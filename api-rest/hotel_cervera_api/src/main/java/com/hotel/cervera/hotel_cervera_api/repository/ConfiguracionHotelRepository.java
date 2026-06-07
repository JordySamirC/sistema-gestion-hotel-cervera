package com.hotel.cervera.hotel_cervera_api.repository;

import com.hotel.cervera.hotel_cervera_api.model.ConfiguracionHotel;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ConfiguracionHotelRepository extends JpaRepository<ConfiguracionHotel, Long> {
    Optional<ConfiguracionHotel> findByClave(String clave);
}
