package com.hotel.cervera.hotel_cervera_api.service;

import com.hotel.cervera.hotel_cervera_api.dto.LoginRequest;
import com.hotel.cervera.hotel_cervera_api.dto.LoginResponse;
import com.hotel.cervera.hotel_cervera_api.exception.BusinessException;
import com.hotel.cervera.hotel_cervera_api.exception.UnauthorizedException;
import com.hotel.cervera.hotel_cervera_api.model.Usuario;
import com.hotel.cervera.hotel_cervera_api.repository.UsuarioRepository;
import com.hotel.cervera.hotel_cervera_api.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    @Transactional
    public LoginResponse login(LoginRequest request) {
        Usuario usuario = usuarioRepository.findActiveByCorreoElectronico(request.getCorreoElectronico())
                .orElseThrow(() -> new UnauthorizedException("Credenciales inválidas"));

        if (!"activo".equals(usuario.getEstado())) {
            throw new BusinessException("Cuenta bloqueada o suspendida. Contacte al administrador.");
        }

        if (!passwordEncoder.matches(request.getContrasena(), usuario.getContrasenaHash())) {
            usuario.setIntentosFallidos(usuario.getIntentosFallidos() != null
                    ? usuario.getIntentosFallidos() + 1 : 1);
            if (usuario.getIntentosFallidos() >= 5) {
                usuario.setEstado("bloqueado");
                usuario.setBloqueadoHasta(OffsetDateTime.now().plusMinutes(15));
            }
            usuarioRepository.save(usuario);
            throw new UnauthorizedException("Credenciales inválidas");
        }

        usuario.setIntentosFallidos(0);
        usuario.setUltimoAcceso(OffsetDateTime.now());
        usuarioRepository.save(usuario);

        String token = jwtUtil.generateToken(
                usuario.getId(),
                usuario.getCorreoElectronico(),
                usuario.getRol().getNombre()
        );

        return LoginResponse.builder()
                .token(token)
                .tipo("Bearer")
                .id(usuario.getId())
                .nombreUsuario(usuario.getNombreUsuario())
                .correoElectronico(usuario.getCorreoElectronico())
                .nombres(usuario.getNombres())
                .apellidos(usuario.getApellidos())
                .rol(usuario.getRol().getNombre())
                .rolId(usuario.getRol().getId())
                .build();
    }
}
