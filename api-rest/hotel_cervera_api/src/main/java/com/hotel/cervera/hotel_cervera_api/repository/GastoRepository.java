package com.hotel.cervera.hotel_cervera_api.repository;

import com.hotel.cervera.hotel_cervera_api.model.Gasto;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Repository
public interface GastoRepository extends JpaRepository<Gasto, UUID> {

    List<Gasto> findByCategoriaId(Long categoriaId);

    @Query("SELECT g FROM Gasto g JOIN FETCH g.categoria JOIN FETCH g.tipoGasto JOIN FETCH g.creadoPor " +
           "WHERE g.fechaGasto BETWEEN :desde AND :hasta " +
           "AND (:categoriaId IS NULL OR g.categoria.id = :categoriaId) " +
           "AND (:tipoGastoId IS NULL OR g.tipoGasto.id = :tipoGastoId) " +
           "ORDER BY g.fechaGasto DESC, g.fechaCreacion DESC")
    List<Gasto> findGastosConFiltros(
            @Param("desde") LocalDate desde,
            @Param("hasta") LocalDate hasta,
            @Param("categoriaId") Long categoriaId,
            @Param("tipoGastoId") Long tipoGastoId);

    @Query("SELECT COALESCE(SUM(g.monto), 0) FROM Gasto g " +
           "WHERE g.estado = 'ACTIVO' AND g.fechaGasto BETWEEN :desde AND :hasta")
    BigDecimal sumGastosActivosByPeriodo(@Param("desde") LocalDate desde, @Param("hasta") LocalDate hasta);

    @Query("SELECT c.nombre, COALESCE(SUM(g.monto), 0) FROM Gasto g RIGHT JOIN g.categoria c " +
           "ON (g.estado = 'ACTIVO' AND g.fechaGasto BETWEEN :desde AND :hasta) " +
           "WHERE c.activo = true " +
           "GROUP BY c.nombre, c.orden " +
           "ORDER BY c.orden ASC")
    List<Object[]> sumByCategoriaEnPeriodo(@Param("desde") LocalDate desde, @Param("hasta") LocalDate hasta);
}
