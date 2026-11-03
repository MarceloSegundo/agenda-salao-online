package com.agenda.api.dto.dashboard;

import java.math.BigDecimal;

/** Contadores e valores dos agendamentos com início hoje; total não conta cancelados. */
public record DaySummaryDto(
        int total,
        int completed,
        int toConfirm,
        int canceled,
        BigDecimal expectedRevenue,
        BigDecimal realizedRevenue
) {}
