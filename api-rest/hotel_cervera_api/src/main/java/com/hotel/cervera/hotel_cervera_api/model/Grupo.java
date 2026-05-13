package com.hotel.cervera.hotel_cervera_api.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "grupos")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Grupo {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "nombre_grupo", length = 200)
    private String nombreGrupo;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "responsable_pago_id", nullable = false)
    private Cliente responsablePago;

    @Column(name = "fecha_ingreso", nullable = false)
    private LocalDate fechaIngreso;

    @Column(name = "fecha_salida", nullable = false)
    private LocalDate fechaSalida;

    @Builder.Default
    @Column(name = "facturar_todo_al_responsable", nullable = false)
    private Boolean facturarTodoAlResponsable = true;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "canal_venta_id", nullable = false)
    private CanalesVenta canalVenta;

    @Column(name = "canal_venta_otro", length = 100)
    private String canalVentaOtro;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "creado_por", nullable = false)
    private Usuario creadoPor;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private OffsetDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private OffsetDateTime updatedAt;
}
