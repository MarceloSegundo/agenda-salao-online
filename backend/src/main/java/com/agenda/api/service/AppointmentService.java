package com.agenda.api.service;

import com.agenda.api.dto.*;
import com.agenda.api.exception.BusinessException;
import com.agenda.api.exception.ResourceNotFoundException;
import com.agenda.api.model.*;
import com.agenda.api.repository.*;
import com.agenda.api.security.TenantContext;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
public class AppointmentService {

    private final AppointmentRepository appointmentRepository;
    private final CustomerRepository customerRepository;
    private final ProfessionalRepository professionalRepository;
    private final ServiceRepository serviceRepository;
    private final TenantRepository tenantRepository;
    private final AvailabilityService availabilityService;
    private final WhatsAppNotificationService notificationService;

    public AppointmentService(AppointmentRepository appointmentRepository,
                              CustomerRepository customerRepository,
                              ProfessionalRepository professionalRepository,
                              ServiceRepository serviceRepository,
                              TenantRepository tenantRepository,
                              AvailabilityService availabilityService,
                              WhatsAppNotificationService notificationService) {
        this.appointmentRepository = appointmentRepository;
        this.customerRepository = customerRepository;
        this.professionalRepository = professionalRepository;
        this.serviceRepository = serviceRepository;
        this.tenantRepository = tenantRepository;
        this.availabilityService = availabilityService;
        this.notificationService = notificationService;
    }

    @Transactional
    public AppointmentResponseDTO create(CreateAppointmentRequest request) {
        UUID tenantId = TenantContext.getCurrentTenant();
        Tenant tenant = tenantRepository.findById(tenantId)
                .orElseThrow(() -> new BusinessException("Tenant atual não encontrado."));

        Customer customer = customerRepository.findByIdInCurrentTenant(request.getCustomerId())
                .orElseThrow(() -> new ResourceNotFoundException("Cliente não encontrado"));

        com.agenda.api.model.Service service = serviceRepository.findByIdInCurrentTenant(request.getServiceId())
                .orElseThrow(() -> new ResourceNotFoundException("Serviço não encontrado"));

        // Trava a linha do profissional até o fim da transação: duas criações
        // simultâneas para ele passam uma de cada vez pela checagem de conflito
        Professional professional = professionalRepository.findByIdForUpdate(request.getProfessionalId(), tenantId)
                .orElseThrow(() -> new ResourceNotFoundException("Profissional não encontrado"));

        LocalDateTime startTime = request.getStartTime();
        LocalDateTime endTime = startTime.plusMinutes(service.getDurationMinutes());
        availabilityService.assertBookable(tenant, professional, startTime, endTime);

        Appointment appointment = new Appointment();
        appointment.setCustomer(customer);
        appointment.setProfessional(professional);
        appointment.setService(service);
        appointment.setStartTime(startTime);
        appointment.setEndTime(endTime);
        appointment.setStatus(AppointmentStatus.PENDING);
        // Tenant is automatically set by the BaseTenantEntity listener

        appointment = appointmentRepository.save(appointment);

        if (customer.getPhone() != null && !customer.getPhone().isBlank()) {
            String formattedDate = startTime.toString();
            notificationService.sendAppointmentConfirmation(
                    customer.getName(),
                    customer.getPhone(),
                    service.getName(),
                    formattedDate);
        }

        return mapToResponse(appointment);
    }

    /** Agenda do dia, em ordem de horário, incluindo cancelados. */
    @Transactional(readOnly = true)
    public List<AppointmentResponseDTO> listByDay(LocalDate date) {
        LocalDateTime dayStart = date.atStartOfDay();
        return appointmentRepository
                .findByStartTimeGreaterThanEqualAndStartTimeLessThanOrderByStartTimeAsc(dayStart, dayStart.plusDays(1))
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Transactional
    public AppointmentResponseDTO updateStatus(UUID id, UpdateAppointmentStatusRequest request) {
        Appointment appointment = appointmentRepository.findByIdInCurrentTenant(id)
                .orElseThrow(() -> new ResourceNotFoundException("Agendamento não encontrado"));

        if (appointment.getStatus() == AppointmentStatus.CANCELED
                || appointment.getStatus() == AppointmentStatus.COMPLETED) {
            throw new BusinessException("Agendamento cancelado ou concluído não pode mudar de status.");
        }

        appointment.setStatus(request.getStatus());
        appointment = appointmentRepository.save(appointment);
        return mapToResponse(appointment);
    }

    private AppointmentResponseDTO mapToResponse(Appointment appointment) {
        AppointmentResponseDTO dto = new AppointmentResponseDTO();
        dto.setId(appointment.getId());
        dto.setCustomerName(appointment.getCustomer().getName());
        dto.setServiceName(appointment.getService().getName());
        dto.setProfessionalId(appointment.getProfessional().getId());
        dto.setProfessionalName(appointment.getProfessional().getName());
        dto.setStartTime(appointment.getStartTime());
        dto.setEndTime(appointment.getEndTime());
        dto.setDurationMinutes(appointment.getService().getDurationMinutes());
        dto.setStatus(appointment.getStatus());
        return dto;
    }
}
