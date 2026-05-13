package com.hotel.cervera.hotel_cervera_api.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PanelReservaItem {
    private String tipo;
    private String codigo;
    private String cliente;
    private LocalDate fechaIngreso;
    private LocalDate fechaSalida;
    private String grupoNombre;
    private String estado;
    private List<PanelReservaItem> hijas;
}
