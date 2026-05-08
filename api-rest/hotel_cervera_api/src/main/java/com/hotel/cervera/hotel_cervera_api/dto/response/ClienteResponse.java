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
public class ClienteResponse {
    private UUID id;
    private String tipoDocumento;
    private String numeroDocumento;
    private String nombres;
    private String apellidos;
    private String nacionalidad;
    private String telefono;
    private String email;
    private Integer vecesHospedado;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;
}
