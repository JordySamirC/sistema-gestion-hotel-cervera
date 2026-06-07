package com.hotel.cervera.hotel_cervera_api.controller;

import com.hotel.cervera.hotel_cervera_api.dto.response.AlertaDashboardDTO;
import com.hotel.cervera.hotel_cervera_api.dto.response.DashboardGraficosDTO;
import com.hotel.cervera.hotel_cervera_api.dto.response.ResumenDashboardDTO;
import com.hotel.cervera.hotel_cervera_api.service.DashboardService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
@Tag(name = "Dashboard", description = "Métricas y gráficos del panel de control del Gerente")
public class DashboardController {

    private final DashboardService dashboardService;

    @GetMapping("/resumen")
    @Operation(summary = "Obtener KPIs de resumen", description = "Devuelve el conteo de habitaciones por estado, check-ins/outs de hoy e ingresos")
    public ResponseEntity<ResumenDashboardDTO> getResumen() {
        return ResponseEntity.ok(dashboardService.obtenerResumen());
    }

    @GetMapping("/graficos")
    @Operation(summary = "Obtener datos de gráficos", description = "Devuelve las series de datos para ocupación semanal, ingresos, estados y ranking")
    public ResponseEntity<DashboardGraficosDTO> getGraficos() {
        return ResponseEntity.ok(dashboardService.obtenerGraficos());
    }

    @GetMapping("/alertas")
    @Operation(summary = "Obtener alertas operativas", description = "Devuelve las alertas y advertencias de negocio de la jornada")
    public ResponseEntity<List<AlertaDashboardDTO>> getAlertas() {
        return ResponseEntity.ok(dashboardService.obtenerAlertas());
    }
}
