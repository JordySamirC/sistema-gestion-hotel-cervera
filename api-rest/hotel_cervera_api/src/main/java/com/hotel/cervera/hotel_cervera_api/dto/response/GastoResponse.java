package com.hotel.cervera.hotel_cervera_api.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GastoResponse {
    private UUID id;
    private LocalDate fechaGasto;
    private String descripcion;
    private String categoria;
    private BigDecimal monto;
    private Boolean esFijo;
    private UUID creadoPor;
    private String creadoPorNombre;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;
}
