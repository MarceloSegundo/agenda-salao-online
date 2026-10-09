package com.agenda.api.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record CustomerRequest(
        @NotBlank(message = "Nome é obrigatório")
        String name,
        
        @NotBlank(message = "Telefone é obrigatório")
        // Aceita formatação comum; o serviço guarda só os dígitos
        @Pattern(regexp = "^\\+?[0-9 ().-]{8,25}$", message = "Telefone em formato inválido")
        String phone,
        
        @Email(message = "E-mail inválido")
        String email
) {}
