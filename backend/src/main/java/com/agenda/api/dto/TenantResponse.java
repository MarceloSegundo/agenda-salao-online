package com.agenda.api.dto;

import java.time.LocalTime;
import java.util.UUID;

public record TenantResponse(
        UUID id,
        String name,
        String domain,
        LocalTime openingTime,
        LocalTime closingTime,
        boolean active
) {}
