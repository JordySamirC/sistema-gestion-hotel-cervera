package com.hotel.cervera.hotel_cervera_api.controller;

import com.hotel.cervera.hotel_cervera_api.dto.ApiResponse;
import com.hotel.cervera.hotel_cervera_api.dto.request.IniciarLimpiezaRequest;
import com.hotel.cervera.hotel_cervera_api.dto.response.LimpiezaResponse;
import com.hotel.cervera.hotel_cervera_api.service.LimpiezaService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/limpiezas")
@RequiredArgsConstructor
@Tag(name = "Limpieza", description = "Gestión de tareas de limpieza de habitaciones")
public class LimpiezaController {

    private final LimpiezaService limpiezaService;

    @GetMapping
    @Operation(summary = "Listar todas las limpiezas", description = "Obtiene el listado completo de registros de limpieza")
    @ApiResponses(value = {
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Lista de limpiezas obtenida exitosamente")
    })
    public ResponseEntity<List<LimpiezaResponse>> findAll() {
        return ResponseEntity.ok(limpiezaService.findAll());
    }

    @GetMapping("/{id}")
    @Operation(summary = "Buscar limpieza por ID", description = "Obtiene los detalles de un registro de limpieza específico")
    @ApiResponses(value = {
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Limpieza encontrada"),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "Limpieza no encontrada")
    })
    public ResponseEntity<LimpiezaResponse> findById(@PathVariable UUID id) {
        return ResponseEntity.ok(limpiezaService.findById(id));
    }

    @GetMapping("/activas")
    @Operation(summary = "Listar limpiezas activas", description = "Obtiene las tareas de limpieza actualmente en progreso")
    @ApiResponses(value = {
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Lista de limpiezas activas obtenida exitosamente")
    })
    public ResponseEntity<List<LimpiezaResponse>> findActivas() {
        return ResponseEntity.ok(limpiezaService.findActivas());
    }

    @GetMapping("/historial/habitacion/{habitacionId}")
    @Operation(summary = "Historial de limpieza por habitación", description = "Obtiene el historial completo de limpiezas de una habitación")
    @ApiResponses(value = {
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Historial obtenido exitosamente")
    })
    public ResponseEntity<List<LimpiezaResponse>> findByHabitacion(@PathVariable UUID habitacionId) {
        return ResponseEntity.ok(limpiezaService.findByHabitacion(habitacionId));
    }

    @GetMapping("/historial/usuario/{usuarioId}")
    @Operation(summary = "Historial de limpieza por usuario", description = "Obtiene el historial de limpiezas realizadas por un usuario específico")
    @ApiResponses(value = {
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Historial obtenido exitosamente")
    })
    public ResponseEntity<List<LimpiezaResponse>> findByUsuario(@PathVariable UUID usuarioId) {
        return ResponseEntity.ok(limpiezaService.findByUsuario(usuarioId));
    }

    @PostMapping("/iniciar")
    @Operation(summary = "Iniciar una limpieza", description = "Registra el inicio de una tarea de limpieza en una habitación")
    @ApiResponses(value = {
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "201", description = "Limpieza iniciada exitosamente"),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Datos inválidos")
    })
    public ResponseEntity<LimpiezaResponse> iniciar(@Valid @RequestBody IniciarLimpiezaRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(limpiezaService.iniciar(request));
    }

    @PutMapping("/{id}/terminar")
    @Operation(summary = "Finalizar una limpieza", description = "Registra la finalización de una tarea de limpieza")
    @ApiResponses(value = {
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Limpieza finalizada exitosamente"),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "Limpieza no encontrada")
    })
    public ResponseEntity<LimpiezaResponse> terminar(@PathVariable UUID id) {
        return ResponseEntity.ok(limpiezaService.terminar(id));
    }
}
