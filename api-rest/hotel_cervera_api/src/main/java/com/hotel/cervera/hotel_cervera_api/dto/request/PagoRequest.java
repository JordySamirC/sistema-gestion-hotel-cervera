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

    @NotNull(message = "El monto total es obligatorio")
    private BigDecimal montoTotal;

    @NotBlank(message = "El método de pago es obligatorio")
    @Size(max = 20)
    private String metodoPago;

    @NotBlank(message = "El tipo de comprobante es obligatorio")
    @Size(max = 20)
    private String tipoComprobante; // 'BOLETA', 'FACTURA'

    @NotBlank(message = "La serie es obligatoria")
    @Size(max = 20)
    private String serie;

    // Datos del cliente
    @Size(max = 100)
    private String clienteNombre;

    @Size(max = 20)
    private String clienteTipoDocumento;

    @Size(max = 20)
    private String clienteDocumento;

    @Size(max = 11)
    private String clienteRuc;

    @Size(max = 200)
    private String clienteRazonSocial;

    // Pago
    @Size(max = 100)
    private String referenciaPago;

    private String observaciones;

    @NotNull(message = "El monto neto es obligatorio")
    @PositiveOrZero
    private BigDecimal montoNeto;

    @NotNull
    @PositiveOrZero
    private BigDecimal igv;

    private UUID creadoPor;

    // Campos para trazabilidad de grupos
    private String modoPago; // 'CONSOLIDADO', 'INDIVIDUAL'
    private String descripcionHabitaciones;
    private Integer cantidadHabitaciones;
    private UUID grupoId;
    private java.util.List<UUID> estadiaIds;
}
