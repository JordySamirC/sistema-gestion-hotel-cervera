package com.hotel.cervera.hotel_cervera_api.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class RolRequest {

    @NotBlank(message = "El nombre del rol es obligatorio")
    @Size(max = 20, message = "El nombre del rol no debe exceder 20 caracteres")
    private String nombre;

    @Size(max = 100, message = "La descripción no debe exceder 100 caracteres")
    private String descripcion;
}
