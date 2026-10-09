package com.agenda.api.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import java.time.LocalTime;

public record BusinessHourDto(
        @NotNull(message = "O dia da semana é obrigatório")
        @Min(value = 1, message = "Dia da semana deve ser entre 1 e 7")
        @Max(value = 7, message = "Dia da semana deve ser entre 1 e 7")
        Integer dayOfWeek,

        LocalTime openingTime,
        
        LocalTime closingTime,
        
        boolean isClosed
) {}
