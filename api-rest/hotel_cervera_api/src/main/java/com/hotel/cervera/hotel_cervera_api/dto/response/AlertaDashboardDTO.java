package com.hotel.cervera.hotel_cervera_api.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AlertaDashboardDTO {
    private String tipo;    // URGENTE, ADVERTENCIA, INFO, EXITO
    private String mensaje; // El texto de la alerta
    private String icono;   // Icono visual (ej: 🔴, ⚠️, ℹ️, ✅)
    private String fecha;   // Representación legible del momento, ej: "Hace 2 horas" o "Hoy"
}
