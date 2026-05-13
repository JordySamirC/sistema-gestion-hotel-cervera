package com.hotel.cervera.hotel_cervera_api.repository;

import com.hotel.cervera.hotel_cervera_api.model.CanalesVenta;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CanalesVentaRepository extends JpaRepository<CanalesVenta, Long> {
    List<CanalesVenta> findByActivoTrueOrderByOrdenAsc();
}
