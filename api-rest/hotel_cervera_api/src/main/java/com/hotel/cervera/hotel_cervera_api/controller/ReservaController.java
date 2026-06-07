package com.hotel.cervera.hotel_cervera_api.controller;

import com.hotel.cervera.hotel_cervera_api.dto.ApiResponse;
import com.hotel.cervera.hotel_cervera_api.dto.request.ActualizarReservaRequest;
import com.hotel.cervera.hotel_cervera_api.dto.request.AgregarHuespedRequest;
import com.hotel.cervera.hotel_cervera_api.dto.request.CambiarHabitacionRequest;
import com.hotel.cervera.hotel_cervera_api.dto.request.CancelarReservaRequest;
import com.hotel.cervera.hotel_cervera_api.dto.request.ExtenderReservaRequest;
import com.hotel.cervera.hotel_cervera_api.dto.request.ReservaDetalleRequest;
import com.hotel.cervera.hotel_cervera_api.dto.request.ReservaRequest;
import com.hotel.cervera.hotel_cervera_api.dto.response.ReservaDetalleResponse;
import com.hotel.cervera.hotel_cervera_api.dto.response.PanelReservaItem;
import com.hotel.cervera.hotel_cervera_api.dto.response.ReservaHuespedResponse;
import com.hotel.cervera.hotel_cervera_api.dto.response.ReservaResponse;
import com.hotel.cervera.hotel_cervera_api.service.ReservaService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/reservas")
@RequiredArgsConstructor
@Tag(name = "Reservas", description = "Gestión de reservas de habitaciones")
public class ReservaController {

    private final ReservaService reservaService;

    @GetMapping
    @Operation(summary = "Listar reservas", description = "Obtiene todas las reservas, opcionalmente filtradas por estado")
    @ApiResponses(value = {
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Lista de reservas obtenida exitosamente")
    })
    public ResponseEntity<List<ReservaResponse>> findAll(
            @RequestParam(required = false) String estado) {
        if ("RESERVADA".equalsIgnoreCase(estado)) {
            reservaService.procesarInasistenciasAutomaticas();
        }
        if (estado != null) return ResponseEntity.ok(reservaService.findByEstado(estado));
        return ResponseEntity.ok(reservaService.findAll());
    }

    @GetMapping("/{id}")
    @Operation(summary = "Buscar reserva por ID", description = "Obtiene los datos de una reserva específica")
    @ApiResponses(value = {
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Reserva encontrada"),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "Reserva no encontrada")
    })
    public ResponseEntity<ReservaResponse> findById(@PathVariable UUID id) {
        return ResponseEntity.ok(reservaService.findById(id));
    }

    @GetMapping("/codigo/{codigo}")
    @Operation(summary = "Buscar reserva por código", description = "Busca una reserva por su código único")
    @ApiResponses(value = {
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Reserva encontrada"),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "Reserva no encontrada con ese código")
    })
    public ResponseEntity<ReservaResponse> findByCodigo(@PathVariable String codigo) {
        return ResponseEntity.ok(reservaService.findByCodigo(codigo));
    }

    @GetMapping("/cliente/{clienteId}")
    @Operation(summary = "Listar reservas por cliente", description = "Obtiene todas las reservas asociadas a un cliente")
    @ApiResponses(value = {
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Lista de reservas del cliente obtenida exitosamente")
    })
    public ResponseEntity<List<ReservaResponse>> findByCliente(@PathVariable UUID clienteId) {
        return ResponseEntity.ok(reservaService.findByCliente(clienteId));
    }

