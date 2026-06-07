package com.hotel.cervera.hotel_cervera_api.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReporteCompletoDTO {

    private Kpis kpis;
    private List<OcupacionDiariaInfo> ocupacionDiaria;
    private List<IngresosPorTipoInfo> ingresosPorTipo;
    private List<DistribucionCanalInfo> distribucionCanales;
    private List<HabitacionPopularInfo> habitacionesMasReservadas;
    private CancelacionesDetalleInfo cancelaciones;
    private List<OcupacionDiariaInfo> proyeccion7Dias;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class Kpis {
        private KpiInfo ocupacion;
        private KpiInfo adr;
        private KpiInfo revPar;
        private KpiInfo trevPar;
        private KpiInfo alos;
        private KpiInfo tasaCancelacion;
        private BigDecimal totalIngresos;
        private BigDecimal totalIngresosAnterior;
        private BigDecimal totalGastos;
        private BigDecimal totalGastosAnterior;
        private BigDecimal gananciaNeta;
        private BigDecimal gananciaNetaAnterior;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class KpiInfo {
        private BigDecimal valorActual;
        private BigDecimal valorAnterior;
        private BigDecimal porcentajeCambio;
        private String tendencia; // "up", "down", "stable"
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class OcupacionDiariaInfo {
        private LocalDate fecha;
        private long habitacionesOcupadas;
        private long totalHabitaciones;
        private BigDecimal porcentaje;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class IngresosPorTipoInfo {
        private String tipoHabitacion;
        private BigDecimal totalIngresos;
        private BigDecimal porcentaje;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class DistribucionCanalInfo {
        private String canal;
        private String icono;
        private long cantidadReservas;
        private BigDecimal porcentaje;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class HabitacionPopularInfo {
        private String numero;
        private String tipo;
        private long nochesOcupadas;
        private BigDecimal totalIngresos;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class CancelacionesDetalleInfo {
        private long canceladas;
        private long noShow;
        private BigDecimal tasaCancelacion;
        private Map<String, Long> cancelacionesPorMotivo;
    }
}
