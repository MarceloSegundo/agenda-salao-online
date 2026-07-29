package com.agenda.api.service;

import com.agenda.api.config.WhatsAppProperties;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.util.Map;

@Service
public class WhatsAppNotificationService {

    private static final Logger logger = LoggerFactory.getLogger(WhatsAppNotificationService.class);
    private final RestClient restClient;
    private final WhatsAppProperties properties;

    public WhatsAppNotificationService(RestClient restClient, WhatsAppProperties properties) {
        this.restClient = restClient;
        this.properties = properties;
    }

    @Async
    public void sendAppointmentConfirmation(String customerName, String phone, String serviceName, String date) {
        if (!properties.isEnabled()) {
            logger.info("WhatsApp notification is disabled. Skipping message for {}", phone);
            return;
        }

        String message = String.format("Olá %s! Seu agendamento para %s no dia %s foi confirmado com sucesso.", 
                customerName, serviceName, date);

        try {
            logger.info("Sending WhatsApp message to {}", phone);
            
            restClient.post()
                    .uri(properties.getApiUrl() + "/api/send")
                    .body(Map.of(
                            "number", phone,
                            "message", message
                    ))
                    .retrieve()
                    .toBodilessEntity();
                    
            logger.info("WhatsApp message sent successfully to {}", phone);
        } catch (Exception e) {
            logger.error("Failed to send WhatsApp message to {}: {}", phone, e.getMessage(), e);
        }
    }
}
