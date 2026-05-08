package com.hotel.cervera.hotel_cervera_api.repository;

import com.hotel.cervera.hotel_cervera_api.model.Reserva;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ReservaRepository extends JpaRepository<Reserva, UUID> {

    Optional<Reserva> findByCodigo(String codigo);

    boolean existsByCodigo(String codigo);

    List<Reserva> findByClienteId(UUID clienteId);

    List<Reserva> findByEstado(String estado);

    @Query("SELECT r FROM Reserva r WHERE r.fechaIngreso BETWEEN :desde AND :hasta " +
           "OR r.fechaSalida BETWEEN :desde AND :hasta")
    List<Reserva> findReservasEnRango(@Param("desde") LocalDate desde, @Param("hasta") LocalDate hasta);

    @Query("SELECT r FROM Reserva r WHERE r.estado = 'pendiente' AND r.fechaIngreso <= :hoy " +
           "AND r.fechaIngreso >= :ayer")
    List<Reserva> findReservasPendientesParaHoy(@Param("hoy") LocalDate hoy, @Param("ayer") LocalDate ayer);

    long countByEstado(String estado);

    @Query("SELECT COUNT(r) FROM Reserva r WHERE r.estado IN ('pendiente', 'checked_in') " +
           "AND r.fechaIngreso <= :fecha AND r.fechaSalida >= :fecha")
    long countReservasActivasEnFecha(@Param("fecha") LocalDate fecha);
}
