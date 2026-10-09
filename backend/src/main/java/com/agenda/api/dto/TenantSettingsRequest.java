package com.agenda.api.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Pattern;
import java.util.List;

/**
 * Atualização parcial (PATCH): campos nulos mantêm o valor atual.
 */
public record TenantSettingsRequest(
        @Pattern(regexp = ".*\\S.*", message = "Nome do salão não pode ficar em branco")
        String salonName,

        List<@Valid BusinessHourDto> businessHours
) {}
