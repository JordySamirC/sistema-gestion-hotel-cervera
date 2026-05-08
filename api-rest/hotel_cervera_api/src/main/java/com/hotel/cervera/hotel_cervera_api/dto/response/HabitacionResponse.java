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
public class HabitacionResponse {
    private UUID id;
    private String numero;
    private Integer piso;
    private UUID tipoId;
    private String tipoNombre;
    private String estadoActual;
    private String notas;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;
}
