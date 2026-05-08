package com.hotel.cervera.hotel_cervera_api.service;

import com.hotel.cervera.hotel_cervera_api.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.*;

@Service
@RequiredArgsConstructor
public class ReporteService {

    private final HabitacionRepository habitacionRepository;
    private final ReservaRepository reservaRepository;
    private final PagoRepository pagoRepository;
    private final GastoRepository gastoRepository;
    private final LimpiezaRepository limpiezaRepository;
    private final ReservaDetalleRepository reservaDetalleRepository;

    public Map<String, Object> ocupacionDiaria(LocalDate fecha) {
        long totalOperativas = habitacionRepository.count();
        long reservasActivas = reservaRepository.countReservasActivasEnFecha(fecha);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("fecha", fecha);
        result.put("totalHabitaciones", totalOperativas);
        result.put("habitacionesOcupadas", reservasActivas);
        result.put("porcentajeOcupacion", totalOperativas > 0
                ? BigDecimal.valueOf(reservasActivas * 100.0 / totalOperativas)
                        .setScale(2, RoundingMode.HALF_UP) + "%"
                : "0%");
        return result;
    }

    public Map<String, Object> ingresosPorPeriodo(LocalDate desde, LocalDate hasta) {
        BigDecimal ingresos = pagoRepository.sumIngresosByPeriodo(desde, hasta);
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("desde", desde);
        result.put("hasta", hasta);
        result.put("totalIngresos", ingresos);
        return result;
    }

    public Map<String, Object> gananciasNetas(LocalDate desde, LocalDate hasta) {
        BigDecimal ingresos = pagoRepository.sumIngresosByPeriodo(desde, hasta);
        BigDecimal gastos = gastoRepository.sumGastosByPeriodo(desde, hasta);
        BigDecimal neto = ingresos.subtract(gastos);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("desde", desde);
        result.put("hasta", hasta);
        result.put("totalIngresos", ingresos);
        result.put("totalGastos", gastos);
        result.put("gananciaNeta", neto);
        return result;
    }

    public Map<String, Object> resumenLimpieza() {
        Double promedioGlobal = limpiezaRepository.promedioDuracionGlobal();

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("promedioDuracionGlobalSegundos", promedioGlobal != null ? promedioGlobal.intValue() : 0);
        result.put("promedioDuracionGlobalMinutos", promedioGlobal != null
                ? BigDecimal.valueOf(promedioGlobal / 60.0).setScale(2, RoundingMode.HALF_UP) : 0);
        return result;
    }

    public long totalReservasCanceladas() {
        return reservaRepository.countByEstado("cancelada");
    }

    public long totalReservasNoShow() {
        return reservaRepository.countByEstado("no_show");
    }

    public long proyeccionOcupacion() {
        LocalDate hoy = LocalDate.now();
        LocalDate dentroDe7Dias = hoy.plusDays(7);
        long total = 0;
        LocalDate fecha = hoy;
        while (!fecha.isAfter(dentroDe7Dias)) {
            total += reservaRepository.countReservasActivasEnFecha(fecha);
            fecha = fecha.plusDays(1);
        }
        return total;
    }
}
