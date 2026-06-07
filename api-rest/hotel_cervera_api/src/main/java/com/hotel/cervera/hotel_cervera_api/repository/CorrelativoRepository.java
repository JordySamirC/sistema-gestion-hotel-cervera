package com.hotel.cervera.hotel_cervera_api.repository;

import com.hotel.cervera.hotel_cervera_api.model.Correlativo;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface CorrelativoRepository extends JpaRepository<Correlativo, Integer> {
    Optional<Correlativo> findByTipoComprobanteAndSerie(String tipoComprobante, String serie);
}
