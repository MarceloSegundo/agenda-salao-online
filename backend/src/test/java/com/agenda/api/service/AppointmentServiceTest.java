package com.agenda.api.service;

import com.agenda.api.dto.AppointmentResponseDTO;
import com.agenda.api.dto.CreateAppointmentRequest;
import com.agenda.api.dto.UpdateAppointmentStatusRequest;
import com.agenda.api.exception.BusinessException;
import com.agenda.api.exception.ConflictException;
import com.agenda.api.model.*;
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
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * Orquestração da criação e da troca de status. As regras de horário
 * (expediente, passado, sobreposição) estão no AvailabilityServiceTest.
 */
@ExtendWith(MockitoExtension.class)
public class AppointmentServiceTest {

    @Mock private AppointmentRepository appointmentRepository;
    @Mock private CustomerRepository customerRepository;
    @Mock private ProfessionalRepository professionalRepository;
    @Mock private ServiceRepository serviceRepository;
    @Mock private TenantRepository tenantRepository;
    @Mock private AvailabilityService availabilityService;
    @Mock private WhatsAppNotificationService notificationService;

    @InjectMocks
    private AppointmentService appointmentService;

    private Customer customer;
    private Professional professional;
    private com.agenda.api.model.Service service;
    private Tenant tenant;
    private CreateAppointmentRequest request;

    private final UUID tenantId = UUID.randomUUID();

    @BeforeEach
    void setUp() {
        TenantContext.setCurrentTenant(tenantId);

        tenant = new Tenant();
        tenant.setId(tenantId);

        customer = new Customer();
        customer.setId(UUID.randomUUID());
        customer.setName("Maria");

        professional = new Professional();
        professional.setId(UUID.randomUUID());
        professional.setName("Carlos");
        professional.setActive(true);

        service = new com.agenda.api.model.Service();
        service.setId(UUID.randomUUID());
        service.setName("Corte");
        service.setPrice(new BigDecimal("50.0"));
        service.setDurationMinutes(60);

        request = new CreateAppointmentRequest();
        request.setCustomerId(customer.getId());
        request.setProfessionalId(professional.getId());
        request.setServiceId(service.getId());
        request.setStartTime(LocalDateTime.now().plusDays(1).withHour(10).withMinute(0).withSecond(0).withNano(0));
    }

    @AfterEach
    void tearDown() {
        TenantContext.clear();
    }

    @Test
    void shouldCreateAppointmentSuccessfully() {
        stubCreateLookups();
        when(appointmentRepository.save(any(Appointment.class))).thenAnswer(inv -> inv.getArgument(0));

        AppointmentResponseDTO response = appointmentService.create(request);

        assertEquals(AppointmentStatus.PENDING, response.getStatus());
        assertEquals(request.getStartTime().plusMinutes(60), response.getEndTime());
        verify(availabilityService).assertBookable(tenant, professional, request.getStartTime(), request.getStartTime().plusMinutes(60));
        verify(professionalRepository).findByIdForUpdate(professional.getId(), tenantId);
    }

    @Test
    void shouldPropagateConflictFromAvailability() {
        stubCreateLookups();
        doThrow(new ConflictException("O profissional já possui um agendamento neste horário."))
                .when(availabilityService).assertBookable(any(), any(), any(), any());

        assertThrows(ConflictException.class, () -> appointmentService.create(request));
        verify(appointmentRepository, never()).save(any());
    }

    @Test
    void shouldNotChangeStatusOfCanceledAppointment() {
        assertStatusIsFinal(AppointmentStatus.CANCELED);
    }

    @Test
    void shouldNotChangeStatusOfCompletedAppointment() {
        assertStatusIsFinal(AppointmentStatus.COMPLETED);
    }

    private void assertStatusIsFinal(AppointmentStatus current) {
        Appointment appointment = new Appointment();
        appointment.setId(UUID.randomUUID());
        appointment.setStatus(current);
        when(appointmentRepository.findByIdInCurrentTenant(appointment.getId())).thenReturn(Optional.of(appointment));
        UpdateAppointmentStatusRequest update = new UpdateAppointmentStatusRequest();
        update.setStatus(AppointmentStatus.CONFIRMED);

        BusinessException ex = assertThrows(BusinessException.class,
                () -> appointmentService.updateStatus(appointment.getId(), update));

        assertEquals("Agendamento cancelado ou concluído não pode mudar de status.", ex.getMessage());
        verify(appointmentRepository, never()).save(any());
    }

    private void stubCreateLookups() {
        when(tenantRepository.findById(tenantId)).thenReturn(Optional.of(tenant));
        when(customerRepository.findByIdInCurrentTenant(customer.getId())).thenReturn(Optional.of(customer));
        when(professionalRepository.findByIdForUpdate(professional.getId(), tenantId)).thenReturn(Optional.of(professional));
        when(serviceRepository.findByIdInCurrentTenant(service.getId())).thenReturn(Optional.of(service));
    }
}
