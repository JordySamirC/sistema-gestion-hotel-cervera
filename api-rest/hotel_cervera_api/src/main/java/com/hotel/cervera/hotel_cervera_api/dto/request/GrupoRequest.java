package com.hotel.cervera.hotel_cervera_api.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class GrupoRequest {

    private String nombreGrupo;

    @NotNull(message = "El responsable de pago es obligatorio")
    private UUID responsablePagoId;

    @NotNull(message = "La fecha de ingreso es obligatoria")
    private LocalDate fechaIngreso;

    @NotNull(message = "La fecha de salida es obligatoria")
    private LocalDate fechaSalida;

    @NotEmpty(message = "Debe incluir al menos una reserva (habitación)")
    @Valid
    private List<ReservaEnGrupoRequest> reservas;

    @NotNull(message = "El canal de venta es obligatorio")
    private Long canalVentaId;

    @Size(max = 100)
    private String canalVentaOtro;

    @NotNull(message = "El usuario creador es obligatorio")
    private UUID creadoPor;

    private Boolean facturarTodoAlResponsable;
}
