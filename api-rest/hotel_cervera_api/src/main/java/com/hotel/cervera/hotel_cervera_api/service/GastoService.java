package com.hotel.cervera.hotel_cervera_api.service;

import com.hotel.cervera.hotel_cervera_api.dto.request.GastoRequest;
import com.hotel.cervera.hotel_cervera_api.dto.response.GastoResponse;
import com.hotel.cervera.hotel_cervera_api.exception.ResourceNotFoundException;
import com.hotel.cervera.hotel_cervera_api.model.Gasto;
import com.hotel.cervera.hotel_cervera_api.model.Usuario;
import com.hotel.cervera.hotel_cervera_api.repository.GastoRepository;
import com.hotel.cervera.hotel_cervera_api.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class GastoService {

    private final GastoRepository gastoRepository;
    private final UsuarioRepository usuarioRepository;

    public List<GastoResponse> findAll() {
        return gastoRepository.findAll().stream().map(this::toResponse).toList();
    }

    public GastoResponse findById(UUID id) {
        return toResponse(gastoRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Gasto", id)));
    }

    @Transactional
    public GastoResponse create(GastoRequest request) {
        Usuario usuario = usuarioRepository.findById(request.getCreadoPor())
                .orElseThrow(() -> new ResourceNotFoundException("Usuario", request.getCreadoPor()));

        Gasto gasto = Gasto.builder()
                .fechaGasto(request.getFechaGasto())
                .descripcion(request.getDescripcion())
                .categoria(request.getCategoria())
                .monto(request.getMonto())
                .esFijo(request.getEsFijo() != null ? request.getEsFijo() : false)
                .creadoPor(usuario)
                .build();
        return toResponse(gastoRepository.save(gasto));
    }

    @Transactional
    public GastoResponse update(UUID id, GastoRequest request) {
        Gasto gasto = gastoRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Gasto", id));
        Usuario usuario = usuarioRepository.findById(request.getCreadoPor())
                .orElseThrow(() -> new ResourceNotFoundException("Usuario", request.getCreadoPor()));

        gasto.setFechaGasto(request.getFechaGasto());
        gasto.setDescripcion(request.getDescripcion());
        gasto.setCategoria(request.getCategoria());
        gasto.setMonto(request.getMonto());
        gasto.setEsFijo(request.getEsFijo() != null ? request.getEsFijo() : false);
        gasto.setCreadoPor(usuario);
        return toResponse(gastoRepository.save(gasto));
    }

    @Transactional
    public void delete(UUID id) {
        if (!gastoRepository.existsById(id)) {
            throw new ResourceNotFoundException("Gasto", id);
        }
        gastoRepository.deleteById(id);
    }

    public List<GastoResponse> findByPeriodo(LocalDate desde, LocalDate hasta) {
        return gastoRepository.findByFechaGastoBetweenOrderByFechaGastoAsc(desde, hasta)
                .stream().map(this::toResponse).toList();
    }

    public List<GastoResponse> findByCategoria(String categoria) {
        return gastoRepository.findByCategoria(categoria).stream().map(this::toResponse).toList();
    }

    public BigDecimal sumGastosByPeriodo(LocalDate desde, LocalDate hasta) {
        return gastoRepository.sumGastosByPeriodo(desde, hasta);
    }

    public Map<String, BigDecimal> sumByCategoriaEnPeriodo(LocalDate desde, LocalDate hasta) {
        Map<String, BigDecimal> result = new LinkedHashMap<>();
        for (Object[] row : gastoRepository.sumByCategoriaEnPeriodo(desde, hasta)) {
            result.put((String) row[0], (BigDecimal) row[1]);
        }
        return result;
    }

    private GastoResponse toResponse(Gasto entity) {
        return GastoResponse.builder()
                .id(entity.getId())
                .fechaGasto(entity.getFechaGasto())
                .descripcion(entity.getDescripcion())
                .categoria(entity.getCategoria())
                .monto(entity.getMonto())
                .esFijo(entity.getEsFijo())
                .creadoPor(entity.getCreadoPor().getId())
                .creadoPorNombre(entity.getCreadoPor().getNombres() + " " + entity.getCreadoPor().getApellidos())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }
}
