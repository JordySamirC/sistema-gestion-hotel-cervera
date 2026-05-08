package com.hotel.cervera.hotel_cervera_api.repository;

import com.hotel.cervera.hotel_cervera_api.model.ReservaDetalle;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ReservaDetalleRepository extends JpaRepository<ReservaDetalle, UUID> {

    List<ReservaDetalle> findByReservaId(UUID reservaId);

    Optional<ReservaDetalle> findByReservaIdAndHabitacionId(UUID reservaId, UUID habitacionId);

    boolean existsByReservaIdAndHabitacionId(UUID reservaId, UUID habitacionId);

    void deleteByReservaId(UUID reservaId);
}
