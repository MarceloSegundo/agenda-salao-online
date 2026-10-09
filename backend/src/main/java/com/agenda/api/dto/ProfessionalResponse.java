package com.agenda.api.dto;

import java.util.List;
import java.util.UUID;

public record ProfessionalResponse(
        UUID id,
        String name,
        String specialization,
        boolean active,
        List<BusinessHourDto> businessHours
) {}
