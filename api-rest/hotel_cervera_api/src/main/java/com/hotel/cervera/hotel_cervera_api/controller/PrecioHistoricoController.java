package com.hotel.cervera.hotel_cervera_api.controller;

import com.hotel.cervera.hotel_cervera_api.dto.ApiResponse;
import com.hotel.cervera.hotel_cervera_api.dto.request.PrecioHistoricoRequest;
import com.hotel.cervera.hotel_cervera_api.dto.response.PrecioHistoricoResponse;
import com.hotel.cervera.hotel_cervera_api.service.PrecioHistoricoService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/precios-historicos")
@RequiredArgsConstructor
@Tag(name = "Precios Históricos", description = "Gestión de precios históricos por tipo de habitación (solo gerente)")
public class PrecioHistoricoController {

    private final PrecioHistoricoService service;

    @GetMapping
    @Operation(summary = "Listar todos los precios históricos", description = "Obtiene el listado completo de precios históricos registrados")
    @ApiResponses(value = {
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Lista obtenida exitosamente")
    })
    public ResponseEntity<List<PrecioHistoricoResponse>> findAll() {
        return ResponseEntity.ok(service.findAll());
    }

    @GetMapping("/{id}")
    @Operation(summary = "Buscar precio histórico por ID", description = "Obtiene los detalles de un precio histórico específico")
    @ApiResponses(value = {
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Precio histórico encontrado"),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "Precio histórico no encontrado")
    })
    public ResponseEntity<PrecioHistoricoResponse> findById(@PathVariable UUID id) {
        return ResponseEntity.ok(service.findById(id));
    }

    @GetMapping("/por-tipo/{tipoHabitacionId}")
    @Operation(summary = "Listar precios por tipo de habitación", description = "Obtiene el historial de precios para un tipo de habitación específico")
    @ApiResponses(value = {
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Lista de precios obtenida exitosamente")
    })
    public ResponseEntity<List<PrecioHistoricoResponse>> findByTipo(@PathVariable UUID tipoHabitacionId) {
        return ResponseEntity.ok(service.findByTipoHabitacion(tipoHabitacionId));
    }

    @GetMapping("/vigente")
    @Operation(summary = "Consultar precio vigente", description = "Obtiene el precio vigente para un tipo de habitación en una fecha específica")
    @ApiResponses(value = {
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Precio vigente obtenido exitosamente"),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "No se encontró precio vigente para esa fecha")
    })
    public ResponseEntity<Map<String, Object>> getPrecioVigente(
            @RequestParam UUID tipoHabitacionId, @RequestParam(required = false) LocalDate fecha) {
        LocalDate fechaConsulta = fecha != null ? fecha : LocalDate.now();
        BigDecimal precio = service.findPrecioVigente(tipoHabitacionId, fechaConsulta);
        return ResponseEntity.ok(Map.of(
                "tipoHabitacionId", tipoHabitacionId,
                "fecha", fechaConsulta,
                "precioNoche", precio
        ));
    }

    @PostMapping
    @Operation(summary = "Crear un precio histórico", description = "Registra un nuevo precio para un tipo de habitación en un período")
    @ApiResponses(value = {
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "201", description = "Precio histórico creado exitosamente"),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Datos inválidos")
    })
    public ResponseEntity<PrecioHistoricoResponse> create(@Valid @RequestBody PrecioHistoricoRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(request));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Actualizar un precio histórico", description = "Actualiza los datos de un precio histórico existente")
    @ApiResponses(value = {
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Precio histórico actualizado exitosamente"),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "Precio histórico no encontrado")
    })
    public ResponseEntity<PrecioHistoricoResponse> update(@PathVariable UUID id,
                                                           @Valid @RequestBody PrecioHistoricoRequest request) {
        return ResponseEntity.ok(service.update(id, request));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Eliminar un precio histórico", description = "Elimina un precio histórico del sistema")
    @ApiResponses(value = {
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Precio histórico eliminado correctamente"),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "Precio histórico no encontrado")
    })
    public ResponseEntity<ApiResponse> delete(@PathVariable UUID id) {
        service.delete(id);
        return ResponseEntity.ok(ApiResponse.ok("Precio histórico eliminado correctamente"));
    }
}
