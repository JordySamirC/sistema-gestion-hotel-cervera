package com.hotel.cervera.hotel_cervera_api.repository;

import com.hotel.cervera.hotel_cervera_api.model.TipoGasto;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface TipoGastoRepository extends JpaRepository<TipoGasto, Long> {
    Optional<TipoGasto> findByNombreIgnoreCase(String nombre);
}
