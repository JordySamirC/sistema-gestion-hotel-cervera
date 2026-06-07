package com.hotel.cervera.hotel_cervera_api.service;

import com.hotel.cervera.hotel_cervera_api.exception.ResourceNotFoundException;
import com.hotel.cervera.hotel_cervera_api.model.ConfiguracionHotel;
import com.hotel.cervera.hotel_cervera_api.repository.ConfiguracionHotelRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class ConfiguracionService {

    private final ConfiguracionHotelRepository repository;

    public String getValor(String clave) {
        return repository.findByClave(clave)
                .map(ConfiguracionHotel::getValor)
                .orElseThrow(() -> new ResourceNotFoundException("Configuracion", "clave", clave));
    }

    public int getInt(String clave) {
        return Integer.parseInt(getValor(clave));
    }

    public Map<String, String> getAllAsMap() {
        List<ConfiguracionHotel> all = repository.findAll();
        Map<String, String> map = new HashMap<>();
        for (ConfiguracionHotel c : all) {
            map.put(c.getClave(), c.getValor());
        }
        return map;
    }
}
