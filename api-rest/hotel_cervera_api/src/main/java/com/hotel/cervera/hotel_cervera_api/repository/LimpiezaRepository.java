package com.hotel.cervera.hotel_cervera_api.repository;

import com.hotel.cervera.hotel_cervera_api.model.Limpieza;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface LimpiezaRepository extends JpaRepository<Limpieza, UUID> {

    List<Limpieza> findByHabitacionIdOrderByFechaInicioDesc(UUID habitacionId);

    List<Limpieza> findByUsuarioIdOrderByFechaInicioDesc(UUID usuarioId);

    @Query("SELECT l FROM Limpieza l WHERE l.fechaFin IS NULL")
    List<Limpieza> findActivas();

    @Query("SELECT l FROM Limpieza l WHERE l.fechaFin IS NULL AND l.usuario.id = :usuarioId")
    Optional<Limpieza> findActivaByUsuarioId(@Param("usuarioId") UUID usuarioId);

    @Query("SELECT l FROM Limpieza l WHERE l.fechaFin IS NULL AND l.habitacion.id = :habitacionId")
    Optional<Limpieza> findActivaByHabitacionId(@Param("habitacionId") UUID habitacionId);

    @Query("SELECT AVG(l.duracionSegundos) FROM Limpieza l WHERE l.duracionSegundos IS NOT NULL " +
           "AND l.usuario.id = :usuarioId")
    Double promedioDuracionByUsuarioId(@Param("usuarioId") UUID usuarioId);

    @Query("SELECT AVG(l.duracionSegundos) FROM Limpieza l WHERE l.duracionSegundos IS NOT NULL")
    Double promedioDuracionGlobal();

    long countByUsuarioIdAndDuracionSegundosIsNotNull(UUID usuarioId);
}
