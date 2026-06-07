package com.hotel.cervera.hotel_cervera_api.service;

import com.hotel.cervera.hotel_cervera_api.dto.response.AlertaDashboardDTO;
import com.hotel.cervera.hotel_cervera_api.dto.response.DashboardGraficosDTO;
import com.hotel.cervera.hotel_cervera_api.dto.response.ResumenDashboardDTO;
import com.hotel.cervera.hotel_cervera_api.model.Habitacion;
import com.hotel.cervera.hotel_cervera_api.model.Pago;
import com.hotel.cervera.hotel_cervera_api.model.Reserva;
import com.hotel.cervera.hotel_cervera_api.model.ReservaDetalle;
import com.hotel.cervera.hotel_cervera_api.repository.HabitacionRepository;
import com.hotel.cervera.hotel_cervera_api.repository.PagoRepository;
import com.hotel.cervera.hotel_cervera_api.repository.ReservaRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
@Transactional(readOnly = true)
public class DashboardService {

    @Autowired
    private HabitacionRepository habitacionRepository;

    @Autowired
    private ReservaRepository reservaRepository;

    @Autowired
    private PagoRepository pagoRepository;

    /**
     * Obtener el resumen de métricas clave (KPIs) para el Dashboard.
     */
    public ResumenDashboardDTO obtenerResumen() {
        // Obtener todas las habitaciones
        List<Habitacion> habitacionesActivas = habitacionRepository.findAll();

        long total = habitacionesActivas.size();
        long disponibles = habitacionesActivas.stream()
                .filter(h -> "Disponible".equalsIgnoreCase(h.getEstadoActual()))
                .count();
        long ocupadas = habitacionesActivas.stream()
                .filter(h -> "Ocupada".equalsIgnoreCase(h.getEstadoActual()))
                .count();
        long porLimpiar = habitacionesActivas.stream()
                .filter(h -> "Por limpiar".equalsIgnoreCase(h.getEstadoActual()) || "En limpieza".equalsIgnoreCase(h.getEstadoActual()))
                .count();

        // Reservas de hoy
        LocalDate hoy = LocalDate.now();
        List<Reserva> reservasHoy = reservaRepository.findReservasEnRango(hoy, hoy);
        
        long checkInsHoy = reservasHoy.stream()
                .filter(r -> r.getFechaIngreso().equals(hoy) && 
                             !"CANCELADA".equalsIgnoreCase(r.getEstado()) && 
                             !"CANCELADO".equalsIgnoreCase(r.getEstado()))
                .count();

        long checkOutsHoy = reservasHoy.stream()
                .filter(r -> r.getFechaSalida().equals(hoy) && 
                             "checked_in".equalsIgnoreCase(r.getEstado()))
                .count();

        // Ingresos
        BigDecimal ingresosHoy = pagoRepository.sumIngresosByPeriodo(hoy, hoy);
        BigDecimal ingresosMes = pagoRepository.sumIngresosByPeriodo(hoy.withDayOfMonth(1), hoy);

        if (ingresosHoy == null) ingresosHoy = BigDecimal.ZERO;
        if (ingresosMes == null) ingresosMes = BigDecimal.ZERO;

        double ocupacionPorcentaje = total > 0 ? (ocupadas * 100.0 / total) : 0.0;

        return ResumenDashboardDTO.builder()
                .totalHabitaciones(total)
                .disponibles(disponibles)
                .ocupadas(ocupadas)
                .porLimpiar(porLimpiar)
                .checkInsHoy(checkInsHoy)
                .checkOutsHoy(checkOutsHoy)
                .ingresosHoy(ingresosHoy)
                .ingresosMes(ingresosMes)
                .ocupacionPorcentaje(Math.round(ocupacionPorcentaje * 10.0) / 10.0) // 1 decimal
                .build();
    }

