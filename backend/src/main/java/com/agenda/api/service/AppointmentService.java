package com.agenda.api.service;

import com.agenda.api.dto.*;
import com.agenda.api.exception.BusinessException;
import com.agenda.api.exception.ResourceNotFoundException;
import com.agenda.api.model.*;
import com.agenda.api.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
public class AppointmentService {

    private final AppointmentRepository appointmentRepository;
    private final CustomerRepository customerRepository;
    private final ProfessionalRepository professionalRepository;
    private final ServiceRepository serviceRepository;
    private final WhatsAppNotificationService notificationService;

    public AppointmentService(AppointmentRepository appointmentRepository,
                              CustomerRepository customerRepository,
                              ProfessionalRepository professionalRepository,
                              ServiceRepository serviceRepository,
                              WhatsAppNotificationService notificationService) {
        this.appointmentRepository = appointmentRepository;
        this.customerRepository = customerRepository;
        this.professionalRepository = professionalRepository;
        this.serviceRepository = serviceRepository;
        this.notificationService = notificationService;
    }

    @Transactional
    public AppointmentResponse create(AppointmentRequest request) {
        if (request.endTime().isBefore(request.startTime()) || request.endTime().isEqual(request.startTime())) {
            throw new BusinessException("A data de término deve ser maior que a data de início.");
        }

        Customer customer = customerRepository.findById(request.customerId())
                .orElseThrow(() -> new ResourceNotFoundException("Cliente não encontrado"));

        Professional professional = professionalRepository.findById(request.professionalId())
                .orElseThrow(() -> new ResourceNotFoundException("Profissional não encontrado"));

        com.agenda.api.model.Service service = serviceRepository.findById(request.serviceId())
                .orElseThrow(() -> new ResourceNotFoundException("Serviço não encontrado"));

        if (!professional.isActive()) {
            throw new BusinessException("O profissional selecionado não está ativo.");
        }

        boolean hasOverlap = appointmentRepository.hasOverlappingAppointment(
                professional.getId(), request.startTime(), request.endTime());

        if (hasOverlap) {
            throw new BusinessException("O profissional já possui um agendamento neste horário.");
        }

        Appointment appointment = new Appointment();
        appointment.setCustomer(customer);
        appointment.setProfessional(professional);
        appointment.setService(service);
        appointment.setStartTime(request.startTime());
        appointment.setEndTime(request.endTime());
        appointment.setStatus(AppointmentStatus.PENDING);

        appointment = appointmentRepository.save(appointment);

        // Dispara notificação assíncrona
        if (customer.getPhone() != null && !customer.getPhone().isBlank()) {
            // Formata a data (exemplo simples)
            String formattedDate = request.startTime().toString(); // Poderia usar um DateTimeFormatter
            notificationService.sendAppointmentConfirmation(
                    customer.getName(), 
                    customer.getPhone(), 
                    service.getName(), 
                    formattedDate);
        }

        return mapToResponse(appointment);
    }

    private AppointmentResponse mapToResponse(Appointment appointment) {
        return new AppointmentResponse(
                appointment.getId(),
                new CustomerResponse(appointment.getCustomer().getId(), appointment.getCustomer().getName(), appointment.getCustomer().getPhone(), appointment.getCustomer().getEmail()),
                new ProfessionalResponse(appointment.getProfessional().getId(), appointment.getProfessional().getName(), appointment.getProfessional().getSpecialization(), appointment.getProfessional().isActive()),
                new ServiceResponse(appointment.getService().getId(), appointment.getService().getName(), appointment.getService().getDescription(), appointment.getService().getPrice(), appointment.getService().getDurationMinutes(), appointment.getService().isRequiresOnlinePayment()),
                appointment.getStartTime(),
                appointment.getEndTime(),
                appointment.getStatus()
        );
    }
}
