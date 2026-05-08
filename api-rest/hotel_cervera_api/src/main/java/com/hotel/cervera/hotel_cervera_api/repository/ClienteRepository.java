package com.hotel.cervera.hotel_cervera_api.repository;

import com.hotel.cervera.hotel_cervera_api.model.Cliente;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface ClienteRepository extends JpaRepository<Cliente, UUID> {

    Optional<Cliente> findByTipoDocumentoAndNumeroDocumento(String tipoDocumento, String numeroDocumento);

    boolean existsByTipoDocumentoAndNumeroDocumento(String tipoDocumento, String numeroDocumento);
}
