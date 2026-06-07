package com.hotel.cervera.hotel_cervera_api.service;

import com.hotel.cervera.hotel_cervera_api.dto.request.CheckInRequest;
import com.hotel.cervera.hotel_cervera_api.dto.request.PagoGrupoRequest;
import com.hotel.cervera.hotel_cervera_api.dto.response.EstadiaResponse;
import com.hotel.cervera.hotel_cervera_api.exception.BusinessException;
import com.hotel.cervera.hotel_cervera_api.exception.ResourceNotFoundException;
import com.hotel.cervera.hotel_cervera_api.model.*;
import com.hotel.cervera.hotel_cervera_api.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.OffsetDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class EstadiaService {

    private final EstadiaRepository estadiaRepository;
    private final ReservaRepository reservaRepository;
    private final HabitacionRepository habitacionRepository;
    private final PagoRepository pagoRepository;
    private final CorrelativoRepository correlativoRepository;

    public List<EstadiaResponse> findAll() {
        return estadiaRepository.findAll().stream().map(this::toResponse).toList();
    }

    public EstadiaResponse findById(UUID id) {
        return toResponse(estadiaRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Estadía", id)));
    }

    public List<EstadiaResponse> findActivas() {
        return estadiaRepository.findActivas().stream().map(this::toResponse).toList();
    }

    @Transactional
    public EstadiaResponse checkIn(CheckInRequest request) {
        Reserva reserva = reservaRepository.findById(request.getReservaId())
                .orElseThrow(() -> new ResourceNotFoundException("Reserva", request.getReservaId()));

        if (!"RESERVADA".equalsIgnoreCase(reserva.getEstado())) {
            throw new BusinessException(
                    "La reserva debe estar en estado 'RESERVADA' para hacer check-in. Estado actual: "
                            + reserva.getEstado());
        }

        if (estadiaRepository.existsByReservaIdAndEstado(reserva.getId(), "activa")) {
            throw new BusinessException("Ya existe una estadía activa para esta reserva");
        }

        reserva.setEstado("HOSPEDADO");
        reservaRepository.save(reserva);

        for (ReservaDetalle detalle : reserva.getDetalles()) {
            Habitacion habitacion = habitacionRepository.findById(detalle.getHabitacion().getId())
                    .orElseThrow(() -> new BusinessException("Habitación no encontrada"));
            habitacion.setEstadoActual("Ocupada");
            habitacionRepository.save(habitacion);
        }

        Estadia estadia = Estadia.builder()
                .reserva(reserva)
                .fechaIngreso(request.getFechaIngreso() != null
                        ? request.getFechaIngreso() : OffsetDateTime.now())
                .estado("activa")
                .build();

        return toResponse(estadiaRepository.save(estadia));
    }

    @Transactional
    public EstadiaResponse checkOut(UUID estadiaId, OffsetDateTime fechaSalidaParam) {
        Estadia estadia = estadiaRepository.findById(estadiaId)
                .orElseThrow(() -> new ResourceNotFoundException("Estadía", estadiaId));

        if (!"activa".equalsIgnoreCase(estadia.getEstado())) {
            throw new BusinessException("La estadía no está activa");
        }

        Reserva reserva = estadia.getReserva();
        if (!"HOSPEDADO".equalsIgnoreCase(reserva.getEstado())) {
            throw new BusinessException("La reserva debe estar en estado 'HOSPEDADO'");
        }

        OffsetDateTime checkOut = fechaSalidaParam != null
                ? fechaSalidaParam : OffsetDateTime.now();
        estadia.setFechaSalida(checkOut);

        long noches = ChronoUnit.DAYS.between(estadia.getFechaIngreso(), checkOut);
        if (noches < 1) noches = 1;
        estadia.setNoches((int) noches);

        BigDecimal montoTotal = BigDecimal.ZERO;
        for (ReservaDetalle detalle : reserva.getDetalles()) {
            montoTotal = montoTotal.add(
                    detalle.getPrecioAplicado().multiply(BigDecimal.valueOf(noches)));
        }
        estadia.setMontoTotal(montoTotal);
        estadia.setEstado("finalizada");
        estadia = estadiaRepository.save(estadia);

        reserva.setEstado("FINALIZADO");
        reservaRepository.save(reserva);

        for (ReservaDetalle detalle : reserva.getDetalles()) {
            Habitacion habitacion = habitacionRepository.findById(detalle.getHabitacion().getId())
                    .orElseThrow(() -> new BusinessException("Habitación no encontrada"));
            habitacion.setEstadoActual("Por limpiar");
            habitacionRepository.save(habitacion);
        }

        return toResponse(estadia);
    }

    @Transactional
    public List<EstadiaResponse> checkOutGrupo(PagoGrupoRequest request) {
        List<Reserva> hijas = reservaRepository.findByGrupoId(request.getGrupoId());
        List<Estadia> estadiasActivas = new java.util.ArrayList<>();
        for (Reserva h : hijas) {
            estadiaRepository.findByReservaId(h.getId())
                    .filter(e -> "activa".equalsIgnoreCase(e.getEstado()))
                    .ifPresent(estadiasActivas::add);
        }

        if (estadiasActivas.isEmpty()) {
            throw new BusinessException("No hay estadías activas en este grupo");
        }

        // Obtener y actualizar correlativo para el grupo
        String tipo = request.getTipoComprobante().toUpperCase();
        Correlativo correlativo = correlativoRepository.findByTipoComprobanteAndSerie(tipo, request.getSerie())
                .orElseThrow(() -> new BusinessException("No se encontró configuración de correlativo"));
        
        correlativo.setUltimoNumero(correlativo.getUltimoNumero() + 1);
        Integer numeroDocumento = correlativo.getUltimoNumero();
        correlativoRepository.save(correlativo);
        
        String compNumero = String.format("%s-%06d", request.getSerie(), numeroDocumento);

        List<EstadiaResponse> responses = new java.util.ArrayList<>();
        BigDecimal totalMontoGrupo = BigDecimal.ZERO;

        for (Estadia e : estadiasActivas) {
            EstadiaResponse checkedOut = checkOut(e.getId(), OffsetDateTime.now());
            Estadia estadiaDb = estadiaRepository.findById(e.getId()).orElseThrow();
            totalMontoGrupo = totalMontoGrupo.add(estadiaDb.getMontoTotal());
            responses.add(checkedOut);
        }

        BigDecimal montoNeto = totalMontoGrupo.divide(BigDecimal.valueOf(1.18), 2, RoundingMode.HALF_UP);
        BigDecimal igv = totalMontoGrupo.subtract(montoNeto);

        List<Estadia> estadiasDb = new java.util.ArrayList<>();
        for (EstadiaResponse r : responses) {
            estadiasDb.add(estadiaRepository.findById(r.getId()).orElseThrow());
        }

        Pago pago = Pago.builder()
                .estadia(estadiasDb.get(0)) // Establecer la primera estadía para cumplir la relación obligatoria
                .estadias(estadiasDb)
                .tipoComprobante(tipo)
                .serie(request.getSerie())
                .numero(numeroDocumento)
                .comprobanteNumero(compNumero)
                .fechaPago(OffsetDateTime.now())
                .clienteNombre(request.getClienteNombre())
                .clienteTipoDocumento(request.getClienteTipoDocumento())
                .clienteDocumento(request.getClienteDocumento())
                .clienteRuc(request.getClienteRuc())
                .clienteRazonSocial(request.getClienteRazonSocial())
                .emisorRuc("20479709034")
                .emisorRazonSocial("Servicios Generales Cervera E.I.R.L.")
                .montoNeto(montoNeto)
                .igv(igv)
                .montoTotal(totalMontoGrupo)
                .metodoPago(request.getMetodoPago().toUpperCase())
                .referenciaPago(request.getReferenciaPago())
                .observaciones(request.getObservaciones())
                .modoPago("CONSOLIDADO")
                .cantidadHabitaciones(estadiasActivas.size())
                .grupoId(request.getGrupoId())
                .build();
                
        pagoRepository.save(pago);
        return responses;
    }

    public EstadiaResponse findByReservaId(UUID reservaId) {
        return toResponse(estadiaRepository.findByReservaId(reservaId)
                .orElseThrow(() -> new ResourceNotFoundException("Estadía", "reservaId", reservaId.toString())));
    }

    private EstadiaResponse toResponse(Estadia entity) {
        Integer noches = entity.getNoches();
        if (noches == null) noches = 0;
        BigDecimal montoTotal = entity.getMontoTotal();

        if ("activa".equalsIgnoreCase(entity.getEstado())) {
            long calcNoches = ChronoUnit.DAYS.between(entity.getFechaIngreso(), OffsetDateTime.now());
            if (calcNoches < 1) calcNoches = 1;
            noches = (int) calcNoches;

            montoTotal = BigDecimal.ZERO;
            if (entity.getReserva() != null && entity.getReserva().getDetalles() != null) {
                for (ReservaDetalle d : entity.getReserva().getDetalles()) {
                    if (d.getPrecioAplicado() != null) {
                        montoTotal = montoTotal.add(d.getPrecioAplicado().multiply(BigDecimal.valueOf(noches)));
                    }
                }
            }
        }

        return EstadiaResponse.builder()
                .id(entity.getId())
                .reservaId(entity.getReserva().getId())
                .reservaCodigo(entity.getReserva().getCodigo())
                .fechaIngreso(entity.getFechaIngreso())
                .fechaSalida(entity.getFechaSalida())
                .noches(noches)
                .montoTotal(montoTotal)
                .estado(entity.getEstado())
                .fechaCreacion(entity.getFechaCreacion())
                .fechaActualizacion(entity.getFechaActualizacion())
                .build();
    }
}
