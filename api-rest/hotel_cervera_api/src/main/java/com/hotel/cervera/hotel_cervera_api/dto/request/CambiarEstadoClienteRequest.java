package com.hotel.cervera.hotel_cervera_api.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CambiarEstadoClienteRequest {

    @NotBlank(message = "El estado es obligatorio")
    @Pattern(regexp = "^(ACTIVO|SUSPENDIDO|VETADO)$", message = "Estado inválido. Use: ACTIVO, SUSPENDIDO o VETADO")
    private String estado;
}
