package com.hotel.cervera.hotel_cervera_api.controller;

import com.hotel.cervera.hotel_cervera_api.service.ConfiguracionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/configuracion")
@RequiredArgsConstructor
@Tag(name = "Configuracion", description = "Configuración global del hotel")
public class ConfiguracionController {

    private final ConfiguracionService configuracionService;

    @GetMapping
    @Operation(summary = "Obtener toda la configuración", description = "Devuelve todas las claves y valores de configuración del hotel")
    public ResponseEntity<Map<String, String>> getAll() {
        return ResponseEntity.ok(configuracionService.getAllAsMap());
    }

    @GetMapping("/{clave}")
    @Operation(summary = "Obtener valor de configuración por clave", description = "Devuelve el valor de una clave de configuración específica")
    public ResponseEntity<String> getByClave(@PathVariable String clave) {
        return ResponseEntity.ok(configuracionService.getValor(clave));
    }
}
