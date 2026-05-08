package com.hotel.cervera.hotel_cervera_api.repository;

import com.hotel.cervera.hotel_cervera_api.model.Habitacion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface HabitacionRepository extends JpaRepository<Habitacion, UUID> {

    Optional<Habitacion> findByNumero(String numero);

    boolean existsByNumero(String numero);

    List<Habitacion> findByPiso(Integer piso);

    List<Habitacion> findByTipoId(UUID tipoId);

    List<Habitacion> findByEstadoActual(String estadoActual);

    @Query("SELECT h FROM Habitacion h WHERE h.estadoActual = 'disponible' OR h.estadoActual = 'por_limpiar'")
    List<Habitacion> findDisponiblesYPendientes();

    @Query("SELECT h FROM Habitacion h WHERE h.id NOT IN (" +
           "SELECT rd.habitacion.id FROM ReservaDetalle rd " +
           "JOIN rd.reserva r WHERE r.estado IN ('pendiente', 'checked_in') " +
           "AND r.fechaIngreso <= :fechaSalida AND r.fechaSalida >= :fechaIngreso" +
           ") AND h.estadoActual IN ('disponible', 'por_limpiar')")
    List<Habitacion> findDisponiblesEnRango(@Param("fechaIngreso") LocalDate fechaIngreso,
                                             @Param("fechaSalida") LocalDate fechaSalida);

    long countByEstadoActual(String estadoActual);
}
