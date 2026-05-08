package com.hotel.cervera.hotel_cervera_api.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PagoRequest {

    @NotNull(message = "La estadía es obligatoria")
    private UUID estadiaId;

    @NotBlank(message = "El número de comprobante es obligatorio")
    @Size(max = 20)
    private String comprobanteNumero;

    @NotNull(message = "El monto total es obligatorio")
    private BigDecimal montoTotal;

    @NotBlank(message = "El método de pago es obligatorio")
    @Size(max = 20)
    private String metodoPago;

    @NotBlank(message = "El tipo de comprobante es obligatorio")
    @Size(max = 3)
    private String tipoComprobante;

    @NotBlank(message = "La serie es obligatoria")
    @Size(max = 10)
    private String serie;

    @NotNull(message = "El número es obligatorio")
    private Integer numero;

    @Size(max = 100)
    private String rucRazonSocial;

    @NotNull(message = "El monto neto es obligatorio")
    @PositiveOrZero
    private BigDecimal montoNeto;

    @NotNull
    @PositiveOrZero
    private BigDecimal igv;
}
