package com.agenda.api.dto.dashboard;

import java.util.List;

/** Listas limitadas a 20 itens; os totais trazem a contagem completa. */
public record PendingDto(
        List<DashboardAppointmentDto> toConfirm,
        int toConfirmTotal,
        List<DashboardAppointmentDto> overdue,
        int overdueTotal
) {}
