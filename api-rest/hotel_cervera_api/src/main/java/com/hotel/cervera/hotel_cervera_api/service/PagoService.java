package com.hotel.cervera.hotel_cervera_api.service;

import com.hotel.cervera.hotel_cervera_api.dto.request.PagoRequest;
import com.hotel.cervera.hotel_cervera_api.dto.response.PagoResponse;
import com.hotel.cervera.hotel_cervera_api.exception.BusinessException;
import com.hotel.cervera.hotel_cervera_api.exception.ResourceNotFoundException;
import com.hotel.cervera.hotel_cervera_api.model.Estadia;
import com.hotel.cervera.hotel_cervera_api.model.Pago;
import com.hotel.cervera.hotel_cervera_api.repository.EstadiaRepository;
import com.hotel.cervera.hotel_cervera_api.repository.PagoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class PagoService {

    private final PagoRepository pagoRepository;
    private final EstadiaRepository estadiaRepository;

    public List<PagoResponse> findAll() {
        return pagoRepository.findAll().stream().map(this::toResponse).toList();
    }

    public PagoResponse findById(UUID id) {
        return toResponse(pagoRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Pago", id)));
    }

    public PagoResponse findByEstadia(UUID estadiaId) {
        return toResponse(pagoRepository.findByEstadiaId(estadiaId)
                .orElseThrow(() -> new ResourceNotFoundException("Pago", "estadiaId", estadiaId.toString())));
    }

    @Transactional
    public PagoResponse create(PagoRequest request) {
        Set<String> metodosValidos = Set.of("efectivo", "transferencia", "tarjeta");
        if (!metodosValidos.contains(request.getMetodoPago())) {
            throw new BusinessException("Método de pago inválido. Use: efectivo, transferencia o tarjeta");
        }

        Set<String> comprobantesValidos = Set.of("B001", "F001");
        if (!comprobantesValidos.contains(request.getTipoComprobante())) {
            throw new BusinessException("Tipo de comprobante inválido. Use: B001 o F001");
        }

        if (pagoRepository.existsByComprobanteNumero(request.getComprobanteNumero())) {
            throw new BusinessException("El número de comprobante ya existe");
        }

        Estadia estadia = estadiaRepository.findById(request.getEstadiaId())
                .orElseThrow(() -> new ResourceNotFoundException("Estadía", request.getEstadiaId()));

        if (!"finalizada".equals(estadia.getEstado())) {
            throw new BusinessException("La estadía debe estar finalizada para registrar el pago");
        }

        if (pagoRepository.findByEstadiaId(request.getEstadiaId()).isPresent()) {
            throw new BusinessException("La estadía ya tiene un pago registrado");
        }

        if (estadia.getMontoTotal() != null
                && request.getMontoTotal().compareTo(estadia.getMontoTotal()) != 0) {
            throw new BusinessException("El monto total del pago debe ser exactamente "
                    + estadia.getMontoTotal() + " (100% al check-out)");
        }

        BigDecimal igvCalculado = request.getMontoNeto()
                .multiply(BigDecimal.valueOf(0.18))
                .setScale(2, RoundingMode.HALF_UP);
        if (request.getIgv().compareTo(igvCalculado) != 0) {
            throw new BusinessException("El IGV debe ser el 18% del monto neto (" + igvCalculado + ")");
        }

        Pago pago = Pago.builder()
                .estadia(estadia)
                .comprobanteNumero(request.getComprobanteNumero())
                .montoTotal(request.getMontoTotal())
                .metodoPago(request.getMetodoPago())
                .tipoComprobante(request.getTipoComprobante())
                .serie(request.getSerie())
                .numero(request.getNumero())
                .rucRazonSocial(request.getRucRazonSocial())
                .montoNeto(request.getMontoNeto())
                .igv(request.getIgv())
                .build();

        return toResponse(pagoRepository.save(pago));
    }

    public List<PagoResponse> findByPeriodo(LocalDate desde, LocalDate hasta) {
        return pagoRepository.findByFechaPagoBetween(desde, hasta)
                .stream().map(this::toResponse).toList();
    }

    public BigDecimal sumIngresosByPeriodo(LocalDate desde, LocalDate hasta) {
        return pagoRepository.sumIngresosByPeriodo(desde, hasta);
    }

    private PagoResponse toResponse(Pago entity) {
        return PagoResponse.builder()
                .id(entity.getId())
                .estadiaId(entity.getEstadia().getId())
                .comprobanteNumero(entity.getComprobanteNumero())
                .fechaPago(entity.getFechaPago())
                .montoTotal(entity.getMontoTotal())
                .metodoPago(entity.getMetodoPago())
                .tipoComprobante(entity.getTipoComprobante())
                .serie(entity.getSerie())
                .numero(entity.getNumero())
                .rucRazonSocial(entity.getRucRazonSocial())
                .montoNeto(entity.getMontoNeto())
                .igv(entity.getIgv())
                .createdAt(entity.getCreatedAt())
                .build();
    }
}
