package com.hotel.cervera.hotel_cervera_api.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UsuarioUpdateRequest {

    @Size(max = 50)
    private String nombres;

    @Size(max = 50)
    private String apellidos;

    @Email(message = "Correo electrónico inválido")
    @Size(max = 100)
    private String correoElectronico;

    @Size(max = 20)
    private String estado;
}
