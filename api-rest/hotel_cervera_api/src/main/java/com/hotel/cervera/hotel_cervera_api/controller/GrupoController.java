package com.hotel.cervera.hotel_cervera_api.controller;

import com.hotel.cervera.hotel_cervera_api.dto.ApiResponse;
import com.hotel.cervera.hotel_cervera_api.dto.request.AddHabitacionRequest;
import com.hotel.cervera.hotel_cervera_api.dto.request.CancelarGrupoRequest;
import com.hotel.cervera.hotel_cervera_api.dto.request.ExtenderGrupoRequest;
import com.hotel.cervera.hotel_cervera_api.dto.request.GrupoRequest;
import com.hotel.cervera.hotel_cervera_api.dto.request.GrupoUpdateRequest;
import com.hotel.cervera.hotel_cervera_api.dto.response.GrupoResponse;
import com.hotel.cervera.hotel_cervera_api.dto.response.ReservaHuespedResponse;
import com.hotel.cervera.hotel_cervera_api.service.GrupoService;
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
@RequestMapping("/api/grupos")
@RequiredArgsConstructor
@Tag(name = "Grupos", description = "Gestión de grupos de reservas")
public class GrupoController {

    private final GrupoService grupoService;

    @GetMapping
    @Operation(summary = "Listar todos los grupos", description = "Obtiene todos los grupos de reservas")
    public ResponseEntity<List<GrupoResponse>> findAll() {
        return ResponseEntity.ok(grupoService.findAll());
    }

    @GetMapping("/{id}")
    @Operation(summary = "Buscar grupo por ID", description = "Obtiene los datos de un grupo de reservas")
    public ResponseEntity<GrupoResponse> findById(@PathVariable UUID id) {
        return ResponseEntity.ok(grupoService.findById(id));
    }

    @PostMapping
    @Operation(summary = "Crear un nuevo grupo de reservas", description = "Crea un grupo con múltiples reservas y huéspedes")
    public ResponseEntity<GrupoResponse> create(@Valid @RequestBody GrupoRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(grupoService.create(request));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Editar grupo", description = "Actualiza los datos de un grupo (nombre, responsable, fechas, canal)")
    public ResponseEntity<GrupoResponse> update(@PathVariable UUID id, @Valid @RequestBody GrupoUpdateRequest request) {
        return ResponseEntity.ok(grupoService.update(id, request));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Eliminar grupo", description = "Elimina un grupo solo si no tiene reservas activas")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        grupoService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/habitaciones")
    @Operation(summary = "Agregar habitación al grupo", description = "Agrega una nueva reserva hija con una habitación al grupo")
    public ResponseEntity<GrupoResponse> addHabitacion(@PathVariable UUID id, @Valid @RequestBody AddHabitacionRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(grupoService.addHabitacion(id, request));
    }

    @DeleteMapping("/{id}/habitaciones/{habitacionId}")
    @Operation(summary = "Quitar habitación del grupo", description = "Cancela la reserva hija que tiene la habitación asignada")
    public ResponseEntity<GrupoResponse> removeHabitacion(@PathVariable UUID id, @PathVariable UUID habitacionId) {
        return ResponseEntity.ok(grupoService.removeHabitacion(id, habitacionId));
    }

    @GetMapping("/{reservaId}/huespedes")
    @Operation(summary = "Obtener huéspedes de una reserva en grupo", description = "Lista los huéspedes asociados a una reserva dentro de un grupo")
    public ResponseEntity<List<ReservaHuespedResponse>> getHuespedes(@PathVariable UUID reservaId) {
        return ResponseEntity.ok(grupoService.getHuespedes(reservaId));
    }

    @PatchMapping("/{id}/cancelar")
    @Operation(summary = "Cancelar grupo", description = "Cancela todas las reservas en estado RESERVADA del grupo")
    public ResponseEntity<ApiResponse> cancelarGrupo(
            @PathVariable UUID id,
            @Valid @RequestBody CancelarGrupoRequest request,
            @RequestParam UUID usuarioId) {
        grupoService.cancelarGrupo(id, request, usuarioId);
        return ResponseEntity.ok(ApiResponse.ok("Grupo cancelado exitosamente"));
    }

    @PatchMapping("/{id}/extender")
    @Operation(summary = "Extender grupo", description = "Extiende la fecha de salida de todas las reservas activas del grupo")
    public ResponseEntity<GrupoResponse> extenderGrupo(
            @PathVariable UUID id,
            @Valid @RequestBody ExtenderGrupoRequest request) {
        return ResponseEntity.ok(grupoService.extenderGrupo(id, request));
    }
}
