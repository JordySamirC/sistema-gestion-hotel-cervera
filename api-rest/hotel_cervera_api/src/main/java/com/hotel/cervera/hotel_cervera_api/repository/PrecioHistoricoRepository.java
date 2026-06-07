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

    @Query(value = "SELECT * FROM precios_historicos ph WHERE ph.tipo_habitacion_id = :tipoHabitacionId " +
           "AND ph.fecha_inicio <= :fecha AND (ph.fecha_fin IS NULL OR ph.fecha_fin >= :fecha) " +
           "ORDER BY ph.fecha_inicio DESC LIMIT 1", nativeQuery = true)
    Optional<PrecioHistorico> findPrecioVigente(@Param("tipoHabitacionId") UUID tipoHabitacionId,
                                                 @Param("fecha") LocalDate fecha);

    @Query(value = "SELECT ph.precio_noche FROM precios_historicos ph WHERE ph.tipo_habitacion_id = :tipoHabitacionId " +
           "AND ph.fecha_inicio <= :fecha AND (ph.fecha_fin IS NULL OR ph.fecha_fin >= :fecha) " +
           "ORDER BY ph.fecha_inicio DESC LIMIT 1", nativeQuery = true)
    Optional<BigDecimal> findPrecioVigenteValue(@Param("tipoHabitacionId") UUID tipoHabitacionId,
                                                 @Param("fecha") LocalDate fecha);
}
