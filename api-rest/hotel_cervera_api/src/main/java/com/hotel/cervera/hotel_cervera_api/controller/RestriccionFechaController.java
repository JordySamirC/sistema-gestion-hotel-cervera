package com.hotel.cervera.hotel_cervera_api.controller;

import com.hotel.cervera.hotel_cervera_api.dto.response.RestriccionFechaResponse;
import com.hotel.cervera.hotel_cervera_api.model.RestriccionFecha;
import com.hotel.cervera.hotel_cervera_api.service.RestriccionFechaService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/restricciones-fecha")
@RequiredArgsConstructor
@Tag(name = "Restricciones de Fecha", description = "Gestión de restricciones de fechas (cierres, bloqueos de check-in/out)")
public class RestriccionFechaController {

    private final RestriccionFechaService service;

    @GetMapping
    @Operation(summary = "Listar restricciones activas")
    public ResponseEntity<List<RestriccionFechaResponse>> findAll() {
        return ResponseEntity.ok(service.findAll());
    }

    @GetMapping("/{id}")
    @Operation(summary = "Obtener restricción por ID")
    public ResponseEntity<RestriccionFechaResponse> findById(@PathVariable UUID id) {
        return ResponseEntity.ok(service.findById(id));
    }

    @PostMapping
    @Operation(summary = "Crear restricción de fecha")
    public ResponseEntity<RestriccionFechaResponse> create(@Valid @RequestBody RestriccionFecha request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(request));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Actualizar restricción de fecha")
    public ResponseEntity<RestriccionFechaResponse> update(@PathVariable UUID id,
                                                            @Valid @RequestBody RestriccionFecha request) {
        return ResponseEntity.ok(service.update(id, request));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Eliminar restricción de fecha")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}
