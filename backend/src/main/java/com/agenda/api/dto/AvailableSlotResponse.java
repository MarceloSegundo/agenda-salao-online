package com.agenda.api.dto;

import com.fasterxml.jackson.annotation.JsonFormat;

import java.time.LocalTime;
import java.util.UUID;

public record AvailableSlotResponse(
        @JsonFormat(pattern = "HH:mm")
        LocalTime time,
        UUID professionalId,
        String professionalName
) {}
