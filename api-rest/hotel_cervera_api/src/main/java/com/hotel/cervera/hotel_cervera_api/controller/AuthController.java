package com.hotel.cervera.hotel_cervera_api.controller;

import com.hotel.cervera.hotel_cervera_api.dto.LoginRequest;
import com.hotel.cervera.hotel_cervera_api.dto.LoginResponse;
import com.hotel.cervera.hotel_cervera_api.repository.UsuarioRepository;
import com.hotel.cervera.hotel_cervera_api.service.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.persistence.EntityManager;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.DatabaseMetaData;
import java.sql.ResultSet;
import java.sql.Statement;
import java.util.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Tag(name = "Autenticación", description = "Endpoints para autenticación de usuarios (login JWT)")
public class AuthController {

    private final AuthService authService;
    private final UsuarioRepository usuarioRepository;
    private final DataSource dataSource;
    private final EntityManager entityManager;

    @PostMapping("/login")
    @Operation(summary = "Iniciar sesión", description = "Autentica un usuario con nombre de usuario y contraseña, retornando un token JWT")
    @ApiResponses(value = {
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Login exitoso, token JWT generado",
                content = @Content(schema = @Schema(implementation = LoginResponse.class))),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Credenciales inválidas o usuario inactivo"),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Autenticación fallida")
    })
    public ResponseEntity<LoginResponse> login(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }

    @GetMapping("/diagnostico")
    public Map<String, Object> diagnostic() {
        Map<String, Object> result = new LinkedHashMap<>();

        try (Connection conn = dataSource.getConnection()) {
            DatabaseMetaData meta = conn.getMetaData();
            result.put("driverName", meta.getDriverName());
            result.put("driverVersion", meta.getDriverVersion());
            result.put("dbProductVersion", meta.getDatabaseProductVersion());
            result.put("dbMajorVersion", meta.getDatabaseMajorVersion());
            result.put("dbMinorVersion", meta.getDatabaseMinorVersion());
            result.put("jdbcUrl", meta.getURL());
            result.put("catalog", conn.getCatalog());
            result.put("schema", conn.getSchema());
        } catch (Exception e) {
            result.put("jdbcError", e.getMessage());
        }

        List<Map<String, Object>> usuarios = new ArrayList<>();
        try (Connection conn = dataSource.getConnection();
             Statement stmt = conn.createStatement();
             ResultSet rs = stmt.executeQuery(
                 "SELECT u.id, u.nombre_usuario, u.estado, u.email, r.nombre AS rol " +
                 "FROM usuarios u JOIN roles r ON r.id = u.rol_id " +
                 "ORDER BY u.nombre_usuario")) {
            while (rs.next()) {
                Map<String, Object> u = new LinkedHashMap<>();
                u.put("id", rs.getString("id"));
                u.put("nombre_usuario", rs.getString("nombre_usuario"));
                u.put("estado", rs.getString("estado"));
                u.put("email", rs.getString("email"));
                u.put("rol", rs.getString("rol"));
                usuarios.add(u);
            }
        } catch (Exception e) {
            result.put("usuariosError", e.getMessage());
        }
        result.put("usuarios", usuarios);

        try {
            Long count = (Long) entityManager.createQuery(
                "SELECT COUNT(u) FROM Usuario u").getSingleResult();
            result.put("totalUsuariosJPA", count);
        } catch (Exception e) {
            result.put("totalUsuariosJPAError", e.getMessage());
        }

        return result;
    }
}
