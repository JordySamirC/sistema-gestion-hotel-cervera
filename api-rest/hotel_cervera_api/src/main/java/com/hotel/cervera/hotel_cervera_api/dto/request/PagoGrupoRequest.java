package com.hotel.cervera.hotel_cervera_api.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PagoGrupoRequest {
    @NotNull(message = "El ID del grupo es obligatorio")
    private UUID grupoId;

    @NotNull(message = "El monto total es obligatorio")
    @Positive(message = "El monto total debe ser mayor a 0")
    private BigDecimal montoTotal;

    @NotBlank(message = "El método de pago es obligatorio")
    private String metodoPago;

    @NotBlank(message = "El tipo de comprobante es obligatorio")
    private String tipoComprobante;

    @NotBlank(message = "La serie es obligatoria")
    private String serie;

    @NotNull(message = "El monto neto es obligatorio")
    @Positive(message = "El monto neto debe ser mayor a 0")
    private BigDecimal montoNeto;

    @NotNull(message = "El IGV es obligatorio")
    private BigDecimal igv;

    // Datos del cliente
    private String clienteNombre;
    private String clienteTipoDocumento;
    private String clienteDocumento;
    private String clienteRuc;
    private String clienteRazonSocial;

    private String referenciaPago;
    private String observaciones;
}
