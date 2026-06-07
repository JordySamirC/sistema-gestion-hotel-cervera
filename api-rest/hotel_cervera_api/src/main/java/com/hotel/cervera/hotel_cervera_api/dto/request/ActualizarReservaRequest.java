package com.hotel.cervera.hotel_cervera_api.dto.request;

import jakarta.validation.constraints.PositiveOrZero;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ActualizarReservaRequest {
    private LocalDate fechaIngreso;
    private LocalDate fechaSalida;

    @PositiveOrZero(message = "La cantidad de adultos debe ser mayor o igual a 0")
    private Integer adultos;

    @PositiveOrZero(message = "La cantidad de niños debe ser mayor o igual a 0")
    private Integer ninos;
}
