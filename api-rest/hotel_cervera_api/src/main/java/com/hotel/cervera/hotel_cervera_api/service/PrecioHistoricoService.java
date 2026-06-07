package com.hotel.cervera.hotel_cervera_api.service;

import com.hotel.cervera.hotel_cervera_api.dto.request.PrecioHistoricoRequest;
import com.hotel.cervera.hotel_cervera_api.dto.response.PrecioHistoricoResponse;
import com.hotel.cervera.hotel_cervera_api.exception.BusinessException;
import com.hotel.cervera.hotel_cervera_api.exception.ResourceNotFoundException;
import com.hotel.cervera.hotel_cervera_api.model.PrecioHistorico;
import com.hotel.cervera.hotel_cervera_api.model.TipoHabitacion;
import com.hotel.cervera.hotel_cervera_api.model.Usuario;
import com.hotel.cervera.hotel_cervera_api.repository.PrecioHistoricoRepository;
import com.hotel.cervera.hotel_cervera_api.repository.TipoHabitacionRepository;
import com.hotel.cervera.hotel_cervera_api.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class PrecioHistoricoService {

    private final PrecioHistoricoRepository repository;
    private final TipoHabitacionRepository tipoHabitacionRepository;
    private final UsuarioRepository usuarioRepository;

    public List<PrecioHistoricoResponse> findAll() {
        return repository.findAll().stream().map(this::toResponse).toList();
    }

    public PrecioHistoricoResponse findById(UUID id) {
        return toResponse(repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Precio histórico", id)));
    }

    public List<PrecioHistoricoResponse> findByTipoHabitacion(UUID tipoHabitacionId) {
        return repository.findByTipoHabitacionIdOrderByFechaInicioDesc(tipoHabitacionId)
                .stream().map(this::toResponse).toList();
    }

    public BigDecimal findPrecioVigente(UUID tipoHabitacionId, LocalDate fecha) {
        return repository.findPrecioVigenteValue(tipoHabitacionId, fecha)
                .orElseThrow(() -> new BusinessException(
                        "No hay precio vigente para el tipo de habitación en la fecha " + fecha));
    }

    @Transactional
    public PrecioHistoricoResponse create(PrecioHistoricoRequest request) {
        if (request.getFechaFin() != null && request.getFechaFin().isBefore(request.getFechaInicio())) {
            throw new BusinessException("La fecha fin no puede ser anterior a la fecha inicio");
        }

        TipoHabitacion tipo = tipoHabitacionRepository.findById(request.getTipoHabitacionId())
                .orElseThrow(() -> new ResourceNotFoundException("Tipo de habitación", request.getTipoHabitacionId()));
        Usuario usuario = usuarioRepository.findById(request.getCreadoPor())
                .orElseThrow(() -> new ResourceNotFoundException("Usuario", request.getCreadoPor()));

        repository.findPrecioVigente(request.getTipoHabitacionId(), request.getFechaInicio().minusDays(1))
                .ifPresent(previo -> {
                    previo.setFechaFin(request.getFechaInicio().minusDays(1));
                    repository.save(previo);
                });

        PrecioHistorico entity = PrecioHistorico.builder()
                .tipoHabitacion(tipo)
                .precioNoche(request.getPrecioNoche())
                .fechaInicio(request.getFechaInicio())
                .fechaFin(request.getFechaFin())
                .creadoPor(usuario)
                .build();
        return toResponse(repository.save(entity));
    }

    @Transactional
    public PrecioHistoricoResponse update(UUID id, PrecioHistoricoRequest request) {
        PrecioHistorico entity = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Precio histórico", id));

        if (request.getFechaFin() != null && request.getFechaFin().isBefore(request.getFechaInicio())) {
            throw new BusinessException("La fecha fin no puede ser anterior a la fecha inicio");
        }

        TipoHabitacion tipo = tipoHabitacionRepository.findById(request.getTipoHabitacionId())
                .orElseThrow(() -> new ResourceNotFoundException("Tipo de habitación", request.getTipoHabitacionId()));
        Usuario usuario = usuarioRepository.findById(request.getCreadoPor())
                .orElseThrow(() -> new ResourceNotFoundException("Usuario", request.getCreadoPor()));

        entity.setTipoHabitacion(tipo);
        entity.setPrecioNoche(request.getPrecioNoche());
        entity.setFechaInicio(request.getFechaInicio());
        entity.setFechaFin(request.getFechaFin());
        entity.setCreadoPor(usuario);
        return toResponse(repository.save(entity));
    }

    @Transactional
    public void delete(UUID id) {
        if (!repository.existsById(id)) {
            throw new ResourceNotFoundException("Precio histórico", id);
        }
        repository.deleteById(id);
    }

    private PrecioHistoricoResponse toResponse(PrecioHistorico entity) {
        return PrecioHistoricoResponse.builder()
                .id(entity.getId())
                .tipoHabitacionId(entity.getTipoHabitacion().getId())
                .tipoHabitacionNombre(entity.getTipoHabitacion().getNombre())
                .precioNoche(entity.getPrecioNoche())
                .fechaInicio(entity.getFechaInicio())
                .fechaFin(entity.getFechaFin())
                .fechaCreacion(entity.getFechaCreacion())
                .creadoPor(entity.getCreadoPor() != null ? entity.getCreadoPor().getId() : null)
                .build();
    }
}
