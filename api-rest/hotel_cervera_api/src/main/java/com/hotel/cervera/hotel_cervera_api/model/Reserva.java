package com.hotel.cervera.hotel_cervera_api.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "reservas")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Reserva {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "codigo", nullable = false, unique = true, length = 20)
    private String codigo;

    @Column(name = "fecha_reserva")
    private OffsetDateTime fechaReserva;

    @Column(name = "fecha_ingreso", nullable = false)
    private LocalDate fechaIngreso;

    @Column(name = "fecha_salida", nullable = false)
    private LocalDate fechaSalida;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cliente_id", nullable = false)
    private Cliente cliente;

    @Column(name = "estado", nullable = false, length = 20)
    private String estado;

    @Column(name = "motivo_cancelacion", columnDefinition = "TEXT")
    private String motivoCancelacion;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "creado_por", nullable = false)
    private Usuario creadoPor;

    @Column(name = "adultos", nullable = false)
    private Integer adultos;

    @Column(name = "adolescentes", nullable = false)
    private Integer adolescentes;

    @Column(name = "ninos", nullable = false)
    private Integer ninos;

    @Column(name = "bebes", nullable = false)
    private Integer bebes;

    @Column(name = "canal_venta", nullable = false, length = 30)
    private String canalVenta;

    @Column(name = "tipo_cliente", nullable = false, length = 20)
    private String tipoCliente;

    @Column(name = "cambios_reserva", nullable = false)
    private Integer cambiosReserva;

    @Column(name = "solicitudes_especiales", nullable = false)
    private Integer solicitudesEspeciales;

    @Column(name = "cancelaciones_previas", nullable = false)
    private Integer cancelacionesPrevias;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private OffsetDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private OffsetDateTime updatedAt;

    @OneToMany(mappedBy = "reserva", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<ReservaDetalle> detalles = new ArrayList<>();

    @OneToMany(mappedBy = "reserva")
    private List<Estadia> estadias;
}
