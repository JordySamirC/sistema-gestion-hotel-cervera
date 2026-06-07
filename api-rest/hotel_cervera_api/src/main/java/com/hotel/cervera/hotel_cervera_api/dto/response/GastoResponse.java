package com.hotel.cervera.hotel_cervera_api.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GastoResponse {
    private UUID id;
    private LocalDate fechaGasto;
    private String descripcion;
    
    private Long categoriaId;
    private String categoriaNombre;
    
    private Long tipoGastoId;
    private String tipoGastoNombre;
    
    private BigDecimal monto;
    private String observaciones;
    private String estado;
    
    // Trazabilidad
    private UUID creadoPor;
    private String creadoPorNombre;
    private OffsetDateTime fechaCreacion;
    
    private UUID actualizadoPor;
    private String actualizadoPorNombre;
    private OffsetDateTime fechaActualizacion;
    
    private OffsetDateTime fechaAnulacion;
    private UUID anuladoPor;
    private String anuladoPorNombre;
    private String motivoAnulacion;
}
