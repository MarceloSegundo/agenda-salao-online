package com.agenda.api.service;

import com.agenda.api.dto.*;
import com.agenda.api.exception.BusinessException;
import com.agenda.api.model.*;
import com.agenda.api.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class AppointmentServiceTest {

    @Mock
    private AppointmentRepository appointmentRepository;
    
    @Mock
    private CustomerRepository customerRepository;
    
    @Mock
    private ProfessionalRepository professionalRepository;
    
    @Mock
    private ServiceRepository serviceRepository;

    @Mock
    private WhatsAppNotificationService notificationService;

    @InjectMocks
    private AppointmentService appointmentService;

    private Customer customer;
    private Professional professional;
    private com.agenda.api.model.Service service;
    private AppointmentRequest request;

    private final UUID customerId = UUID.randomUUID();
    private final UUID professionalId = UUID.randomUUID();
    private final UUID serviceId = UUID.randomUUID();

    @BeforeEach
    void setUp() {
        customer = new Customer();
        customer.setId(customerId);
        customer.setName("Maria");

        professional = new Professional();
        professional.setId(professionalId);
        professional.setName("Carlos");
        professional.setActive(true);

        service = new com.agenda.api.model.Service();
        service.setId(serviceId);
        service.setName("Corte");
        service.setPrice(new BigDecimal("50.0"));

        LocalDateTime startTime = LocalDateTime.now().plusDays(1).withHour(10).withMinute(0);
        LocalDateTime endTime = startTime.plusMinutes(30);

        request = new AppointmentRequest(customerId, professionalId, serviceId, startTime, endTime);
    }

    @Test
    void shouldCreateAppointmentSuccessfully() {
        when(customerRepository.findById(customerId)).thenReturn(Optional.of(customer));
        when(professionalRepository.findById(professionalId)).thenReturn(Optional.of(professional));
        when(serviceRepository.findById(serviceId)).thenReturn(Optional.of(service));
        
        when(appointmentRepository.hasOverlappingAppointment(eq(professionalId), any(), any())).thenReturn(false);

        Appointment savedAppointment = new Appointment();
        savedAppointment.setId(UUID.randomUUID());
        savedAppointment.setCustomer(customer);
        savedAppointment.setProfessional(professional);
        savedAppointment.setService(service);
        savedAppointment.setStartTime(request.startTime());
        savedAppointment.setEndTime(request.endTime());
        savedAppointment.setStatus(AppointmentStatus.PENDING);

        when(appointmentRepository.save(any(Appointment.class))).thenReturn(savedAppointment);

        AppointmentResponse response = appointmentService.create(request);

        assertNotNull(response);
        assertEquals(AppointmentStatus.PENDING, response.status());
        verify(appointmentRepository, times(1)).save(any(Appointment.class));
    }

    @Test
    void shouldThrowExceptionWhenTimeOverlaps() {
        when(customerRepository.findById(customerId)).thenReturn(Optional.of(customer));
        when(professionalRepository.findById(professionalId)).thenReturn(Optional.of(professional));
        when(serviceRepository.findById(serviceId)).thenReturn(Optional.of(service));
        
        when(appointmentRepository.hasOverlappingAppointment(eq(professionalId), any(), any())).thenReturn(true);

        BusinessException exception = assertThrows(BusinessException.class, () -> appointmentService.create(request));
        
        assertEquals("O profissional já possui um agendamento neste horário.", exception.getMessage());
        verify(appointmentRepository, never()).save(any(Appointment.class));
    }
}
