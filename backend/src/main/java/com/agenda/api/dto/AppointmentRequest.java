package com.agenda.api.dto;

import jakarta.validation.constraints.NotNull;
import java.time.LocalDateTime;
import java.util.UUID;

public record AppointmentRequest(
        @NotNull(message = "Cliente é obrigatório")
        UUID customerId,
        
        @NotNull(message = "Profissional é obrigatório")
        UUID professionalId,
        
        @NotNull(message = "Serviço é obrigatório")
        UUID serviceId,
        
        @NotNull(message = "Data e hora de início são obrigatórias")
        LocalDateTime startTime,
        
        @NotNull(message = "Data e hora de fim são obrigatórias")
        LocalDateTime endTime
) {}
