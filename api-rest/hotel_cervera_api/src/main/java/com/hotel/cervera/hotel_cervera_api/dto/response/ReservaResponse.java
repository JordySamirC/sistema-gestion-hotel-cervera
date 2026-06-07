package com.hotel.cervera.hotel_cervera_api.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReservaResponse {
    private UUID id;
    private String codigo;
    private OffsetDateTime fechaReserva;
    private LocalDate fechaIngreso;
    private LocalDate fechaSalida;
    private UUID clienteId;
    private String clienteNombre;
    private String estado;
    private String motivoCancelacion;
    private String observacionesCancelacion;
    private LocalDateTime fechaCancelacion;
    private UUID canceladoPor;
    private String canceladoPorNombre;
    private UUID creadoPor;
    private String creadoPorNombre;
    private Integer adultos;
    private Integer ninos;
    private String canalVentaNombre;
    private String canalVentaIcono;
    private String canalVentaOtro;
    private OffsetDateTime fechaCreacion;
    private OffsetDateTime fechaActualizacion;
    private UUID grupoId;
    private String nombreGrupo;
    private List<ReservaDetalleResponse> detalles;
    private List<ReservaHuespedResponse> huespedes;
    private BigDecimal precioTotal;
}
