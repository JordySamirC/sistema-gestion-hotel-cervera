package com.hotel.cervera.hotel_cervera_api.controller;

import com.hotel.cervera.hotel_cervera_api.dto.ApiResponse;
import com.hotel.cervera.hotel_cervera_api.dto.request.GastoRequest;
import com.hotel.cervera.hotel_cervera_api.dto.response.GastoResponse;
import com.hotel.cervera.hotel_cervera_api.service.GastoService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
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
@RequestMapping("/api/gastos")
@RequiredArgsConstructor
@Tag(name = "Gastos", description = "Gestión de gastos operativos del hotel (solo gerente)")
public class GastoController {

    private final GastoService gastoService;

    @GetMapping
    @Operation(summary = "Listar todos los gastos", description = "Obtiene el listado completo de gastos registrados")
    @io.swagger.v3.oas.annotations.responses.ApiResponses(value = {
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Lista de gastos obtenida exitosamente")
    })
    public ResponseEntity<List<GastoResponse>> findAll() {
        return ResponseEntity.ok(gastoService.findAll());
    }

    @GetMapping("/{id}")
    @Operation(summary = "Buscar gasto por ID", description = "Obtiene los detalles de un gasto específico")
    @io.swagger.v3.oas.annotations.responses.ApiResponses(value = {
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Gasto encontrado"),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "Gasto no encontrado")
    })
    public ResponseEntity<GastoResponse> findById(@PathVariable UUID id) {
        return ResponseEntity.ok(gastoService.findById(id));
    }

    @GetMapping("/periodo")
    @Operation(summary = "Listar gastos por período", description = "Obtiene los gastos dentro de un rango de fechas")
    @io.swagger.v3.oas.annotations.responses.ApiResponses(value = {
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Lista de gastos en el período obtenida exitosamente")
    })
    public ResponseEntity<List<GastoResponse>> findByPeriodo(
            @RequestParam LocalDate desde, @RequestParam LocalDate hasta) {
        return ResponseEntity.ok(gastoService.findByPeriodo(desde, hasta));
    }

    @GetMapping("/categoria/{categoria}")
    @Operation(summary = "Listar gastos por categoría", description = "Obtiene los gastos filtrados por categoría")
    @io.swagger.v3.oas.annotations.responses.ApiResponses(value = {
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Lista de gastos por categoría obtenida exitosamente")
    })
    public ResponseEntity<List<GastoResponse>> findByCategoria(@PathVariable String categoria) {
        return ResponseEntity.ok(gastoService.findByCategoria(categoria));
    }

    @GetMapping("/resumen-por-categoria")
    @Operation(summary = "Resumen de gastos por categoría", description = "Obtiene el total de gastos agrupados por categoría en un período")
    @io.swagger.v3.oas.annotations.responses.ApiResponses(value = {
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Resumen obtenido exitosamente")
    })
    public ResponseEntity<Map<String, BigDecimal>> resumenPorCategoria(
            @RequestParam LocalDate desde, @RequestParam LocalDate hasta) {
        return ResponseEntity.ok(gastoService.sumByCategoriaEnPeriodo(desde, hasta));
    }

    @PostMapping
    @Operation(summary = "Crear un nuevo gasto", description = "Registra un nuevo gasto operativo")
    @io.swagger.v3.oas.annotations.responses.ApiResponses(value = {
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "201", description = "Gasto creado exitosamente"),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Datos inválidos")
    })
    public ResponseEntity<GastoResponse> create(@Valid @RequestBody GastoRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(gastoService.create(request));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Actualizar un gasto", description = "Actualiza los datos de un gasto existente")
    @io.swagger.v3.oas.annotations.responses.ApiResponses(value = {
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Gasto actualizado exitosamente"),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "Gasto no encontrado")
    })
    public ResponseEntity<GastoResponse> update(@PathVariable UUID id,
                                                 @Valid @RequestBody GastoRequest request) {
        return ResponseEntity.ok(gastoService.update(id, request));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Eliminar un gasto", description = "Elimina un gasto del sistema")
    @io.swagger.v3.oas.annotations.responses.ApiResponses(value = {
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Gasto eliminado correctamente"),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "Gasto no encontrado")
    })
    public ResponseEntity<ApiResponse> delete(@PathVariable UUID id) {
        gastoService.delete(id);
        return ResponseEntity.ok(ApiResponse.ok("Gasto eliminado correctamente"));
    }
}
