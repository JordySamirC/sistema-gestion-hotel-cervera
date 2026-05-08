package com.hotel.cervera.hotel_cervera_api.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CheckInRequest {

    @NotNull(message = "La reserva es obligatoria")
    private UUID reservaId;

    private OffsetDateTime fechaCheckIn;
}
