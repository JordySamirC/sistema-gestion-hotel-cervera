package com.hotel.cervera.hotel_cervera_api.service;

import com.hotel.cervera.hotel_cervera_api.dto.request.ActualizarReservaRequest;
import com.hotel.cervera.hotel_cervera_api.dto.request.AgregarHuespedRequest;
import com.hotel.cervera.hotel_cervera_api.dto.request.CambiarHabitacionRequest;
import com.hotel.cervera.hotel_cervera_api.dto.request.CancelarReservaRequest;
import com.hotel.cervera.hotel_cervera_api.dto.request.ExtenderReservaRequest;
import com.hotel.cervera.hotel_cervera_api.dto.request.ReservaRequest;
import com.hotel.cervera.hotel_cervera_api.dto.response.ReservaDetalleResponse;
import com.hotel.cervera.hotel_cervera_api.dto.response.ReservaHuespedResponse;
import com.hotel.cervera.hotel_cervera_api.dto.response.ReservaResponse;
import com.hotel.cervera.hotel_cervera_api.exception.BusinessException;
import com.hotel.cervera.hotel_cervera_api.dto.response.PanelReservaItem;
import com.hotel.cervera.hotel_cervera_api.exception.ResourceNotFoundException;
import com.hotel.cervera.hotel_cervera_api.model.Grupo;
import com.hotel.cervera.hotel_cervera_api.model.ReservaHuesped;
import com.hotel.cervera.hotel_cervera_api.model.*;
import com.hotel.cervera.hotel_cervera_api.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.util.ArrayList;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ReservaService {

    private final ReservaRepository reservaRepository;
    private final ReservaDetalleRepository detalleRepository;
    private final ClienteRepository clienteRepository;
    private final UsuarioRepository usuarioRepository;
    private final HabitacionRepository habitacionRepository;
    private final PrecioHistoricoRepository precioHistoricoRepository;
    private final ReservaHuespedRepository huespedRepository;
    private final GrupoRepository grupoRepository;
    private final CanalesVentaRepository canalesVentaRepository;

    @Transactional
    public void procesarInasistenciasAutomaticas() {
        LocalDate hoy = LocalDate.now();
        List<Reserva> inasistencias = reservaRepository.findByEstadoAndFechaIngresoBefore("RESERVADA", hoy);
        for (Reserva reserva : inasistencias) {
            reserva.setEstado("CANCELADA");
            reserva.setMotivoCancelacion("Inasistencia");
            reserva.setObservacionesCancelacion(
                    "Inasistencia automática - Check-in no realizado en la fecha programada.");
            reserva.setFechaCancelacion(LocalDateTime.now());
            reservaRepository.save(reserva);

            for (ReservaDetalle detalle : reserva.getDetalles()) {
                Habitacion habitacion = habitacionRepository.findById(detalle.getHabitacion().getId())
                        .orElseThrow(() -> new BusinessException("Habitación no encontrada"));
                if ("Por limpiar".equals(habitacion.getEstadoActual())
                        || "Reservada".equals(habitacion.getEstadoActual())) {
                    habitacion.setEstadoActual("Disponible");
                    habitacionRepository.save(habitacion);
                }
            }
        }
    }

    public List<ReservaResponse> findAll() {
        return reservaRepository.findAll().stream().map(this::toResponse).toList();
    }

    public ReservaResponse findById(UUID id) {
        return toResponse(reservaRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Reserva", id)));
    }

    public ReservaResponse findByCodigo(String codigo) {
        return toResponse(reservaRepository.findByCodigo(codigo)
                .orElseThrow(() -> new ResourceNotFoundException("Reserva", "código", codigo)));
    }

    public List<ReservaResponse> findByCliente(UUID clienteId) {
        return reservaRepository.findByClienteId(clienteId).stream().map(this::toResponse).toList();
    }

    public List<ReservaResponse> findByEstado(String estado) {
        return reservaRepository.findByEstado(estado).stream().map(this::toResponse).toList();
    }

    @Transactional
    public ReservaResponse create(ReservaRequest request) {
        if (request.getFechaSalida().isBefore(request.getFechaIngreso()) ||
                request.getFechaSalida().equals(request.getFechaIngreso())) {
            throw new BusinessException("La fecha de salida debe ser posterior a la fecha de ingreso");
        }

        Cliente cliente = clienteRepository.findById(request.getClienteId())
                .orElseThrow(() -> new ResourceNotFoundException("Cliente", request.getClienteId()));
        Usuario creadoPor = usuarioRepository.findById(request.getCreadoPor())
                .orElseThrow(() -> new ResourceNotFoundException("Usuario", request.getCreadoPor()));

        if (!"activo".equals(creadoPor.getEstado())) {
            throw new BusinessException("El usuario creador no está activo");
        }

        if (request.getHabitacionesIds() == null || request.getHabitacionesIds().isEmpty()) {
            throw new BusinessException("Debe seleccionar al menos una habitación");
        }

        for (UUID habId : request.getHabitacionesIds()) {
            if (!reservaRepository.isHabitacionDisponible(habId, request.getFechaIngreso(), request.getFechaSalida())) {
                Habitacion h = habitacionRepository.findById(habId)
                        .orElseThrow(() -> new ResourceNotFoundException("Habitación", habId));
                throw new BusinessException("La habitación " + h.getNumero() + " no está disponible en esas fechas");
            }
        }

        String codigo = generarCodigoReserva();

        Reserva reserva = Reserva.builder()
                .codigo(codigo)
                .fechaReserva(OffsetDateTime.now())
                .fechaIngreso(request.getFechaIngreso())
                .fechaSalida(request.getFechaSalida())
                .cliente(cliente)
                .estado("RESERVADA")
                .creadoPor(creadoPor)
                .adultos(request.getAdultos() != null ? request.getAdultos() : 1)
                .ninos(request.getNinos() != null ? request.getNinos() : 0)
                .canalVenta(canalesVentaRepository.findById(request.getCanalVentaId())
                        .orElseThrow(() -> new BusinessException("Canal de venta no válido")))
                .canalVentaOtro(request.getCanalVentaOtro())
                .build();

        reserva = reservaRepository.save(reserva);

        for (UUID habId : request.getHabitacionesIds()) {
            Habitacion habitacion = habitacionRepository.findById(habId)
                    .orElseThrow(() -> new ResourceNotFoundException("Habitación", habId));

            if (!"Disponible".equals(habitacion.getEstadoActual()) &&
                    !"Por limpiar".equals(habitacion.getEstadoActual())) {
                throw new BusinessException("La habitación " + habitacion.getNumero()
                        + " no está disponible (estado: " + habitacion.getEstadoActual() + ")");
            }

            boolean yaReservada = detalleRepository.existsByReservaIdAndHabitacionId(reserva.getId(), habId);
            if (yaReservada) {
                throw new BusinessException("La habitación ya está asignada a esta reserva");
            }

            BigDecimal precio = precioHistoricoRepository
                    .findPrecioVigenteValue(habitacion.getTipo().getId(), request.getFechaIngreso())
                    .orElseThrow(() -> new BusinessException("No hay precio vigente para la habitación "
                            + habitacion.getNumero()));

            ReservaDetalle detalle = ReservaDetalle.builder()
                    .reserva(reserva)
                    .habitacion(habitacion)
                    .precioAplicado(precio)
                    .build();
            detalleRepository.save(detalle);

            habitacionRepository.save(habitacion);
        }

        ReservaHuesped titular = ReservaHuesped.builder()
                .reserva(reserva)
                .cliente(cliente)
                .esTitular(true)
                .build();
        huespedRepository.save(titular);

        if (request.getHuespedesIds() != null) {
            for (UUID huespedId : request.getHuespedesIds()) {
                if (huespedId.equals(request.getClienteId()))
                    continue;
                Cliente huespedCliente = clienteRepository.findById(huespedId)
                        .orElseThrow(() -> new ResourceNotFoundException("Cliente", huespedId));

                // Evitamos duplicidad por si acaso
                boolean yaExiste = huespedRepository.findByReservaId(reserva.getId()).stream()
                        .anyMatch(h -> h.getCliente().getId().equals(huespedId));
                if (!yaExiste) {
                    ReservaHuesped h = ReservaHuesped.builder()
                            .reserva(reserva)
                            .cliente(huespedCliente)
                            .esTitular(false)
                            .build();
                    huespedRepository.save(h);
                }
            }
        }

        return toResponse(reservaRepository.findById(reserva.getId()).orElseThrow());
    }

    @Transactional
    public ReservaResponse cancelar(UUID id, CancelarReservaRequest request, UUID usuarioId) {
        Reserva reserva = reservaRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Reserva", id));

        if (!"RESERVADA".equals(reserva.getEstado())) {
            throw new BusinessException("Solo se pueden cancelar reservas en estado 'RESERVADA'");
        }

        Usuario canceladoPor = usuarioRepository.findById(usuarioId)
                .orElseThrow(() -> new ResourceNotFoundException("Usuario", usuarioId));

        reserva.setEstado("CANCELADA");
        reserva.setMotivoCancelacion(request.getMotivoCancelacion());
        reserva.setObservacionesCancelacion(request.getObservaciones());
        reserva.setFechaCancelacion(LocalDateTime.now());
        reserva.setCanceladoPor(canceladoPor);
        reserva = reservaRepository.save(reserva);

        for (ReservaDetalle detalle : reserva.getDetalles()) {
            Habitacion habitacion = habitacionRepository.findById(detalle.getHabitacion().getId())
                    .orElseThrow(() -> new BusinessException("Habitación no encontrada"));
            if ("Por limpiar".equals(habitacion.getEstadoActual())) {
                habitacion.setEstadoActual("Disponible");
                habitacionRepository.save(habitacion);
            }
        }

        return toResponse(reserva);
    }

    @Transactional
    public ReservaResponse cancelar(UUID id, String motivo) {
        Reserva reserva = reservaRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Reserva", id));

        if (!"RESERVADA".equals(reserva.getEstado())) {
            throw new BusinessException("Solo se pueden cancelar reservas en estado 'RESERVADA'");
        }

        reserva.setEstado("CANCELADA");
        reserva.setMotivoCancelacion(motivo);
        reserva.setFechaCancelacion(LocalDateTime.now());
        reserva = reservaRepository.save(reserva);

        for (ReservaDetalle detalle : reserva.getDetalles()) {
            Habitacion habitacion = habitacionRepository.findById(detalle.getHabitacion().getId())
                    .orElseThrow(() -> new BusinessException("Habitación no encontrada"));
            if ("Por limpiar".equals(habitacion.getEstadoActual())) {
                habitacion.setEstadoActual("Disponible");
                habitacionRepository.save(habitacion);
            }
        }

        return toResponse(reserva);
    }

    @Transactional
    public void delete(UUID id) {
        if (!reservaRepository.existsById(id)) {
            throw new ResourceNotFoundException("Reserva", id);
        }
        reservaRepository.deleteById(id);
    }

    public long countByEstado(String estado) {
        return reservaRepository.countByEstado(estado);
    }

    public List<ReservaDetalleResponse> getDetalles(UUID reservaId) {
        return detalleRepository.findByReservaId(reservaId).stream()
                .map(d -> ReservaDetalleResponse.builder()
                        .id(d.getId())
                        .reservaId(d.getReserva().getId())
                        .habitacionId(d.getHabitacion().getId())
                        .habitacionNumero(d.getHabitacion().getNumero())
                        .tipoNombre(d.getHabitacion().getTipo().getNombre())
                        .capacidadMax(d.getHabitacion().getTipo().getCapacidadMax())
                        .precioAplicado(d.getPrecioAplicado())
                        .fechaCreacion(d.getFechaCreacion())
                        .build())
                .toList();
    }

    @Transactional
    public ReservaDetalleResponse addDetalle(UUID reservaId, UUID habitacionId) {
        Reserva reserva = reservaRepository.findById(reservaId)
                .orElseThrow(() -> new ResourceNotFoundException("Reserva", reservaId));
        Habitacion habitacion = habitacionRepository.findById(habitacionId)
                .orElseThrow(() -> new ResourceNotFoundException("Habitación", habitacionId));

        if (detalleRepository.existsByReservaIdAndHabitacionId(reservaId, habitacionId)) {
            throw new BusinessException("La habitación ya está asignada a esta reserva");
        }

        BigDecimal precio = precioHistoricoRepository
                .findPrecioVigenteValue(habitacion.getTipo().getId(), reserva.getFechaIngreso())
                .orElseThrow(() -> new BusinessException("No hay precio vigente para esta habitación"));

        ReservaDetalle detalle = ReservaDetalle.builder()
                .reserva(reserva)
                .habitacion(habitacion)
                .precioAplicado(precio)
                .build();
        detalle = detalleRepository.save(detalle);

        return ReservaDetalleResponse.builder()
                .id(detalle.getId())
                .reservaId(detalle.getReserva().getId())
                .habitacionId(detalle.getHabitacion().getId())
                .habitacionNumero(detalle.getHabitacion().getNumero())
                .tipoNombre(detalle.getHabitacion().getTipo().getNombre())
                .capacidadMax(detalle.getHabitacion().getTipo().getCapacidadMax())
                .precioAplicado(detalle.getPrecioAplicado())
                .fechaCreacion(detalle.getFechaCreacion())
                .build();
    }

    @Transactional
    public void removeDetalle(UUID reservaId, UUID detalleId) {
        ReservaDetalle detalle = detalleRepository.findById(detalleId)
                .orElseThrow(() -> new ResourceNotFoundException("Detalle de reserva", detalleId));
        if (!detalle.getReserva().getId().equals(reservaId)) {
            throw new BusinessException("El detalle no pertenece a esta reserva");
        }
        detalleRepository.delete(detalle);
    }

    @Transactional
    public ReservaHuespedResponse agregarHuesped(UUID reservaId, AgregarHuespedRequest request) {
        Reserva reserva = reservaRepository.findById(reservaId)
                .orElseThrow(() -> new ResourceNotFoundException("Reserva", reservaId));

        String estado = reserva.getEstado();
        if (!"RESERVADA".equals(estado) && !"HOSPEDADO".equals(estado)) {
            throw new BusinessException("Solo se pueden agregar huéspedes a reservas en estado RESERVADA o HOSPEDADO");
        }

        if (!reserva.getDetalles().isEmpty()) {
            ReservaDetalle detalle = reserva.getDetalles().iterator().next();
            Integer capacidadMax = detalle.getHabitacion().getTipo().getCapacidadMax();
            long huespedesActuales = huespedRepository.countByReservaId(reservaId);
            if (huespedesActuales >= capacidadMax) {
                throw new BusinessException(
                        "La habitación ha alcanzado su capacidad máxima de " + capacidadMax + " huéspedes");
            }
        }

        Cliente cliente = clienteRepository.findById(request.getClienteId())
                .orElseThrow(() -> new ResourceNotFoundException("Cliente", request.getClienteId()));

        boolean yaExiste = huespedRepository.findByReservaId(reservaId).stream()
                .anyMatch(h -> h.getCliente().getId().equals(request.getClienteId()));
        if (yaExiste) {
            throw new BusinessException("El cliente ya está registrado como huésped en esta reserva");
        }

        ReservaHuesped huesped = ReservaHuesped.builder()
                .reserva(reserva)
                .cliente(cliente)
                .esTitular(false)
                .build();
        huesped = huespedRepository.save(huesped);

        return ReservaHuespedResponse.builder()
                .id(huesped.getId())
                .reservaId(huesped.getReserva().getId())
                .clienteId(huesped.getCliente().getId())
                .clienteNombre(huesped.getCliente().getNombres() + " " + huesped.getCliente().getApellidos())
                .clienteDocumento(
                        huesped.getCliente().getTipoDocumento() + ": " + huesped.getCliente().getNumeroDocumento())
                .esTitular(huesped.getEsTitular())
                .fechaCreacion(huesped.getFechaCreacion())
                .build();
    }

    @Transactional
    public void eliminarHuesped(UUID reservaId, UUID huespedId) {
        Reserva reserva = reservaRepository.findById(reservaId)
                .orElseThrow(() -> new ResourceNotFoundException("Reserva", reservaId));

        if (!"RESERVADA".equals(reserva.getEstado())) {
            throw new BusinessException("Solo se pueden eliminar huéspedes de reservas en estado RESERVADA");
        }

        ReservaHuesped huesped = huespedRepository.findById(huespedId)
                .orElseThrow(() -> new ResourceNotFoundException("Huésped", huespedId));

        if (!huesped.getReserva().getId().equals(reservaId)) {
            throw new BusinessException("El huésped no pertenece a esta reserva");
        }

        if (Boolean.TRUE.equals(huesped.getEsTitular())) {
            throw new BusinessException("No se puede eliminar al titular de la reserva");
        }

        huespedRepository.delete(huesped);
    }

    @Transactional
    public ReservaResponse cambiarHabitacion(UUID reservaId, CambiarHabitacionRequest request) {
        Reserva reserva = reservaRepository.findById(reservaId)
                .orElseThrow(() -> new ResourceNotFoundException("Reserva", reservaId));

        if (!"RESERVADA".equals(reserva.getEstado())) {
            throw new BusinessException("Solo se puede cambiar la habitación de reservas en estado RESERVADA");
        }

        Habitacion nuevaHabitacion = habitacionRepository.findById(request.getNuevaHabitacionId())
                .orElseThrow(() -> new ResourceNotFoundException("Habitación", request.getNuevaHabitacionId()));

        boolean disponible = reservaRepository.isHabitacionDisponibleParaReserva(
                nuevaHabitacion.getId(), reserva.getFechaIngreso(), reserva.getFechaSalida(), reservaId);
        if (!disponible) {
            throw new BusinessException(
                    "La habitación " + nuevaHabitacion.getNumero() + " no está disponible en las fechas de la reserva");
        }

        if (reserva.getDetalles() == null || reserva.getDetalles().isEmpty()) {
            throw new BusinessException("La reserva no tiene un detalle de habitación para cambiar");
        }

        ReservaDetalle detalle = reserva.getDetalles().iterator().next();

        BigDecimal nuevoPrecio = precioHistoricoRepository
                .findPrecioVigenteValue(nuevaHabitacion.getTipo().getId(), reserva.getFechaIngreso())
                .orElseThrow(() -> new BusinessException("No hay precio vigente para la nueva habitación"));

        detalle.setHabitacion(nuevaHabitacion);
        detalle.setPrecioAplicado(nuevoPrecio);
        detalleRepository.save(detalle);

        return toResponse(reservaRepository.findById(reservaId).orElseThrow());
    }

    public long countReservasActivasEnFecha(LocalDate fecha) {
        return reservaRepository.countReservasActivasEnFecha(fecha);
    }

    private String generarCodigoReserva() {
        String codigo;
        do {
            String numeros = String.format("%04d", (int) (Math.random() * 10000));
            codigo = "RES-" + numeros;
        } while (reservaRepository.existsByCodigo(codigo));
        return codigo;
    }

    private ReservaResponse toResponse(Reserva reserva) {
        long noches = ChronoUnit.DAYS.between(reserva.getFechaIngreso(), reserva.getFechaSalida());
        if (noches < 1)
            noches = 1;
        BigDecimal precioTotal = BigDecimal.ZERO;
        if (reserva.getDetalles() != null) {
            for (ReservaDetalle d : reserva.getDetalles()) {
                if (d.getPrecioAplicado() != null) {
                    precioTotal = precioTotal.add(d.getPrecioAplicado().multiply(BigDecimal.valueOf(noches)));
                }
            }
        }

        return ReservaResponse.builder()
                .id(reserva.getId())
                .codigo(reserva.getCodigo())
                .fechaReserva(reserva.getFechaReserva())
                .fechaIngreso(reserva.getFechaIngreso())
                .fechaSalida(reserva.getFechaSalida())
                .clienteId(reserva.getCliente().getId())
                .clienteNombre(reserva.getCliente().getNombres() + " " + reserva.getCliente().getApellidos())
                .estado(reserva.getEstado())
                .motivoCancelacion(reserva.getMotivoCancelacion())
                .observacionesCancelacion(reserva.getObservacionesCancelacion())
                .fechaCancelacion(reserva.getFechaCancelacion())
                .canceladoPor(reserva.getCanceladoPor() != null ? reserva.getCanceladoPor().getId() : null)
                .canceladoPorNombre(reserva.getCanceladoPor() != null
                        ? reserva.getCanceladoPor().getNombres() + " " + reserva.getCanceladoPor().getApellidos()
                        : null)
                .creadoPor(reserva.getCreadoPor().getId())
                .creadoPorNombre(reserva.getCreadoPor().getNombres() + " " + reserva.getCreadoPor().getApellidos())
                .adultos(reserva.getAdultos())
                .ninos(reserva.getNinos())
                .canalVentaNombre(reserva.getCanalVenta().getNombre())
                .canalVentaIcono(reserva.getCanalVenta().getIcono())
                .canalVentaOtro(reserva.getCanalVentaOtro())
                .fechaCreacion(reserva.getFechaCreacion())
                .fechaActualizacion(reserva.getFechaActualizacion())
                .detalles(reserva.getDetalles() != null
                        ? reserva.getDetalles().stream()
                                .map(d -> ReservaDetalleResponse.builder()
                                        .id(d.getId())
                                        .reservaId(d.getReserva().getId())
                                        .habitacionId(d.getHabitacion().getId())
                                        .habitacionNumero(d.getHabitacion().getNumero())
                                        .tipoNombre(d.getHabitacion().getTipo().getNombre())
                                        .capacidadMax(d.getHabitacion().getTipo().getCapacidadMax())
                                        .precioAplicado(d.getPrecioAplicado())
                                        .fechaCreacion(d.getFechaCreacion())
                                        .build())
                                .toList()
                        : List.of())
                .grupoId(reserva.getGrupo() != null ? reserva.getGrupo().getId() : null)
                .nombreGrupo(reserva.getGrupo() != null ? reserva.getGrupo().getNombreGrupo() : null)
                .huespedes(buildHuespedesList(reserva))
                .precioTotal(precioTotal)
                .build();
    }

    private List<ReservaHuespedResponse> buildHuespedesList(Reserva reserva) {
        List<ReservaHuespedResponse> lista = new ArrayList<>(huespedRepository.findByReservaId(reserva.getId()).stream()
                .map(h -> ReservaHuespedResponse.builder()
                        .id(h.getId())
                        .reservaId(h.getReserva().getId())
                        .clienteId(h.getCliente().getId())
                        .clienteNombre(h.getCliente().getNombres() + " " + h.getCliente().getApellidos())
                        .clienteDocumento(
                                h.getCliente().getTipoDocumento() + ": " + h.getCliente().getNumeroDocumento())
                        .esTitular(h.getEsTitular())
                        .fechaCreacion(h.getFechaCreacion())
                        .build())
                .toList());

        boolean titularExiste = lista.stream().anyMatch(ReservaHuespedResponse::getEsTitular);
        if (!titularExiste && reserva.getCliente() != null) {
            lista.add(0, ReservaHuespedResponse.builder()
                    .reservaId(reserva.getId())
                    .clienteId(reserva.getCliente().getId())
                    .clienteNombre(reserva.getCliente().getNombres() + " " + reserva.getCliente().getApellidos())
                    .clienteDocumento(
                            reserva.getCliente().getTipoDocumento() + ": " + reserva.getCliente().getNumeroDocumento())
                    .esTitular(true)
                    .fechaCreacion(reserva.getFechaCreacion())
                    .build());
        }

        return lista;
    }

    public List<PanelReservaItem> getPanelReservas() {
        List<Reserva> individuales = reservaRepository.findByGrupoIdIsNull();
        List<Grupo> grupos = grupoRepository.findAll();

        List<PanelReservaItem> resultado = new ArrayList<>();

        for (Reserva r : individuales) {
            long noches = ChronoUnit.DAYS.between(r.getFechaIngreso(), r.getFechaSalida());
            if (noches < 1)
                noches = 1;
            BigDecimal precioTotal = BigDecimal.ZERO;
            String habitacionNumero = null;
            if (r.getDetalles() != null && !r.getDetalles().isEmpty()) {
                habitacionNumero = r.getDetalles().get(0).getHabitacion().getNumero();
                for (ReservaDetalle d : r.getDetalles()) {
                    if (d.getPrecioAplicado() != null) {
                        precioTotal = precioTotal.add(d.getPrecioAplicado().multiply(BigDecimal.valueOf(noches)));
                    }
                }
            }
            resultado.add(PanelReservaItem.builder()
                    .id(r.getId())
                    .tipo("INDIVIDUAL")
                    .codigo(r.getCodigo())
                    .cliente(r.getCliente().getNombres() + " " + r.getCliente().getApellidos())
                    .fechaIngreso(r.getFechaIngreso())
                    .fechaSalida(r.getFechaSalida())
                    .grupoNombre(null)
                    .estado(r.getEstado())
                    .precioTotal(precioTotal)
                    .habitacionNumero(habitacionNumero)
                    .build());
        }

        for (Grupo g : grupos) {
            List<Reserva> hijas = reservaRepository.findByGrupoId(g.getId());
            List<PanelReservaItem> hijasItems = hijas.stream().map(h -> {
                String titularNombre = huespedRepository.findByReservaId(h.getId()).stream()
                        .filter(ReservaHuesped::getEsTitular)
                        .findFirst()
                        .map(hue -> hue.getCliente().getNombres() + " " + hue.getCliente().getApellidos())
                        .orElse(h.getCliente().getNombres() + " " + h.getCliente().getApellidos());

                long noches = ChronoUnit.DAYS.between(h.getFechaIngreso(), h.getFechaSalida());
                if (noches < 1)
                    noches = 1;
                BigDecimal precioHija = BigDecimal.ZERO;
                String habitacionNumero = null;
                if (h.getDetalles() != null && !h.getDetalles().isEmpty()) {
                    habitacionNumero = h.getDetalles().get(0).getHabitacion().getNumero();
                    for (ReservaDetalle d : h.getDetalles()) {
                        if (d.getPrecioAplicado() != null) {
                            precioHija = precioHija.add(d.getPrecioAplicado().multiply(BigDecimal.valueOf(noches)));
                        }
                    }
                }

                return PanelReservaItem.builder()
                        .id(h.getId())
                        .tipo("HIJA")
                        .codigo(h.getCodigo())
                        .cliente(titularNombre)
                        .fechaIngreso(h.getFechaIngreso())
                        .fechaSalida(h.getFechaSalida())
                        .grupoNombre(null)
                        .estado(h.getEstado())
                        .precioTotal(precioHija)
                        .habitacionNumero(habitacionNumero)
                        .build();
            }).toList();

            BigDecimal grupoPrecioTotal = hijasItems.stream()
                    .map(item -> item.getPrecioTotal() != null ? item.getPrecioTotal() : BigDecimal.ZERO)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            PanelReservaItem cabecera = PanelReservaItem.builder()
                    .id(g.getId())
                    .tipo("GRUPO")
                    .codigo("GRP-" + g.getId().toString().substring(0, 6).toUpperCase())
                    .cliente(g.getResponsablePago().getNombres() + " " + g.getResponsablePago().getApellidos())
                    .fechaIngreso(g.getFechaIngreso())
                    .fechaSalida(g.getFechaSalida())
                    .grupoNombre(g.getNombreGrupo())
                    .estado(calcularEstadoGrupo(hijasItems))
                    .hijas(hijasItems)
                    .precioTotal(grupoPrecioTotal)
                    .build();

            resultado.add(cabecera);
        }

        resultado.sort((a, b) -> {
            int cmp = b.getFechaIngreso().compareTo(a.getFechaIngreso());
            if (cmp != 0)
                return cmp;
            return a.getCodigo().compareTo(b.getCodigo());
        });

        return resultado;
    }

    @Transactional
    public ReservaResponse update(UUID id, ActualizarReservaRequest request) {
        Reserva reserva = reservaRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Reserva", id));

        if (!"RESERVADA".equals(reserva.getEstado())) {
            throw new BusinessException("Solo se pueden modificar reservas en estado 'RESERVADA'");
        }

        LocalDate nuevaFechaIngreso = request.getFechaIngreso() != null ? request.getFechaIngreso()
                : reserva.getFechaIngreso();
        LocalDate nuevaFechaSalida = request.getFechaSalida() != null ? request.getFechaSalida()
                : reserva.getFechaSalida();

        if (nuevaFechaSalida.isBefore(nuevaFechaIngreso) || nuevaFechaSalida.equals(nuevaFechaIngreso)) {
            throw new BusinessException("La fecha de salida debe ser posterior a la fecha de ingreso");
        }

        boolean fechasCambiaron = !nuevaFechaIngreso.equals(reserva.getFechaIngreso())
                || !nuevaFechaSalida.equals(reserva.getFechaSalida());

        if (fechasCambiaron) {
            for (ReservaDetalle detalle : reserva.getDetalles()) {
                boolean disponible = reservaRepository.isHabitacionDisponibleParaReserva(
                        detalle.getHabitacion().getId(), nuevaFechaIngreso, nuevaFechaSalida, id);
                if (!disponible) {
                    throw new BusinessException("La habitación " + detalle.getHabitacion().getNumero()
                            + " no está disponible en las nuevas fechas");
                }
            }
        }

        reserva.setFechaIngreso(nuevaFechaIngreso);
        reserva.setFechaSalida(nuevaFechaSalida);

        if (request.getAdultos() != null)
            reserva.setAdultos(request.getAdultos());
        if (request.getNinos() != null)
            reserva.setNinos(request.getNinos());

        reserva = reservaRepository.save(reserva);
        return toResponse(reserva);
    }

    @Transactional
    public ReservaResponse extender(UUID id, ExtenderReservaRequest request) {
        Reserva reserva = reservaRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Reserva", id));

        if (!"RESERVADA".equals(reserva.getEstado())) {
            throw new BusinessException("Solo se pueden extender reservas en estado 'RESERVADA'");
        }

        LocalDate nuevaFechaSalida = request.getNuevaFechaSalida();

        if (!nuevaFechaSalida.isAfter(reserva.getFechaSalida())) {
            throw new BusinessException("La nueva fecha de salida debe ser posterior a la actual");
        }

        for (ReservaDetalle detalle : reserva.getDetalles()) {
            boolean disponible = reservaRepository.isHabitacionDisponibleParaReserva(
                    detalle.getHabitacion().getId(), reserva.getFechaIngreso(), nuevaFechaSalida, id);
            if (!disponible) {
                throw new BusinessException("La habitación " + detalle.getHabitacion().getNumero()
                        + " no está disponible para extender hasta la fecha solicitada");
            }
        }

        reserva.setFechaSalida(nuevaFechaSalida);
        reserva = reservaRepository.save(reserva);
        return toResponse(reserva);
    }

    private String calcularEstadoGrupo(List<PanelReservaItem> hijas) {
        if (hijas == null || hijas.isEmpty())
            return "CANCELADO";

        long total = hijas.size();
        long canceladas = hijas.stream()
                .filter(r -> "CANCELADA".equals(r.getEstado()) || "CANCELADO".equals(r.getEstado())).count();
        long finalizados = hijas.stream().filter(r -> "FINALIZADO".equals(r.getEstado())).count();
        long hospedados = hijas.stream().filter(r -> "HOSPEDADO".equals(r.getEstado())).count();
        long reservadas = hijas.stream().filter(r -> "RESERVADA".equals(r.getEstado())).count();

        if (canceladas == total)
            return "CANCELADO";
        if (hospedados > 0)
            return "ACTIVO";
        if (finalizados == total)
            return "FINALIZADO";
        if (finalizados + canceladas == total && finalizados > 0)
            return "FINALIZADO";
        if (reservadas == total)
            return "RESERVADA";
        if (reservadas > 0 && canceladas > 0)
            return "RESERVADA";
        return "RESERVADA";
    }
}
