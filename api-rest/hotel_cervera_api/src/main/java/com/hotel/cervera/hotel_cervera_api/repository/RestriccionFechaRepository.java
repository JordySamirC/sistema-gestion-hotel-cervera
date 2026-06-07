package com.hotel.cervera.hotel_cervera_api.repository;

import com.hotel.cervera.hotel_cervera_api.model.RestriccionFecha;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Repository
public interface RestriccionFechaRepository extends JpaRepository<RestriccionFecha, UUID> {

    List<RestriccionFecha> findByActivoTrue();

    List<RestriccionFecha> findByTipoAndActivoTrue(String tipo);

    @Query("SELECT r FROM RestriccionFecha r WHERE r.activo = true AND " +
           "r.fechaInicio <= :fechaFin AND (r.fechaFin IS NULL OR r.fechaFin >= :fechaInicio)")
    List<RestriccionFecha> findRestriccionesEnRango(@Param("fechaInicio") LocalDate fechaInicio,
                                                     @Param("fechaFin") LocalDate fechaFin);

    @Query("SELECT r FROM RestriccionFecha r WHERE r.activo = true AND r.tipo = :tipo AND " +
           "r.fechaInicio <= :fechaFin AND (r.fechaFin IS NULL OR r.fechaFin >= :fechaInicio)")
    List<RestriccionFecha> findRestriccionesByTipoEnRango(@Param("tipo") String tipo,
                                                           @Param("fechaInicio") LocalDate fechaInicio,
                                                           @Param("fechaFin") LocalDate fechaFin);
}
