package com.hotel.cervera.hotel_cervera_api.controller;

import com.hotel.cervera.hotel_cervera_api.model.CanalesVenta;
import com.hotel.cervera.hotel_cervera_api.repository.CanalesVentaRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/canales-venta")
@RequiredArgsConstructor
@Tag(name = "Canales de Venta", description = "Catálogo de canales de venta")
public class CanalesVentaController {

    private final CanalesVentaRepository canalesVentaRepository;

    @GetMapping
    @Operation(summary = "Listar canales de venta activos")
    public ResponseEntity<List<CanalesVenta>> findAll() {
        return ResponseEntity.ok(canalesVentaRepository.findByActivoTrueOrderByOrdenAsc());
    }
}
