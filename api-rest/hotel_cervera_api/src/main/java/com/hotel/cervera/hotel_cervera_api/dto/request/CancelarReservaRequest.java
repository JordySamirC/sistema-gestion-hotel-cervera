package com.hotel.cervera.hotel_cervera_api.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CancelarReservaRequest {

    @NotBlank(message = "El motivo de cancelación es obligatorio")
    private String motivoCancelacion;
}
