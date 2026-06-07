package com.hotel.cervera.hotel_cervera_api.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
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
    private String genero;
    private String estado;
    private String telefono;
    private String correoElectronico;
    private Integer vecesHospedado;
    private LocalDate fechaNacimiento;
    private OffsetDateTime fechaCreacion;
    private OffsetDateTime fechaActualizacion;
}
