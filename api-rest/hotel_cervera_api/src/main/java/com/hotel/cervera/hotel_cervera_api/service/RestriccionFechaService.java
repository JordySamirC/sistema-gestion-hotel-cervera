package com.hotel.cervera.hotel_cervera_api.service;

import com.hotel.cervera.hotel_cervera_api.dto.response.RestriccionFechaResponse;
import com.hotel.cervera.hotel_cervera_api.exception.BusinessException;
import com.hotel.cervera.hotel_cervera_api.exception.ResourceNotFoundException;
import com.hotel.cervera.hotel_cervera_api.model.RestriccionFecha;
import com.hotel.cervera.hotel_cervera_api.repository.RestriccionFechaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.Arrays;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class RestriccionFechaService {

    private final RestriccionFechaRepository repository;

    public List<RestriccionFechaResponse> findAll() {
        return repository.findByActivoTrue().stream().map(this::toResponse).toList();
    }

    public RestriccionFechaResponse findById(UUID id) {
        return toResponse(repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("RestriccionFecha", id)));
    }

    public RestriccionFechaResponse create(RestriccionFecha entity) {
        if (entity.getFechaFin() != null && entity.getFechaFin().isBefore(entity.getFechaInicio())) {
            throw new BusinessException("La fecha fin no puede ser anterior a la fecha inicio");
        }
        return toResponse(repository.save(entity));
    }

    public RestriccionFechaResponse update(UUID id, RestriccionFecha entity) {
        RestriccionFecha existing = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("RestriccionFecha", id));
        existing.setTipo(entity.getTipo());
        existing.setFechaInicio(entity.getFechaInicio());
        existing.setFechaFin(entity.getFechaFin());
        existing.setMinLos(entity.getMinLos());
        existing.setMaxLos(entity.getMaxLos());
        existing.setDiasCheckIn(entity.getDiasCheckIn());
        existing.setDiasCheckOut(entity.getDiasCheckOut());
        existing.setMotivo(entity.getMotivo());
        existing.setActivo(entity.getActivo());
        if (existing.getFechaFin() != null && existing.getFechaFin().isBefore(existing.getFechaInicio())) {
            throw new BusinessException("La fecha fin no puede ser anterior a la fecha inicio");
        }
        return toResponse(repository.save(existing));
    }

    public void delete(UUID id) {
        if (!repository.existsById(id)) {
            throw new ResourceNotFoundException("RestriccionFecha", id);
        }
        repository.deleteById(id);
    }

    public boolean hayRestriccionEnRango(LocalDate fechaIngreso, LocalDate fechaSalida) {
        List<RestriccionFecha> restricciones = repository.findRestriccionesEnRango(fechaIngreso, fechaSalida);
        return restricciones.stream().anyMatch(r -> "FECHA_CERRADA".equals(r.getTipo()));
    }

    public boolean isCheckInCerrado(LocalDate fecha) {
        List<RestriccionFecha> restricciones = repository.findRestriccionesByTipoEnRango("CHECK_IN_CERRADO", fecha,
                fecha);
        return !restricciones.isEmpty();
    }

    public boolean isCheckOutCerrado(LocalDate fecha) {
        List<RestriccionFecha> restricciones = repository.findRestriccionesByTipoEnRango("CHECK_OUT_CERRADO", fecha,
                fecha);
        return !restricciones.isEmpty();
    }

    public void validarDisponibilidad(LocalDate fechaIngreso, LocalDate fechaSalida) {
        List<RestriccionFecha> restricciones = repository.findRestriccionesEnRango(fechaIngreso, fechaSalida);

        long noches = fechaIngreso.until(fechaSalida).getDays();

        for (RestriccionFecha r : restricciones) {
            LocalDate inicio = r.getFechaInicio();
            LocalDate fin = r.getFechaFin() != null ? r.getFechaFin() : inicio;

            boolean enRango = !fechaIngreso.isAfter(fin) && !fechaSalida.isBefore(inicio);

            if (!enRango)
                continue;

            switch (r.getTipo()) {
                case "FECHA_CERRADA":
                    for (LocalDate d = inicio; !d.isAfter(fin); d = d.plusDays(1)) {
                        if (!d.isBefore(fechaIngreso) && d.isBefore(fechaSalida)) {
                            String motivo = r.getMotivo() != null ? " (" + r.getMotivo() + ")" : "";
                            throw new BusinessException("El hotel permanece cerrado el " + d + motivo);
                        }
                    }
                    break;
                case "CHECK_IN_CERRADO":
                    if (!fechaIngreso.isBefore(inicio) && !fechaIngreso.isAfter(fin)) {
                        String motivo = r.getMotivo() != null ? " (" + r.getMotivo() + ")" : "";
                        throw new BusinessException("No se permite check-in el " + fechaIngreso + motivo);
                    }
                    break;
                case "CHECK_OUT_CERRADO":
                    if (!fechaSalida.isBefore(inicio) && !fechaSalida.isAfter(fin)) {
                        String motivo = r.getMotivo() != null ? " (" + r.getMotivo() + ")" : "";
                        throw new BusinessException("No se permite check-out el " + fechaSalida + motivo);
                    }
                    break;
            }

            if (r.getMinLos() != null && noches < r.getMinLos()) {
                throw new BusinessException(
                        "Esta fecha requiere una estadía mínima de " + r.getMinLos()
                                + " noches. Selecciona una fecha de salida posterior.");
            }

            if (r.getMaxLos() != null && noches > r.getMaxLos()) {
                throw new BusinessException(
                        "La estadía máxima permitida es de " + r.getMaxLos()
                                + " noches. Selecciona una fecha de salida anterior.");
            }

            if (r.getDiasCheckIn() != null && !r.getDiasCheckIn().isBlank()) {
                Set<Integer> diasPermitidos = Arrays.stream(r.getDiasCheckIn().split(","))
                        .map(String::trim).map(Integer::parseInt).collect(Collectors.toSet());
                int diaIngreso = fechaIngreso.getDayOfWeek().getValue() % 7;
                if (!diasPermitidos.contains(diaIngreso)) {
                    String[] nombres = { "domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado" };
                    String dias = r.getDiasCheckIn();
                    throw new BusinessException(
                            "Solo se puede ingresar los días " + formatearDias(dias, nombres) + " en esta temporada.");
                }
            }

            if (r.getDiasCheckOut() != null && !r.getDiasCheckOut().isBlank()) {
                Set<Integer> diasPermitidos = Arrays.stream(r.getDiasCheckOut().split(","))
                        .map(String::trim).map(Integer::parseInt).collect(Collectors.toSet());
                int diaSalida = fechaSalida.getDayOfWeek().getValue() % 7;
                if (!diasPermitidos.contains(diaSalida)) {
                    String[] nombres = { "domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado" };
                    String dias = r.getDiasCheckOut();
                    throw new BusinessException(
                            "Solo se puede salir los días " + formatearDias(dias, nombres) + " en esta temporada.");
                }
            }
        }
    }

    private String formatearDias(String csv, String[] nombres) {
        return Arrays.stream(csv.split(","))
                .map(String::trim)
                .map(Integer::parseInt)
                .map(i -> nombres[i])
                .collect(Collectors.joining(", "));
    }

    private RestriccionFechaResponse toResponse(RestriccionFecha r) {
        return RestriccionFechaResponse.builder()
                .id(r.getId())
                .tipo(r.getTipo())
                .fechaInicio(r.getFechaInicio())
                .fechaFin(r.getFechaFin())
                .minLos(r.getMinLos())
                .maxLos(r.getMaxLos())
                .diasCheckIn(r.getDiasCheckIn())
                .diasCheckOut(r.getDiasCheckOut())
                .motivo(r.getMotivo())
                .activo(r.getActivo())
                .fechaCreacion(r.getFechaCreacion())
                .fechaActualizacion(r.getFechaActualizacion())
                .build();
    }
}
