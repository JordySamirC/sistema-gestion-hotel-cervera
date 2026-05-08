package com.hotel.cervera.hotel_cervera_api.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "habitaciones")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Habitacion {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "numero", nullable = false, unique = true, length = 10)
    private String numero;

    @Column(name = "piso", nullable = false)
    private Integer piso;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tipo_id", nullable = false)
    private TipoHabitacion tipo;

    @Column(name = "estado_actual", nullable = false, length = 20)
    private String estadoActual;

    @Column(name = "notas", columnDefinition = "TEXT")
    private String notas;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private OffsetDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private OffsetDateTime updatedAt;
}
