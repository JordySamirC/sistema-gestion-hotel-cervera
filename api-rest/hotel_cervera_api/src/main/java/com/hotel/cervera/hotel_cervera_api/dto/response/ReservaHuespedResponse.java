package com.hotel.cervera.hotel_cervera_api.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReservaHuespedResponse {
    private UUID id;
    private UUID reservaId;
    private UUID clienteId;
    private String clienteNombre;
    private String clienteDocumento;
    private Boolean esTitular;
    private OffsetDateTime fechaCreacion;
}
