package com.hotel.cervera.hotel_cervera_api.service;

import com.hotel.cervera.hotel_cervera_api.dto.request.GastoRequest;
import com.hotel.cervera.hotel_cervera_api.dto.response.GastoResponse;
import com.hotel.cervera.hotel_cervera_api.exception.BusinessException;
import com.hotel.cervera.hotel_cervera_api.exception.ResourceNotFoundException;
import com.hotel.cervera.hotel_cervera_api.model.CategoriaGasto;
import com.hotel.cervera.hotel_cervera_api.model.Gasto;
import com.hotel.cervera.hotel_cervera_api.model.TipoGasto;
import com.hotel.cervera.hotel_cervera_api.model.Usuario;
import com.hotel.cervera.hotel_cervera_api.repository.CategoriaGastoRepository;
import com.hotel.cervera.hotel_cervera_api.repository.GastoRepository;
import com.hotel.cervera.hotel_cervera_api.repository.TipoGastoRepository;
import com.hotel.cervera.hotel_cervera_api.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class GastoService {

    private final GastoRepository gastoRepository;
    private final CategoriaGastoRepository categoriaRepository;
    private final TipoGastoRepository tipoRepository;
    private final UsuarioRepository usuarioRepository;

    public List<GastoResponse> findAll() {
        return gastoRepository.findAll().stream().map(this::toResponse).toList();
    }

    public GastoResponse findById(UUID id) {
        return toResponse(gastoRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Gasto", id)));
    }

    public List<CategoriaGasto> findAllCategorias() {
        return categoriaRepository.findByActivoTrueOrderByOrdenAsc();
    }

    public List<TipoGasto> findAllTipos() {
        return tipoRepository.findAll();
    }

    public List<GastoResponse> findConFiltros(LocalDate desde, LocalDate hasta, Long categoriaId, Long tipoGastoId) {
        return gastoRepository.findGastosConFiltros(desde, hasta, categoriaId, tipoGastoId)
                .stream().map(this::toResponse).toList();
    }

    @Transactional
    public GastoResponse create(GastoRequest request) {
        // R1: Validar monto positivo
        if (request.getMonto() == null || request.getMonto().compareTo(BigDecimal.ZERO) <= 0) {
            throw new BusinessException("El monto del gasto debe ser mayor a 0.");
        }

        // R2: Validar fecha no futura
        if (request.getFechaGasto() != null && request.getFechaGasto().isAfter(LocalDate.now())) {
            throw new BusinessException("La fecha del gasto no puede ser futura.");
        }

        CategoriaGasto categoria = categoriaRepository.findById(request.getCategoriaId())
                .orElseThrow(() -> new ResourceNotFoundException("Categoría no encontrada con id: " + request.getCategoriaId()));

        TipoGasto tipo = tipoRepository.findById(request.getTipoGastoId())
                .orElseThrow(() -> new ResourceNotFoundException("Tipo de gasto no encontrado con id: " + request.getTipoGastoId()));

        Usuario creador = usuarioRepository.findById(request.getCreadoPor())
                .orElseThrow(() -> new ResourceNotFoundException("Usuario no encontrado con id: " + request.getCreadoPor()));

        Gasto gasto = Gasto.builder()
                .fechaGasto(request.getFechaGasto())
                .descripcion(request.getDescripcion())
                .categoria(categoria)
                .tipoGasto(tipo)
                .monto(request.getMonto())
                .observaciones(request.getObservaciones())
                .estado("ACTIVO")
                .creadoPor(creador)
                .build();

        return toResponse(gastoRepository.save(gasto));
    }

    @Transactional
    public GastoResponse update(UUID id, GastoRequest request) {
        Gasto gasto = gastoRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Gasto", id));

        // R8: No se permite modificar gastos anulados
        if ("ANULADO".equals(gasto.getEstado())) {
            throw new BusinessException("No se puede modificar un gasto en estado ANULADO.");
        }

        // R1: Validar monto positivo
        if (request.getMonto() == null || request.getMonto().compareTo(BigDecimal.ZERO) <= 0) {
            throw new BusinessException("El monto del gasto debe ser mayor a 0.");
        }

        // R2: Validar fecha no futura
        if (request.getFechaGasto() != null && request.getFechaGasto().isAfter(LocalDate.now())) {
            throw new BusinessException("La fecha del gasto no puede ser futura.");
        }

        CategoriaGasto categoria = categoriaRepository.findById(request.getCategoriaId())
                .orElseThrow(() -> new ResourceNotFoundException("Categoría no encontrada con id: " + request.getCategoriaId()));

        TipoGasto tipo = tipoRepository.findById(request.getTipoGastoId())
                .orElseThrow(() -> new ResourceNotFoundException("Tipo de gasto no encontrado con id: " + request.getTipoGastoId()));

        Usuario modificador = usuarioRepository.findById(request.getCreadoPor())
                .orElseThrow(() -> new ResourceNotFoundException("Usuario no encontrado con id: " + request.getCreadoPor()));

        gasto.setFechaGasto(request.getFechaGasto());
        gasto.setDescripcion(request.getDescripcion());
        gasto.setCategoria(categoria);
        gasto.setTipoGasto(tipo);
        gasto.setMonto(request.getMonto());
        gasto.setObservaciones(request.getObservaciones());
        gasto.setActualizadoPor(modificador);

        return toResponse(gastoRepository.save(gasto));
    }

    @Transactional
    public void delete(UUID id) {
        Gasto gasto = gastoRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Gasto", id));
        gastoRepository.delete(gasto);
    }

    @Transactional
    public GastoResponse anularGasto(UUID id, String motivo, UUID usuarioId) {
        Gasto gasto = gastoRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Gasto", id));

        // R6: Solo se puede anular un gasto ACTIVO
        if (!"ACTIVO".equals(gasto.getEstado())) {
            throw new BusinessException("Solo se pueden anular gastos en estado ACTIVO.");
        }

        if (motivo == null || motivo.trim().isEmpty()) {
            throw new BusinessException("El motivo de anulación es obligatorio.");
        }

        Usuario anulador = usuarioRepository.findById(usuarioId)
                .orElseThrow(() -> new ResourceNotFoundException("Usuario no encontrado con id: " + usuarioId));

        gasto.setEstado("ANULADO");
        gasto.setFechaAnulacion(OffsetDateTime.now());
        gasto.setAnuladoPor(anulador);
        gasto.setMotivoAnulacion(motivo);
        gasto.setActualizadoPor(anulador);

        return toResponse(gastoRepository.save(gasto));
    }

    public BigDecimal sumGastosActivosByPeriodo(LocalDate desde, LocalDate hasta) {
        return gastoRepository.sumGastosActivosByPeriodo(desde, hasta);
    }

    public Map<String, BigDecimal> sumByCategoriaEnPeriodo(LocalDate desde, LocalDate hasta) {
        Map<String, BigDecimal> result = new LinkedHashMap<>();
        for (Object[] row : gastoRepository.sumByCategoriaEnPeriodo(desde, hasta)) {
            result.put((String) row[0], (BigDecimal) row[1]);
        }
        return result;
    }

    private GastoResponse toResponse(Gasto entity) {
        GastoResponse.GastoResponseBuilder builder = GastoResponse.builder()
                .id(entity.getId())
                .fechaGasto(entity.getFechaGasto())
                .descripcion(entity.getDescripcion())
                .categoriaId(entity.getCategoria().getId())
                .categoriaNombre(entity.getCategoria().getNombre())
                .tipoGastoId(entity.getTipoGasto().getId())
                .tipoGastoNombre(entity.getTipoGasto().getNombre())
                .monto(entity.getMonto())
                .observaciones(entity.getObservaciones())
                .estado(entity.getEstado())
                .creadoPor(entity.getCreadoPor().getId())
                .creadoPorNombre(entity.getCreadoPor().getNombres() + " " + entity.getCreadoPor().getApellidos())
                .fechaCreacion(entity.getFechaCreacion())
                .fechaActualizacion(entity.getFechaActualizacion());

        if (entity.getActualizadoPor() != null) {
            builder.actualizadoPor(entity.getActualizadoPor().getId())
                    .actualizadoPorNombre(entity.getActualizadoPor().getNombres() + " " + entity.getActualizadoPor().getApellidos());
        }

        if (entity.getFechaAnulacion() != null) {
            builder.fechaAnulacion(entity.getFechaAnulacion());
        }

        if (entity.getAnuladoPor() != null) {
            builder.anuladoPor(entity.getAnuladoPor().getId())
                    .anuladoPorNombre(entity.getAnuladoPor().getNombres() + " " + entity.getAnuladoPor().getApellidos());
        }

        if (entity.getMotivoAnulacion() != null) {
            builder.motivoAnulacion(entity.getMotivoAnulacion());
        }

        return builder.build();
    }
}
