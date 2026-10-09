package com.agenda.api.exception;

import java.util.Map;

/**
 * Conflito com o estado atual (HTTP 409): horário que deixou de estar livre,
 * registro duplicado. Estende BusinessException para que quem trata regra de
 * negócio também trate conflito; o handler mais específico responde 409.
 */
public class ConflictException extends BusinessException {

    private final Map<String, String> details;

    public ConflictException(String message) {
        this(message, null);
    }

    public ConflictException(String message, Map<String, String> details) {
        super(message);
        this.details = details;
    }

    public Map<String, String> getDetails() {
        return details;
    }
}
