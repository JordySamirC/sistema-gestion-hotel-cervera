package com.hotel.cervera.hotel_cervera_api.service;

import com.hotel.cervera.hotel_cervera_api.dto.request.RolRequest;
import com.hotel.cervera.hotel_cervera_api.dto.response.RolResponse;
import com.hotel.cervera.hotel_cervera_api.exception.BusinessException;
import com.hotel.cervera.hotel_cervera_api.exception.ResourceNotFoundException;
import com.hotel.cervera.hotel_cervera_api.model.Rol;
import com.hotel.cervera.hotel_cervera_api.repository.RolRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class RolService {

    private final RolRepository rolRepository;

    public List<RolResponse> findAll() {
        return rolRepository.findAll().stream().map(this::toResponse).toList();
    }

    public RolResponse findById(UUID id) {
        return toResponse(rolRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Rol", id)));
    }

    @Transactional
    public RolResponse create(RolRequest request) {
        if (rolRepository.existsByNombre(request.getNombre())) {
            throw new BusinessException("Ya existe un rol con el nombre: " + request.getNombre());
        }
        Rol rol = Rol.builder()
                .nombre(request.getNombre())
                .descripcion(request.getDescripcion())
                .build();
        return toResponse(rolRepository.save(rol));
    }

    @Transactional
    public RolResponse update(UUID id, RolRequest request) {
        Rol rol = rolRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Rol", id));
        if (!rol.getNombre().equals(request.getNombre())
                && rolRepository.existsByNombre(request.getNombre())) {
            throw new BusinessException("Ya existe un rol con el nombre: " + request.getNombre());
        }
        rol.setNombre(request.getNombre());
        rol.setDescripcion(request.getDescripcion());
        return toResponse(rolRepository.save(rol));
    }

    @Transactional
    public void delete(UUID id) {
        if (!rolRepository.existsById(id)) {
            throw new ResourceNotFoundException("Rol", id);
        }
        rolRepository.deleteById(id);
    }

    private RolResponse toResponse(Rol rol) {
        return RolResponse.builder()
                .id(rol.getId())
                .nombre(rol.getNombre())
                .descripcion(rol.getDescripcion())
                .fechaCreacion(rol.getFechaCreacion())
                .fechaActualizacion(rol.getFechaActualizacion())
                .build();
    }
}
