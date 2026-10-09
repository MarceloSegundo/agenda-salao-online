package com.agenda.api.controller;

import com.agenda.api.dto.AppointmentResponseDTO;
import com.agenda.api.dto.AvailableSlotResponse;
import com.agenda.api.dto.CreateAppointmentRequest;
import com.agenda.api.dto.UpdateAppointmentStatusRequest;
import com.agenda.api.service.AppointmentService;
import com.agenda.api.service.AvailabilityService;
import org.springframework.format.annotation.DateTimeFormat;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/appointments")
public class AppointmentController {

    private final AppointmentService appointmentService;
    private final AvailabilityService availabilityService;

    public AppointmentController(AppointmentService appointmentService, AvailabilityService availabilityService) {
        this.appointmentService = appointmentService;
        this.availabilityService = availabilityService;
    }

    @PostMapping
    public ResponseEntity<AppointmentResponseDTO> create(@RequestBody @Valid CreateAppointmentRequest request) {
        AppointmentResponseDTO response = appointmentService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping
    public ResponseEntity<List<AppointmentResponseDTO>> listByDay(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return ResponseEntity.ok(appointmentService.listByDay(date));
    }

    /** Horários livres; sem professionalId, modo "qualquer profissional". */
    @GetMapping("/availability")
    public ResponseEntity<List<AvailableSlotResponse>> availability(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestParam UUID serviceId,
            @RequestParam(required = false) UUID professionalId) {
        return ResponseEntity.ok(availabilityService.findAvailableSlots(date, serviceId, professionalId));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<AppointmentResponseDTO> updateStatus(
            @PathVariable UUID id,
            @RequestBody @Valid UpdateAppointmentStatusRequest request) {
        return ResponseEntity.ok(appointmentService.updateStatus(id, request));
    }
}
