package com.agenda.api.dto;

import jakarta.validation.constraints.NotNull;
import java.time.LocalDateTime;
import java.util.UUID;

public class CreateAppointmentRequest {

    @NotNull(message = "O cliente é obrigatório")
    private UUID customerId;

    @NotNull(message = "O profissional é obrigatório")
    private UUID professionalId;

    @NotNull(message = "O serviço é obrigatório")
    private UUID serviceId;

    @NotNull(message = "O horário de início é obrigatório")
    @jakarta.validation.constraints.FutureOrPresent(message = "O horário de início não pode estar no passado")
    private LocalDateTime startTime;

    // Getters and Setters
    public UUID getCustomerId() { return customerId; }
    public void setCustomerId(UUID customerId) { this.customerId = customerId; }
    
    public UUID getProfessionalId() { return professionalId; }
    public void setProfessionalId(UUID professionalId) { this.professionalId = professionalId; }
    
    public UUID getServiceId() { return serviceId; }
    public void setServiceId(UUID serviceId) { this.serviceId = serviceId; }
    
    public LocalDateTime getStartTime() { return startTime; }
    public void setStartTime(LocalDateTime startTime) { this.startTime = startTime; }
}
