package com.hotel.cervera.hotel_cervera_api.controller;

import com.hotel.cervera.hotel_cervera_api.dto.ForgotPasswordRequest;
import com.hotel.cervera.hotel_cervera_api.dto.LoginRequest;
import com.hotel.cervera.hotel_cervera_api.dto.LoginResponse;
import com.hotel.cervera.hotel_cervera_api.dto.ResetPasswordRequest;
import com.hotel.cervera.hotel_cervera_api.exception.BusinessException;
import com.hotel.cervera.hotel_cervera_api.model.PasswordResetToken;
import com.hotel.cervera.hotel_cervera_api.model.Usuario;
import com.hotel.cervera.hotel_cervera_api.repository.PasswordResetTokenRepository;
import com.hotel.cervera.hotel_cervera_api.repository.UsuarioRepository;
import com.hotel.cervera.hotel_cervera_api.service.AuthService;
import com.hotel.cervera.hotel_cervera_api.service.EmailService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.persistence.EntityManager;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import javax.sql.DataSource;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.sql.Connection;
import java.sql.DatabaseMetaData;
import java.sql.ResultSet;
import java.sql.Statement;
import java.time.LocalDateTime;
import java.util.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Autenticación", description = "Endpoints para autenticación de usuarios (login JWT)")
public class AuthController {

    private final AuthService authService;
    private final UsuarioRepository usuarioRepository;
    private final DataSource dataSource;
    private final EntityManager entityManager;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final EmailService emailService;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.base-url}")
    private String appBaseUrl;

    @PostMapping("/login")
    @Operation(summary = "Iniciar sesión", description = "Autentica un usuario con nombre de usuario y contraseña, retornando un token JWT")
    @ApiResponses(value = {
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Login exitoso, token JWT generado",
                content = @Content(schema = @Schema(implementation = LoginResponse.class))),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Credenciales inválidas o usuario inactivo"),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Autenticación fallida")
    })
    public ResponseEntity<LoginResponse> login(@Valid @RequestBody LoginRequest request) {
        LoginResponse response = authService.login(request);
        
        org.springframework.http.ResponseCookie cookie = org.springframework.http.ResponseCookie.from("auth_token", response.getToken())
                .httpOnly(true)
                .secure(true) // Required for SameSite=None
                .path("/")
                .maxAge(24 * 60 * 60)
                .sameSite("None") // Required for cross-origin cookie sharing
                .build();
                
        // Return without token in body for security
        response.setToken(null);
        
        return ResponseEntity.ok()
                .header(org.springframework.http.HttpHeaders.SET_COOKIE, cookie.toString())
                .body(response);
    }
    
    @PostMapping("/logout")
    @Operation(summary = "Cerrar sesión", description = "Elimina la cookie JWT")
    public ResponseEntity<Void> logout() {
        org.springframework.http.ResponseCookie cookie = org.springframework.http.ResponseCookie.from("auth_token", "")
                .httpOnly(true)
                .secure(true) // Required for SameSite=None
                .path("/")
                .maxAge(0)
                .sameSite("None")
                .build();
                
        return ResponseEntity.ok()
                .header(org.springframework.http.HttpHeaders.SET_COOKIE, cookie.toString())
                .build();
    }

    @PostMapping("/forgot-password")
    @Operation(summary = "Solicitar restablecimiento de contraseña",
               description = "Envía un magic link al correo si está registrado. Siempre devuelve el mismo mensaje genérico (seguridad NIST).")
    public ResponseEntity<Map<String, String>> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        Optional<Usuario> userOptional = usuarioRepository.findByCorreoElectronico(request.getCorreoElectronico());

        if (userOptional.isPresent()) {
            Usuario user = userOptional.get();

            String rawToken = UUID.randomUUID().toString();
            String tokenHash = hashToken(rawToken);

            PasswordResetToken resetToken = PasswordResetToken.builder()
                    .email(user.getCorreoElectronico())
                    .tokenHash(tokenHash)
                    .expiresAt(LocalDateTime.now().plusHours(1))
                    .used(false)
                    .build();
            passwordResetTokenRepository.save(resetToken);

            String magicLink = appBaseUrl + "/reset-password?token=" + rawToken;

            try {
                emailService.sendMagicLink(user.getCorreoElectronico(), magicLink);
                log.info("Magic link sent to masked email: {}", maskEmail(user.getCorreoElectronico()));
            } catch (Exception e) {
                log.error("Failed to send magic link email to {}: {}", maskEmail(user.getCorreoElectronico()), e.getMessage());
            }
        } else {
            log.info("Forgot password requested for non-existent email (silent)");
        }

        return ResponseEntity.ok(Map.of(
            "message", "Si el correo está registrado en el sistema, recibirás un enlace para restablecer tu contraseña. Revisa tu bandeja de entrada y la carpeta de spam."
        ));
    }

    @PostMapping("/reset-password")
    @Operation(summary = "Restablecer contraseña",
               description = "Valida el token mágico y actualiza la contraseña del usuario.")
    public ResponseEntity<Map<String, String>> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        if (isCommonPassword(request.getNewPassword())) {
            throw new BusinessException("La contraseña es demasiado común. Elige una más segura.");
        }

        String tokenHash = hashToken(request.getToken());

        PasswordResetToken resetToken = passwordResetTokenRepository.findByTokenHash(tokenHash)
                .orElseThrow(() -> new BusinessException("El enlace es inválido o ha expirado."));

        if (resetToken.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new BusinessException("El enlace ha expirado. Solicita un nuevo restablecimiento.");
        }

        if (Boolean.TRUE.equals(resetToken.getUsed())) {
            throw new BusinessException("Este enlace ya ha sido utilizado. Solicita un nuevo restablecimiento.");
        }

        Usuario user = usuarioRepository.findByCorreoElectronico(resetToken.getEmail())
                .orElseThrow(() -> new BusinessException("Usuario no encontrado."));

        user.setContrasenaHash(passwordEncoder.encode(request.getNewPassword()));
        usuarioRepository.save(user);

        resetToken.setUsed(true);
        passwordResetTokenRepository.save(resetToken);

        log.info("Password reset successfully for user: {}", user.getNombreUsuario());

        return ResponseEntity.ok(Map.of(
            "message", "Contraseña actualizada correctamente. Ya puedes iniciar sesión con tu nueva contraseña."
        ));
    }



    private String hashToken(String token) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            byte[] hash = md.digest(token.getBytes(java.nio.charset.StandardCharsets.UTF_8));
            StringBuilder hexString = new StringBuilder();
            for (byte b : hash) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) hexString.append('0');
                hexString.append(hex);
            }
            return hexString.toString();
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("SHA-256 algorithm not available", e);
        }
    }

    private boolean isCommonPassword(String password) {
        Set<String> commonPasswords = Set.of(
            "password123456789", "admin123456789", "hotel123456789",
            "qwertyuiop12345", "123456789012345", "contraseña12345678",
            "hotelcervera2026", "adminadmin123456", "123456789123456"
        );
        return commonPasswords.contains(password.toLowerCase());
    }

    private String maskEmail(String email) {
        String[] parts = email.split("@");
        if (parts.length < 2) return "***@***";
        if (parts[0].length() <= 3) return "***@" + parts[1];
        return parts[0].substring(0, 2) + "***@" + parts[1];
    }
}
