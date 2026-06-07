package com.hotel.cervera.hotel_cervera_api.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DashboardGraficosDTO {
    private List<OcupacionPunto> ocupacionSemana;
    private List<IngresosTipo> ingresosTipo;
    private List<EstadoConteo> distribucionEstados;
    private List<RankingPopularidad> rankingHabitaciones;

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor
    public static class OcupacionPunto {
        private String name; // fecha, ej: "11/05"
        private double value; // porcentaje, ej: 65.0
    }

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor
    public static class IngresosTipo {
        private String name; // tipo, ej: "Matrimonial"
        private BigDecimal value; // monto, ej: 4500.00
    }

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor
    public static class EstadoConteo {
        private String name; // estado, ej: "Disponible"
        private long value; // conteo, ej: 15
    }

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor
    public static class RankingPopularidad {
        private String name; // tipo, ej: "Matrimonial"
        private long value; // cantidad de reservas, ej: 45
    }
}
