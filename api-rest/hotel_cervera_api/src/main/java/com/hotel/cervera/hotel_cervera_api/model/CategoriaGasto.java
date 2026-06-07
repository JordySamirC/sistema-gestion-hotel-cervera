package com.hotel.cervera.hotel_cervera_api.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "categorias_gasto")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class CategoriaGasto {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 50)
    private String nombre;

    private String descripcion;

    @Builder.Default
    private Boolean activo = true;

    @Builder.Default
    private Integer orden = 0;
}
