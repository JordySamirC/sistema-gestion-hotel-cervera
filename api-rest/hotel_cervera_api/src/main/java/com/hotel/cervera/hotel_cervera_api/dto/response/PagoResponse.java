package com.hotel.cervera.hotel_cervera_api.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PagoResponse {
    private UUID id;
    private UUID estadiaId;
    private String comprobanteNumero;
    private OffsetDateTime fechaPago;
    private BigDecimal montoTotal;
    private String metodoPago;
    private String tipoComprobante;
    private String serie;
    private Integer numero;
    private String rucRazonSocial;
    private BigDecimal montoNeto;
    private BigDecimal igv;
    private OffsetDateTime createdAt;
}
