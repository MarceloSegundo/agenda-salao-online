package com.agenda.api.controller;

import com.agenda.api.dto.AppointmentResponseDTO;
import com.agenda.api.dto.CreateAppointmentRequest;
import com.agenda.api.dto.UpdateAppointmentStatusRequest;
import com.agenda.api.service.AppointmentService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/appointments")
public class AppointmentController {

    private final AppointmentService appointmentService;

    public AppointmentController(AppointmentService appointmentService) {
        this.appointmentService = appointmentService;
    }

    @PostMapping
    public ResponseEntity<AppointmentResponseDTO> create(@RequestBody @Valid CreateAppointmentRequest request) {
        AppointmentResponseDTO response = appointmentService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping
    public ResponseEntity<List<AppointmentResponseDTO>> getAll() {
        return ResponseEntity.ok(appointmentService.getAll());
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<AppointmentResponseDTO> updateStatus(
            @PathVariable UUID id,
            @RequestBody @Valid UpdateAppointmentStatusRequest request) {
        return ResponseEntity.ok(appointmentService.updateStatus(id, request));
    }
}
