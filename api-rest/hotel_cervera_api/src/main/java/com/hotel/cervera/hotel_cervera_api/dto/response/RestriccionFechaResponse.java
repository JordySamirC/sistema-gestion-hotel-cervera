package com.hotel.cervera.hotel_cervera_api.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class RestriccionFechaResponse {
    private UUID id;
    private String tipo;
    private LocalDate fechaInicio;
    private LocalDate fechaFin;
    private Integer minLos;
    private Integer maxLos;
    private String diasCheckIn;
    private String diasCheckOut;
    private String motivo;
    private Boolean activo;
    private OffsetDateTime fechaCreacion;
    private OffsetDateTime fechaActualizacion;
}
