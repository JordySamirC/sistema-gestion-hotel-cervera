package com.hotel.cervera.hotel_cervera_api.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EstadiaResponse {
    private UUID id;
    private UUID reservaId;
    private String reservaCodigo;
    private OffsetDateTime fechaIngreso;
    private OffsetDateTime fechaSalida;
    private Integer noches;
    private BigDecimal montoTotal;
    private String estado;
    private OffsetDateTime fechaCreacion;
    private OffsetDateTime fechaActualizacion;
}
