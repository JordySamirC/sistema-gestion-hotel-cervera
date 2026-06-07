package com.hotel.cervera.hotel_cervera_api.service;

import com.hotel.cervera.hotel_cervera_api.dto.request.TipoHabitacionRequest;
import com.hotel.cervera.hotel_cervera_api.dto.response.TipoHabitacionResponse;
import com.hotel.cervera.hotel_cervera_api.exception.BusinessException;
import com.hotel.cervera.hotel_cervera_api.exception.ResourceNotFoundException;
import com.hotel.cervera.hotel_cervera_api.model.TipoHabitacion;
import com.hotel.cervera.hotel_cervera_api.repository.TipoHabitacionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class TipoHabitacionService {

    private final TipoHabitacionRepository repository;

    public List<TipoHabitacionResponse> findAll() {
        return repository.findAll().stream().map(this::toResponse).toList();
    }

    public TipoHabitacionResponse findById(UUID id) {
        return toResponse(repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Tipo de habitación", id)));
    }

    @Transactional
    public TipoHabitacionResponse create(TipoHabitacionRequest request) {
        if (repository.existsByNombre(request.getNombre())) {
            throw new BusinessException("Ya existe un tipo con el nombre: " + request.getNombre());
        }
        TipoHabitacion entity = TipoHabitacion.builder()
                .nombre(request.getNombre())
                .capacidadMax(request.getCapacidadMax())
                .configuracionCamas(request.getConfiguracionCamas())
                .descripcion(request.getDescripcion())
                .build();
        return toResponse(repository.save(entity));
    }

    @Transactional
    public TipoHabitacionResponse update(UUID id, TipoHabitacionRequest request) {
        TipoHabitacion entity = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Tipo de habitación", id));
        if (!entity.getNombre().equals(request.getNombre())
                && repository.existsByNombre(request.getNombre())) {
            throw new BusinessException("Ya existe un tipo con el nombre: " + request.getNombre());
        }
        entity.setNombre(request.getNombre());
        entity.setCapacidadMax(request.getCapacidadMax());
        entity.setConfiguracionCamas(request.getConfiguracionCamas());
        entity.setDescripcion(request.getDescripcion());
        return toResponse(repository.save(entity));
    }

    @Transactional
    public void delete(UUID id) {
        if (!repository.existsById(id)) {
            throw new ResourceNotFoundException("Tipo de habitación", id);
        }
        repository.deleteById(id);
    }

    private TipoHabitacionResponse toResponse(TipoHabitacion entity) {
        return TipoHabitacionResponse.builder()
                .id(entity.getId())
                .nombre(entity.getNombre())
                .capacidadMax(entity.getCapacidadMax())
                .configuracionCamas(entity.getConfiguracionCamas())
                .descripcion(entity.getDescripcion())
                .fechaCreacion(entity.getFechaCreacion())
                .fechaActualizacion(entity.getFechaActualizacion())
                .build();
    }
}
