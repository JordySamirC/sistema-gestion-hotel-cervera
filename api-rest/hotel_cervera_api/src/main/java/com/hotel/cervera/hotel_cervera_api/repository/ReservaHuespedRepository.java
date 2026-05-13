package com.hotel.cervera.hotel_cervera_api.repository;

import com.hotel.cervera.hotel_cervera_api.model.ReservaHuesped;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ReservaHuespedRepository extends JpaRepository<ReservaHuesped, UUID> {

    List<ReservaHuesped> findByReservaId(UUID reservaId);

    long countByReservaId(UUID reservaId);
}
