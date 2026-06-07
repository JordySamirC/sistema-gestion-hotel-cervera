package com.hotel.cervera.hotel_cervera_api.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class HabitacionRequest {

    @NotBlank(message = "El número de habitación es obligatorio")
    @Size(max = 10)
    private String numero;

    @NotNull(message = "El piso es obligatorio")
    @jakarta.validation.constraints.Min(value = 1, message = "El piso debe ser mayor o igual a 1")
    private Integer piso;

    @NotNull(message = "El tipo de habitación es obligatorio")
    private UUID tipoId;

    private String estado;

    private String notas;
}
