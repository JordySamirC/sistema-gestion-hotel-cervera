package com.hotel.cervera.hotel_cervera_api.service;

import com.hotel.cervera.hotel_cervera_api.dto.ReporteCompletoDTO;
import com.hotel.cervera.hotel_cervera_api.model.*;
import com.hotel.cervera.hotel_cervera_api.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.*;

@Service
@RequiredArgsConstructor
public class ReporteService {

    private final HabitacionRepository habitacionRepository;
    private final ReservaRepository reservaRepository;
    private final PagoRepository pagoRepository;
    private final GastoRepository gastoRepository;
    private final LimpiezaRepository limpiezaRepository;

    public Map<String, Object> ocupacionDiaria(LocalDate fecha) {
        long totalOperativas = habitacionRepository.count();
        long reservasActivas = reservaRepository.countReservasActivasEnFecha(fecha);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("fecha", fecha);
        result.put("totalHabitaciones", totalOperativas);
        result.put("habitacionesOcupadas", reservasActivas);
        result.put("porcentajeOcupacion", totalOperativas > 0
                ? BigDecimal.valueOf(reservasActivas * 100.0 / totalOperativas)
                        .setScale(2, RoundingMode.HALF_UP) + "%"
                : "0%");
        return result;
    }

    public Map<String, Object> ingresosPorPeriodo(LocalDate desde, LocalDate hasta) {
        BigDecimal ingresos = pagoRepository.sumIngresosByPeriodo(desde, hasta);
        if (ingresos == null) ingresos = BigDecimal.ZERO;
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("desde", desde);
        result.put("hasta", hasta);
        result.put("totalIngresos", ingresos);
        return result;
    }

    public Map<String, Object> gananciasNetas(LocalDate desde, LocalDate hasta) {
        BigDecimal ingresos = pagoRepository.sumIngresosByPeriodo(desde, hasta);
        if (ingresos == null) ingresos = BigDecimal.ZERO;
        BigDecimal gastos = gastoRepository.sumGastosActivosByPeriodo(desde, hasta);
        if (gastos == null) gastos = BigDecimal.ZERO;
        BigDecimal neto = ingresos.subtract(gastos);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("desde", desde);
        result.put("hasta", hasta);
        result.put("totalIngresos", ingresos);
        result.put("totalGastos", gastos);
        result.put("gananciaNeta", neto);
        return result;
    }

    public Map<String, Object> resumenLimpieza() {
        Double promedioGlobal = limpiezaRepository.promedioDuracionGlobal();

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("promedioDuracionGlobalSegundos", promedioGlobal != null ? promedioGlobal.intValue() : 0);
        result.put("promedioDuracionGlobalMinutos", promedioGlobal != null
                ? BigDecimal.valueOf(promedioGlobal / 60.0).setScale(2, RoundingMode.HALF_UP)
                : 0);
        return result;
    }

    public long totalReservasCanceladas() {
        return reservaRepository.countByEstado("cancelada");
    }

    public long totalReservasNoShow() {
        return reservaRepository.countByEstado("no_show");
    }

    public long proyeccionOcupacion() {
        LocalDate hoy = LocalDate.now();
        LocalDate dentroDe7Dias = hoy.plusDays(7);
        long total = 0;
        LocalDate fecha = hoy;
        while (!fecha.isAfter(dentroDe7Dias)) {
            total += reservaRepository.countReservasActivasEnFecha(fecha);
            fecha = fecha.plusDays(1);
        }
        return total;
    }

