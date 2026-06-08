package com.hotel.cervera.hotel_cervera_api.security;

import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .cors(cors -> {})
            .csrf(csrf -> csrf.disable())
            .sessionManagement(session ->
                session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                // Público
                .requestMatchers("/api/auth/**").permitAll()
                .requestMatchers("/swagger-ui/**", "/v3/api-docs/**", "/swagger-ui.html").hasRole("gerente")
                .requestMatchers("/actuator/**").hasRole("gerente")
                .requestMatchers(HttpMethod.GET, "/api/canales-venta/**").permitAll()

                // Limpieza - solo acceso a lo suyo
                .requestMatchers(HttpMethod.GET, "/api/limpiezas/**").hasAnyRole("gerente", "limpieza")
                .requestMatchers("/api/limpiezas/**").hasAnyRole("gerente", "limpieza")

                // Admin-only (gerente)
                .requestMatchers("/api/roles/**").hasRole("gerente")
                .requestMatchers(HttpMethod.GET, "/api/precios-historicos/**").authenticated()
                .requestMatchers("/api/precios-historicos/**").hasRole("gerente")
                .requestMatchers("/api/usuarios/**").hasRole("gerente")
                .requestMatchers("/api/gastos/**").hasRole("gerente")
                .requestMatchers("/api/reportes/**").hasRole("gerente")
                .requestMatchers(HttpMethod.POST, "/api/habitaciones").hasRole("gerente")
                .requestMatchers(HttpMethod.PUT, "/api/habitaciones/**").hasRole("gerente")
                .requestMatchers(HttpMethod.DELETE, "/api/habitaciones/**").hasRole("gerente")
                .requestMatchers(HttpMethod.DELETE, "/api/clientes/**").hasRole("gerente")
                .requestMatchers(HttpMethod.DELETE, "/api/reservas/**").hasRole("gerente")

                // Cualquier autenticado
                .anyRequest().authenticated()
            )
            .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationManager authenticationManager(
            AuthenticationConfiguration authenticationConfiguration) throws Exception {
        return authenticationConfiguration.getAuthenticationManager();
    }
}
