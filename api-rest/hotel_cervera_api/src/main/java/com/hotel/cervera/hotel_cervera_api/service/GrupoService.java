package com.hotel.cervera.hotel_cervera_api.service;

import com.hotel.cervera.hotel_cervera_api.dto.request.AddHabitacionRequest;
import com.hotel.cervera.hotel_cervera_api.dto.request.CancelarGrupoRequest;
import com.hotel.cervera.hotel_cervera_api.dto.request.ExtenderGrupoRequest;
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
import java.time.LocalDateTime;
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

        if (request.getNombreGrupo() != null)
            grupo.setNombreGrupo(request.getNombreGrupo());
        if (request.getResponsablePagoId() != null) {
            Cliente responsable = clienteRepository.findById(request.getResponsablePagoId())
                    .orElseThrow(() -> new ResourceNotFoundException("Cliente", request.getResponsablePagoId()));
            grupo.setResponsablePago(responsable);
        }

        LocalDate nuevaFechaIngreso = request.getFechaIngreso() != null ? request.getFechaIngreso() : grupo.getFechaIngreso();
        LocalDate nuevaFechaSalida = request.getFechaSalida() != null ? request.getFechaSalida() : grupo.getFechaSalida();

        if (!nuevaFechaSalida.isAfter(nuevaFechaIngreso)) {
            throw new BusinessException("La fecha de salida debe ser posterior a la fecha de ingreso");
        }

        boolean fechasCambiaron = !nuevaFechaIngreso.equals(grupo.getFechaIngreso())
                || !nuevaFechaSalida.equals(grupo.getFechaSalida());

        if (fechasCambiaron) {
            List<Reserva> hijas = reservaRepository.findByGrupoId(id);
            for (Reserva hija : hijas) {
                if (!"RESERVADA".equals(hija.getEstado())) continue;
                for (ReservaDetalle detalle : hija.getDetalles()) {
                    boolean disponible = reservaRepository.isHabitacionDisponibleParaReserva(
                            detalle.getHabitacion().getId(), nuevaFechaIngreso, nuevaFechaSalida, hija.getId());
                    if (!disponible) {
                        throw new BusinessException("La habitación " + detalle.getHabitacion().getNumero()
                                + " no está disponible en las nuevas fechas del grupo");
                    }
                }
                hija.setFechaIngreso(nuevaFechaIngreso);
                hija.setFechaSalida(nuevaFechaSalida);
                reservaRepository.save(hija);
            }
            grupo.setFechaIngreso(nuevaFechaIngreso);
            grupo.setFechaSalida(nuevaFechaSalida);
        }

        if (request.getFacturarTodoAlResponsable() != null) {
            grupo.setFacturarTodoAlResponsable(request.getFacturarTodoAlResponsable());
        }
        if (request.getCanalVentaId() != null) {
            CanalesVenta canal = canalesVentaRepository.findById(request.getCanalVentaId())
                    .orElseThrow(() -> new ResourceNotFoundException("Canal de venta no válido"));
            grupo.setCanalVenta(canal);
        }
        if (request.getCanalVentaOtro() != null)
            grupo.setCanalVentaOtro(request.getCanalVentaOtro());

        grupo = grupoRepository.save(grupo);
        return toResponse(grupo);
    }

    @Transactional
    public void delete(UUID id) {
        Grupo grupo = grupoRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Grupo", id));
        List<Reserva> reservas = reservaRepository.findByGrupoId(id);
        boolean hasActivas = reservas.stream().anyMatch(r -> !"CANCELADA".equals(r.getEstado()));
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

        target.setEstado("CANCELADA");
        target.setMotivoCancelacion("Eliminada del grupo");
        reservaRepository.save(target);

        return toResponse(grupoRepository.findById(grupo.getId()).orElseThrow());
    }

    @Transactional
    public GrupoResponse cancelarGrupo(UUID id, CancelarGrupoRequest request, UUID usuarioId) {
        Grupo grupo = grupoRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Grupo", id));

        Usuario canceladoPor = usuarioRepository.findById(usuarioId)
                .orElseThrow(() -> new ResourceNotFoundException("Usuario", usuarioId));

        List<Reserva> hijas = reservaRepository.findByGrupoId(id);
        boolean algunaCancelada = false;

        for (Reserva hija : hijas) {
            if (!"RESERVADA".equals(hija.getEstado())) continue;
            hija.setEstado("CANCELADA");
            hija.setMotivoCancelacion(request.getMotivoCancelacion());
            hija.setObservacionesCancelacion(request.getObservaciones());
            hija.setFechaCancelacion(LocalDateTime.now());
            hija.setCanceladoPor(canceladoPor);
            reservaRepository.save(hija);
            algunaCancelada = true;
        }

        if (!algunaCancelada) {
            throw new BusinessException("No hay reservas en estado RESERVADA para cancelar en este grupo");
        }

        return toResponse(grupoRepository.findById(id).orElseThrow());
    }

    @Transactional
    public GrupoResponse extenderGrupo(UUID id, ExtenderGrupoRequest request) {
        Grupo grupo = grupoRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Grupo", id));

        LocalDate nuevaFechaSalida = request.getNuevaFechaSalida();

        if (!nuevaFechaSalida.isAfter(grupo.getFechaSalida())) {
            throw new BusinessException("La nueva fecha de salida debe ser posterior a la actual");
        }

        List<Reserva> hijas = reservaRepository.findByGrupoId(id);
        for (Reserva hija : hijas) {
            String estado = hija.getEstado();
            if ("CANCELADA".equals(estado) || "FINALIZADO".equals(estado)) continue;

            for (ReservaDetalle detalle : hija.getDetalles()) {
                boolean disponible = reservaRepository.isHabitacionDisponibleParaReserva(
                        detalle.getHabitacion().getId(), hija.getFechaIngreso(), nuevaFechaSalida, hija.getId());
                if (!disponible) {
                    throw new BusinessException("La habitación " + detalle.getHabitacion().getNumero()
                            + " no está disponible para extender hasta la fecha solicitada");
                }
            }
            hija.setFechaSalida(nuevaFechaSalida);
            reservaRepository.save(hija);
        }

        grupo.setFechaSalida(nuevaFechaSalida);
        grupo = grupoRepository.save(grupo);

        return toResponse(grupo);
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
                        ? request.getFacturarTodoAlResponsable()
                        : true)
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
                .estado("RESERVADA")
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
                        .clienteDocumento(
                                h.getCliente().getTipoDocumento() + ": " + h.getCliente().getNumeroDocumento())
                        .esTitular(h.getEsTitular())
                        .fechaCreacion(h.getFechaCreacion())
                        .build())
                .toList();
    }

    private void validarDisponibilidad(UUID habitacionId, LocalDate fechaIngreso, LocalDate fechaSalida) {
        boolean disponible = reservaRepository.isHabitacionDisponible(habitacionId, fechaIngreso, fechaSalida);
        if (!disponible) {
            throw new BusinessException("La habitación no está disponible en las fechas seleccionadas");
        }
    }

    private String calcularEstadoGrupo(List<ReservaResponse> reservas) {
        if (reservas == null || reservas.isEmpty()) return "CANCELADO";

        long total = reservas.size();
        long canceladas = reservas.stream().filter(r -> "CANCELADA".equals(r.getEstado())).count();
        long finalizados = reservas.stream().filter(r -> "FINALIZADO".equals(r.getEstado())).count();
        long hospedados = reservas.stream().filter(r -> "HOSPEDADO".equals(r.getEstado())).count();
        long reservadas = reservas.stream().filter(r -> "RESERVADA".equals(r.getEstado())).count();

        if (canceladas == total) return "CANCELADO";
        if (hospedados > 0) return "ACTIVO";
        if (finalizados == total) return "FINALIZADO";
        if (reservadas == total) return "RESERVADA";
        if (reservadas > 0 && canceladas > 0) return "RESERVADA";
        return "RESERVADA";
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
                                    .clienteDocumento(h.getCliente().getTipoDocumento() + ": "
                                            + h.getCliente().getNumeroDocumento())
                                    .esTitular(h.getEsTitular())
                                    .fechaCreacion(h.getFechaCreacion())
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

                            .fechaCreacion(r.getFechaCreacion())
                            .fechaActualizacion(r.getFechaActualizacion())
                            .detalles(r.getDetalles().stream()
                                    .map(d -> com.hotel.cervera.hotel_cervera_api.dto.response.ReservaDetalleResponse
                                            .builder()
                                            .id(d.getId())
                                            .reservaId(d.getReserva().getId())
                                            .habitacionId(d.getHabitacion().getId())
                                            .habitacionNumero(d.getHabitacion().getNumero())
                                            .precioAplicado(d.getPrecioAplicado())
                                            .fechaCreacion(d.getFechaCreacion())
                                            .build())
                                    .toList())
                            .grupoId(r.getGrupo() != null ? r.getGrupo().getId() : null)
                            .nombreGrupo(r.getGrupo() != null ? r.getGrupo().getNombreGrupo() : null)
                            .huespedes(huespedes)
                            .build();
                })
                .toList();

        String estadoGrupo = calcularEstadoGrupo(reservas);

        return GrupoResponse.builder()
                .id(grupo.getId())
                .nombreGrupo(grupo.getNombreGrupo())
                .responsablePagoId(grupo.getResponsablePago().getId())
                .responsablePagoNombre(
                        grupo.getResponsablePago().getNombres() + " " + grupo.getResponsablePago().getApellidos())
                .fechaIngreso(grupo.getFechaIngreso())
                .fechaSalida(grupo.getFechaSalida())
                .facturarTodoAlResponsable(grupo.getFacturarTodoAlResponsable())
                .canalVentaNombre(grupo.getCanalVenta().getNombre())
                .canalVentaIcono(grupo.getCanalVenta().getIcono())
                .canalVentaOtro(grupo.getCanalVentaOtro())
                .creadoPor(grupo.getCreadoPor().getId())
                .creadoPorNombre(grupo.getCreadoPor().getNombres() + " " + grupo.getCreadoPor().getApellidos())
                .fechaCreacion(grupo.getFechaCreacion())
                .fechaActualizacion(grupo.getFechaActualizacion())
                .estado(estadoGrupo)
                .reservas(reservas)
                .build();
    }
}
