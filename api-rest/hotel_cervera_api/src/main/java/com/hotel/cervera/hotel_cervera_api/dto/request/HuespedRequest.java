package com.hotel.cervera.hotel_cervera_api.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class HuespedRequest {

    @NotNull(message = "El cliente es obligatorio")
    private UUID clienteId;

    private Boolean esTitular;
}
