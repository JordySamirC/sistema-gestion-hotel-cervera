package com.hotel.cervera.hotel_cervera_api.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ExtenderGrupoRequest {

    @NotNull(message = "La nueva fecha de salida es obligatoria")
    private LocalDate nuevaFechaSalida;
}
