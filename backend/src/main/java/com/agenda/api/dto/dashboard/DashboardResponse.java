package com.agenda.api.dto.dashboard;

import java.time.LocalDate;
import java.util.List;

/** Operação do dia: resumo, próximo atendimento, pendências e equipe. */
public record DashboardResponse(
        LocalDate date,
        String salonName,
        DaySummaryDto summary,
        DashboardAppointmentDto next,
        PendingDto pending,
        List<TeamMemberDto> team
) {}
