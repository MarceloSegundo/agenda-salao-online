package com.agenda.api.dto;

import java.util.UUID;

public class AuthResponse {

    private String token;
    private String name;
    private String email;
    private UUID tenantId;

    public AuthResponse(String token, String name, String email, UUID tenantId) {
        this.token = token;
        this.name = name;
        this.email = email;
        this.tenantId = tenantId;
    }

    public String getToken() {
        return token;
    }

    public void setToken(String token) {
        this.token = token;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public UUID getTenantId() {
        return tenantId;
    }

    public void setTenantId(UUID tenantId) {
        this.tenantId = tenantId;
    }
}
