package com.hotel.cervera.hotel_cervera_api.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ClienteRequest {

    @NotBlank(message = "El tipo de documento es obligatorio")
    @Pattern(regexp = "^(DNI|Pasaporte|Carné Extranjería)$", message = "Tipo de documento inválido. Use: DNI, Pasaporte o Carné Extranjería")
    @Size(max = 30)
    private String tipoDocumento;

    @NotBlank(message = "El número de documento es obligatorio")
    @Size(max = 20)
    private String numeroDocumento;

    @NotBlank(message = "Los nombres son obligatorios")
    @Size(max = 50)
    private String nombres;

    @NotBlank(message = "Los apellidos son obligatorios")
    @Size(max = 50)
    private String apellidos;

    @NotBlank(message = "La nacionalidad es obligatoria")
    @Size(max = 50)
    private String nacionalidad;

    @NotBlank(message = "El género es obligatorio")
    @Size(max = 20)
    private String genero;

    @NotBlank(message = "El teléfono es obligatorio")
    @Size(max = 30)
    private String telefono;

    @Email(message = "Correo inválido")
    @Size(max = 100)
    private String correoElectronico;

    private LocalDate fechaNacimiento;
}
