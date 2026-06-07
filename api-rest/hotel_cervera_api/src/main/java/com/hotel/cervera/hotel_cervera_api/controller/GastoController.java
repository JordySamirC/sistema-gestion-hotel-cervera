package com.hotel.cervera.hotel_cervera_api.controller;

import com.hotel.cervera.hotel_cervera_api.dto.ApiResponse;
import com.hotel.cervera.hotel_cervera_api.dto.request.GastoRequest;
import com.hotel.cervera.hotel_cervera_api.dto.response.GastoResponse;
import com.hotel.cervera.hotel_cervera_api.model.CategoriaGasto;
import com.hotel.cervera.hotel_cervera_api.model.TipoGasto;
import com.hotel.cervera.hotel_cervera_api.service.GastoService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
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
    @Operation(summary = "Listar gastos con filtros", description = "Obtiene los gastos dentro de un rango de fechas con filtros opcionales de categoría y tipo")
    public ResponseEntity<List<GastoResponse>> findConFiltros(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate desde,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate hasta,
            @RequestParam(required = false) Long categoriaId,
            @RequestParam(required = false) Long tipoGastoId) {
        return ResponseEntity.ok(gastoService.findConFiltros(desde, hasta, categoriaId, tipoGastoId));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Buscar gasto por ID", description = "Obtiene los detalles de un gasto específico")
    public ResponseEntity<GastoResponse> findById(@PathVariable UUID id) {
        return ResponseEntity.ok(gastoService.findById(id));
    }

    @GetMapping("/categorias")
    @Operation(summary = "Listar categorías activas", description = "Retorna el listado de categorías para gasto")
    public ResponseEntity<List<CategoriaGasto>> getCategorias() {
        return ResponseEntity.ok(gastoService.findAllCategorias());
    }

    @GetMapping("/tipos")
    @Operation(summary = "Listar tipos de gasto", description = "Retorna los tipos Fijo o Variable")
    public ResponseEntity<List<TipoGasto>> getTipos() {
        return ResponseEntity.ok(gastoService.findAllTipos());
    }

    @GetMapping("/resumen-por-categoria")
    @Operation(summary = "Resumen de gastos por categoría", description = "Obtiene el total de gastos agrupados por categoría en un período")
    public ResponseEntity<Map<String, BigDecimal>> resumenPorCategoria(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate desde,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate hasta) {
        return ResponseEntity.ok(gastoService.sumByCategoriaEnPeriodo(desde, hasta));
    }

    @PostMapping
    @Operation(summary = "Crear un nuevo gasto", description = "Registra un nuevo gasto operativo")
    public ResponseEntity<GastoResponse> create(@Valid @RequestBody GastoRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(gastoService.create(request));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Actualizar un gasto", description = "Actualiza los datos de un gasto existente")
    public ResponseEntity<GastoResponse> update(@PathVariable UUID id,
                                                 @Valid @RequestBody GastoRequest request) {
        return ResponseEntity.ok(gastoService.update(id, request));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Eliminar un gasto físicamente", description = "Elimina un gasto del sistema por ID")
    public ResponseEntity<ApiResponse> delete(@PathVariable UUID id) {
        gastoService.delete(id);
        return ResponseEntity.ok(ApiResponse.ok("Gasto eliminado físicamente con éxito"));
    }

    @PostMapping("/{id}/anular")
    @Operation(summary = "Anular un gasto con trazabilidad", description = "Establece el estado de un gasto a ANULADO con motivo obligatorio")
    public ResponseEntity<GastoResponse> anularGasto(
            @PathVariable UUID id,
            @RequestParam String motivo,
            @RequestParam UUID usuarioId) {
        return ResponseEntity.ok(gastoService.anularGasto(id, motivo, usuarioId));
    }
}
