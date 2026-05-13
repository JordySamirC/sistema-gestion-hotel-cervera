package com.hotel.cervera.hotel_cervera_api.dto.request;

import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ReservaRequest {

    @NotNull(message = "La fecha de ingreso es obligatoria")
    private LocalDate fechaIngreso;

    @NotNull(message = "La fecha de salida es obligatoria")
    private LocalDate fechaSalida;

    @NotNull(message = "El cliente es obligatorio")
    private UUID clienteId;

    @NotNull(message = "El usuario creador es obligatorio")
    private UUID creadoPor;

    @Min(value = 1, message = "Debe haber al menos 1 adulto")
    private Integer adultos;

    @Min(value = 0)
    private Integer ninos;

    @NotNull(message = "El canal de venta es obligatorio")
    private Long canalVentaId;

    @Size(max = 100)
    private String canalVentaOtro;

    @NotEmpty(message = "Debe seleccionar al menos una habitación")
    private List<UUID> habitacionesIds;
}
