package com.hotel.cervera.hotel_cervera_api.service;

import com.hotel.cervera.hotel_cervera_api.dto.request.ClienteRequest;
import com.hotel.cervera.hotel_cervera_api.dto.response.ClienteResponse;
import com.hotel.cervera.hotel_cervera_api.exception.BusinessException;
import com.hotel.cervera.hotel_cervera_api.exception.ResourceNotFoundException;
import com.hotel.cervera.hotel_cervera_api.model.Cliente;
import com.hotel.cervera.hotel_cervera_api.repository.ClienteRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Set;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ClienteService {

    private final ClienteRepository repository;

    public List<ClienteResponse> findAll() {
        return repository.findAll().stream().map(this::toResponse).toList();
    }

    public ClienteResponse findById(UUID id) {
        return toResponse(repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Cliente", id)));
    }

    public ClienteResponse buscarPorDocumento(String tipoDocumento, String numeroDocumento) {
        return toResponse(repository.findByTipoDocumentoAndNumeroDocumento(tipoDocumento, numeroDocumento)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Cliente", "documento", tipoDocumento + "-" + numeroDocumento)));
    }

    @Transactional
    public ClienteResponse create(ClienteRequest request) {
        Set<String> tiposValidos = Set.of("DNI", "PAS", "RUC");
        if (!tiposValidos.contains(request.getTipoDocumento())) {
            throw new BusinessException("Tipo de documento inválido. Use: DNI, PAS o RUC");
        }
        if (repository.existsByTipoDocumentoAndNumeroDocumento(
                request.getTipoDocumento(), request.getNumeroDocumento())) {
            throw new BusinessException("Ya existe un cliente con ese tipo y número de documento");
        }
        Cliente entity = Cliente.builder()
                .tipoDocumento(request.getTipoDocumento())
                .numeroDocumento(request.getNumeroDocumento())
                .nombres(request.getNombres())
                .apellidos(request.getApellidos())
                .nacionalidad(request.getNacionalidad())
                .telefono(request.getTelefono())
                .email(request.getEmail())
                .vecesHospedado(0)
                .build();
        return toResponse(repository.save(entity));
    }

    @Transactional
    public ClienteResponse update(UUID id, ClienteRequest request) {
        Cliente entity = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Cliente", id));

        boolean docChanged = !entity.getTipoDocumento().equals(request.getTipoDocumento())
                || !entity.getNumeroDocumento().equals(request.getNumeroDocumento());
        if (docChanged && repository.existsByTipoDocumentoAndNumeroDocumento(
                request.getTipoDocumento(), request.getNumeroDocumento())) {
            throw new BusinessException("Ya existe un cliente con ese tipo y número de documento");
        }

        entity.setTipoDocumento(request.getTipoDocumento());
        entity.setNumeroDocumento(request.getNumeroDocumento());
        entity.setNombres(request.getNombres());
        entity.setApellidos(request.getApellidos());
        entity.setNacionalidad(request.getNacionalidad());
        entity.setTelefono(request.getTelefono());
        entity.setEmail(request.getEmail());
        return toResponse(repository.save(entity));
    }

    @Transactional
    public void delete(UUID id) {
        if (!repository.existsById(id)) {
            throw new ResourceNotFoundException("Cliente", id);
        }
        repository.deleteById(id);
    }

    private ClienteResponse toResponse(Cliente entity) {
        return ClienteResponse.builder()
                .id(entity.getId())
                .tipoDocumento(entity.getTipoDocumento())
                .numeroDocumento(entity.getNumeroDocumento())
                .nombres(entity.getNombres())
                .apellidos(entity.getApellidos())
                .nacionalidad(entity.getNacionalidad())
                .telefono(entity.getTelefono())
                .email(entity.getEmail())
                .vecesHospedado(entity.getVecesHospedado())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }
}
