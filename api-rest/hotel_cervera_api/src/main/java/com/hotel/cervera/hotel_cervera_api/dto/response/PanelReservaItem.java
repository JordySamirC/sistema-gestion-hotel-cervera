package com.hotel.cervera.hotel_cervera_api.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PanelReservaItem {
    private UUID id;
    private String tipo;
    private String codigo;
    private String cliente;
    private LocalDate fechaIngreso;
    private LocalDate fechaSalida;
    private String grupoNombre;
    private String estado;
    private List<PanelReservaItem> hijas;
    private Boolean expandido;
    private BigDecimal precioTotal;
    private String habitacionNumero;
}
