package com.agenda.api.dto;

import com.agenda.api.model.AppointmentStatus;
import java.time.LocalDateTime;
import java.util.UUID;

public record AppointmentResponse(
        UUID id,
        CustomerResponse customer,
        ProfessionalResponse professional,
        ServiceResponse service,
        LocalDateTime startTime,
        LocalDateTime endTime,
        AppointmentStatus status
) {}
