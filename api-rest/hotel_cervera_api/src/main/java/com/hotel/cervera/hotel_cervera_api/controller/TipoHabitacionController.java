package com.hotel.cervera.hotel_cervera_api.controller;

import com.hotel.cervera.hotel_cervera_api.dto.ApiResponse;
import com.hotel.cervera.hotel_cervera_api.dto.request.TipoHabitacionRequest;
import com.hotel.cervera.hotel_cervera_api.dto.response.TipoHabitacionResponse;
import com.hotel.cervera.hotel_cervera_api.service.TipoHabitacionService;
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
@RequestMapping("/api/tipos-habitacion")
@RequiredArgsConstructor
@Tag(name = "Tipos de Habitación", description = "Gestión de tipos de habitación")
public class TipoHabitacionController {

    private final TipoHabitacionService service;

    @GetMapping
    @Operation(summary = "Listar todos los tipos de habitación", description = "Obtiene el listado completo de tipos de habitación disponibles")
    @ApiResponses(value = {
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Lista obtenida exitosamente")
    })
    public ResponseEntity<List<TipoHabitacionResponse>> findAll() {
        return ResponseEntity.ok(service.findAll());
    }

    @GetMapping("/{id}")
    @Operation(summary = "Buscar tipo de habitación por ID", description = "Obtiene los datos de un tipo de habitación específico")
    @ApiResponses(value = {
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Tipo de habitación encontrado"),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "Tipo de habitación no encontrado")
    })
    public ResponseEntity<TipoHabitacionResponse> findById(@PathVariable UUID id) {
        return ResponseEntity.ok(service.findById(id));
    }

    @PostMapping
    @Operation(summary = "Crear un tipo de habitación", description = "Registra un nuevo tipo de habitación")
    @ApiResponses(value = {
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "201", description = "Tipo de habitación creado exitosamente"),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Datos inválidos")
    })
    public ResponseEntity<TipoHabitacionResponse> create(@Valid @RequestBody TipoHabitacionRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(request));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Actualizar un tipo de habitación", description = "Actualiza los datos de un tipo de habitación existente")
    @ApiResponses(value = {
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Tipo de habitación actualizado exitosamente"),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "Tipo de habitación no encontrado")
    })
    public ResponseEntity<TipoHabitacionResponse> update(@PathVariable UUID id,
                                                          @Valid @RequestBody TipoHabitacionRequest request) {
        return ResponseEntity.ok(service.update(id, request));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Eliminar un tipo de habitación", description = "Elimina un tipo de habitación del sistema")
    @ApiResponses(value = {
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Tipo de habitación eliminado correctamente"),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "Tipo de habitación no encontrado")
    })
    public ResponseEntity<ApiResponse> delete(@PathVariable UUID id) {
        service.delete(id);
        return ResponseEntity.ok(ApiResponse.ok("Tipo de habitación eliminado correctamente"));
    }
}
