package com.agenda.api.dto;

import com.agenda.api.model.AppointmentStatus;
import jakarta.validation.constraints.NotNull;

public class UpdateAppointmentStatusRequest {

    @NotNull(message = "O novo status é obrigatório")
    private AppointmentStatus status;

    public AppointmentStatus getStatus() { return status; }
    public void setStatus(AppointmentStatus status) { this.status = status; }
}
