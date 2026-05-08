package com.hotel.cervera.hotel_cervera_api.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CambiarEstadoHabitacionRequest {

    @NotBlank(message = "El estado es obligatorio")
    private String estadoActual;
}
