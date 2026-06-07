package com.hotel.cervera.hotel_cervera_api.security;

import com.hotel.cervera.hotel_cervera_api.model.Usuario;
import com.hotel.cervera.hotel_cervera_api.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class CustomUserDetailsService implements UserDetailsService {

    private final UsuarioRepository usuarioRepository;

    @Override
    @Transactional(readOnly = true)
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        UUID userId;
        try {
            userId = UUID.fromString(username);
        } catch (IllegalArgumentException e) {
            throw new UsernameNotFoundException("ID de usuario inválido: " + username);
        }

        Usuario usuario = usuarioRepository.findActiveById(userId)
                .orElseThrow(() -> new UsernameNotFoundException("Usuario no encontrado: " + username));

        // Mapeo inteligente y flexible de roles para Spring Security
        List<SimpleGrantedAuthority> authorities = new ArrayList<>();
        String roleName = usuario.getRol().getNombre();
        
        // 1. Agregar rol original (ej. "Gerente")
        authorities.add(new SimpleGrantedAuthority("ROLE_" + roleName));
        // 2. Agregar rol original en minúsculas (ej. "gerente")
        authorities.add(new SimpleGrantedAuthority("ROLE_" + roleName.toLowerCase()));

        // 3. Mapeo específico e inteligente de roles a los requeridos por SecurityConfig
        if (roleName.equalsIgnoreCase("Gerente")) {
            authorities.add(new SimpleGrantedAuthority("ROLE_gerente"));
        } else if (roleName.equalsIgnoreCase("Asistente de Habitaciones") || roleName.equalsIgnoreCase("limpieza")) {
            authorities.add(new SimpleGrantedAuthority("ROLE_limpieza"));
        }

        return new User(
                usuario.getId().toString(),
                usuario.getContrasenaHash(),
                usuario.getEstado().equals("activo"),
                true, true, true,
                authorities
        );
    }
}