    public ReporteCompletoDTO obtenerReporteCompleto(LocalDate desde, LocalDate hasta) {
        long totalHabitacionesCount = habitacionRepository.count();
        long dias = java.time.temporal.ChronoUnit.DAYS.between(desde, hasta) + 1;
        if (dias <= 0) dias = 1;

        LocalDate desdePrev = desde.minusDays(dias);
        LocalDate hastaPrev = hasta.minusDays(dias);

        // 1. Ocupación Diaria y total de noches ocupadas
        long occupiedRoomNights = 0;
        List<ReporteCompletoDTO.OcupacionDiariaInfo> ocupacionDiariaList = new ArrayList<>();
        LocalDate actual = desde;
        while (!actual.isAfter(hasta)) {
            long ocupadas = reservaRepository.countReservasActivasEnFecha(actual);
            BigDecimal pct = totalHabitacionesCount > 0 
                ? BigDecimal.valueOf(ocupadas * 100.0 / totalHabitacionesCount).setScale(2, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;
            ocupacionDiariaList.add(ReporteCompletoDTO.OcupacionDiariaInfo.builder()
                .fecha(actual)
                .habitacionesOcupadas(ocupadas)
                .totalHabitaciones(totalHabitacionesCount)
                .porcentaje(pct)
                .build());
            occupiedRoomNights += ocupadas;
            actual = actual.plusDays(1);
        }

        // Período anterior noches ocupadas
        long occupiedRoomNightsPrev = 0;
        LocalDate actualPrev = desdePrev;
        while (!actualPrev.isAfter(hastaPrev)) {
            occupiedRoomNightsPrev += reservaRepository.countReservasActivasEnFecha(actualPrev);
            actualPrev = actualPrev.plusDays(1);
        }

        // Porcentaje Ocupación global de los períodos
        long totalAvailableRoomNights = totalHabitacionesCount * dias;
        BigDecimal pctOcupacionActual = totalAvailableRoomNights > 0
            ? BigDecimal.valueOf(occupiedRoomNights * 100.0 / totalAvailableRoomNights).setScale(2, RoundingMode.HALF_UP)
            : BigDecimal.ZERO;
        BigDecimal pctOcupacionPrev = totalAvailableRoomNights > 0
            ? BigDecimal.valueOf(occupiedRoomNightsPrev * 100.0 / totalAvailableRoomNights).setScale(2, RoundingMode.HALF_UP)
            : BigDecimal.ZERO;

        ReporteCompletoDTO.KpiInfo kpiOcupacion = calcularKpiInfo(pctOcupacionActual, pctOcupacionPrev, true);

        // 2. Ingresos y Gastos
        BigDecimal totalIngresos = pagoRepository.sumIngresosByPeriodo(desde, hasta);
        if (totalIngresos == null) totalIngresos = BigDecimal.ZERO;
        BigDecimal totalIngresosPrev = pagoRepository.sumIngresosByPeriodo(desdePrev, hastaPrev);
        if (totalIngresosPrev == null) totalIngresosPrev = BigDecimal.ZERO;

        BigDecimal totalGastos = gastoRepository.sumGastosActivosByPeriodo(desde, hasta);
        if (totalGastos == null) totalGastos = BigDecimal.ZERO;
        BigDecimal totalGastosPrev = gastoRepository.sumGastosActivosByPeriodo(desdePrev, hastaPrev);
        if (totalGastosPrev == null) totalGastosPrev = BigDecimal.ZERO;

        BigDecimal gananciaNeta = totalIngresos.subtract(totalGastos);
        BigDecimal gananciaNetaPrev = totalIngresosPrev.subtract(totalGastosPrev);

        // 3. ADR (Average Daily Rate)
        BigDecimal adr = occupiedRoomNights > 0
            ? totalIngresos.divide(BigDecimal.valueOf(occupiedRoomNights), 2, RoundingMode.HALF_UP)
            : BigDecimal.ZERO;
        BigDecimal adrPrev = occupiedRoomNightsPrev > 0
            ? totalIngresosPrev.divide(BigDecimal.valueOf(occupiedRoomNightsPrev), 2, RoundingMode.HALF_UP)
            : BigDecimal.ZERO;
        ReporteCompletoDTO.KpiInfo kpiAdr = calcularKpiInfo(adr, adrPrev, false);

        // 4. RevPAR (Revenue Per Available Room)
        BigDecimal revPar = totalAvailableRoomNights > 0
            ? totalIngresos.divide(BigDecimal.valueOf(totalAvailableRoomNights), 2, RoundingMode.HALF_UP)
            : BigDecimal.ZERO;
        BigDecimal revParPrev = totalAvailableRoomNights > 0
            ? totalIngresosPrev.divide(BigDecimal.valueOf(totalAvailableRoomNights), 2, RoundingMode.HALF_UP)
            : BigDecimal.ZERO;
        ReporteCompletoDTO.KpiInfo kpiRevPar = calcularKpiInfo(revPar, revParPrev, false);

        // 5. TrevPAR (Igual a RevPAR porque solo hay ingresos de habitaciones)
        ReporteCompletoDTO.KpiInfo kpiTrevPar = calcularKpiInfo(revPar, revParPrev, false);

        // 6. ALOS (Average Length Of Stay)
        List<Reserva> reservas = reservaRepository.findReservasEnRango(desde, hasta);
        long totalStayNights = 0;
        long countReservasValidas = 0;
        long canceladas = 0;
        long noShow = 0;
        long totalReservasCount = 0;
        Map<String, Long> cancelacionesPorMotivo = new HashMap<>();

        for (Reserva r : reservas) {
            totalReservasCount++;
            boolean isCancel = "cancelada".equalsIgnoreCase(r.getEstado());
            boolean isNoShow = "no_show".equalsIgnoreCase(r.getEstado());
            if (isCancel) {
                canceladas++;
                String motivo = r.getMotivoCancelacion();
                if (motivo == null || motivo.trim().isEmpty()) motivo = "Otro motivo";
                cancelacionesPorMotivo.put(motivo, cancelacionesPorMotivo.getOrDefault(motivo, 0L) + 1);
            } else if (isNoShow) {
                noShow++;
                String motivo = "Inasistencia";
                cancelacionesPorMotivo.put(motivo, cancelacionesPorMotivo.getOrDefault(motivo, 0L) + 1);
            }

            if (!isCancel && !isNoShow) {
                long nights = java.time.temporal.ChronoUnit.DAYS.between(r.getFechaIngreso(), r.getFechaSalida());
                if (nights <= 0) nights = 1;
                totalStayNights += nights;
                countReservasValidas++;
            }
        }

        BigDecimal alosActual = countReservasValidas > 0
            ? BigDecimal.valueOf(totalStayNights * 1.0 / countReservasValidas).setScale(2, RoundingMode.HALF_UP)
            : BigDecimal.ZERO;

        List<Reserva> reservasPrev = reservaRepository.findReservasEnRango(desdePrev, hastaPrev);
        long totalStayNightsPrev = 0;
        long countReservasValidasPrev = 0;
        long canceladasPrev = 0;
        long noShowPrev = 0;
        long totalReservasCountPrev = 0;

        for (Reserva r : reservasPrev) {
            totalReservasCountPrev++;
            boolean isCancel = "cancelada".equalsIgnoreCase(r.getEstado());
            boolean isNoShow = "no_show".equalsIgnoreCase(r.getEstado());
            if (isCancel) canceladasPrev++;
            else if (isNoShow) noShowPrev++;

            if (!isCancel && !isNoShow) {
                long nights = java.time.temporal.ChronoUnit.DAYS.between(r.getFechaIngreso(), r.getFechaSalida());
                if (nights <= 0) nights = 1;
                totalStayNightsPrev += nights;
                countReservasValidasPrev++;
            }
        }

        BigDecimal alosPrev = countReservasValidasPrev > 0
            ? BigDecimal.valueOf(totalStayNightsPrev * 1.0 / countReservasValidasPrev).setScale(2, RoundingMode.HALF_UP)
            : BigDecimal.ZERO;
        ReporteCompletoDTO.KpiInfo kpiAlos = calcularKpiInfo(alosActual, alosPrev, false);

        // 7. Tasa de Cancelación
        BigDecimal tasaCancelacionActual = totalReservasCount > 0
            ? BigDecimal.valueOf((canceladas + noShow) * 100.0 / totalReservasCount).setScale(2, RoundingMode.HALF_UP)
            : BigDecimal.ZERO;
        BigDecimal tasaCancelacionPrev = totalReservasCountPrev > 0
            ? BigDecimal.valueOf((canceladasPrev + noShowPrev) * 100.0 / totalReservasCountPrev).setScale(2, RoundingMode.HALF_UP)
            : BigDecimal.ZERO;
        ReporteCompletoDTO.KpiInfo kpiTasaCancelacion = calcularKpiInfo(tasaCancelacionActual, tasaCancelacionPrev, true);

        // 8. Ingresos por Tipo de Habitación
        List<Pago> pagos = pagoRepository.findByFechaPagoBetween(desde, hasta);
        Map<String, BigDecimal> ingresosPorTipoMap = new HashMap<>();
        BigDecimal totalIngresosCalculado = BigDecimal.ZERO;
        for (Pago p : pagos) {
            if (p.getEstadia() != null && p.getEstadia().getReserva() != null) {
                Reserva r = p.getEstadia().getReserva();
                List<ReservaDetalle> detalles = r.getDetalles();
                if (detalles != null && !detalles.isEmpty()) {
                    BigDecimal division = p.getMontoTotal().divide(BigDecimal.valueOf(detalles.size()), 4, RoundingMode.HALF_UP);
                    for (ReservaDetalle d : detalles) {
                        String tipo = (d.getHabitacion().getTipo() != null) ? d.getHabitacion().getTipo().getNombre() : "matrimonial";
                        ingresosPorTipoMap.put(tipo, ingresosPorTipoMap.getOrDefault(tipo, BigDecimal.ZERO).add(division));
                        totalIngresosCalculado = totalIngresosCalculado.add(division);
                    }
                } else {
                    String tipo = "matrimonial";
                    ingresosPorTipoMap.put(tipo, ingresosPorTipoMap.getOrDefault(tipo, BigDecimal.ZERO).add(p.getMontoTotal()));
                    totalIngresosCalculado = totalIngresosCalculado.add(p.getMontoTotal());
                }
            } else {
                String tipo = "matrimonial";
                ingresosPorTipoMap.put(tipo, ingresosPorTipoMap.getOrDefault(tipo, BigDecimal.ZERO).add(p.getMontoTotal()));
                totalIngresosCalculado = totalIngresosCalculado.add(p.getMontoTotal());
            }
        }

        List<ReporteCompletoDTO.IngresosPorTipoInfo> ingresosPorTipoList = new ArrayList<>();
        for (Map.Entry<String, BigDecimal> entry : ingresosPorTipoMap.entrySet()) {
            BigDecimal pct = totalIngresosCalculado.compareTo(BigDecimal.ZERO) > 0
                ? entry.getValue().multiply(BigDecimal.valueOf(100)).divide(totalIngresosCalculado, 2, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;
            ingresosPorTipoList.add(ReporteCompletoDTO.IngresosPorTipoInfo.builder()
                .tipoHabitacion(entry.getKey())
                .totalIngresos(entry.getValue().setScale(2, RoundingMode.HALF_UP))
                .porcentaje(pct)
                .build());
        }

        // 9. Distribución de Canales de Venta
        Map<String, Long> canalesCountMap = new HashMap<>();
        Map<String, String> canalesIconMap = new HashMap<>();
        long totalReservasValidasCanal = 0;
        for (Reserva r : reservas) {
            if (r.getCanalVenta() != null) {
                String canalNombre = r.getCanalVenta().getNombre();
                String icono = r.getCanalVenta().getIcono();
                if ("Otro".equalsIgnoreCase(canalNombre) && r.getCanalVentaOtro() != null) {
                    canalNombre = r.getCanalVentaOtro();
                }
                canalesCountMap.put(canalNombre, canalesCountMap.getOrDefault(canalNombre, 0L) + 1);
                canalesIconMap.put(canalNombre, icono != null ? icono : "🌐");
                totalReservasValidasCanal++;
            }
        }
        List<ReporteCompletoDTO.DistribucionCanalInfo> canalesList = new ArrayList<>();
        for (Map.Entry<String, Long> entry : canalesCountMap.entrySet()) {
            BigDecimal pct = totalReservasValidasCanal > 0
                ? BigDecimal.valueOf(entry.getValue() * 100.0 / totalReservasValidasCanal).setScale(2, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;
            canalesList.add(ReporteCompletoDTO.DistribucionCanalInfo.builder()
                .canal(entry.getKey())
                .icono(canalesIconMap.get(entry.getKey()))
                .cantidadReservas(entry.getValue())
                .porcentaje(pct)
                .build());
        }

        // 10. Habitaciones Populares (Most Booked Rooms)
        Map<String, Long> habNochesMap = new HashMap<>();
        Map<String, String> habTipoMap = new HashMap<>();
        Map<String, BigDecimal> habIngresosMap = new HashMap<>();
        for (Reserva r : reservas) {
            if ("cancelada".equalsIgnoreCase(r.getEstado()) || "no_show".equalsIgnoreCase(r.getEstado())) {
                continue;
            }
            long nights = java.time.temporal.ChronoUnit.DAYS.between(r.getFechaIngreso(), r.getFechaSalida());
            if (nights <= 0) nights = 1;
            
            List<ReservaDetalle> detalles = r.getDetalles();
            if (detalles != null) {
                for (ReservaDetalle d : detalles) {
                    String num = d.getHabitacion().getNumero();
                    String tipo = (d.getHabitacion().getTipo() != null) ? d.getHabitacion().getTipo().getNombre() : "matrimonial";
                    BigDecimal precio = d.getPrecioAplicado();
                    if (precio == null) precio = BigDecimal.ZERO;
                    BigDecimal revenue = precio.multiply(BigDecimal.valueOf(nights));
                    
                    habNochesMap.put(num, habNochesMap.getOrDefault(num, 0L) + nights);
                    habTipoMap.put(num, tipo);
                    habIngresosMap.put(num, habIngresosMap.getOrDefault(num, BigDecimal.ZERO).add(revenue));
                }
            }
        }
        
        List<ReporteCompletoDTO.HabitacionPopularInfo> popularList = new ArrayList<>();
        for (Map.Entry<String, Long> entry : habNochesMap.entrySet()) {
            popularList.add(ReporteCompletoDTO.HabitacionPopularInfo.builder()
                .numero(entry.getKey())
                .tipo(habTipoMap.get(entry.getKey()))
                .nochesOcupadas(entry.getValue())
                .totalIngresos(habIngresosMap.get(entry.getKey()).setScale(2, RoundingMode.HALF_UP))
                .build());
        }
        popularList.sort((a, b) -> b.getTotalIngresos().compareTo(a.getTotalIngresos()));
        if (popularList.size() > 10) {
            popularList = popularList.subList(0, 10);
        }

        // 11. Proyección 7 Días
        List<ReporteCompletoDTO.OcupacionDiariaInfo> proyeccionList = new ArrayList<>();
        LocalDate hoy = LocalDate.now();
        for (int i = 0; i < 7; i++) {
            LocalDate diaProy = hoy.plusDays(i);
            long ocupadas = reservaRepository.countReservasActivasEnFecha(diaProy);
            BigDecimal pct = totalHabitacionesCount > 0 
                ? BigDecimal.valueOf(ocupadas * 100.0 / totalHabitacionesCount).setScale(2, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;
            proyeccionList.add(ReporteCompletoDTO.OcupacionDiariaInfo.builder()
                .fecha(diaProy)
                .habitacionesOcupadas(ocupadas)
                .totalHabitaciones(totalHabitacionesCount)
                .porcentaje(pct)
                .build());
        }

        // 12. Consolidar KPIs finales
        ReporteCompletoDTO.Kpis kpis = ReporteCompletoDTO.Kpis.builder()
            .ocupacion(kpiOcupacion)
            .adr(kpiAdr)
            .revPar(kpiRevPar)
            .trevPar(kpiTrevPar)
            .alos(kpiAlos)
            .tasaCancelacion(kpiTasaCancelacion)
            .totalIngresos(totalIngresos.setScale(2, RoundingMode.HALF_UP))
            .totalIngresosAnterior(totalIngresosPrev.setScale(2, RoundingMode.HALF_UP))
            .totalGastos(totalGastos.setScale(2, RoundingMode.HALF_UP))
            .totalGastosAnterior(totalGastosPrev.setScale(2, RoundingMode.HALF_UP))
            .gananciaNeta(gananciaNeta.setScale(2, RoundingMode.HALF_UP))
            .gananciaNetaAnterior(gananciaNetaPrev.setScale(2, RoundingMode.HALF_UP))
            .build();

        return ReporteCompletoDTO.builder()
            .kpis(kpis)
            .ocupacionDiaria(ocupacionDiariaList)
            .ingresosPorTipo(ingresosPorTipoList)
            .distribucionCanales(canalesList)
            .habitacionesMasReservadas(popularList)
            .cancelaciones(ReporteCompletoDTO.CancelacionesDetalleInfo.builder()
                .canceladas(canceladas)
                .noShow(noShow)
                .tasaCancelacion(tasaCancelacionActual)
                .cancelacionesPorMotivo(cancelacionesPorMotivo)
                .build())
            .proyeccion7Dias(proyeccionList)
            .build();
    }

    private ReporteCompletoDTO.KpiInfo calcularKpiInfo(BigDecimal actual, BigDecimal anterior, boolean isAbsoluteChange) {
        BigDecimal pctChange = BigDecimal.ZERO;
        if (isAbsoluteChange) {
            pctChange = actual.subtract(anterior);
        } else {
            if (anterior.compareTo(BigDecimal.ZERO) > 0) {
                pctChange = actual.subtract(anterior)
                    .multiply(BigDecimal.valueOf(100))
                    .divide(anterior, 2, RoundingMode.HALF_UP);
            }
        }
        String tendencia = pctChange.compareTo(BigDecimal.ZERO) > 0 ? "up" : (pctChange.compareTo(BigDecimal.ZERO) < 0 ? "down" : "stable");
        return ReporteCompletoDTO.KpiInfo.builder()
            .valorActual(actual)
            .valorAnterior(anterior)
            .porcentajeCambio(pctChange)
            .tendencia(tendencia)
            .build();
    }
}
