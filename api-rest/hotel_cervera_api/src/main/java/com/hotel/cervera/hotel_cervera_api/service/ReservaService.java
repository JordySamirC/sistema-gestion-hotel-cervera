package com.hotel.cervera.hotel_cervera_api.service;

import com.hotel.cervera.hotel_cervera_api.dto.request.ReservaRequest;
import com.hotel.cervera.hotel_cervera_api.dto.response.ReservaDetalleResponse;
import com.hotel.cervera.hotel_cervera_api.dto.response.ReservaResponse;
import com.hotel.cervera.hotel_cervera_api.exception.BusinessException;
import com.hotel.cervera.hotel_cervera_api.exception.ResourceNotFoundException;
import com.hotel.cervera.hotel_cervera_api.model.*;
import com.hotel.cervera.hotel_cervera_api.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Set;
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

        String codigo = generarCodigoReserva();

        Reserva reserva = Reserva.builder()
                .codigo(codigo)
                .fechaReserva(OffsetDateTime.now())
                .fechaIngreso(request.getFechaIngreso())
                .fechaSalida(request.getFechaSalida())
                .cliente(cliente)
                .estado("pendiente")
                .creadoPor(creadoPor)
                .adultos(request.getAdultos() != null ? request.getAdultos() : 1)
                .adolescentes(request.getAdolescentes() != null ? request.getAdolescentes() : 0)
                .ninos(request.getNinos() != null ? request.getNinos() : 0)
                .bebes(request.getBebes() != null ? request.getBebes() : 0)
                .canalVenta(request.getCanalVenta() != null ? request.getCanalVenta() : "directo")
                .tipoCliente(request.getTipoCliente() != null ? request.getTipoCliente() : "transient")
                .cambiosReserva(0)
                .solicitudesEspeciales(0)
                .cancelacionesPrevias(0)
                .build();

        reserva = reservaRepository.save(reserva);

        for (UUID habId : request.getHabitacionesIds()) {
            Habitacion habitacion = habitacionRepository.findById(habId)
                    .orElseThrow(() -> new ResourceNotFoundException("Habitación", habId));

            if (!"disponible".equals(habitacion.getEstadoActual()) &&
                    !"por_limpiar".equals(habitacion.getEstadoActual())) {
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

            if (!"por_limpiar".equals(habitacion.getEstadoActual())) {
                habitacion.setEstadoActual("por_limpiar");
            }
            habitacionRepository.save(habitacion);
        }

        return toResponse(reservaRepository.findById(reserva.getId()).orElseThrow());
    }

    @Transactional
    public ReservaResponse cancelar(UUID id, String motivo) {
        Reserva reserva = reservaRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Reserva", id));

        if (!"pendiente".equals(reserva.getEstado())) {
            throw new BusinessException("Solo se pueden cancelar reservas en estado 'pendiente'");
        }

        reserva.setEstado("cancelada");
        reserva.setMotivoCancelacion(motivo);
        reserva = reservaRepository.save(reserva);

        for (ReservaDetalle detalle : reserva.getDetalles()) {
            Habitacion habitacion = detalle.getHabitacion();
            if ("por_limpiar".equals(habitacion.getEstadoActual())) {
                habitacion.setEstadoActual("disponible");
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
                        .precioAplicado(d.getPrecioAplicado())
                        .createdAt(d.getCreatedAt())
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
                .precioAplicado(detalle.getPrecioAplicado())
                .createdAt(detalle.getCreatedAt())
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
        Set<String> estadosSinDetalle = Set.of("cancelada", "no_show");
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
                .creadoPor(reserva.getCreadoPor().getId())
                .creadoPorNombre(reserva.getCreadoPor().getNombres() + " " + reserva.getCreadoPor().getApellidos())
                .adultos(reserva.getAdultos())
                .adolescentes(reserva.getAdolescentes())
                .ninos(reserva.getNinos())
                .bebes(reserva.getBebes())
                .canalVenta(reserva.getCanalVenta())
                .tipoCliente(reserva.getTipoCliente())
                .cambiosReserva(reserva.getCambiosReserva())
                .solicitudesEspeciales(reserva.getSolicitudesEspeciales())
                .cancelacionesPrevias(reserva.getCancelacionesPrevias())
                .createdAt(reserva.getCreatedAt())
                .updatedAt(reserva.getUpdatedAt())
                .detalles(!estadosSinDetalle.contains(reserva.getEstado())
                        ? reserva.getDetalles().stream()
                            .map(d -> ReservaDetalleResponse.builder()
                                    .id(d.getId())
                                    .reservaId(d.getReserva().getId())
                                    .habitacionId(d.getHabitacion().getId())
                                    .habitacionNumero(d.getHabitacion().getNumero())
                                    .precioAplicado(d.getPrecioAplicado())
                                    .createdAt(d.getCreatedAt())
                                    .build())
                            .toList()
                        : List.of())
                .build();
    }
}