    @PostMapping
    @Operation(summary = "Crear una nueva reserva", description = "Registra una nueva reserva de habitación")
    @ApiResponses(value = {
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "201", description = "Reserva creada exitosamente"),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Datos inválidos")
    })
    public ResponseEntity<ReservaResponse> create(@Valid @RequestBody ReservaRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(reservaService.create(request));
    }

    @PatchMapping("/{id}/cancelar")
    @Operation(summary = "Cancelar una reserva", description = "Cancela una reserva existente indicando el motivo y observaciones")
    @ApiResponses(value = {
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Reserva cancelada exitosamente"),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "Reserva no encontrada")
    })
    public ResponseEntity<ReservaResponse> cancelar(@PathVariable UUID id,
                                                     @Valid @RequestBody CancelarReservaRequest request) {
        String userIdStr = SecurityContextHolder.getContext().getAuthentication().getName();
        UUID usuarioId = UUID.fromString(userIdStr);
        return ResponseEntity.ok(reservaService.cancelar(id, request, usuarioId));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Eliminar una reserva", description = "Elimina una reserva del sistema (solo gerente)")
    @ApiResponses(value = {
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Reserva eliminada correctamente"),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "Reserva no encontrada")
    })
    public ResponseEntity<ApiResponse> delete(@PathVariable UUID id) {
        reservaService.delete(id);
        return ResponseEntity.ok(ApiResponse.ok("Reserva eliminada correctamente"));
    }

    @PatchMapping("/{id}")
    @Operation(summary = "Actualizar una reserva", description = "Actualiza fechas y/o número de huéspedes de una reserva existente")
    @ApiResponses(value = {
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Reserva actualizada exitosamente"),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Datos inválidos o habitaciones no disponibles"),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "Reserva no encontrada")
    })
    public ResponseEntity<ReservaResponse> update(@PathVariable UUID id,
                                                   @Valid @RequestBody ActualizarReservaRequest request) {
        return ResponseEntity.ok(reservaService.update(id, request));
    }

    @PatchMapping("/{id}/extender")
    @Operation(summary = "Extender una reserva", description = "Extiende la fecha de salida de una reserva existente")
    @ApiResponses(value = {
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Reserva extendida exitosamente"),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Fecha inválida o habitaciones no disponibles"),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "Reserva no encontrada")
    })
    public ResponseEntity<ReservaResponse> extender(@PathVariable UUID id,
                                                     @Valid @RequestBody ExtenderReservaRequest request) {
        return ResponseEntity.ok(reservaService.extender(id, request));
    }

    @GetMapping("/panel")
    @Operation(summary = "Obtener panel unificado de reservas", description = "Retorna una lista unificada con reservas individuales y grupos (con sus hijas) para el panel de reservas")
    public ResponseEntity<List<PanelReservaItem>> getPanel() {
        return ResponseEntity.ok(reservaService.getPanelReservas());
    }

    @GetMapping("/{reservaId}/detalles")
    @Operation(summary = "Obtener detalles de reserva", description = "Obtiene los detalles (habitaciones) asociados a una reserva")
    @ApiResponses(value = {
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Detalles obtenidos exitosamente"),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "Reserva no encontrada")
    })
    public ResponseEntity<List<ReservaDetalleResponse>> getDetalles(@PathVariable UUID reservaId) {
        return ResponseEntity.ok(reservaService.getDetalles(reservaId));
    }

    @PostMapping("/{reservaId}/detalles")
    @Operation(summary = "Agregar detalle a reserva", description = "Agrega una habitación adicional a una reserva existente")
    @ApiResponses(value = {
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "201", description = "Detalle agregado exitosamente"),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Datos inválidos")
    })
    public ResponseEntity<ReservaDetalleResponse> addDetalle(
            @PathVariable UUID reservaId, @Valid @RequestBody ReservaDetalleRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(reservaService.addDetalle(reservaId, request.getHabitacionId()));
    }

    @DeleteMapping("/{reservaId}/detalles/{detalleId}")
    @Operation(summary = "Eliminar detalle de reserva", description = "Elimina una habitación de una reserva existente")
    @ApiResponses(value = {
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Detalle eliminado correctamente"),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "Detalle no encontrado")
    })
    public ResponseEntity<ApiResponse> removeDetalle(@PathVariable UUID reservaId,
                                                       @PathVariable UUID detalleId) {
        reservaService.removeDetalle(reservaId, detalleId);
        return ResponseEntity.ok(ApiResponse.ok("Detalle eliminado correctamente"));
    }

    @PostMapping("/{reservaId}/huespedes")
    @Operation(summary = "Agregar huésped a reserva", description = "Agrega un cliente como acompañante a una reserva existente")
    @ApiResponses(value = {
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "201", description = "Huésped agregado exitosamente"),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Datos inválidos o capacidad excedida"),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "Reserva o cliente no encontrado")
    })
    public ResponseEntity<ReservaHuespedResponse> agregarHuesped(
            @PathVariable UUID reservaId, @Valid @RequestBody AgregarHuespedRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(reservaService.agregarHuesped(reservaId, request));
    }

    @DeleteMapping("/{reservaId}/huespedes/{huespedId}")
    @Operation(summary = "Eliminar huésped de reserva", description = "Elimina un acompañante de una reserva existente")
    @ApiResponses(value = {
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Huésped eliminado correctamente"),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "No se puede eliminar al titular"),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "Reserva o huésped no encontrado")
    })
    public ResponseEntity<ApiResponse> eliminarHuesped(@PathVariable UUID reservaId,
                                                        @PathVariable UUID huespedId) {
        reservaService.eliminarHuesped(reservaId, huespedId);
        return ResponseEntity.ok(ApiResponse.ok("Huésped eliminado correctamente"));
    }

    @PatchMapping("/{reservaId}/habitacion")
    @Operation(summary = "Cambiar habitación de reserva", description = "Cambia la habitación asignada a una reserva existente")
    @ApiResponses(value = {
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Habitación cambiada exitosamente"),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Habitación no disponible o estado inválido"),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "Reserva o habitación no encontrada")
    })
    public ResponseEntity<ReservaResponse> cambiarHabitacion(@PathVariable UUID reservaId,
                                                               @Valid @RequestBody CambiarHabitacionRequest request) {
        return ResponseEntity.ok(reservaService.cambiarHabitacion(reservaId, request));
    }
}
