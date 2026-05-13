package com.hotel.cervera.hotel_cervera_api.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GrupoResponse {
    private UUID id;
    private String nombreGrupo;
    private UUID responsablePagoId;
    private String responsablePagoNombre;
    private LocalDate fechaIngreso;
    private LocalDate fechaSalida;
    private Boolean facturarTodoAlResponsable;
    private String canalVentaNombre;
    private String canalVentaIcono;
    private String canalVentaOtro;
    private UUID creadoPor;
    private String creadoPorNombre;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;
    private List<ReservaResponse> reservas;
}
