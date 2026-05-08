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

import java.util.Collections;
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

        return new User(
                usuario.getId().toString(),
                usuario.getContrasenaHash(),
                usuario.getEstado().equals("activo"),
                true, true, true,
                Collections.singletonList(
                        new SimpleGrantedAuthority("ROLE_" + usuario.getRol().getNombre())
                )
        );
    }
}
