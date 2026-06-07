package com.hotel.cervera.hotel_cervera_api.service;

import com.hotel.cervera.hotel_cervera_api.dto.request.PagoRequest;
import com.hotel.cervera.hotel_cervera_api.dto.response.PagoResponse;
import com.hotel.cervera.hotel_cervera_api.exception.BusinessException;
import com.hotel.cervera.hotel_cervera_api.exception.ResourceNotFoundException;
import com.hotel.cervera.hotel_cervera_api.model.*;
import com.hotel.cervera.hotel_cervera_api.repository.CorrelativoRepository;
import com.hotel.cervera.hotel_cervera_api.repository.EstadiaRepository;
import com.hotel.cervera.hotel_cervera_api.repository.PagoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PagoService {

    private final PagoRepository pagoRepository;
    private final EstadiaRepository estadiaRepository;
    private final CorrelativoRepository correlativoRepository;

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

    public PagoResponse findByGrupo(UUID grupoId) {
        return toResponse(pagoRepository.findByGrupoId(grupoId)
                .orElseThrow(() -> new ResourceNotFoundException("Pago", "grupoId", grupoId.toString())));
    }

    @Transactional
    public PagoResponse create(PagoRequest request) {
        // Validar métodos de pago (Case Insensitive)
        String metodo = request.getMetodoPago().toUpperCase();
        Set<String> metodosValidos = Set.of("EFECTIVO", "TRANSFERENCIA", "TARJETA");
        if (!metodosValidos.contains(metodo)) {
            throw new BusinessException("Método de pago inválido. Use: EFECTIVO, TRANSFERENCIA o TARJETA");
        }

        // Validar tipo comprobante (Saneamiento preventivo)
        if (request.getTipoComprobante() == null) {
            throw new BusinessException("El tipo de comprobante no puede ser nulo");
        }
        
        String tipo = request.getTipoComprobante().trim().toUpperCase();
        if (!tipo.equals("BOLETA") && !tipo.equals("FACTURA")) {
            // Log para debug (aparecerá en la consola del servidor)
            System.out.println("DEBUG: Se recibió un tipo de comprobante inválido: [" + tipo + "]");
            throw new BusinessException("Tipo de comprobante inválido: '" + tipo + "'. Use: BOLETA o FACTURA");
        }

        Estadia estadia = estadiaRepository.findById(request.getEstadiaId())
                .orElseThrow(() -> new ResourceNotFoundException("Estadía", request.getEstadiaId()));

        if (!"finalizada".equalsIgnoreCase(estadia.getEstado())) {
            throw new BusinessException("La estadía debe estar finalizada para registrar el pago");
        }

        if (pagoRepository.findByEstadiaId(request.getEstadiaId()).isPresent()) {
            throw new BusinessException("La estadía ya tiene un pago registrado");
        }

        // Generar Correlativo Real (Atomic)
        Correlativo correlativo = correlativoRepository.findByTipoComprobanteAndSerie(tipo, request.getSerie())
                .orElseThrow(() -> new BusinessException("No se encontró configuración de correlativo para " + tipo + " " + request.getSerie()));
        
        correlativo.setUltimoNumero(correlativo.getUltimoNumero() + 1);
        Integer nuevoNumero = correlativo.getUltimoNumero();
        correlativoRepository.save(correlativo);

        String compNumero = String.format("%s-%06d", request.getSerie(), nuevoNumero);

        // Validar IGV
        BigDecimal igvCalculado = request.getMontoNeto()
                .multiply(BigDecimal.valueOf(0.18))
                .setScale(2, RoundingMode.HALF_UP);
        
        // Permitimos una diferencia de 0.01 por temas de redondeo
        if (request.getIgv().subtract(igvCalculado).abs().compareTo(BigDecimal.valueOf(0.01)) > 0) {
            throw new BusinessException("El IGV debe ser el 18% del monto neto (" + igvCalculado + ")");
        }

        Pago pago = Pago.builder()
                .estadia(estadia)
                .tipoComprobante(tipo)
                .serie(request.getSerie())
                .numero(nuevoNumero)
                .comprobanteNumero(compNumero)
                .fechaPago(OffsetDateTime.now())
                .clienteNombre(request.getClienteNombre())
                .clienteTipoDocumento(request.getClienteTipoDocumento())
                .clienteDocumento(request.getClienteDocumento())
                .clienteRuc(request.getClienteRuc())
                .clienteRazonSocial(request.getClienteRazonSocial())
                .emisorRuc("20479709034")
                .emisorRazonSocial("Servicios Generales Cervera E.I.R.L.")
                .montoNeto(request.getMontoNeto())
                .igv(request.getIgv())
                .montoTotal(request.getMontoTotal())
                .metodoPago(metodo)
                .referenciaPago(request.getReferenciaPago())
                .observaciones(request.getObservaciones())
                .creadoPor(request.getCreadoPor())
                .modoPago(request.getModoPago())
                .descripcionHabitaciones(request.getDescripcionHabitaciones())
                .cantidadHabitaciones(request.getCantidadHabitaciones())
                .grupoId(request.getGrupoId())
                .build();

        // Vincular múltiples estadías si es un pago consolidado
        if (request.getEstadiaIds() != null && !request.getEstadiaIds().isEmpty()) {
            List<Estadia> todas = estadiaRepository.findAllById(request.getEstadiaIds());
            pago.setEstadias(todas);
        } else {
            pago.setEstadias(List.of(estadia));
        }

        return toResponse(pagoRepository.save(pago));
    }

    public List<PagoResponse> findByPeriodo(LocalDate desde, LocalDate hasta) {
        return pagoRepository.findByFechaPagoBetween(desde, hasta)
                .stream().map(this::toResponse).toList();
    }

    private PagoResponse toResponse(Pago entity) {
        // Fallback para registros antiguos: si no tiene descripción, la sacamos de los detalles de la reserva
        String descHab = entity.getDescripcionHabitaciones();
        if ((descHab == null || descHab.isEmpty()) && entity.getEstadia() != null && entity.getEstadia().getReserva() != null) {
            List<ReservaDetalle> detalles = entity.getEstadia().getReserva().getDetalles();
            if (detalles != null && !detalles.isEmpty()) {
                descHab = "Hab. " + detalles.stream()
                        .map(d -> d.getHabitacion().getNumero())
                        .collect(Collectors.joining(", "));
            }
        }

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
                .clienteNombre(entity.getClienteNombre())
                .clienteTipoDocumento(entity.getClienteTipoDocumento())
                .clienteDocumento(entity.getClienteDocumento())
                .clienteRuc(entity.getClienteRuc())
                .clienteRazonSocial(entity.getClienteRazonSocial())
                .emisorRuc(entity.getEmisorRuc())
                .emisorRazonSocial(entity.getEmisorRazonSocial())
                .referenciaPago(entity.getReferenciaPago())
                .observaciones(entity.getObservaciones())
                .montoNeto(entity.getMontoNeto())
                .igv(entity.getIgv())
                .fechaCreacion(entity.getFechaCreacion())
                .modoPago(entity.getModoPago())
                .descripcionHabitaciones(descHab)
                .cantidadHabitaciones(entity.getCantidadHabitaciones())
                .grupoId(entity.getGrupoId())
                .build();
    }
}
