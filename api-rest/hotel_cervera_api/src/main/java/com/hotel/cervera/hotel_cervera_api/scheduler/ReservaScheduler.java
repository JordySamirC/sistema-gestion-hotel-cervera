package com.hotel.cervera.hotel_cervera_api.scheduler;

import com.hotel.cervera.hotel_cervera_api.model.Reserva;
import com.hotel.cervera.hotel_cervera_api.repository.ReservaRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class ReservaScheduler {

    private final ReservaRepository reservaRepository;

    @Scheduled(cron = "0 0 1 * * ?") // Se ejecuta a la 1:00 AM todos los días
    @Transactional
    public void marcarNoShowAutomatico() {
        LocalDate hoy = LocalDate.now();
        log.info("Iniciando tarea programada para marcar inasistencias (No-Show). Fecha actual: {}", hoy);

        List<Reserva> inasistencias = reservaRepository.findByEstadoAndFechaIngresoBefore("RESERVADA", hoy);

        if (inasistencias.isEmpty()) {
            log.info("No se encontraron reservas pendientes de ingreso con fecha anterior a hoy (No-Shows).");
            return;
        }

        for (Reserva reserva : inasistencias) {
            log.warn("Reserva {} (Código: {}) marcada como CANCELADA debido a inasistencia. Fecha ingreso programada: {}", 
                     reserva.getId(), reserva.getCodigo(), reserva.getFechaIngreso());
            
            reserva.setEstado("CANCELADA");
            reserva.setMotivoCancelacion("Inasistencia");
            reserva.setObservacionesCancelacion("Inasistencia automática - Hospedaje no realizado en la fecha programada");
            reserva.setFechaCancelacion(LocalDateTime.now());
            
            reservaRepository.save(reserva);
        }

        log.info("Tarea programada de No-Show finalizada exitosamente. Total procesadas: {}", inasistencias.size());
    }
}
