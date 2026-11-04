package com.agenda.api.controller;

import com.agenda.api.dto.dashboard.DashboardResponse;
import com.agenda.api.service.DashboardService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/dashboard")
public class DashboardController {

    private final DashboardService dashboardService;

    public DashboardController(DashboardService dashboardService) {
        this.dashboardService = dashboardService;
    }

    /** Operação do dia no fuso do salão: resumo, próximo atendimento, pendências e equipe. */
    @GetMapping("/today")
    public ResponseEntity<DashboardResponse> today() {
        return ResponseEntity.ok(dashboardService.today());
    }
}
