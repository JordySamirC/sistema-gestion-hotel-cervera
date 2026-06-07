package com.hotel.cervera.hotel_cervera_api.repository;

import com.hotel.cervera.hotel_cervera_api.model.TipoHabitacion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface TipoHabitacionRepository extends JpaRepository<TipoHabitacion, UUID> {
    Optional<TipoHabitacion> findByNombreIgnoreCase(String nombre);
    Optional<TipoHabitacion> findByNombre(String nombre);
    boolean existsByNombre(String nombre);
}