    /**
     * Obtener datos consolidados para los 4 gráficos interactivos SVG.
     */
    public DashboardGraficosDTO obtenerGraficos() {
        LocalDate hoy = LocalDate.now();

        // 1. Ocupación de los últimos 7 días (hacia atrás desde hoy)
        List<DashboardGraficosDTO.OcupacionPunto> ocupacionSemana = new ArrayList<>();
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd/MM");
        List<Habitacion> habitacionesActivas = habitacionRepository.findAll();
        long totalHabitaciones = habitacionesActivas.size();

        for (int i = 6; i >= 0; i--) {
            LocalDate dia = hoy.minusDays(i);
            long reservasActivas = reservaRepository.countReservasActivasEnFecha(dia);
            double pct = totalHabitaciones > 0 ? (reservasActivas * 100.0 / totalHabitaciones) : 0.0;
            pct = Math.round(pct * 10.0) / 10.0; // 1 decimal
            ocupacionSemana.add(new DashboardGraficosDTO.OcupacionPunto(dia.format(formatter), pct));
        }

        // 2. Ingresos por tipo de habitación (Matrimonial, Doble, Triple)
        // Obtenemos todos los pagos para asociar sus habitaciones y tipos
        List<Pago> pagos = pagoRepository.findAll();
        Map<String, BigDecimal> ingresosPorTipo = new HashMap<>();
        ingresosPorTipo.put("Matrimonial", BigDecimal.ZERO);
        ingresosPorTipo.put("Doble", BigDecimal.ZERO);
        ingresosPorTipo.put("Triple", BigDecimal.ZERO);

        for (Pago p : pagos) {
            BigDecimal monto = p.getMontoTotal();
            if (monto == null) continue;

            // Revisamos las estadías asociadas para encontrar las habitaciones y tipos
            if (p.getEstadias() != null && !p.getEstadias().isEmpty()) {
                p.getEstadias().forEach(e -> {
                    if (e.getReserva() != null && e.getReserva().getDetalles() != null) {
                        e.getReserva().getDetalles().forEach(d -> {
                            if (d.getHabitacion() != null && d.getHabitacion().getTipo() != null) {
                                String tipoNombre = d.getHabitacion().getTipo().getNombre();
                                if (tipoNombre != null) {
                                    String key = normalizarTipoHabitacion(tipoNombre);
                                    ingresosPorTipo.put(key, ingresosPorTipo.getOrDefault(key, BigDecimal.ZERO).add(monto));
                                }
                            }
                        });
                    }
                });
            } else if (p.getEstadia() != null) {
                // Relación individual directa
                if (p.getEstadia().getReserva() != null && p.getEstadia().getReserva().getDetalles() != null) {
                    p.getEstadia().getReserva().getDetalles().forEach(d -> {
                        if (d.getHabitacion() != null && d.getHabitacion().getTipo() != null) {
                            String tipoNombre = d.getHabitacion().getTipo().getNombre();
                            if (tipoNombre != null) {
                                String key = normalizarTipoHabitacion(tipoNombre);
                                ingresosPorTipo.put(key, ingresosPorTipo.getOrDefault(key, BigDecimal.ZERO).add(monto));
                            }
                        }
                    });
                }
            }
        }

        List<DashboardGraficosDTO.IngresosTipo> ingresosTipo = ingresosPorTipo.entrySet().stream()
                .map(entry -> new DashboardGraficosDTO.IngresosTipo(entry.getKey(), entry.getValue()))
                .collect(Collectors.toList());

        // 3. Distribución de estados de habitaciones (Disponible, Ocupada, Por limpiar, etc.)
        Map<String, Long> conteoEstados = habitacionesActivas.stream()
                .collect(Collectors.groupingBy(Habitacion::getEstadoActual, Collectors.counting()));

        List<DashboardGraficosDTO.EstadoConteo> distribucionEstados = new ArrayList<>();
        // Agregar en un orden preferido con valores por defecto
        List<String> estadosList = Arrays.asList("Disponible", "Ocupada", "Por limpiar", "En limpieza", "Mantenimiento", "Remodelación", "Inhabitable");
        for (String est : estadosList) {
            distribucionEstados.add(new DashboardGraficosDTO.EstadoConteo(est, conteoEstados.getOrDefault(est, 0L)));
        }

        // 4. Ranking de Habitaciones (Tipos más reservados)
        List<Reserva> todasReservas = reservaRepository.findAll().stream()
                .filter(r -> !"CANCELADA".equalsIgnoreCase(r.getEstado()) && !"CANCELADO".equalsIgnoreCase(r.getEstado()))
                .collect(Collectors.toList());

        Map<String, Long> conteoReservasTipo = new HashMap<>();
        conteoReservasTipo.put("Matrimonial", 0L);
        conteoReservasTipo.put("Doble", 0L);
        conteoReservasTipo.put("Triple", 0L);

        for (Reserva r : todasReservas) {
            if (r.getDetalles() != null) {
                for (ReservaDetalle d : r.getDetalles()) {
                    if (d.getHabitacion() != null && d.getHabitacion().getTipo() != null) {
                        String tipo = d.getHabitacion().getTipo().getNombre();
                        if (tipo != null) {
                            String key = normalizarTipoHabitacion(tipo);
                            conteoReservasTipo.put(key, conteoReservasTipo.getOrDefault(key, 0L) + 1);
                        }
                    }
                }
            }
        }

        List<DashboardGraficosDTO.RankingPopularidad> rankingHabitaciones = conteoReservasTipo.entrySet().stream()
                .map(entry -> new DashboardGraficosDTO.RankingPopularidad(entry.getKey(), entry.getValue()))
                .sorted((a, b) -> Long.compare(b.getValue(), a.getValue())) // ordenar descendente
                .collect(Collectors.toList());

        return DashboardGraficosDTO.builder()
                .ocupacionSemana(ocupacionSemana)
                .ingresosTipo(ingresosTipo)
                .distribucionEstados(distribucionEstados)
                .rankingHabitaciones(rankingHabitaciones)
                .build();
    }

