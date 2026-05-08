package com.hotel.cervera.hotel_cervera_api.service;

import com.hotel.cervera.hotel_cervera_api.dto.request.CheckInRequest;
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

        if (!"pendiente".equals(reserva.getEstado())) {
            throw new BusinessException(
                    "La reserva debe estar en estado 'pendiente' para hacer check-in. Estado actual: "
                            + reserva.getEstado());
        }

        if (estadiaRepository.existsByReservaIdAndEstado(reserva.getId(), "activa")) {
            throw new BusinessException("Ya existe una estadía activa para esta reserva");
        }

        reserva.setEstado("checked_in");
        reservaRepository.save(reserva);

        for (ReservaDetalle detalle : reserva.getDetalles()) {
            Habitacion habitacion = detalle.getHabitacion();
            habitacion.setEstadoActual("ocupada");
            habitacionRepository.save(habitacion);
        }

        Estadia estadia = Estadia.builder()
                .reserva(reserva)
                .fechaCheckIn(request.getFechaCheckIn() != null
                        ? request.getFechaCheckIn() : OffsetDateTime.now())
                .estado("activa")
                .build();

        return toResponse(estadiaRepository.save(estadia));
    }

    @Transactional
    public EstadiaResponse checkOut(UUID estadiaId, OffsetDateTime fechaCheckOutParam) {
        Estadia estadia = estadiaRepository.findById(estadiaId)
                .orElseThrow(() -> new ResourceNotFoundException("Estadía", estadiaId));

        if (!"activa".equals(estadia.getEstado())) {
            throw new BusinessException("La estadía no está activa");
        }

        Reserva reserva = estadia.getReserva();
        if (!"checked_in".equals(reserva.getEstado())) {
            throw new BusinessException("La reserva debe estar en estado 'checked_in'");
        }

        OffsetDateTime checkOut = fechaCheckOutParam != null
                ? fechaCheckOutParam : OffsetDateTime.now();
        estadia.setFechaCheckOut(checkOut);

        long noches = ChronoUnit.DAYS.between(estadia.getFechaCheckIn(), checkOut);
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

        reserva.setEstado("checked_out");
        reservaRepository.save(reserva);

        for (ReservaDetalle detalle : reserva.getDetalles()) {
            Habitacion habitacion = detalle.getHabitacion();
            habitacion.setEstadoActual("por_limpiar");
            habitacionRepository.save(habitacion);
        }

        return toResponse(estadia);
    }

    public EstadiaResponse findByReservaId(UUID reservaId) {
        return toResponse(estadiaRepository.findByReservaId(reservaId)
                .orElseThrow(() -> new ResourceNotFoundException("Estadía", "reservaId", reservaId.toString())));
    }

    private EstadiaResponse toResponse(Estadia entity) {
        return EstadiaResponse.builder()
                .id(entity.getId())
                .reservaId(entity.getReserva().getId())
                .reservaCodigo(entity.getReserva().getCodigo())
                .fechaCheckIn(entity.getFechaCheckIn())
                .fechaCheckOut(entity.getFechaCheckOut())
                .noches(entity.getNoches())
                .montoTotal(entity.getMontoTotal())
                .estado(entity.getEstado())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }
}
