package com.hotel.cervera.hotel_cervera_api.controller;

import com.hotel.cervera.hotel_cervera_api.dto.ApiResponse;
import com.hotel.cervera.hotel_cervera_api.dto.request.CambiarEstadoHabitacionRequest;
import com.hotel.cervera.hotel_cervera_api.dto.request.HabitacionRequest;
import com.hotel.cervera.hotel_cervera_api.dto.response.HabitacionResponse;
import com.hotel.cervera.hotel_cervera_api.service.HabitacionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/habitaciones")
@RequiredArgsConstructor
@Tag(name = "Habitaciones", description = "Gestión de habitaciones del hotel")
public class HabitacionController {

    private final HabitacionService habitacionService;

    @GetMapping
    @Operation(summary = "Listar habitaciones", description = "Obtiene todas las habitaciones, opcionalmente filtradas por piso o estado")
    @ApiResponses(value = {
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Lista de habitaciones obtenida exitosamente")
    })
    public ResponseEntity<List<HabitacionResponse>> findAll(
            @RequestParam(required = false) Integer piso,
            @RequestParam(required = false) String estado) {
        if (piso != null) return ResponseEntity.ok(habitacionService.findByPiso(piso));
        if (estado != null) return ResponseEntity.ok(habitacionService.findByEstado(estado));
        return ResponseEntity.ok(habitacionService.findAll());
    }

    @GetMapping("/{id}")
    @Operation(summary = "Buscar habitación por ID", description = "Obtiene los datos de una habitación específica")
    @ApiResponses(value = {
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Habitación encontrada"),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "Habitación no encontrada")
    })
    public ResponseEntity<HabitacionResponse> findById(@PathVariable UUID id) {
        return ResponseEntity.ok(habitacionService.findById(id));
    }

    @GetMapping("/disponibles")
    @Operation(summary = "Buscar habitaciones disponibles", description = "Obtiene las habitaciones disponibles en un rango de fechas")
    @ApiResponses(value = {
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Lista de habitaciones disponibles obtenida exitosamente")
    })
    public ResponseEntity<List<HabitacionResponse>> findDisponibles(
            @RequestParam LocalDate fechaIngreso, @RequestParam LocalDate fechaSalida) {
        return ResponseEntity.ok(habitacionService.findDisponiblesEnRango(fechaIngreso, fechaSalida));
    }

    @PostMapping
    @Operation(summary = "Crear una nueva habitación", description = "Registra una nueva habitación en el sistema (solo gerente)")
    @ApiResponses(value = {
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "201", description = "Habitación creada exitosamente"),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Datos inválidos")
    })
    public ResponseEntity<HabitacionResponse> create(@Valid @RequestBody HabitacionRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(habitacionService.create(request));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Actualizar una habitación", description = "Actualiza los datos de una habitación existente (solo gerente)")
    @ApiResponses(value = {
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Habitación actualizada exitosamente"),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "Habitación no encontrada")
    })
    public ResponseEntity<HabitacionResponse> update(@PathVariable UUID id,
                                                      @Valid @RequestBody HabitacionRequest request) {
        return ResponseEntity.ok(habitacionService.update(id, request));
    }

    @PatchMapping("/{id}/estado")
    @Operation(summary = "Cambiar estado de habitación", description = "Actualiza el estado actual de una habitación (limpia, ocupada, mantenimiento, etc.)")
    @ApiResponses(value = {
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Estado actualizado exitosamente"),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "Habitación no encontrada")
    })
    public ResponseEntity<HabitacionResponse> cambiarEstado(@PathVariable UUID id,
                                                             @Valid @RequestBody CambiarEstadoHabitacionRequest request) {
        return ResponseEntity.ok(habitacionService.cambiarEstado(id, request.getEstadoActual()));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Eliminar una habitación", description = "Elimina una habitación del sistema (solo gerente)")
    @ApiResponses(value = {
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Habitación eliminada correctamente"),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "Habitación no encontrada")
    })
    public ResponseEntity<ApiResponse> delete(@PathVariable UUID id) {
        habitacionService.delete(id);
        return ResponseEntity.ok(ApiResponse.ok("Habitación eliminada correctamente"));
    }
}
