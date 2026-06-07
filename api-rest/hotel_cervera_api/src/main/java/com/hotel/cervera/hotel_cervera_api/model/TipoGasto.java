package com.hotel.cervera.hotel_cervera_api.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "tipos_gasto")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class TipoGasto {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 30)
    private String nombre;
}
