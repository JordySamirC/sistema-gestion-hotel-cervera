package com.hotel.cervera.hotel_cervera_api.controller;

import com.hotel.cervera.hotel_cervera_api.dto.ReporteCompletoDTO;
import com.hotel.cervera.hotel_cervera_api.service.ReporteService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.Map;

@RestController
@RequestMapping("/api/reportes")
@RequiredArgsConstructor
@Tag(name = "Reportes", description = "Reportes gerenciales del hotel (solo gerente)")
public class ReporteController {

    private final ReporteService reporteService;

    @GetMapping("/ocupacion-diaria")
    @Operation(summary = "Reporte de ocupación diaria", description = "Obtiene el reporte de ocupación del hotel para una fecha específica")
    @ApiResponses(value = {
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Reporte de ocupación obtenido exitosamente")
    })
    public ResponseEntity<Map<String, Object>> ocupacionDiaria(
            @RequestParam(required = false) LocalDate fecha) {
        LocalDate fechaConsulta = fecha != null ? fecha : LocalDate.now();
        return ResponseEntity.ok(reporteService.ocupacionDiaria(fechaConsulta));
    }

    @GetMapping("/ingresos")
    @Operation(summary = "Reporte de ingresos", description = "Obtiene el total de ingresos por pagos en un período")
    @ApiResponses(value = {
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Reporte de ingresos obtenido exitosamente")
    })
    public ResponseEntity<Map<String, Object>> ingresos(
            @RequestParam LocalDate desde, @RequestParam LocalDate hasta) {
        return ResponseEntity.ok(reporteService.ingresosPorPeriodo(desde, hasta));
    }

    @GetMapping("/ganancias-netas")
    @Operation(summary = "Reporte de ganancias netas", description = "Obtiene las ganancias netas (ingresos - gastos) en un período")
    @ApiResponses(value = {
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Reporte de ganancias netas obtenido exitosamente")
    })
    public ResponseEntity<Map<String, Object>> gananciasNetas(
            @RequestParam LocalDate desde, @RequestParam LocalDate hasta) {
        return ResponseEntity.ok(reporteService.gananciasNetas(desde, hasta));
    }

    @GetMapping("/limpieza")
    @Operation(summary = "Resumen de limpieza", description = "Obtiene un resumen del estado de limpieza de las habitaciones")
    @ApiResponses(value = {
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Resumen de limpieza obtenido exitosamente")
    })
    public ResponseEntity<Map<String, Object>> resumenLimpieza() {
        return ResponseEntity.ok(reporteService.resumenLimpieza());
    }

    @GetMapping("/cancelaciones")
    @Operation(summary = "Reporte de cancelaciones", description = "Obtiene el total de reservas canceladas y no-show")
    @ApiResponses(value = {
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Reporte de cancelaciones obtenido exitosamente")
    })
    public ResponseEntity<Map<String, Object>> cancelaciones() {
        return ResponseEntity.ok(Map.of(
                "canceladas", reporteService.totalReservasCanceladas(),
                "noShow", reporteService.totalReservasNoShow()
        ));
    }

    @GetMapping("/proyeccion-ocupacion")
    @Operation(summary = "Proyección de ocupación", description = "Obtiene la proyección de ocupación para los próximos 7 días")
    @ApiResponses(value = {
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Proyección obtenida exitosamente")
    })
    public ResponseEntity<Map<String, Object>> proyeccionOcupacion() {
        return ResponseEntity.ok(Map.of(
                "proyeccion7Dias", reporteService.proyeccionOcupacion()
        ));
    }

    @GetMapping("/completo")
    @Operation(summary = "Reporte ejecutivo completo", description = "Obtiene todos los KPIs, gráficos y series analíticas para un período")
    @ApiResponses(value = {
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Reporte completo obtenido exitosamente")
    })
    public ResponseEntity<ReporteCompletoDTO> reporteCompleto(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate desde,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate hasta) {
        return ResponseEntity.ok(reporteService.obtenerReporteCompleto(desde, hasta));
    }
}
