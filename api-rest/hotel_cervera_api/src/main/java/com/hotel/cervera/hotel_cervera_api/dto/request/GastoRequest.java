package com.hotel.cervera.hotel_cervera_api.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class GastoRequest {

    @NotNull(message = "La fecha del gasto es obligatoria")
    private LocalDate fechaGasto;

    @NotBlank(message = "La descripción es obligatoria")
    @Size(max = 200)
    private String descripcion;

    @NotBlank(message = "La categoría es obligatoria")
    @Size(max = 50)
    private String categoria;

    @NotNull(message = "El monto es obligatorio")
    @Positive(message = "El monto debe ser mayor a 0")
    private BigDecimal monto;

    private Boolean esFijo;

    @NotNull(message = "El usuario creador es obligatorio")
    private UUID creadoPor;
}
