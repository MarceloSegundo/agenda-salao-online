package com.agenda.api.service;

import com.agenda.api.dto.AvailableSlotResponse;
import com.agenda.api.exception.BusinessException;
import com.agenda.api.exception.ConflictException;
import com.agenda.api.model.Appointment;
import com.agenda.api.model.Professional;
import com.agenda.api.model.Tenant;
import com.agenda.api.model.base.BusinessHour;
import com.agenda.api.repository.AppointmentRepository;
import com.agenda.api.repository.ProfessionalRepository;
import com.agenda.api.repository.ServiceRepository;
import com.agenda.api.repository.TenantRepository;
import com.agenda.api.security.TenantContext;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import java.time.Clock;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class AvailabilityServiceTest {

    private static final ZoneId ZONE = ZoneId.of("America/Sao_Paulo");
    private static final LocalDate MONDAY = LocalDate.of(2026, 10, 12);
    private static final LocalDate TUESDAY = MONDAY.plusDays(1);
    private static final LocalDate SATURDAY = MONDAY.plusDays(5);

    @Mock private TenantRepository tenantRepository;
    @Mock private ProfessionalRepository professionalRepository;
    @Mock private ServiceRepository serviceRepository;
    @Mock private AppointmentRepository appointmentRepository;

    private final UUID tenantId = UUID.randomUUID();
    private Tenant tenant;
    private com.agenda.api.model.Service service;
    private final List<Appointment> dayAppointments = new ArrayList<>();

    @BeforeEach
    void setUp() {
        TenantContext.setCurrentTenant(tenantId);

        tenant = new Tenant();
        tenant.setId(tenantId);
        List<BusinessHour> hours = new ArrayList<>();
        for (int day = 1; day <= 7; day++) {
            hours.add(new BusinessHour(day, LocalTime.of(8, 0), LocalTime.of(18, 0), day >= 6));
        }
        tenant.setBusinessHours(hours);
        when(tenantRepository.findById(tenantId)).thenReturn(Optional.of(tenant));

        service = new com.agenda.api.model.Service();
        service.setId(UUID.randomUUID());
        service.setName("Corte");
        service.setDurationMinutes(30);
        when(serviceRepository.findByIdInCurrentTenant(service.getId())).thenReturn(Optional.of(service));

        when(appointmentRepository.findActiveBetween(any(), any())).thenReturn(dayAppointments);
    }

    @AfterEach
    void tearDown() {
        TenantContext.clear();
    }

    @Test
    void usesSalonHoursWhenProfessionalHasNoConfigForTheDay() {
        Professional ana = professional("Ana");

        List<LocalTime> times = times(availability(at(MONDAY, 8, 0)).findAvailableSlots(MONDAY, service.getId(), ana.getId()));

        assertThat(times.get(0)).isEqualTo(LocalTime.of(8, 0));
        assertThat(times.get(times.size() - 1)).isEqualTo(LocalTime.of(17, 30));
    }

    @Test
    void intersectsSalonAndProfessionalHours() {
        Professional ana = professional("Ana", new BusinessHour(1, LocalTime.of(10, 0), LocalTime.of(20, 0), false));

        List<LocalTime> times = times(availability(at(MONDAY, 8, 0)).findAvailableSlots(MONDAY, service.getId(), ana.getId()));

        assertThat(times.get(0)).isEqualTo(LocalTime.of(10, 0));
        assertThat(times.get(times.size() - 1)).isEqualTo(LocalTime.of(17, 30));
    }

    @Test
    void noSlotsWhenSalonIsClosed() {
        Professional ana = professional("Ana");

        assertThat(availability(at(MONDAY, 8, 0)).findAvailableSlots(SATURDAY, service.getId(), ana.getId())).isEmpty();
    }

    @Test
    void noSlotsWhenProfessionalIsClosedThatDay() {
        Professional ana = professional("Ana", new BusinessHour(1, LocalTime.of(8, 0), LocalTime.of(18, 0), true));

        assertThat(availability(at(MONDAY, 8, 0)).findAvailableSlots(MONDAY, service.getId(), ana.getId())).isEmpty();
    }

    @Test
    void noSlotsWhenIntersectionIsEmpty() {
        Professional ana = professional("Ana", new BusinessHour(1, LocalTime.of(18, 0), LocalTime.of(22, 0), false));

        assertThat(availability(at(MONDAY, 8, 0)).findAvailableSlots(MONDAY, service.getId(), ana.getId())).isEmpty();
    }

    @Test
    void serviceMustFitBeforeClosing() {
        service.setDurationMinutes(45);
        Professional ana = professional("Ana");

        List<LocalTime> times = times(availability(at(MONDAY, 8, 0)).findAvailableSlots(MONDAY, service.getId(), ana.getId()));

        assertThat(times.get(times.size() - 1)).isEqualTo(LocalTime.of(17, 0));
    }

    @Test
    void skipsPastSlotsToday() {
        Professional ana = professional("Ana");
        AvailabilityService availability = availability(at(MONDAY, 10, 10));

        assertThat(times(availability.findAvailableSlots(MONDAY, service.getId(), ana.getId())).get(0))
                .isEqualTo(LocalTime.of(10, 30));
        assertThat(times(availability.findAvailableSlots(TUESDAY, service.getId(), ana.getId())).get(0))
                .isEqualTo(LocalTime.of(8, 0));
    }

    @Test
    void overlappingAppointmentRemovesSlots() {
        Professional ana = professional("Ana");
        dayAppointments.add(appointment(ana, MONDAY.atTime(9, 0), MONDAY.atTime(9, 45)));

        List<LocalTime> times = times(availability(at(MONDAY, 8, 0)).findAvailableSlots(MONDAY, service.getId(), ana.getId()));

        assertThat(times).doesNotContain(LocalTime.of(9, 0), LocalTime.of(9, 30));
        assertThat(times).contains(LocalTime.of(8, 30), LocalTime.of(10, 0));
    }

    @Test
    void canceledAppointmentDoesNotBlock() {
        Professional ana = professional("Ana");
        // findActiveBetween já exclui cancelados: com a lista vazia, nada bloqueia
        // (a exclusão em si é coberta pelo teste de integração canceledAppointmentFreesTheSlot)

        List<LocalTime> times = times(availability(at(MONDAY, 8, 0)).findAvailableSlots(MONDAY, service.getId(), ana.getId()));

        assertThat(times).contains(LocalTime.of(9, 0));
    }

    @Test
    void inactiveProfessionalHasNoSlots() {
        Professional ana = professional("Ana");
        ana.setActive(false);

        assertThat(availability(at(MONDAY, 8, 0)).findAvailableSlots(MONDAY, service.getId(), ana.getId())).isEmpty();
    }

    @Test
    void anyProfessionalAssignsTheOneWithFewestAppointments() {
        Professional ana = professional("Ana");
        Professional bruno = professional("Bruno");
        activeProfessionals(ana, bruno);
        dayAppointments.add(appointment(ana, MONDAY.atTime(14, 0), MONDAY.atTime(14, 30)));
        dayAppointments.add(appointment(ana, MONDAY.atTime(15, 0), MONDAY.atTime(15, 30)));

        AvailableSlotResponse first = availability(at(MONDAY, 8, 0)).findAvailableSlots(MONDAY, service.getId(), null).get(0);

        assertThat(first.time()).isEqualTo(LocalTime.of(8, 0));
        assertThat(first.professionalName()).isEqualTo("Bruno");
    }

    @Test
    void anyProfessionalTieBreaksByName() {
        activeProfessionals(professional("Bruno"), professional("Ana"));

        AvailableSlotResponse first = availability(at(MONDAY, 8, 0)).findAvailableSlots(MONDAY, service.getId(), null).get(0);

        assertThat(first.professionalName()).isEqualTo("Ana");
    }

    @Test
    void anyProfessionalSkipsBusyOnes() {
        Professional ana = professional("Ana");
        Professional bruno = professional("Bruno");
        activeProfessionals(ana, bruno);
        dayAppointments.add(appointment(ana, MONDAY.atTime(9, 0), MONDAY.atTime(9, 30)));
        // Bruno tem mais agendamentos no dia, mas é o único livre às 9h
        dayAppointments.add(appointment(bruno, MONDAY.atTime(14, 0), MONDAY.atTime(14, 30)));
        dayAppointments.add(appointment(bruno, MONDAY.atTime(15, 0), MONDAY.atTime(15, 30)));

        List<AvailableSlotResponse> slots = availability(at(MONDAY, 8, 0)).findAvailableSlots(MONDAY, service.getId(), null);

        AvailableSlotResponse nine = slots.stream().filter(s -> s.time().equals(LocalTime.of(9, 0))).findFirst().orElseThrow();
        assertThat(nine.professionalName()).isEqualTo("Bruno");
    }

    @Test
    void anyProfessionalWithNoActiveProfessionalsReturnsEmpty() {
        activeProfessionals();

        assertThat(availability(at(MONDAY, 8, 0)).findAvailableSlots(MONDAY, service.getId(), null)).isEmpty();
    }

    @Test
    void assertBookableRejectsOverlapWithConflict() {
        Professional ana = professional("Ana");
        when(appointmentRepository.hasOverlappingAppointment(eq(ana.getId()), any(), any())).thenReturn(true);

        assertThrows(ConflictException.class, () -> availability(at(MONDAY, 8, 0))
                .assertBookable(tenant, ana, MONDAY.atTime(10, 0), MONDAY.atTime(10, 30)));
    }

    @Test
    void assertBookableRejectsPastWithBusinessException() {
        Professional ana = professional("Ana");

        BusinessException ex = assertThrows(BusinessException.class, () -> availability(at(MONDAY, 11, 0))
                .assertBookable(tenant, ana, MONDAY.atTime(10, 0), MONDAY.atTime(10, 30)));

        assertThat(ex).isNotInstanceOf(ConflictException.class);
        assertThat(ex.getMessage()).isEqualTo("O horário de início não pode estar no passado.");
    }

    private AvailabilityService availability(Clock clock) {
        return new AvailabilityService(tenantRepository, professionalRepository, serviceRepository, appointmentRepository, clock);
    }

    private static Clock at(LocalDate date, int hour, int minute) {
        return Clock.fixed(date.atTime(hour, minute).atZone(ZONE).toInstant(), ZONE);
    }

    private Professional professional(String name, BusinessHour... hours) {
        Professional professional = new Professional();
        professional.setId(UUID.randomUUID());
        professional.setName(name);
        professional.setActive(true);
        professional.setBusinessHours(new ArrayList<>(List.of(hours)));
        when(professionalRepository.findByIdInCurrentTenant(professional.getId())).thenReturn(Optional.of(professional));
        return professional;
    }

    private void activeProfessionals(Professional... professionals) {
        when(professionalRepository.findByActiveTrueOrderByNameAsc()).thenReturn(List.of(professionals));
    }

    private static Appointment appointment(Professional professional, LocalDateTime start, LocalDateTime end) {
        Appointment appointment = new Appointment();
        appointment.setProfessional(professional);
        appointment.setStartTime(start);
        appointment.setEndTime(end);
        return appointment;
    }

    private static List<LocalTime> times(List<AvailableSlotResponse> slots) {
        return slots.stream().map(AvailableSlotResponse::time).toList();
    }
}
