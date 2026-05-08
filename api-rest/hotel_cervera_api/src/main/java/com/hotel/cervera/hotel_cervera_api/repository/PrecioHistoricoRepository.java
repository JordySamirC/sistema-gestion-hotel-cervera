package com.hotel.cervera.hotel_cervera_api.repository;

import com.hotel.cervera.hotel_cervera_api.model.PrecioHistorico;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface PrecioHistoricoRepository extends JpaRepository<PrecioHistorico, UUID> {

    List<PrecioHistorico> findByTipoHabitacionIdOrderByFechaInicioDesc(UUID tipoHabitacionId);

    @Query("SELECT ph FROM PrecioHistorico ph WHERE ph.tipoHabitacion.id = :tipoHabitacionId " +
           "AND ph.fechaInicio <= :fecha AND (ph.fechaFin IS NULL OR ph.fechaFin >= :fecha) " +
           "ORDER BY ph.fechaInicio DESC")
    Optional<PrecioHistorico> findPrecioVigente(@Param("tipoHabitacionId") UUID tipoHabitacionId,
                                                 @Param("fecha") LocalDate fecha);

    @Query("SELECT ph.precioNoche FROM PrecioHistorico ph WHERE ph.tipoHabitacion.id = :tipoHabitacionId " +
           "AND ph.fechaInicio <= :fecha AND (ph.fechaFin IS NULL OR ph.fechaFin >= :fecha) " +
           "ORDER BY ph.fechaInicio DESC")
    Optional<BigDecimal> findPrecioVigenteValue(@Param("tipoHabitacionId") UUID tipoHabitacionId,
                                                 @Param("fecha") LocalDate fecha);
}
