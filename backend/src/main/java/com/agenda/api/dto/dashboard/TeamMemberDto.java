package com.agenda.api.dto.dashboard;

import com.fasterxml.jackson.annotation.JsonFormat;

import java.time.LocalTime;
import java.util.UUID;

public record TeamMemberDto(
        UUID professionalId,
        String name,
        int appointmentsToday,
        TeamMemberState state,
        @JsonFormat(pattern = "HH:mm")
        LocalTime currentUntil,
        @JsonFormat(pattern = "HH:mm")
        LocalTime nextAt
) {}
