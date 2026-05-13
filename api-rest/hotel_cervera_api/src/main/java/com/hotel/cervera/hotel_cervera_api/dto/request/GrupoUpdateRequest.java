package com.hotel.cervera.hotel_cervera_api.dto.request;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class GrupoUpdateRequest {

    private String nombreGrupo;
    private UUID responsablePagoId;
    private LocalDate fechaIngreso;
    private LocalDate fechaSalida;
    private Boolean facturarTodoAlResponsable;
    private Long canalVentaId;
    private String canalVentaOtro;
}
