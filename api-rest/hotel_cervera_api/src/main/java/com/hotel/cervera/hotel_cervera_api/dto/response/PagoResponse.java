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
    
    // Datos del cliente
    private String clienteNombre;
    private String clienteTipoDocumento;
    private String clienteDocumento;
    private String clienteRuc;
    private String clienteRazonSocial;

    // Datos del emisor
    private String emisorRuc;
    private String emisorRazonSocial;

    private String referenciaPago;
    private String observaciones;
    
    private BigDecimal montoNeto;
    private BigDecimal igv;
    private OffsetDateTime fechaCreacion;

    // Campos para trazabilidad de grupos
    private String modoPago;
    private String descripcionHabitaciones;
    private Integer cantidadHabitaciones;
    private UUID grupoId;
}
