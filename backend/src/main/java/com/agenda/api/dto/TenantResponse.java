package com.agenda.api.dto;

import java.util.List;
import java.util.UUID;

public record TenantResponse(
        UUID id,
        String name,
        String domain,
        List<BusinessHourDto> businessHours,
        boolean active
) {}
