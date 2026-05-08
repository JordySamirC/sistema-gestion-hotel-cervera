package com.hotel.cervera.hotel_cervera_api.controller;

import com.hotel.cervera.hotel_cervera_api.dto.ApiResponse;
import com.hotel.cervera.hotel_cervera_api.dto.request.CambiarPasswordRequest;
import com.hotel.cervera.hotel_cervera_api.dto.request.UsuarioRequest;
import com.hotel.cervera.hotel_cervera_api.dto.request.UsuarioUpdateRequest;
import com.hotel.cervera.hotel_cervera_api.dto.response.UsuarioResponse;
import com.hotel.cervera.hotel_cervera_api.service.UsuarioService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/usuarios")
@RequiredArgsConstructor
@Tag(name = "Usuarios", description = "Gestión de usuarios del sistema (solo gerente)")
public class UsuarioController {

    private final UsuarioService usuarioService;

    @GetMapping
    @Operation(summary = "Listar todos los usuarios", description = "Obtiene el listado completo de usuarios del sistema")
    @ApiResponses(value = {
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Lista de usuarios obtenida exitosamente")
    })
    public ResponseEntity<List<UsuarioResponse>> findAll() {
        return ResponseEntity.ok(usuarioService.findAll());
    }

    @GetMapping("/{id}")
    @Operation(summary = "Buscar usuario por ID", description = "Obtiene los datos de un usuario específico")
    @ApiResponses(value = {
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Usuario encontrado"),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "Usuario no encontrado")
    })
    public ResponseEntity<UsuarioResponse> findById(@PathVariable UUID id) {
        return ResponseEntity.ok(usuarioService.findById(id));
    }

    @PostMapping
    @Operation(summary = "Crear un nuevo usuario", description = "Registra un nuevo usuario en el sistema")
    @ApiResponses(value = {
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "201", description = "Usuario creado exitosamente"),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Datos inválidos")
    })
    public ResponseEntity<UsuarioResponse> create(@Valid @RequestBody UsuarioRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(usuarioService.create(request));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Actualizar un usuario", description = "Actualiza los datos de un usuario existente")
    @ApiResponses(value = {
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Usuario actualizado exitosamente"),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "Usuario no encontrado")
    })
    public ResponseEntity<UsuarioResponse> update(@PathVariable UUID id,
                                                   @Valid @RequestBody UsuarioUpdateRequest request) {
        return ResponseEntity.ok(usuarioService.update(id, request));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Desactivar un usuario", description = "Desactiva (soft-delete) un usuario del sistema")
    @ApiResponses(value = {
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Usuario desactivado correctamente"),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "Usuario no encontrado")
    })
    public ResponseEntity<ApiResponse> delete(@PathVariable UUID id) {
        usuarioService.softDelete(id);
        return ResponseEntity.ok(ApiResponse.ok("Usuario desactivado correctamente"));
    }

    @PutMapping("/{id}/cambiar-password")
    @Operation(summary = "Cambiar contraseña", description = "Cambia la contraseña de un usuario (solo el propio usuario puede cambiar su contraseña)")
    @ApiResponses(value = {
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Contraseña cambiada correctamente"),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Contraseña actual incorrecta"),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403", description = "No puedes cambiar la contraseña de otro usuario")
    })
    public ResponseEntity<ApiResponse> cambiarPassword(@PathVariable UUID id,
                                                        @Valid @RequestBody CambiarPasswordRequest request,
                                                        Principal principal) {
        if (!principal.getName().equals(id.toString())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(ApiResponse.error("No puedes cambiar la contraseña de otro usuario"));
        }
        usuarioService.cambiarPassword(id, request.getContrasenaActual(), request.getNuevaContrasena());
        return ResponseEntity.ok(ApiResponse.ok("Contraseña cambiada correctamente"));
    }
}
