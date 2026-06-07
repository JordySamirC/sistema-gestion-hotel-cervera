package com.hotel.cervera.hotel_cervera_api.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LoginResponse {

    private String token;
    private String tipo;
    private UUID id;
    private String nombreUsuario;
    private String correoElectronico;
    private String nombres;
    private String apellidos;
    private String rol;
}
