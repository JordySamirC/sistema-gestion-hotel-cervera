package com.hotel.cervera.hotel_cervera_api.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "canales_venta")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class CanalesVenta {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "nombre", nullable = false, unique = true, length = 50)
    private String nombre;

    @Column(name = "icono", length = 10)
    private String icono;

    @Column(name = "activo", nullable = false)
    @Builder.Default
    private Boolean activo = true;

    @Column(name = "orden", nullable = false)
    @Builder.Default
    private Integer orden = 0;
}
