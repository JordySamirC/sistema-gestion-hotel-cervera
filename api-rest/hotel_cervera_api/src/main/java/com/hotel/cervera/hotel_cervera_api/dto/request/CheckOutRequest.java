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
public class CheckOutRequest {

    @NotNull
    private UUID estadiaId;

    private OffsetDateTime fechaCheckOut;
}
