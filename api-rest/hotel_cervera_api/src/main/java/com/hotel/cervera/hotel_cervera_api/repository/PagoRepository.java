package com.hotel.cervera.hotel_cervera_api.repository;

import com.hotel.cervera.hotel_cervera_api.model.Pago;
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
public interface PagoRepository extends JpaRepository<Pago, UUID> {

    Optional<Pago> findByComprobanteNumero(String comprobanteNumero);

    boolean existsByComprobanteNumero(String comprobanteNumero);

    Optional<Pago> findByEstadiaId(UUID estadiaId);

    Optional<Pago> findByGrupoId(UUID grupoId);

    @Query("SELECT p FROM Pago p WHERE DATE(p.fechaPago) BETWEEN :desde AND :hasta")
    List<Pago> findByFechaPagoBetween(@Param("desde") LocalDate desde, @Param("hasta") LocalDate hasta);

    @Query("SELECT COALESCE(SUM(p.montoTotal), 0) FROM Pago p WHERE DATE(p.fechaPago) BETWEEN :desde AND :hasta")
    BigDecimal sumIngresosByPeriodo(@Param("desde") LocalDate desde, @Param("hasta") LocalDate hasta);

    List<Pago> findByTipoComprobante(String tipoComprobante);
}
