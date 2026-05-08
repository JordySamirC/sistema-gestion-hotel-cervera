package com.hotel.cervera.hotel_cervera_api.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

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

    @Column(name = "comprobante_numero", nullable = false, unique = true, length = 20)
    private String comprobanteNumero;

    @Column(name = "fecha_pago")
    private OffsetDateTime fechaPago;

    @Column(name = "monto_total", nullable = false, precision = 12, scale = 2)
    private BigDecimal montoTotal;

    @Column(name = "metodo_pago", nullable = false, length = 20)
    private String metodoPago;

    @Column(name = "tipo_comprobante", nullable = false, length = 3)
    private String tipoComprobante;

    @Column(name = "serie", nullable = false, length = 10)
    private String serie;

    @Column(name = "numero", nullable = false)
    private Integer numero;

    @Column(name = "ruc_razon_social", length = 100)
    private String rucRazonSocial;

    @Column(name = "monto_neto", nullable = false, precision = 12, scale = 2)
    private BigDecimal montoNeto;

    @Column(name = "igv", nullable = false, precision = 12, scale = 2)
    private BigDecimal igv;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private OffsetDateTime createdAt;
}