    /**
     * Obtener alertas operativas basadas en las reglas de negocio del hotel.
     */
    public List<AlertaDashboardDTO> obtenerAlertas() {
        List<AlertaDashboardDTO> alertas = new ArrayList<>();
        LocalDate hoy = LocalDate.now();
        OffsetDateTime ahora = OffsetDateTime.now();

        // Obtener todas las habitaciones
        List<Habitacion> habitacionesActivas = habitacionRepository.findAll();

        // Regla A1: Habitación en Por limpiar > 24 horas sin atenderse
        for (Habitacion h : habitacionesActivas) {
            if ("Por limpiar".equalsIgnoreCase(h.getEstadoActual()) && h.getFechaActualizacion() != null) {
                if (h.getFechaActualizacion().isBefore(ahora.minusHours(24))) {
                    alertas.add(AlertaDashboardDTO.builder()
                            .tipo("URGENTE")
                            .icono("🔴")
                            .mensaje("La habitación " + h.getNumero() + " está sin limpiar desde hace más de 24 horas.")
                            .fecha("Hace más de 24h")
                            .build());
                }
            }
        }

        // Regla A2: Tasa de ocupación actual baja (< 30%)
        long total = habitacionesActivas.size();
        long ocupadas = habitacionesActivas.stream()
                .filter(h -> "Ocupada".equalsIgnoreCase(h.getEstadoActual()))
                .count();
        double pctOcupacion = total > 0 ? (ocupadas * 100.0 / total) : 0.0;
        if (pctOcupacion < 30.0) {
            alertas.add(AlertaDashboardDTO.builder()
                    .tipo("ADVERTENCIA")
                    .icono("⚠️")
                    .mensaje("Ocupación actual baja (" + Math.round(pctOcupacion * 10.0) / 10.0 + "%). Considere revisar tarifas.")
                    .fecha("Hoy")
                    .build());
        }

        // Regla A3: Habitaciones en Mantenimiento/Remodelación por más de 30 días
        for (Habitacion h : habitacionesActivas) {
            if (("Mantenimiento".equalsIgnoreCase(h.getEstadoActual()) || "Remodelación".equalsIgnoreCase(h.getEstadoActual()))
                    && h.getFechaActualizacion() != null) {
                if (h.getFechaActualizacion().isBefore(ahora.minusDays(30))) {
                    alertas.add(AlertaDashboardDTO.builder()
                            .tipo("ADVERTENCIA")
                            .icono("⚠️")
                            .mensaje("Habitación " + h.getNumero() + " en " + h.getEstadoActual() + " por más de 30 días.")
                            .fecha("Inactivo > 30 días")
                            .build());
                }
            }
        }

        // Regla A4: Check-out pendiente hoy
        List<Reserva> reservasHoy = reservaRepository.findReservasEnRango(hoy, hoy);
        reservasHoy.stream()
                .filter(r -> r.getFechaSalida().equals(hoy) && "checked_in".equalsIgnoreCase(r.getEstado()))
                .forEach(r -> {
                    String habs = r.getDetalles() != null ? r.getDetalles().stream()
                            .map(d -> d.getHabitacion().getNumero())
                            .collect(Collectors.joining(", ")) : "N/A";
                    String cliente = r.getCliente() != null ? r.getCliente().getNombres() + " " + r.getCliente().getApellidos() : "Huésped";
                    alertas.add(AlertaDashboardDTO.builder()
                            .tipo("URGENTE")
                            .icono("🔴")
                            .mensaje("Check-out pendiente hoy para la habitación " + habs + " (" + cliente + ")")
                            .fecha("Hoy a las 12:00")
                            .build());
                });

        // Regla A5: Check-in programado hoy
        reservasHoy.stream()
                .filter(r -> r.getFechaIngreso().equals(hoy) && "pendiente".equalsIgnoreCase(r.getEstado()))
                .forEach(r -> {
                    String habs = r.getDetalles() != null ? r.getDetalles().stream()
                            .map(d -> d.getHabitacion().getNumero())
                            .collect(Collectors.joining(", ")) : "N/A";
                    String cliente = r.getCliente() != null ? r.getCliente().getNombres() + " " + r.getCliente().getApellidos() : "Huésped";
                    alertas.add(AlertaDashboardDTO.builder()
                            .tipo("INFO")
                            .icono("ℹ️")
                            .mensaje("Check-in programado hoy para la habitación " + habs + " (" + cliente + ")")
                            .fecha("Hoy")
                            .build());
                });

        // Agregar alerta de éxito por defecto si todo está limpio y operativo
        if (alertas.isEmpty()) {
            alertas.add(AlertaDashboardDTO.builder()
                    .tipo("EXITO")
                    .icono("✅")
                    .mensaje("Todas las operaciones del hotel están al día. ¡Buen trabajo!")
                    .fecha("Ahora")
                    .build());
        }

        return alertas;
    }

    /**
     * Normalizar nombre del tipo de habitación para agruparlo limpiamente.
     */
    private String normalizarTipoHabitacion(String tipo) {
        if (tipo == null) return "Matrimonial";
        String t = tipo.trim().toLowerCase();
        if (t.contains("matri")) return "Matrimonial";
        if (t.contains("doble")) return "Doble";
        if (t.contains("triple")) return "Triple";
        return "Matrimonial";
    }
}
