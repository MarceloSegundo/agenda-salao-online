package com.agenda.api.service;

import com.agenda.api.dto.*;
import com.agenda.api.exception.BusinessException;
import com.agenda.api.exception.ResourceNotFoundException;
import com.agenda.api.model.*;
import com.agenda.api.repository.*;
import com.agenda.api.security.TenantContext;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.DayOfWeek;
import java.util.List;
import com.agenda.api.model.base.BusinessHour;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class AppointmentService {

    private final AppointmentRepository appointmentRepository;
    private final CustomerRepository customerRepository;
    private final ProfessionalRepository professionalRepository;
    private final ServiceRepository serviceRepository;
    private final TenantRepository tenantRepository;
    private final WhatsAppNotificationService notificationService;

    public AppointmentService(AppointmentRepository appointmentRepository,
                              CustomerRepository customerRepository,
                              ProfessionalRepository professionalRepository,
                              ServiceRepository serviceRepository,
                              TenantRepository tenantRepository,
                              WhatsAppNotificationService notificationService) {
        this.appointmentRepository = appointmentRepository;
        this.customerRepository = customerRepository;
        this.professionalRepository = professionalRepository;
        this.serviceRepository = serviceRepository;
        this.tenantRepository = tenantRepository;
        this.notificationService = notificationService;
    }

    @Transactional
    public AppointmentResponseDTO create(CreateAppointmentRequest request) {
        Tenant tenant = tenantRepository.findById(TenantContext.getCurrentTenant())
                .orElseThrow(() -> new BusinessException("Tenant atual não encontrado."));

        Customer customer = customerRepository.findByIdInCurrentTenant(request.getCustomerId())
                .orElseThrow(() -> new ResourceNotFoundException("Cliente não encontrado"));

        Professional professional = professionalRepository.findByIdInCurrentTenant(request.getProfessionalId())
                .orElseThrow(() -> new ResourceNotFoundException("Profissional não encontrado"));

        com.agenda.api.model.Service service = serviceRepository.findByIdInCurrentTenant(request.getServiceId())
                .orElseThrow(() -> new ResourceNotFoundException("Serviço não encontrado"));

        if (!professional.isActive()) {
            throw new BusinessException("O profissional selecionado não está ativo.");
        }

        LocalDateTime startTime = request.getStartTime();
        LocalDateTime endTime = startTime.plusMinutes(service.getDurationMinutes());

        if (!startTime.toLocalDate().isEqual(endTime.toLocalDate())) {
            throw new BusinessException("O agendamento não pode ultrapassar a meia-noite.");
        }

        LocalTime startLocalTime = startTime.toLocalTime();
        LocalTime endLocalTime = endTime.toLocalTime();
        int dayOfWeekInt = startTime.getDayOfWeek().getValue(); // 1 (Monday) to 7 (Sunday)

        // Encontrar horário do profissional ou usar o da loja
        BusinessHour businessHour = professional.getBusinessHours().stream()
                .filter(bh -> bh.getDayOfWeek() == dayOfWeekInt)
                .findFirst()
                .orElse(null);

        if (businessHour == null) {
            businessHour = tenant.getBusinessHours().stream()
                    .filter(bh -> bh.getDayOfWeek() == dayOfWeekInt)
                    .findFirst()
                    .orElse(null);
        }

        if (businessHour == null || businessHour.isClosed()) {
            throw new BusinessException("O salão ou o profissional não está disponível neste dia.");
        }

        if (startLocalTime.isBefore(businessHour.getOpeningTime()) || endLocalTime.isAfter(businessHour.getClosingTime())) {
            throw new BusinessException("O horário agendado está fora do horário de funcionamento.");
        }

        boolean hasOverlap = appointmentRepository.hasOverlappingAppointment(
                professional.getId(), startTime, endTime);

        if (hasOverlap) {
            throw new BusinessException("O profissional já possui um agendamento neste horário.");
        }

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

    @Transactional(readOnly = true)
    public List<AppointmentResponseDTO> getAll() {
        return appointmentRepository.findAll().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public AppointmentResponseDTO updateStatus(UUID id, UpdateAppointmentStatusRequest request) {
        Appointment appointment = appointmentRepository.findByIdInCurrentTenant(id)
                .orElseThrow(() -> new ResourceNotFoundException("Agendamento não encontrado"));
        
        appointment.setStatus(request.getStatus());
        appointment = appointmentRepository.save(appointment);
        return mapToResponse(appointment);
    }

    private AppointmentResponseDTO mapToResponse(Appointment appointment) {
        AppointmentResponseDTO dto = new AppointmentResponseDTO();
        dto.setId(appointment.getId());
        dto.setCustomerName(appointment.getCustomer().getName());
        dto.setServiceName(appointment.getService().getName());
        dto.setProfessionalName(appointment.getProfessional().getName());
        dto.setStartTime(appointment.getStartTime());
        dto.setEndTime(appointment.getEndTime());
        dto.setDurationMinutes(appointment.getService().getDurationMinutes());
        dto.setStatus(appointment.getStatus());
        return dto;
    }
}
