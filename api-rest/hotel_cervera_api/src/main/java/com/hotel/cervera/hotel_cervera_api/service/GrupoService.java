package com.hotel.cervera.hotel_cervera_api.service;

import com.hotel.cervera.hotel_cervera_api.dto.request.AddHabitacionRequest;
import com.hotel.cervera.hotel_cervera_api.dto.request.GrupoRequest;
import com.hotel.cervera.hotel_cervera_api.dto.request.GrupoUpdateRequest;
import com.hotel.cervera.hotel_cervera_api.dto.request.HuespedRequest;
import com.hotel.cervera.hotel_cervera_api.dto.request.ReservaEnGrupoRequest;
import com.hotel.cervera.hotel_cervera_api.dto.response.GrupoResponse;
import com.hotel.cervera.hotel_cervera_api.dto.response.ReservaHuespedResponse;
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
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class GrupoService {

    private final GrupoRepository grupoRepository;
    private final ReservaRepository reservaRepository;
    private final ReservaDetalleRepository detalleRepository;
    private final ReservaHuespedRepository huespedRepository;
    private final ClienteRepository clienteRepository;
    private final UsuarioRepository usuarioRepository;
    private final HabitacionRepository habitacionRepository;
    private final PrecioHistoricoRepository precioHistoricoRepository;
    private final CanalesVentaRepository canalesVentaRepository;

    public List<GrupoResponse> findAll() {
        return grupoRepository.findAll().stream().map(this::toResponse).toList();
    }

    public GrupoResponse findById(UUID id) {
        Grupo grupo = grupoRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Grupo", id));
        return toResponse(grupo);
    }

    @Transactional
    public GrupoResponse update(UUID id, GrupoUpdateRequest request) {
        Grupo grupo = grupoRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Grupo", id));

        if (request.getNombreGrupo() != null) grupo.setNombreGrupo(request.getNombreGrupo());
        if (request.getResponsablePagoId() != null) {
            Cliente responsable = clienteRepository.findById(request.getResponsablePagoId())
                    .orElseThrow(() -> new ResourceNotFoundException("Cliente", request.getResponsablePagoId()));
            grupo.setResponsablePago(responsable);
        }
        if (request.getFechaIngreso() != null) {
            if (request.getFechaSalida() != null && !request.getFechaSalida().isAfter(request.getFechaIngreso())) {
                throw new BusinessException("La fecha de salida debe ser posterior a la fecha de ingreso");
            }
            grupo.setFechaIngreso(request.getFechaIngreso());
        }
        if (request.getFechaSalida() != null) {
            if (!request.getFechaSalida().isAfter(grupo.getFechaIngreso())) {
                throw new BusinessException("La fecha de salida debe ser posterior a la fecha de ingreso");
            }
            grupo.setFechaSalida(request.getFechaSalida());
        }
        if (request.getFacturarTodoAlResponsable() != null) {
            grupo.setFacturarTodoAlResponsable(request.getFacturarTodoAlResponsable());
        }
        if (request.getCanalVentaId() != null) {
            CanalesVenta canal = canalesVentaRepository.findById(request.getCanalVentaId())
                    .orElseThrow(() -> new ResourceNotFoundException("Canal de venta no válido"));
            grupo.setCanalVenta(canal);
        }
        if (request.getCanalVentaOtro() != null) grupo.setCanalVentaOtro(request.getCanalVentaOtro());

        grupo = grupoRepository.save(grupo);
        return toResponse(grupo);
    }

    @Transactional
    public void delete(UUID id) {
        Grupo grupo = grupoRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Grupo", id));
        List<Reserva> reservas = reservaRepository.findByGrupoId(id);
        boolean hasActivas = reservas.stream().anyMatch(r -> !"cancelada".equals(r.getEstado()));
        if (hasActivas) {
            throw new BusinessException("No se puede eliminar un grupo con reservas activas");
        }
        grupoRepository.delete(grupo);
    }

    @Transactional
    public GrupoResponse addHabitacion(UUID grupoId, AddHabitacionRequest request) {
        Grupo grupo = grupoRepository.findById(grupoId)
                .orElseThrow(() -> new ResourceNotFoundException("Grupo", grupoId));

        Habitacion habitacion = habitacionRepository.findById(request.getHabitacionId())
                .orElseThrow(() -> new ResourceNotFoundException("Habitación", request.getHabitacionId()));

        validarDisponibilidad(habitacion.getId(), grupo.getFechaIngreso(), grupo.getFechaSalida());

        ReservaEnGrupoRequest resReq = new ReservaEnGrupoRequest();
        resReq.setHabitacionId(request.getHabitacionId());
        resReq.setAdultos(request.getAdultos() != null ? request.getAdultos() : 1);
        resReq.setNinos(request.getNinos() != null ? request.getNinos() : 0);
        resReq.setHuespedes(request.getHuespedes());

        crearReservaEnGrupo(grupo, resReq, grupo.getCreadoPor());

        return toResponse(grupoRepository.findById(grupo.getId()).orElseThrow());
    }

    @Transactional
    public GrupoResponse removeHabitacion(UUID grupoId, UUID habitacionId) {
        Grupo grupo = grupoRepository.findById(grupoId)
                .orElseThrow(() -> new ResourceNotFoundException("Grupo", grupoId));

        List<Reserva> reservas = reservaRepository.findByGrupoId(grupoId);
        Reserva target = reservas.stream()
                .filter(r -> r.getDetalles().stream()
                        .anyMatch(d -> d.getHabitacion().getId().equals(habitacionId)))
                .findFirst()
                .orElseThrow(() -> new BusinessException("La habitación no está asignada a este grupo"));

        target.setEstado("cancelada");
        target.setMotivoCancelacion("Eliminada del grupo");
        reservaRepository.save(target);

        return toResponse(grupoRepository.findById(grupo.getId()).orElseThrow());
    }

    @Transactional
    public GrupoResponse create(GrupoRequest request) {
        if (request.getFechaSalida().isBefore(request.getFechaIngreso()) ||
                request.getFechaSalida().equals(request.getFechaIngreso())) {
            throw new BusinessException("La fecha de salida debe ser posterior a la fecha de ingreso");
        }

        Cliente responsable = clienteRepository.findById(request.getResponsablePagoId())
                .orElseThrow(() -> new ResourceNotFoundException("Cliente", request.getResponsablePagoId()));
        Usuario creadoPor = usuarioRepository.findById(request.getCreadoPor())
                .orElseThrow(() -> new ResourceNotFoundException("Usuario", request.getCreadoPor()));

        CanalesVenta canal = canalesVentaRepository.findById(request.getCanalVentaId())
                .orElseThrow(() -> new ResourceNotFoundException("Canal de venta no válido"));

        Grupo grupo = Grupo.builder()
                .nombreGrupo(request.getNombreGrupo())
                .responsablePago(responsable)
                .fechaIngreso(request.getFechaIngreso())
                .fechaSalida(request.getFechaSalida())
                .facturarTodoAlResponsable(request.getFacturarTodoAlResponsable() != null
                        ? request.getFacturarTodoAlResponsable() : true)
                .canalVenta(canal)
                .canalVentaOtro(request.getCanalVentaOtro())
                .creadoPor(creadoPor)
                .build();
        grupo = grupoRepository.save(grupo);

        for (ReservaEnGrupoRequest resReq : request.getReservas()) {
            crearReservaEnGrupo(grupo, resReq, creadoPor);
        }

        return toResponse(grupoRepository.findById(grupo.getId()).orElseThrow());
    }

    private void crearReservaEnGrupo(Grupo grupo, ReservaEnGrupoRequest req, Usuario creadoPor) {
        Habitacion habitacion = habitacionRepository.findById(req.getHabitacionId())
                .orElseThrow(() -> new ResourceNotFoundException("Habitación", req.getHabitacionId()));

        validarDisponibilidad(habitacion.getId(), grupo.getFechaIngreso(), grupo.getFechaSalida());

        String codigo = generarCodigoReserva();

        Reserva reserva = Reserva.builder()
                .codigo(codigo)
                .fechaReserva(OffsetDateTime.now())
                .fechaIngreso(grupo.getFechaIngreso())
                .fechaSalida(grupo.getFechaSalida())
                .cliente(grupo.getResponsablePago())
                .grupo(grupo)
                .estado("pendiente")
                .creadoPor(creadoPor)
                .adultos(req.getAdultos() != null ? req.getAdultos() : 1)
                .ninos(req.getNinos() != null ? req.getNinos() : 0)
                .canalVenta(grupo.getCanalVenta())
                .canalVentaOtro(grupo.getCanalVentaOtro())
                .build();
        reserva = reservaRepository.save(reserva);

        BigDecimal precio = precioHistoricoRepository
                .findPrecioVigenteValue(habitacion.getTipo().getId(), grupo.getFechaIngreso())
                .orElseThrow(() -> new BusinessException("No hay precio vigente para la habitación "
                        + habitacion.getNumero()));

        ReservaDetalle detalle = ReservaDetalle.builder()
                .reserva(reserva)
                .habitacion(habitacion)
                .precioAplicado(precio)
                .build();
        detalleRepository.save(detalle);

        if (req.getHuespedes() == null || req.getHuespedes().isEmpty()) {
            throw new BusinessException("La habitación " + habitacion.getNumero()
                    + " (" + habitacion.getTipo().getNombre() + ") debe tener al menos un huésped");
        }
        boolean hasTitular = req.getHuespedes().stream().anyMatch(HuespedRequest::getEsTitular);
        if (!hasTitular) {
            throw new BusinessException("Cada habitación debe tener al menos un huésped titular");
        }
        if (req.getHuespedes().size() > habitacion.getTipo().getCapacidadMax()) {
            throw new BusinessException("La habitación " + habitacion.getNumero()
                    + " (" + habitacion.getTipo().getNombre() + ") tiene capacidad máxima de "
                    + habitacion.getTipo().getCapacidadMax() + " personas");
        }
            for (HuespedRequest hReq : req.getHuespedes()) {
                Cliente huesped = clienteRepository.findById(hReq.getClienteId())
                        .orElseThrow(() -> new ResourceNotFoundException("Cliente", hReq.getClienteId()));
                ReservaHuesped rh = ReservaHuesped.builder()
                        .reserva(reserva)
                        .cliente(huesped)
                        .esTitular(hReq.getEsTitular() != null && hReq.getEsTitular())
                        .build();
                huespedRepository.save(rh);
            }
    }

    public List<ReservaHuespedResponse> getHuespedes(UUID reservaId) {
        return huespedRepository.findByReservaId(reservaId).stream()
                .map(h -> ReservaHuespedResponse.builder()
                        .id(h.getId())
                        .reservaId(h.getReserva().getId())
                        .clienteId(h.getCliente().getId())
                        .clienteNombre(h.getCliente().getNombres() + " " + h.getCliente().getApellidos())
                        .clienteDocumento(h.getCliente().getTipoDocumento() + ": " + h.getCliente().getNumeroDocumento())
                        .esTitular(h.getEsTitular())
                        .createdAt(h.getCreatedAt())
                        .build())
                .toList();
    }

    private void validarDisponibilidad(UUID habitacionId, LocalDate fechaIngreso, LocalDate fechaSalida) {
        boolean disponible = reservaRepository.isHabitacionDisponible(habitacionId, fechaIngreso, fechaSalida);
        if (!disponible) {
            throw new BusinessException("La habitación no está disponible en las fechas seleccionadas");
        }
    }

    private String generarCodigoReserva() {
        String codigo;
        do {
            String numeros = String.format("%04d", (int) (Math.random() * 10000));
            codigo = "RES-" + numeros;
        } while (reservaRepository.existsByCodigo(codigo));
        return codigo;
    }

    private GrupoResponse toResponse(Grupo grupo) {
        List<ReservaResponse> reservas = reservaRepository.findByGrupoId(grupo.getId()).stream()
                .map(r -> {
                    List<ReservaHuespedResponse> huespedes = huespedRepository.findByReservaId(r.getId()).stream()
                            .map(h -> ReservaHuespedResponse.builder()
                                    .id(h.getId())
                                    .reservaId(h.getReserva().getId())
                                    .clienteId(h.getCliente().getId())
                                    .clienteNombre(h.getCliente().getNombres() + " " + h.getCliente().getApellidos())
                                    .clienteDocumento(h.getCliente().getTipoDocumento() + ": " + h.getCliente().getNumeroDocumento())
                                    .esTitular(h.getEsTitular())
                                    .createdAt(h.getCreatedAt())
                                    .build())
                            .toList();
                    return ReservaResponse.builder()
                            .id(r.getId())
                            .codigo(r.getCodigo())
                            .fechaReserva(r.getFechaReserva())
                            .fechaIngreso(r.getFechaIngreso())
                            .fechaSalida(r.getFechaSalida())
                            .clienteId(r.getCliente().getId())
                            .clienteNombre(r.getCliente().getNombres() + " " + r.getCliente().getApellidos())
                            .estado(r.getEstado())
                            .motivoCancelacion(r.getMotivoCancelacion())
                            .observacionesCancelacion(r.getObservacionesCancelacion())
                            .fechaCancelacion(r.getFechaCancelacion())
                            .canceladoPor(r.getCanceladoPor() != null ? r.getCanceladoPor().getId() : null)
                            .canceladoPorNombre(r.getCanceladoPor() != null
                                    ? r.getCanceladoPor().getNombres() + " " + r.getCanceladoPor().getApellidos()
                                    : null)
                            .creadoPor(r.getCreadoPor().getId())
                            .creadoPorNombre(r.getCreadoPor().getNombres() + " " + r.getCreadoPor().getApellidos())
                            .adultos(r.getAdultos())
                .ninos(r.getNinos())
                .canalVentaNombre(r.getCanalVenta().getNombre())
                            .canalVentaIcono(r.getCanalVenta().getIcono())
                            .canalVentaOtro(r.getCanalVentaOtro())

                            .createdAt(r.getCreatedAt())
                            .updatedAt(r.getUpdatedAt())
                            .detalles(r.getDetalles().stream()
                                    .map(d -> com.hotel.cervera.hotel_cervera_api.dto.response.ReservaDetalleResponse.builder()
                                            .id(d.getId())
                                            .reservaId(d.getReserva().getId())
                                            .habitacionId(d.getHabitacion().getId())
                                            .habitacionNumero(d.getHabitacion().getNumero())
                                            .precioAplicado(d.getPrecioAplicado())
                                            .createdAt(d.getCreatedAt())
                                            .build())
                                    .toList())
                            .grupoId(r.getGrupo() != null ? r.getGrupo().getId() : null)
                            .nombreGrupo(r.getGrupo() != null ? r.getGrupo().getNombreGrupo() : null)
                            .huespedes(huespedes)
                            .build();
                })
                .toList();

        return GrupoResponse.builder()
                .id(grupo.getId())
                .nombreGrupo(grupo.getNombreGrupo())
                .responsablePagoId(grupo.getResponsablePago().getId())
                .responsablePagoNombre(grupo.getResponsablePago().getNombres() + " " + grupo.getResponsablePago().getApellidos())
                .fechaIngreso(grupo.getFechaIngreso())
                .fechaSalida(grupo.getFechaSalida())
                .facturarTodoAlResponsable(grupo.getFacturarTodoAlResponsable())
                .canalVentaNombre(grupo.getCanalVenta().getNombre())
                .canalVentaIcono(grupo.getCanalVenta().getIcono())
                .canalVentaOtro(grupo.getCanalVentaOtro())
                .creadoPor(grupo.getCreadoPor().getId())
                .creadoPorNombre(grupo.getCreadoPor().getNombres() + " " + grupo.getCreadoPor().getApellidos())
                .createdAt(grupo.getCreatedAt())
                .updatedAt(grupo.getUpdatedAt())
                .reservas(reservas)
                .build();
    }
}
