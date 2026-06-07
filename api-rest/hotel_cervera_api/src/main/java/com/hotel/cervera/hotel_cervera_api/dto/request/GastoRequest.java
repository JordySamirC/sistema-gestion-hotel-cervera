package com.hotel.cervera.hotel_cervera_api.dto.request;

import jakarta.validation.constraints.*;
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
    @PastOrPresent(message = "La fecha del gasto no puede ser futura")
    private LocalDate fechaGasto;

    @NotBlank(message = "La descripción es obligatoria")
    @Size(max = 200, message = "La descripción no puede exceder los 200 caracteres")
    private String descripcion;

    @NotNull(message = "La categoría es obligatoria")
    private Long categoriaId;

    @NotNull(message = "El tipo de gasto es obligatorio")
    private Long tipoGastoId;

    @NotNull(message = "El monto es obligatorio")
    @Positive(message = "El monto debe ser mayor a 0")
    private BigDecimal monto;

    private String observaciones;

    @NotNull(message = "El usuario creador es obligatorio")
    private UUID creadoPor;
}
