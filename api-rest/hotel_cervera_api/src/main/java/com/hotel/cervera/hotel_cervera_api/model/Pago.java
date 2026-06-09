package com.hotel.cervera.hotel_cervera_api.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import com.fasterxml.jackson.annotation.JsonIgnore;

@Entity
@Table(name = "pagos")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Pago {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "estadia_id", nullable = false)
    private Estadia estadia;

    @Column(name = "tipo_comprobante", nullable = false, length = 20)
    private String tipoComprobante; // 'BOLETA', 'FACTURA'

    @Column(name = "serie", nullable = false, length = 20)
    private String serie;

    @Column(name = "numero", nullable = false)
    private Integer numero;

    @Column(name = "comprobante_numero", nullable = false, unique = true, length = 20)
    private String comprobanteNumero; // 'B001-000001'

    @Column(name = "fecha_pago")
    private OffsetDateTime fechaPago;

    // Datos del cliente (Snapshot para auditoría)
    @Column(name = "cliente_nombre", length = 100)
    private String clienteNombre;

    @Column(name = "cliente_tipo_documento", length = 20)
    private String clienteTipoDocumento; // DNI, CE, PASAPORTE, RUC

    @Column(name = "cliente_documento", length = 20)
    private String clienteDocumento;

    @Column(name = "cliente_ruc", length = 11)
    private String clienteRuc;

    @Column(name = "cliente_razon_social", length = 200)
    private String clienteRazonSocial;

    // Datos del emisor
    @Column(name = "emisor_ruc", nullable = false, length = 11)
    private String emisorRuc;

    @Column(name = "emisor_razon_social", nullable = false, length = 200)
    private String emisorRazonSocial;

    // Montos
    @Column(name = "monto_neto", nullable = false, precision = 12, scale = 2)
    private BigDecimal montoNeto;

    @Column(name = "igv", nullable = false, precision = 12, scale = 2)
    private BigDecimal igv;

    @Column(name = "monto_total", nullable = false, precision = 12, scale = 2)
    private BigDecimal montoTotal;

    // Pago
    @Column(name = "metodo_pago", nullable = false, length = 20)
    private String metodoPago;

    @Column(name = "referencia_pago", length = 100)
    private String referenciaPago;

    @Column(name = "observaciones", columnDefinition = "TEXT")
    private String observaciones;

    @CreationTimestamp
    @Column(name = "fecha_creacion", updatable = false)
    private OffsetDateTime fechaCreacion;

    @Column(name = "creado_por")
    private UUID creadoPor;

    // Campos para trazabilidad de grupos (Modo Consolidado)
    @Column(name = "modo_pago", length = 20)
    private String modoPago; // 'CONSOLIDADO', 'INDIVIDUAL'

    @Column(name = "descripcion_habitaciones")
    private String descripcionHabitaciones; // Ej: "Hab. 201, 202"

    @Column(name = "cantidad_habitaciones")
    private Integer cantidadHabitaciones;

    @Column(name = "grupo_id")
    private UUID grupoId;

    @JsonIgnore
    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
        name = "pago_estadias",
        joinColumns = @JoinColumn(name = "pago_id"),
        inverseJoinColumns = @JoinColumn(name = "estadia_id")
    )
    @Builder.Default
    private List<Estadia> estadias = new ArrayList<>();
}
