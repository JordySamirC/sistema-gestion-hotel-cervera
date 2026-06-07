package com.hotel.cervera.hotel_cervera_api.controller;

import com.hotel.cervera.hotel_cervera_api.dto.response.EstadiaResponse;
import com.hotel.cervera.hotel_cervera_api.dto.request.CheckInRequest;
import com.hotel.cervera.hotel_cervera_api.dto.request.CheckOutRequest;
import com.hotel.cervera.hotel_cervera_api.service.EstadiaService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
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
@RequestMapping("/api/estadias")
@RequiredArgsConstructor
@Tag(name = "Estadías", description = "Gestión de estadías (check-in / check-out)")
public class EstadiaController {

    private final EstadiaService estadiaService;

    @GetMapping
    @Operation(summary = "Listar todas las estadías", description = "Obtiene el listado completo de estadías registradas")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Lista de estadías obtenida exitosamente")
    })
    public ResponseEntity<List<EstadiaResponse>> findAll() {
        return ResponseEntity.ok(estadiaService.findAll());
    }

    @GetMapping("/{id}")
    @Operation(summary = "Buscar estadía por ID", description = "Obtiene los detalles de una estadía específica")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Estadía encontrada"),
        @ApiResponse(responseCode = "404", description = "Estadía no encontrada")
    })
    public ResponseEntity<EstadiaResponse> findById(@PathVariable UUID id) {
        return ResponseEntity.ok(estadiaService.findById(id));
    }

    @GetMapping("/activas")
    @Operation(summary = "Listar estadías activas", description = "Obtiene todas las estadías actualmente activas (sin check-out)")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Lista de estadías activas obtenida exitosamente")
    })
    public ResponseEntity<List<EstadiaResponse>> findActivas() {
        return ResponseEntity.ok(estadiaService.findActivas());
    }

    @GetMapping("/reserva/{reservaId}")
    @Operation(summary = "Buscar estadía por reserva", description = "Obtiene la estadía asociada a una reserva específica")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Estadía encontrada"),
        @ApiResponse(responseCode = "404", description = "No se encontró estadía para esa reserva")
    })
    public ResponseEntity<EstadiaResponse> findByReserva(@PathVariable UUID reservaId) {
        return ResponseEntity.ok(estadiaService.findByReservaId(reservaId));
    }

    @PostMapping("/check-in")
    @Operation(summary = "Registrar check-in", description = "Registra la entrada (check-in) de un huésped, creando una nueva estadía")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "201", description = "Check-in registrado exitosamente"),
        @ApiResponse(responseCode = "400", description = "Datos inválidos o reserva no confirmada")
    })
    public ResponseEntity<EstadiaResponse> checkIn(@Valid @RequestBody CheckInRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(estadiaService.checkIn(request));
    }

    @PutMapping("/{id}/check-out")
    @Operation(summary = "Registrar check-out", description = "Registra la salida (check-out) de un huésped, finalizando la estadía")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Check-out registrado exitosamente"),
        @ApiResponse(responseCode = "404", description = "Estadía no encontrada")
    })
    public ResponseEntity<EstadiaResponse> checkOut(@PathVariable UUID id,
                                                     @RequestBody(required = false) CheckOutRequest request) {
        return ResponseEntity.ok(estadiaService.checkOut(id,
                request != null ? request.getFechaSalida() : null));
    }

    @PostMapping("/grupo/{grupoId}/check-out")
    @Operation(summary = "Registrar check-out grupal", description = "Registra el pago y salida de todas las estadías activas de un grupo")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Check-out grupal exitoso"),
        @ApiResponse(responseCode = "400", description = "Datos de pago inválidos"),
        @ApiResponse(responseCode = "404", description = "Grupo no encontrado o sin estadías activas")
    })
    public ResponseEntity<List<EstadiaResponse>> checkOutGrupo(
            @PathVariable UUID grupoId,
            @Valid @RequestBody com.hotel.cervera.hotel_cervera_api.dto.request.PagoGrupoRequest request) {
        request.setGrupoId(grupoId);
        return ResponseEntity.ok(estadiaService.checkOutGrupo(request));
    }
}
