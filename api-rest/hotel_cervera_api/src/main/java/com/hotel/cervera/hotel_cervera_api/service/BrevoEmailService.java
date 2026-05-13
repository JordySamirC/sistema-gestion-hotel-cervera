package com.hotel.cervera.hotel_cervera_api.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.*;

@Slf4j
@Service
public class BrevoEmailService implements EmailService {

    @Value("${brevo.api-key}")
    private String apiKey;

    @Value("${brevo.sender-email}")
    private String senderEmail;

    @Value("${brevo.sender-name}")
    private String senderName;

    private final RestTemplate restTemplate;

    public BrevoEmailService() {
        this.restTemplate = new RestTemplate();
    }

    @Override
    public void sendMagicLink(String to, String magicLink) {
        Map<String, Object> request = new HashMap<>();

        Map<String, String> sender = new HashMap<>();
        sender.put("name", senderName);
        sender.put("email", senderEmail);
        request.put("sender", sender);

        List<Map<String, String>> toList = new ArrayList<>();
        Map<String, String> toEntry = new HashMap<>();
        toEntry.put("email", to);
        toList.add(toEntry);
        request.put("to", toList);

        request.put("subject", "Recuperación de contraseña - Hotel Cervera");

        String html = """
            <html><body style="font-family: Arial, sans-serif; padding: 20px;">
                <h2>Recuperación de contraseña</h2>
                <p>Has solicitado restablecer tu contraseña. Haz clic en el siguiente enlace:</p>
                <p><a href="%s" style="display: inline-block; padding: 12px 24px; background-color: #D4A843; color: #1C1A17; text-decoration: none; border-radius: 6px; font-weight: bold;">Restablecer contraseña</a></p>
                <p style="color: #666; font-size: 12px;">Este enlace expira en 1 hora.</p>
                <p style="color: #666; font-size: 12px;">Si no solicitaste este cambio, ignora este correo.</p>
            </body></html>
            """.formatted(magicLink);
        request.put("htmlContent", html);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("api-key", apiKey);

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(request, headers);

        try {
            ResponseEntity<String> response = restTemplate.exchange(
                "https://api.brevo.com/v3/smtp/email",
                HttpMethod.POST,
                entity,
                String.class
            );
            log.info("Magic link email sent to {} - Brevo response: {}", maskEmail(to), response.getStatusCode());
        } catch (Exception e) {
            log.error("Failed to send magic link email to {}: {}", maskEmail(to), e.getMessage());
        }
    }

    private String maskEmail(String email) {
        String[] parts = email.split("@");
        if (parts[0].length() <= 3) return "***@" + parts[1];
        return parts[0].substring(0, 2) + "***@" + parts[1];
    }
}
