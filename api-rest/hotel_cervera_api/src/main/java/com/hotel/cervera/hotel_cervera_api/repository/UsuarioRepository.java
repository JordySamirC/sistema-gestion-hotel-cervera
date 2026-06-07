package com.hotel.cervera.hotel_cervera_api.repository;

import com.hotel.cervera.hotel_cervera_api.model.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface UsuarioRepository extends JpaRepository<Usuario, UUID> {

    Optional<Usuario> findByNombreUsuario(String nombreUsuario);

    Optional<Usuario> findByCorreoElectronico(String correoElectronico);

    boolean existsByNombreUsuario(String nombreUsuario);

    boolean existsByCorreoElectronico(String correoElectronico);

    @Query("SELECT u FROM Usuario u WHERE u.fechaEliminacion IS NULL")
    List<Usuario> findAllActive();

    @Query("SELECT u FROM Usuario u WHERE u.fechaEliminacion IS NULL AND u.id = :id")
    Optional<Usuario> findActiveById(@Param("id") UUID id);

    @Query("SELECT u FROM Usuario u WHERE u.fechaEliminacion IS NULL AND u.correoElectronico = :correoElectronico")
    Optional<Usuario> findActiveByCorreoElectronico(@Param("correoElectronico") String correoElectronico);

    List<Usuario> findByRolId(UUID rolId);
}
