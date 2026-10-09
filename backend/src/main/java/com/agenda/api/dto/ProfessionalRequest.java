package com.agenda.api.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.util.List;

public record ProfessionalRequest(
        @NotBlank(message = "Nome é obrigatório")
        String name,
        
        String specialization,
        
        @NotNull(message = "Status ativo/inativo é obrigatório")
        Boolean active,
        
        List<BusinessHourDto> businessHours
) {}
