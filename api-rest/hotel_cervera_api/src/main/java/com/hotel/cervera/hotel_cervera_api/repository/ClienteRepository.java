package com.hotel.cervera.hotel_cervera_api.repository;

import com.hotel.cervera.hotel_cervera_api.model.Cliente;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ClienteRepository extends JpaRepository<Cliente, UUID> {

    Optional<Cliente> findByTipoDocumentoAndNumeroDocumento(String tipoDocumento, String numeroDocumento);

    boolean existsByTipoDocumentoAndNumeroDocumento(String tipoDocumento, String numeroDocumento);

    @Query("SELECT c FROM Cliente c WHERE " +
           "LOWER(CONCAT(c.nombres, ' ', c.apellidos)) LIKE LOWER(CONCAT('%', :termino, '%')) OR " +
           "LOWER(c.nombres) LIKE LOWER(CONCAT('%', :termino, '%')) OR " +
           "LOWER(c.apellidos) LIKE LOWER(CONCAT('%', :termino, '%')) OR " +
           "c.numeroDocumento LIKE CONCAT('%', :termino, '%') OR " +
           "c.telefono LIKE CONCAT('%', :termino, '%')")
    List<Cliente> buscarPorTermino(@Param("termino") String termino);
}
