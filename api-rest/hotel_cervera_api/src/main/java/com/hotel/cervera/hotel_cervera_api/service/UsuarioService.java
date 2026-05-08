package com.hotel.cervera.hotel_cervera_api.service;

import com.hotel.cervera.hotel_cervera_api.dto.request.UsuarioRequest;
import com.hotel.cervera.hotel_cervera_api.dto.request.UsuarioUpdateRequest;
import com.hotel.cervera.hotel_cervera_api.dto.response.UsuarioResponse;
import com.hotel.cervera.hotel_cervera_api.exception.BusinessException;
import com.hotel.cervera.hotel_cervera_api.exception.ResourceNotFoundException;
import com.hotel.cervera.hotel_cervera_api.model.Rol;
import com.hotel.cervera.hotel_cervera_api.model.Usuario;
import com.hotel.cervera.hotel_cervera_api.repository.RolRepository;
import com.hotel.cervera.hotel_cervera_api.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class UsuarioService {

    private final UsuarioRepository usuarioRepository;
    private final RolRepository rolRepository;
    private final PasswordEncoder passwordEncoder;

    public List<UsuarioResponse> findAll() {
        return usuarioRepository.findAllActive().stream().map(this::toResponse).toList();
    }

    public UsuarioResponse findById(UUID id) {
        return toResponse(usuarioRepository.findActiveById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Usuario", id)));
    }

    @Transactional
    public UsuarioResponse create(UsuarioRequest request) {
        if (usuarioRepository.existsByNombreUsuario(request.getNombreUsuario())) {
            throw new BusinessException("El nombre de usuario ya está en uso");
        }
        if (usuarioRepository.existsByEmail(request.getEmail())) {
            throw new BusinessException("El email ya está en uso");
        }

        Rol rol = rolRepository.findById(request.getRolId())
                .orElseThrow(() -> new ResourceNotFoundException("Rol", request.getRolId()));

        Usuario usuario = Usuario.builder()
                .nombreUsuario(request.getNombreUsuario())
                .email(request.getEmail())
                .contrasenaHash(passwordEncoder.encode(request.getContrasena()))
                .nombres(request.getNombres())
                .apellidos(request.getApellidos())
                .rol(rol)
                .estado("activo")
                .intentosFallidos(0)
                .build();

        return toResponse(usuarioRepository.save(usuario));
    }

    @Transactional
    public UsuarioResponse update(UUID id, UsuarioUpdateRequest request) {
        Usuario usuario = usuarioRepository.findActiveById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Usuario", id));

        if (request.getNombres() != null) usuario.setNombres(request.getNombres());
        if (request.getApellidos() != null) usuario.setApellidos(request.getApellidos());
        if (request.getEmail() != null) {
            if (!usuario.getEmail().equals(request.getEmail())
                    && usuarioRepository.existsByEmail(request.getEmail())) {
                throw new BusinessException("El email ya está en uso");
            }
            usuario.setEmail(request.getEmail());
        }
        if (request.getEstado() != null) usuario.setEstado(request.getEstado());

        return toResponse(usuarioRepository.save(usuario));
    }

    @Transactional
    public void softDelete(UUID id) {
        Usuario usuario = usuarioRepository.findActiveById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Usuario", id));
        usuario.setDeletedAt(OffsetDateTime.now());
        usuario.setEstado("suspendido");
        usuarioRepository.save(usuario);
    }

    @Transactional
    public void cambiarPassword(UUID id, String contrasenaActual, String nuevaContrasena) {
        Usuario usuario = usuarioRepository.findActiveById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Usuario", id));
        if (!passwordEncoder.matches(contrasenaActual, usuario.getContrasenaHash())) {
            throw new BusinessException("La contraseña actual no es correcta");
        }
        usuario.setContrasenaHash(passwordEncoder.encode(nuevaContrasena));
        usuarioRepository.save(usuario);
    }

    private UsuarioResponse toResponse(Usuario usuario) {
        return UsuarioResponse.builder()
                .id(usuario.getId())
                .nombreUsuario(usuario.getNombreUsuario())
                .email(usuario.getEmail())
                .nombres(usuario.getNombres())
                .apellidos(usuario.getApellidos())
                .rolId(usuario.getRol().getId())
                .rolNombre(usuario.getRol().getNombre())
                .estado(usuario.getEstado())
                .ultimoAcceso(usuario.getUltimoAcceso())
                .createdAt(usuario.getCreatedAt())
                .updatedAt(usuario.getUpdatedAt())
                .build();
    }
}
