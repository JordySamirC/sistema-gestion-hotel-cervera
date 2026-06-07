package com.hotel.cervera.hotel_cervera_api.dto.request;

import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ExtenderReservaRequest {
    @NotNull(message = "La nueva fecha de salida es obligatoria")
    @Future(message = "La nueva fecha de salida debe ser futura")
    private LocalDate nuevaFechaSalida;
}
