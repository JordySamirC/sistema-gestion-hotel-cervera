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
public class ReservaDetalleResponse {
    private UUID id;
    private UUID reservaId;
    private UUID habitacionId;
    private String habitacionNumero;
    private String tipoNombre;
    private Integer capacidadMax;
    private BigDecimal precioAplicado;
    private OffsetDateTime fechaCreacion;
}
