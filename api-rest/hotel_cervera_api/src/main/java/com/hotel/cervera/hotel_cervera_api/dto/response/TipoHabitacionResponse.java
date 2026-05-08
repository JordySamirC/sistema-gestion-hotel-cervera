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
public class TipoHabitacionResponse {
    private UUID id;
    private String nombre;
    private Integer capacidadMax;
    private String descripcion;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;
}
