package com.hotel.cervera.hotel_cervera_api.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "habitaciones_historial")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class HabitacionHistorial {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "habitacion_id", nullable = false)
    private UUID habitacionId;

    @Column(name = "campo", nullable = false, length = 50)
    private String campo;

    @Column(name = "valor_anterior", columnDefinition = "TEXT")
    private String valorAnterior;

    @Column(name = "valor_nuevo", columnDefinition = "TEXT")
    private String valorNuevo;

    @Column(name = "modificado_por", nullable = false)
    private UUID modificadoPor;

    @CreationTimestamp
    @Column(name = "fecha", updatable = false)
    private OffsetDateTime fecha;
}
