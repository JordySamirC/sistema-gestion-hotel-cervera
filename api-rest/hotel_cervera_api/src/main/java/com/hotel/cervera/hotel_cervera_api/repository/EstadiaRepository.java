package com.hotel.cervera.hotel_cervera_api.repository;

import com.hotel.cervera.hotel_cervera_api.model.Estadia;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface EstadiaRepository extends JpaRepository<Estadia, UUID> {

    Optional<Estadia> findByReservaId(UUID reservaId);

    List<Estadia> findByEstado(String estado);

    @Query("SELECT e FROM Estadia e WHERE e.estado = 'activa'")
    List<Estadia> findActivas();

    @Query("SELECT e FROM Estadia e JOIN FETCH e.reserva r JOIN FETCH r.detalles rd " +
           "WHERE e.estado = 'activa'")
    List<Estadia> findActivasConDetalles();

    boolean existsByReservaIdAndEstado(UUID reservaId, String estado);
}
