package com.agenda.api.controller;

import com.agenda.api.dto.TenantRegistrationRequest;
import com.agenda.api.model.Tenant;
import com.agenda.api.service.TenantService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/tenants")
public class TenantController {

    private final TenantService tenantService;

    public TenantController(TenantService tenantService) {
        this.tenantService = tenantService;
    }

    @PostMapping("/register")
    public ResponseEntity<Tenant> registerTenant(@Valid @RequestBody TenantRegistrationRequest request) {
        Tenant tenant = tenantService.registerTenant(request);
        return new ResponseEntity<>(tenant, HttpStatus.CREATED);
    }

    @org.springframework.web.bind.annotation.GetMapping("/me")
    public ResponseEntity<com.agenda.api.dto.TenantResponse> getCurrentTenant() {
        return ResponseEntity.ok(tenantService.getCurrentTenant());
    }

    @org.springframework.web.bind.annotation.PatchMapping("/settings")
    public ResponseEntity<com.agenda.api.dto.TenantResponse> updateSettings(@Valid @RequestBody com.agenda.api.dto.TenantSettingsRequest request) {
        return ResponseEntity.ok(tenantService.updateSettings(request));
    }
}
