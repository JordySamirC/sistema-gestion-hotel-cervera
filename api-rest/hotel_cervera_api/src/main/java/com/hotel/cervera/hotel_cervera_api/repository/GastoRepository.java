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

    List<Gasto> findByCategoria(String categoria);

    List<Gasto> findByFechaGastoBetweenOrderByFechaGastoAsc(LocalDate desde, LocalDate hasta);

    @Query("SELECT COALESCE(SUM(g.monto), 0) FROM Gasto g WHERE g.fechaGasto BETWEEN :desde AND :hasta")
    BigDecimal sumGastosByPeriodo(@Param("desde") LocalDate desde, @Param("hasta") LocalDate hasta);

    @Query("SELECT g.categoria, COALESCE(SUM(g.monto), 0) FROM Gasto g " +
           "WHERE g.fechaGasto BETWEEN :desde AND :hasta GROUP BY g.categoria")
    List<Object[]> sumByCategoriaEnPeriodo(@Param("desde") LocalDate desde, @Param("hasta") LocalDate hasta);

    List<Gasto> findByEsFijoTrue();
}
