package com.hotel.cervera.hotel_cervera_api.controller;

import com.hotel.cervera.hotel_cervera_api.dto.ApiResponse;
import com.hotel.cervera.hotel_cervera_api.dto.request.RolRequest;
import com.hotel.cervera.hotel_cervera_api.dto.response.RolResponse;
import com.hotel.cervera.hotel_cervera_api.service.RolService;
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
@RequestMapping("/api/roles")
@RequiredArgsConstructor
@Tag(name = "Roles", description = "Gestión de roles de usuario (solo gerente)")
public class RolController {

    private final RolService rolService;

    @GetMapping
    @Operation(summary = "Listar todos los roles", description = "Obtiene el listado completo de roles del sistema")
    @ApiResponses(value = {
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Lista de roles obtenida exitosamente")
    })
    public ResponseEntity<List<RolResponse>> findAll() {
        return ResponseEntity.ok(rolService.findAll());
    }

    @GetMapping("/{id}")
    @Operation(summary = "Buscar rol por ID", description = "Obtiene los datos de un rol específico")
    @ApiResponses(value = {
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Rol encontrado"),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "Rol no encontrado")
    })
    public ResponseEntity<RolResponse> findById(@PathVariable UUID id) {
        return ResponseEntity.ok(rolService.findById(id));
    }

    @PostMapping
    @Operation(summary = "Crear un nuevo rol", description = "Registra un nuevo rol en el sistema")
    @ApiResponses(value = {
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "201", description = "Rol creado exitosamente"),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Datos inválidos")
    })
    public ResponseEntity<RolResponse> create(@Valid @RequestBody RolRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(rolService.create(request));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Actualizar un rol", description = "Actualiza los datos de un rol existente")
    @ApiResponses(value = {
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Rol actualizado exitosamente"),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "Rol no encontrado")
    })
    public ResponseEntity<RolResponse> update(@PathVariable UUID id, @Valid @RequestBody RolRequest request) {
        return ResponseEntity.ok(rolService.update(id, request));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Eliminar un rol", description = "Elimina un rol del sistema")
    @ApiResponses(value = {
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Rol eliminado correctamente"),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "Rol no encontrado")
    })
    public ResponseEntity<ApiResponse> delete(@PathVariable UUID id) {
        rolService.delete(id);
        return ResponseEntity.ok(ApiResponse.ok("Rol eliminado correctamente"));
    }
}
