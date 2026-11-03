package com.agenda.api.dto.dashboard;

import com.agenda.api.model.AppointmentStatus;

import java.time.LocalDateTime;
import java.util.UUID;

public record DashboardAppointmentDto(
        UUID id,
        String customerName,
        String customerPhone,
        String serviceName,
        String professionalName,
        LocalDateTime startTime,
        LocalDateTime endTime,
        AppointmentStatus status,
        boolean inProgress
) {}
