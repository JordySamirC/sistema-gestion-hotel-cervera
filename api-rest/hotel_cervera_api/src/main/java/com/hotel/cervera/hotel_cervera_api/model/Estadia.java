package com.hotel.cervera.hotel_cervera_api.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "estadias")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Estadia {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reserva_id", nullable = false)
    private Reserva reserva;

    @Column(name = "fecha_check_in", nullable = false)
    private OffsetDateTime fechaCheckIn;

    @Column(name = "fecha_check_out")
    private OffsetDateTime fechaCheckOut;

    @Column(name = "noches")
    private Integer noches;

    @Column(name = "monto_total", precision = 12, scale = 2)
    private BigDecimal montoTotal;

    @Column(name = "estado", nullable = false, length = 20)
    private String estado;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private OffsetDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private OffsetDateTime updatedAt;
}
