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
public class UsuarioResponse {
    private UUID id;
    private String nombreUsuario;
    private String correoElectronico;
    private String nombres;
    private String apellidos;
    private UUID rolId;
    private String rolNombre;
    private String estado;
    private OffsetDateTime ultimoAcceso;
    private OffsetDateTime fechaCreacion;
    private OffsetDateTime fechaActualizacion;
}
