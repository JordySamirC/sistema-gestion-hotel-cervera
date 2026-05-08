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
public class ReservaResponse {
    private UUID id;
    private String codigo;
    private OffsetDateTime fechaReserva;
    private LocalDate fechaIngreso;
    private LocalDate fechaSalida;
    private UUID clienteId;
    private String clienteNombre;
    private String estado;
    private String motivoCancelacion;
    private UUID creadoPor;
    private String creadoPorNombre;
    private Integer adultos;
    private Integer adolescentes;
    private Integer ninos;
    private Integer bebes;
    private String canalVenta;
    private String tipoCliente;
    private Integer cambiosReserva;
    private Integer solicitudesEspeciales;
    private Integer cancelacionesPrevias;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;
    private List<ReservaDetalleResponse> detalles;
}
