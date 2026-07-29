package com.agenda.api.dto;

import java.util.UUID;

public record CustomerResponse(
        UUID id,
        String name,
        String phone,
        String email
) {}
