package com.hotel.cervera.hotel_cervera_api.service;

import com.hotel.cervera.hotel_cervera_api.dto.request.IniciarLimpiezaRequest;
import com.hotel.cervera.hotel_cervera_api.dto.response.LimpiezaResponse;
import com.hotel.cervera.hotel_cervera_api.exception.BusinessException;
import com.hotel.cervera.hotel_cervera_api.exception.ResourceNotFoundException;
import com.hotel.cervera.hotel_cervera_api.model.Habitacion;
import com.hotel.cervera.hotel_cervera_api.model.Limpieza;
import com.hotel.cervera.hotel_cervera_api.model.Usuario;
import com.hotel.cervera.hotel_cervera_api.repository.HabitacionRepository;
import com.hotel.cervera.hotel_cervera_api.repository.LimpiezaRepository;
import com.hotel.cervera.hotel_cervera_api.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class LimpiezaService {

    private final LimpiezaRepository limpiezaRepository;
    private final HabitacionRepository habitacionRepository;
    private final UsuarioRepository usuarioRepository;

    public List<LimpiezaResponse> findAll() {
        return limpiezaRepository.findAll().stream().map(this::toResponse).toList();
    }

    public LimpiezaResponse findById(UUID id) {
        return toResponse(limpiezaRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Limpieza", id)));
    }

    public List<LimpiezaResponse> findActivas() {
        return limpiezaRepository.findActivas().stream().map(this::toResponse).toList();
    }

    public List<LimpiezaResponse> findByHabitacion(UUID habitacionId) {
        return limpiezaRepository.findByHabitacionIdOrderByFechaInicioDesc(habitacionId)
                .stream().map(this::toResponse).toList();
    }

    public List<LimpiezaResponse> findByUsuario(UUID usuarioId) {
        return limpiezaRepository.findByUsuarioIdOrderByFechaInicioDesc(usuarioId)
                .stream().map(this::toResponse).toList();
    }

    @Transactional
    public LimpiezaResponse iniciar(IniciarLimpiezaRequest request) {
        Habitacion habitacion = habitacionRepository.findById(request.getHabitacionId())
                .orElseThrow(() -> new ResourceNotFoundException("Habitación", request.getHabitacionId()));

        if (!"Por limpiar".equals(habitacion.getEstadoActual())) {
            throw new BusinessException(
                    "La habitación debe estar en estado 'Por limpiar'. Estado actual: "
                            + habitacion.getEstadoActual());
        }

        Usuario usuario = usuarioRepository.findActiveById(request.getUsuarioId())
                .orElseThrow(() -> new ResourceNotFoundException("Usuario", request.getUsuarioId()));

        if (limpiezaRepository.findActivaByUsuarioId(request.getUsuarioId()).isPresent()) {
            throw new BusinessException("El trabajador ya tiene una limpieza activa");
        }

        Limpieza limpieza = Limpieza.builder()
                .habitacion(habitacion)
                .usuario(usuario)
                .fechaInicio(OffsetDateTime.now())
                .build();
        limpieza = limpiezaRepository.save(limpieza);

        habitacion.setEstadoActual("En limpieza");
        habitacionRepository.save(habitacion);

        return toResponse(limpieza);
    }

    @Transactional
    public LimpiezaResponse terminar(UUID limpiezaId) {
        Limpieza limpieza = limpiezaRepository.findById(limpiezaId)
                .orElseThrow(() -> new ResourceNotFoundException("Limpieza", limpiezaId));

        if (limpieza.getFechaFin() != null) {
            throw new BusinessException("La limpieza ya fue finalizada");
        }

        limpieza.setFechaFin(OffsetDateTime.now());

        Duration duracion = Duration.between(limpieza.getFechaInicio(), limpieza.getFechaFin());
        limpieza.setDuracionSegundos((int) duracion.getSeconds());
        limpieza = limpiezaRepository.save(limpieza);

        Habitacion habitacion = limpieza.getHabitacion();
        habitacion.setEstadoActual("Disponible");
        habitacionRepository.save(habitacion);

        return toResponse(limpieza);
    }

    public Double promedioDuracion() {
        return limpiezaRepository.promedioDuracionGlobal();
    }

    public Double promedioDuracionByUsuario(UUID usuarioId) {
        return limpiezaRepository.promedioDuracionByUsuarioId(usuarioId);
    }

    private LimpiezaResponse toResponse(Limpieza entity) {
        return LimpiezaResponse.builder()
                .id(entity.getId())
                .habitacionId(entity.getHabitacion().getId())
                .habitacionNumero(entity.getHabitacion().getNumero())
                .usuarioId(entity.getUsuario().getId())
                .usuarioNombre(entity.getUsuario().getNombres() + " " + entity.getUsuario().getApellidos())
                .fechaInicio(entity.getFechaInicio())
                .fechaFin(entity.getFechaFin())
                .duracionSegundos(entity.getDuracionSegundos())
                .fechaCreacion(entity.getFechaCreacion())
                .build();
    }
}
