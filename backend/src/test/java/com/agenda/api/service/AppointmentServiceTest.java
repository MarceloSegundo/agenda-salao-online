package com.agenda.api.service;

import com.agenda.api.dto.*;
import com.agenda.api.exception.BusinessException;
import com.agenda.api.model.*;
import com.agenda.api.model.base.BusinessHour;
import com.agenda.api.repository.*;
import com.agenda.api.security.TenantContext;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.Optional;
import java.util.UUID;
import java.util.List;
import java.util.ArrayList;

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
    private TenantRepository tenantRepository;

    @Mock
    private WhatsAppNotificationService notificationService;

    @InjectMocks
    private AppointmentService appointmentService;

    private Customer customer;
    private Professional professional;
    private com.agenda.api.model.Service service;
    private Tenant tenant;
    private CreateAppointmentRequest request;

    private final UUID tenantId = UUID.randomUUID();
    private final UUID customerId = UUID.randomUUID();
    private final UUID professionalId = UUID.randomUUID();
    private final UUID serviceId = UUID.randomUUID();

    @BeforeEach
    void setUp() {
        TenantContext.setCurrentTenant(tenantId);
        
        tenant = new Tenant();
        tenant.setId(tenantId);
        
        List<BusinessHour> hours = new ArrayList<>();
        for (int i = 1; i <= 7; i++) {
            hours.add(new BusinessHour(i, LocalTime.of(8, 0), LocalTime.of(18, 0), false));
        }
        tenant.setBusinessHours(hours);

        customer = new Customer();
        customer.setId(customerId);
        customer.setName("Maria");

        professional = new Professional();
        professional.setId(professionalId);
        professional.setName("Carlos");
        professional.setActive(true);
        professional.setBusinessHours(new ArrayList<>());

        service = new com.agenda.api.model.Service();
        service.setId(serviceId);
        service.setName("Corte");
        service.setPrice(new BigDecimal("50.0"));
        service.setDurationMinutes(60);

        LocalDateTime startTime = LocalDateTime.now().plusDays(1).withHour(10).withMinute(0);

        request = new CreateAppointmentRequest();
        request.setCustomerId(customerId);
        request.setProfessionalId(professionalId);
        request.setServiceId(serviceId);
        request.setStartTime(startTime);
    }
    
    @AfterEach
    void tearDown() {
        TenantContext.clear();
    }

    @Test
    void shouldCreateAppointmentSuccessfully() {
        when(tenantRepository.findById(tenantId)).thenReturn(Optional.of(tenant));
        when(customerRepository.findById(customerId)).thenReturn(Optional.of(customer));
        when(professionalRepository.findById(professionalId)).thenReturn(Optional.of(professional));
        when(serviceRepository.findById(serviceId)).thenReturn(Optional.of(service));
        
        when(appointmentRepository.hasOverlappingAppointment(eq(professionalId), any(), any())).thenReturn(false);

        Appointment savedAppointment = new Appointment();
        savedAppointment.setId(UUID.randomUUID());
        savedAppointment.setCustomer(customer);
        savedAppointment.setProfessional(professional);
        savedAppointment.setService(service);
        savedAppointment.setStartTime(request.getStartTime());
        savedAppointment.setEndTime(request.getStartTime().plusMinutes(service.getDurationMinutes()));
        savedAppointment.setStatus(AppointmentStatus.PENDING);

        when(appointmentRepository.save(any(Appointment.class))).thenReturn(savedAppointment);

        AppointmentResponseDTO response = appointmentService.create(request);

        assertNotNull(response);
        assertEquals(AppointmentStatus.PENDING, response.getStatus());
        assertEquals(60, response.getDurationMinutes());
        verify(appointmentRepository, times(1)).save(any(Appointment.class));
    }

    @Test
    void shouldThrowExceptionWhenTimeOverlaps() {
        when(tenantRepository.findById(tenantId)).thenReturn(Optional.of(tenant));
        when(customerRepository.findById(customerId)).thenReturn(Optional.of(customer));
        when(professionalRepository.findById(professionalId)).thenReturn(Optional.of(professional));
        when(serviceRepository.findById(serviceId)).thenReturn(Optional.of(service));
        
        when(appointmentRepository.hasOverlappingAppointment(eq(professionalId), any(), any())).thenReturn(true);

        BusinessException exception = assertThrows(BusinessException.class, () -> appointmentService.create(request));
        
        assertEquals("O profissional já possui um agendamento neste horário.", exception.getMessage());
        verify(appointmentRepository, never()).save(any(Appointment.class));
    }

    @Test
    void shouldThrowExceptionWhenOutsideBusinessHours() {
        when(tenantRepository.findById(tenantId)).thenReturn(Optional.of(tenant));
        when(customerRepository.findById(customerId)).thenReturn(Optional.of(customer));
        when(professionalRepository.findById(professionalId)).thenReturn(Optional.of(professional));
        when(serviceRepository.findById(serviceId)).thenReturn(Optional.of(service));
        
        // 17:30 with 60m duration ends at 18:30 (outside business hours, closing is 18:00)
        request.setStartTime(LocalDateTime.now().plusDays(1).withHour(17).withMinute(30));

        BusinessException exception = assertThrows(BusinessException.class, () -> appointmentService.create(request));
        
        assertEquals("O horário agendado está fora do horário de funcionamento.", exception.getMessage());
        verify(appointmentRepository, never()).save(any(Appointment.class));
    }
    
    @Test
    void shouldThrowExceptionWhenCrossingMidnight() {
        when(tenantRepository.findById(tenantId)).thenReturn(Optional.of(tenant));
        when(customerRepository.findById(customerId)).thenReturn(Optional.of(customer));
        when(professionalRepository.findById(professionalId)).thenReturn(Optional.of(professional));
        when(serviceRepository.findById(serviceId)).thenReturn(Optional.of(service));
        
        // Set tenant closing time to next day somehow? Actually, the rule just prevents midnight cross
        request.setStartTime(LocalDateTime.now().plusDays(1).withHour(23).withMinute(30));

        BusinessException exception = assertThrows(BusinessException.class, () -> appointmentService.create(request));
        
        assertEquals("O agendamento não pode ultrapassar a meia-noite.", exception.getMessage());
        verify(appointmentRepository, never()).save(any(Appointment.class));
    }

    @Test
    void shouldThrowExceptionWhenProfessionalIsClosedOnDay() {
        when(tenantRepository.findById(tenantId)).thenReturn(Optional.of(tenant));
        when(customerRepository.findById(customerId)).thenReturn(Optional.of(customer));
        when(professionalRepository.findById(professionalId)).thenReturn(Optional.of(professional));
        when(serviceRepository.findById(serviceId)).thenReturn(Optional.of(service));
        
        // Start time is set to tomorrow
        LocalDateTime startTime = request.getStartTime();
        int dayOfWeekInt = startTime.getDayOfWeek().getValue();

        // Professional has custom hour setting for this day: closed
        List<BusinessHour> profHours = new ArrayList<>();
        profHours.add(new BusinessHour(dayOfWeekInt, LocalTime.of(8, 0), LocalTime.of(18, 0), true));
        professional.setBusinessHours(profHours);

        BusinessException exception = assertThrows(BusinessException.class, () -> appointmentService.create(request));
        
        assertEquals("O salão ou o profissional não está disponível neste dia.", exception.getMessage());
        verify(appointmentRepository, never()).save(any(Appointment.class));
    }

    @Test
    void shouldCreateAppointmentWhenWithinProfessionalCustomHours() {
        when(tenantRepository.findById(tenantId)).thenReturn(Optional.of(tenant));
        when(customerRepository.findById(customerId)).thenReturn(Optional.of(customer));
        when(professionalRepository.findById(professionalId)).thenReturn(Optional.of(professional));
        when(serviceRepository.findById(serviceId)).thenReturn(Optional.of(service));
        when(appointmentRepository.hasOverlappingAppointment(eq(professionalId), any(), any())).thenReturn(false);

        // Start time is set to tomorrow
        LocalDateTime startTime = request.getStartTime();
        int dayOfWeekInt = startTime.getDayOfWeek().getValue();

        // Professional has custom hour setting for this day, which differs from tenant
        List<BusinessHour> profHours = new ArrayList<>();
        // Professional opens at 09:00 instead of 08:00 (tenant)
        profHours.add(new BusinessHour(dayOfWeekInt, LocalTime.of(9, 0), LocalTime.of(12, 0), false));
        professional.setBusinessHours(profHours);

        // If requested at 08:30, it should fail (before professional opens)
        request.setStartTime(startTime.withHour(8).withMinute(30));
        BusinessException exception = assertThrows(BusinessException.class, () -> appointmentService.create(request));
        assertEquals("O horário agendado está fora do horário de funcionamento.", exception.getMessage());

        // If requested at 10:00, it should pass
        request.setStartTime(startTime.withHour(10).withMinute(0));
        
        Appointment savedAppointment = new Appointment();
        savedAppointment.setId(UUID.randomUUID());
        savedAppointment.setCustomer(customer);
        savedAppointment.setProfessional(professional);
        savedAppointment.setService(service);
        savedAppointment.setStartTime(request.getStartTime());
        savedAppointment.setEndTime(request.getStartTime().plusMinutes(service.getDurationMinutes()));
        savedAppointment.setStatus(AppointmentStatus.PENDING);
        
        when(appointmentRepository.save(any(Appointment.class))).thenReturn(savedAppointment);

        AppointmentResponseDTO response = appointmentService.create(request);
        assertNotNull(response);
        verify(appointmentRepository, times(1)).save(any(Appointment.class));
    }
}
