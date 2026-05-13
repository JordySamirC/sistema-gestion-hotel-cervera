package com.hotel.cervera.hotel_cervera_api.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AddHabitacionRequest {

    @NotNull(message = "La habitación es obligatoria")
    private UUID habitacionId;

    @Min(value = 1, message = "Debe haber al menos 1 adulto")
    private Integer adultos;

    @Min(value = 0)
    private Integer ninos;

    @Valid
    private List<HuespedRequest> huespedes;
}
