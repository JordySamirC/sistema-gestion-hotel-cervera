package com.hotel.cervera.hotel_cervera_api.service;

import com.hotel.cervera.hotel_cervera_api.dto.request.HabitacionRequest;
import com.hotel.cervera.hotel_cervera_api.dto.response.HabitacionResponse;
import com.hotel.cervera.hotel_cervera_api.exception.BusinessException;
import com.hotel.cervera.hotel_cervera_api.exception.ResourceNotFoundException;
import com.hotel.cervera.hotel_cervera_api.model.Habitacion;
import com.hotel.cervera.hotel_cervera_api.model.TipoHabitacion;
import com.hotel.cervera.hotel_cervera_api.repository.HabitacionRepository;
import com.hotel.cervera.hotel_cervera_api.repository.TipoHabitacionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Set;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class HabitacionService {

    private final HabitacionRepository habitacionRepository;
    private final TipoHabitacionRepository tipoHabitacionRepository;

    public List<HabitacionResponse> findAll() {
        return habitacionRepository.findAll().stream().map(this::toResponse).toList();
    }

    public HabitacionResponse findById(UUID id) {
        return toResponse(habitacionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Habitación", id)));
    }

    public List<HabitacionResponse> findByPiso(Integer piso) {
        return habitacionRepository.findByPiso(piso).stream().map(this::toResponse).toList();
    }

    public List<HabitacionResponse> findByEstado(String estado) {
        return habitacionRepository.findByEstadoActual(estado).stream().map(this::toResponse).toList();
    }

    public List<HabitacionResponse> findDisponiblesEnRango(java.time.LocalDate fechaIngreso,
                                                            java.time.LocalDate fechaSalida) {
        return habitacionRepository.findDisponiblesEnRango(fechaIngreso, fechaSalida)
                .stream().map(this::toResponse).toList();
    }

    @Transactional
    public HabitacionResponse create(HabitacionRequest request) {
        if (habitacionRepository.existsByNumero(request.getNumero())) {
            throw new BusinessException("Ya existe una habitación con el número: " + request.getNumero());
        }
        TipoHabitacion tipo = tipoHabitacionRepository.findById(request.getTipoId())
                .orElseThrow(() -> new ResourceNotFoundException("Tipo de habitación", request.getTipoId()));

        Habitacion entity = Habitacion.builder()
                .numero(request.getNumero())
                .piso(request.getPiso())
                .tipo(tipo)
                .estadoActual("disponible")
                .notas(request.getNotas())
                .build();
        return toResponse(habitacionRepository.save(entity));
    }

    @Transactional
    public HabitacionResponse update(UUID id, HabitacionRequest request) {
        Habitacion entity = habitacionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Habitación", id));
        if (!entity.getNumero().equals(request.getNumero())
                && habitacionRepository.existsByNumero(request.getNumero())) {
            throw new BusinessException("Ya existe una habitación con el número: " + request.getNumero());
        }
        TipoHabitacion tipo = tipoHabitacionRepository.findById(request.getTipoId())
                .orElseThrow(() -> new ResourceNotFoundException("Tipo de habitación", request.getTipoId()));

        entity.setNumero(request.getNumero());
        entity.setPiso(request.getPiso());
        entity.setTipo(tipo);
        entity.setNotas(request.getNotas());
        return toResponse(habitacionRepository.save(entity));
    }

    @Transactional
    public HabitacionResponse cambiarEstado(UUID id, String nuevoEstado) {
        Set<String> estadosValidos = Set.of("disponible", "ocupada", "por_limpiar",
                "en_limpieza", "mantenimiento", "remodelacion", "inabitable");
        if (!estadosValidos.contains(nuevoEstado)) {
            throw new BusinessException("Estado inválido: " + nuevoEstado);
        }
        Habitacion entity = habitacionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Habitación", id));
        entity.setEstadoActual(nuevoEstado);
        return toResponse(habitacionRepository.save(entity));
    }

    @Transactional
    public void delete(UUID id) {
        if (!habitacionRepository.existsById(id)) {
            throw new ResourceNotFoundException("Habitación", id);
        }
        habitacionRepository.deleteById(id);
    }

    private HabitacionResponse toResponse(Habitacion entity) {
        return HabitacionResponse.builder()
                .id(entity.getId())
                .numero(entity.getNumero())
                .piso(entity.getPiso())
                .tipoId(entity.getTipo().getId())
                .tipoNombre(entity.getTipo().getNombre())
                .capacidadMax(entity.getTipo().getCapacidadMax())
                .estadoActual(entity.getEstadoActual())
                .notas(entity.getNotas())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }
}
