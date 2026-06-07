package com.hotel.cervera.hotel_cervera_api.dto.request;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PrecioHistoricoRequest {

    @NotNull(message = "El tipo de habitación es obligatorio")
    private UUID tipoHabitacionId;

    @NotNull(message = "El precio por noche es obligatorio")
    @PositiveOrZero(message = "El precio debe ser mayor o igual a 0")
    private BigDecimal precioNoche;

    @NotNull(message = "La fecha de inicio es obligatoria")
    private LocalDate fechaInicio;

    private LocalDate fechaFin;

    @NotNull(message = "El usuario creador es obligatorio")
    private UUID creadoPor;
}
