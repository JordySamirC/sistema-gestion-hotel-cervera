package com.hotel.cervera.hotel_cervera_api.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LimpiezaResponse {
    private UUID id;
    private UUID habitacionId;
    private String habitacionNumero;
    private UUID usuarioId;
    private String usuarioNombre;
    private OffsetDateTime fechaInicio;
    private OffsetDateTime fechaFin;
    private Integer duracionSegundos;
    private OffsetDateTime createdAt;
}
