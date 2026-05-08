package com.hotel.cervera.hotel_cervera_api.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UsuarioRequest {

    @NotBlank(message = "El nombre de usuario es obligatorio")
    @Size(max = 50, message = "El nombre de usuario no debe exceder 50 caracteres")
    private String nombreUsuario;

    @NotBlank(message = "El email es obligatorio")
    @Email(message = "Email inválido")
    @Size(max = 100)
    private String email;

    @NotBlank(message = "La contraseña es obligatoria")
    @Size(min = 6, message = "La contraseña debe tener al menos 6 caracteres")
    private String contrasena;

    @NotBlank(message = "Los nombres son obligatorios")
    @Size(max = 50)
    private String nombres;

    @NotBlank(message = "Los apellidos son obligatorios")
    @Size(max = 50)
    private String apellidos;

    @NotNull(message = "El rol es obligatorio")
    private UUID rolId;
}
