package com.hotel.cervera.hotel_cervera_api.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ResumenDashboardDTO {
    private long totalHabitaciones;
    private long disponibles;
    private long ocupadas;
    private long porLimpiar;
    private long checkInsHoy;
    private long checkOutsHoy;
    private BigDecimal ingresosHoy;
    private BigDecimal ingresosMes;
    private double ocupacionPorcentaje;
}
