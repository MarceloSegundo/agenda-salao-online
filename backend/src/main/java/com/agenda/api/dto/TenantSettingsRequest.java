package com.agenda.api.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.LocalTime;

public record TenantSettingsRequest(
        @NotBlank(message = "Nome do salão é obrigatório")
        String salonName,

        @NotNull(message = "Horário de abertura é obrigatório")
        LocalTime openingTime,

        @NotNull(message = "Horário de fechamento é obrigatório")
        LocalTime closingTime
) {}
