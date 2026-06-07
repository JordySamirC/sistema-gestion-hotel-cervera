package com.hotel.cervera.hotel_cervera_api.controller;

import com.hotel.cervera.hotel_cervera_api.dto.ApiResponse;
import com.hotel.cervera.hotel_cervera_api.dto.request.PagoRequest;
import com.hotel.cervera.hotel_cervera_api.dto.response.PagoResponse;
import com.hotel.cervera.hotel_cervera_api.service.PagoService;
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
@RequestMapping("/api/pagos")
@RequiredArgsConstructor
@Tag(name = "Pagos", description = "Gestión de pagos de estadías")
public class PagoController {

    private final PagoService pagoService;

    @GetMapping
    @Operation(summary = "Listar todos los pagos", description = "Obtiene el listado completo de pagos registrados")
    @ApiResponses(value = {
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Lista de pagos obtenida exitosamente")
    })
    public ResponseEntity<List<PagoResponse>> findAll() {
        return ResponseEntity.ok(pagoService.findAll());
    }

    @GetMapping("/{id}")
    @Operation(summary = "Buscar pago por ID", description = "Obtiene los detalles de un pago específico")
    @ApiResponses(value = {
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Pago encontrado"),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "Pago no encontrado")
    })
    public ResponseEntity<PagoResponse> findById(@PathVariable UUID id) {
        return ResponseEntity.ok(pagoService.findById(id));
    }

    @GetMapping("/estadia/{estadiaId}")
    @Operation(summary = "Buscar pago por estadía", description = "Obtiene el pago asociado a una estadía específica")
    @ApiResponses(value = {
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Pago encontrado"),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "Pago no encontrado para esa estadía")
    })
    public ResponseEntity<PagoResponse> findByEstadia(@PathVariable UUID estadiaId) {
        return ResponseEntity.ok(pagoService.findByEstadia(estadiaId));
    }

    @GetMapping("/grupo/{grupoId}")
    @Operation(summary = "Buscar pago por grupo", description = "Obtiene el pago consolidado asociado a un grupo")
    @ApiResponses(value = {
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Pago encontrado"),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "Pago no encontrado para ese grupo")
    })
    public ResponseEntity<PagoResponse> findByGrupo(@PathVariable UUID grupoId) {
        return ResponseEntity.ok(pagoService.findByGrupo(grupoId));
    }

    @GetMapping("/periodo")
    @Operation(summary = "Listar pagos por período", description = "Obtiene los pagos realizados en un rango de fechas")
    @ApiResponses(value = {
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Lista de pagos en el período obtenida exitosamente")
    })
    public ResponseEntity<List<PagoResponse>> findByPeriodo(
            @RequestParam LocalDate desde, @RequestParam LocalDate hasta) {
        return ResponseEntity.ok(pagoService.findByPeriodo(desde, hasta));
    }

    @PostMapping
    @Operation(summary = "Registrar un pago", description = "Registra un nuevo pago asociado a una estadía")
    @ApiResponses(value = {
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "201", description = "Pago registrado exitosamente"),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Datos inválidos")
    })
    public ResponseEntity<PagoResponse> create(@Valid @RequestBody PagoRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(pagoService.create(request));
    }
}
