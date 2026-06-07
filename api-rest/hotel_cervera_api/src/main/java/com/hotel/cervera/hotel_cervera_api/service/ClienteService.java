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
import java.util.Map;
import java.util.Set;
import java.util.UUID;

import static java.util.Map.entry;

@Service
public class ClienteService {

    private final ClienteRepository repository;
    private final PhoneValidationService phoneValidationService;

    private static final Map<String, String> NACIONALIDAD_A_ISO = Map.ofEntries(
        entry("Peruana", "PE"), entry("Argentina", "AR"), entry("Boliviana", "BO"),
        entry("Brasileña", "BR"), entry("Canadiense", "CA"), entry("Chilena", "CL"),
        entry("Colombiana", "CO"), entry("Costarricense", "CR"), entry("Cubana", "CU"),
        entry("Dominicana", "DO"), entry("Ecuatoriana", "EC"), entry("Estadounidense", "US"),
        entry("Francesa", "FR"), entry("Guatemalteca", "GT"), entry("Haitiana", "HT"),
        entry("Hondureña", "HN"), entry("Italiana", "IT"), entry("Japonesa", "JP"),
        entry("Mexicana", "MX"), entry("Nicaragüense", "NI"), entry("Panameña", "PA"),
        entry("Paraguaya", "PY"), entry("Portuguesa", "PT"), entry("Puertorriqueña", "PR"),
        entry("Salvadoreña", "SV"), entry("Española", "ES"), entry("Uruguaya", "UY"),
        entry("Venezolana", "VE"), entry("Alemana", "DE"), entry("Británica", "GB"),
        entry("China", "CN"), entry("Coreana", "KR"), entry("India", "IN"),
        entry("Rusa", "RU"), entry("Sudafricana", "ZA")
    );

    public ClienteService(ClienteRepository repository, PhoneValidationService phoneValidationService) {
        this.repository = repository;
        this.phoneValidationService = phoneValidationService;
    }

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

    public List<ClienteResponse> buscarPorTermino(String termino) {
        return repository.buscarPorTermino(termino).stream()
                .limit(20)
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public ClienteResponse create(ClienteRequest request) {
        if (repository.existsByTipoDocumentoAndNumeroDocumento(
                request.getTipoDocumento(), request.getNumeroDocumento())) {
            throw new BusinessException("Ya existe un cliente con ese tipo y número de documento");
        }
        String iso = NACIONALIDAD_A_ISO.get(request.getNacionalidad());
        String telefonoNormalizado = phoneValidationService.normalizeToE164(request.getTelefono(), iso);
        request.setTelefono(telefonoNormalizado);
        Cliente entity = Cliente.builder()
                .tipoDocumento(request.getTipoDocumento())
                .numeroDocumento(request.getNumeroDocumento())
                .nombres(request.getNombres())
                .apellidos(request.getApellidos())
                .nacionalidad(request.getNacionalidad())
                .genero(request.getGenero())
                .telefono(request.getTelefono())
                .correoElectronico(request.getCorreoElectronico())
                .fechaNacimiento(request.getFechaNacimiento())
                .vecesHospedado(0)
                .estado("ACTIVO")
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

        String iso = NACIONALIDAD_A_ISO.get(request.getNacionalidad());
        String telefonoNormalizado = phoneValidationService.normalizeToE164(request.getTelefono(), iso);
        request.setTelefono(telefonoNormalizado);

        entity.setTipoDocumento(request.getTipoDocumento());
        entity.setNumeroDocumento(request.getNumeroDocumento());
        entity.setNombres(request.getNombres());
        entity.setApellidos(request.getApellidos());
        entity.setNacionalidad(request.getNacionalidad());
        entity.setGenero(request.getGenero());
        entity.setTelefono(request.getTelefono());
        entity.setCorreoElectronico(request.getCorreoElectronico());
        entity.setFechaNacimiento(request.getFechaNacimiento());
        return toResponse(repository.save(entity));
    }

    @Transactional
    public ClienteResponse cambiarEstado(UUID id, String nuevoEstado) {
        Cliente entity = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Cliente", id));
        Set<String> estadosValidos = Set.of("ACTIVO", "SUSPENDIDO", "VETADO");
        if (!estadosValidos.contains(nuevoEstado.toUpperCase())) {
            throw new BusinessException("Estado inválido. Use: ACTIVO, SUSPENDIDO o VETADO");
        }
        entity.setEstado(nuevoEstado.toUpperCase());
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
                .genero(entity.getGenero())
                .estado(entity.getEstado())
                .telefono(entity.getTelefono())
                .correoElectronico(entity.getCorreoElectronico())
                .fechaNacimiento(entity.getFechaNacimiento())
                .vecesHospedado(entity.getVecesHospedado())
                .fechaCreacion(entity.getFechaCreacion())
                .fechaActualizacion(entity.getFechaActualizacion())
                .build();
    }
}
