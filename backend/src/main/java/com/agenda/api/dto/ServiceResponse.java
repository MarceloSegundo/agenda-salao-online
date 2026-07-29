package com.agenda.api.dto;

import java.math.BigDecimal;
import java.util.UUID;

public record ServiceResponse(
        UUID id,
        String name,
        String description,
        BigDecimal price,
        Integer durationMinutes,
        boolean requiresOnlinePayment
) {}
