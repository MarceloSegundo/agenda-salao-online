package com.agenda.api.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record CustomerRequest(
        @NotBlank(message = "Nome é obrigatório")
        String name,
        
        @NotBlank(message = "Telefone é obrigatório")
        @Pattern(regexp = "^\\+?[1-9]\\d{1,14}$", message = "Telefone em formato inválido")
        String phone,
        
        @Email(message = "E-mail inválido")
        String email
) {}
