package com.agenda.api.service;

import com.agenda.api.dto.dashboard.DashboardAppointmentDto;
import com.agenda.api.dto.dashboard.DashboardResponse;
import com.agenda.api.dto.dashboard.TeamMemberDto;
import com.agenda.api.dto.dashboard.TeamMemberState;
import com.agenda.api.model.Appointment;
import com.agenda.api.model.AppointmentStatus;
import com.agenda.api.model.Customer;
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

import java.math.BigDecimal;
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
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class DashboardServiceTest {

    private static final ZoneId ZONE = ZoneId.of("America/Sao_Paulo");
    private static final LocalDate MONDAY = LocalDate.of(2026, 10, 12);
    // "Agora" de todos os testes: segunda às 10:00
    private static final Clock CLOCK = Clock.fixed(MONDAY.atTime(10, 0).atZone(ZONE).toInstant(), ZONE);

    @Mock private TenantRepository tenantRepository;
    @Mock private ProfessionalRepository professionalRepository;
    @Mock private ServiceRepository serviceRepository;
    @Mock private AppointmentRepository appointmentRepository;

    private final UUID tenantId = UUID.randomUUID();
    private final List<Appointment> appointments = new ArrayList<>();
    private final List<Professional> activeProfessionals = new ArrayList<>();
    private Professional carlos;
    private DashboardService dashboard;

    @BeforeEach
    void setUp() {
        TenantContext.setCurrentTenant(tenantId);

        Tenant tenant = new Tenant();
        tenant.setId(tenantId);
        tenant.setName("Salão da Maria");
        List<BusinessHour> hours = new ArrayList<>();
        for (int day = 1; day <= 7; day++) {
            hours.add(new BusinessHour(day, LocalTime.of(8, 0), LocalTime.of(18, 0), day >= 6));
        }
        tenant.setBusinessHours(hours);
        when(tenantRepository.findById(tenantId)).thenReturn(Optional.of(tenant));

        when(appointmentRepository.findWithDetailsBetween(any(), any())).thenReturn(appointments);
        when(professionalRepository.findByActiveTrueOrderByNameAsc()).thenReturn(activeProfessionals);

        carlos = professional("Carlos");

        AvailabilityService availability = new AvailabilityService(
                tenantRepository, professionalRepository, serviceRepository, appointmentRepository, CLOCK);
        dashboard = new DashboardService(tenantRepository, professionalRepository, appointmentRepository, availability, CLOCK);
    }

    @AfterEach
    void tearDown() {
        TenantContext.clear();
    }

    @Test
    void summaryCountsAndRevenue() {
        add(carlos, MONDAY.atTime(11, 0), AppointmentStatus.PENDING, "30.00");
        add(carlos, MONDAY.atTime(12, 0), AppointmentStatus.CONFIRMED, "40.00");
        add(carlos, MONDAY.atTime(8, 0), AppointmentStatus.COMPLETED, "50.00");
        add(carlos, MONDAY.atTime(13, 0), AppointmentStatus.CANCELED, "60.00");
        add(carlos, MONDAY.plusDays(1).atTime(9, 0), AppointmentStatus.PENDING, "99.00");

        var summary = dashboard.today().summary();

        assertThat(summary.total()).isEqualTo(3);
        assertThat(summary.completed()).isEqualTo(1);
        assertThat(summary.toConfirm()).isEqualTo(1);
        assertThat(summary.canceled()).isEqualTo(1);
        assertThat(summary.expectedRevenue()).isEqualByComparingTo("120.00");
        assertThat(summary.realizedRevenue()).isEqualByComparingTo("50.00");
    }

    @Test
    void responseCarriesDateAndSalonName() {
        DashboardResponse response = dashboard.today();

        assertThat(response.date()).isEqualTo(MONDAY);
        assertThat(response.salonName()).isEqualTo("Salão da Maria");
    }

    @Test
    void nextIsInProgressAppointment() {
        add(carlos, MONDAY.atTime(9, 45), AppointmentStatus.CONFIRMED, "30.00");
        add(carlos, MONDAY.atTime(10, 30), AppointmentStatus.PENDING, "30.00");

        DashboardAppointmentDto next = dashboard.today().next();

        assertThat(next.startTime()).isEqualTo(MONDAY.atTime(9, 45));
        assertThat(next.inProgress()).isTrue();
    }

    @Test
    void nextIsFutureWhenNothingInProgress() {
        Appointment eleven = add(carlos, MONDAY.atTime(11, 0), AppointmentStatus.PENDING, "30.00");

        DashboardAppointmentDto next = dashboard.today().next();

        assertThat(next.id()).isEqualTo(eleven.getId());
        assertThat(next.inProgress()).isFalse();
        assertThat(next.customerPhone()).isEqualTo("5586999990000");
    }

    @Test
    void nextSkipsTodayAppointmentThatAlreadyEnded() {
        add(carlos, MONDAY.atTime(9, 0), AppointmentStatus.CONFIRMED, "30.00");
        add(carlos, MONDAY.atTime(11, 0), AppointmentStatus.PENDING, "30.00");

        DashboardResponse response = dashboard.today();

        assertThat(response.next().startTime()).isEqualTo(MONDAY.atTime(11, 0));
        assertThat(response.pending().overdue()).extracting(DashboardAppointmentDto::startTime)
                .containsExactly(MONDAY.atTime(9, 0));
    }

    @Test
    void nextIsNullWhenNothingOpenRemains() {
        add(carlos, MONDAY.atTime(8, 0), AppointmentStatus.COMPLETED, "30.00");
        add(carlos, MONDAY.atTime(11, 0), AppointmentStatus.CANCELED, "30.00");

        assertThat(dashboard.today().next()).isNull();
    }

    @Test
    void yesterdayOpenAppointmentIsOverdueNotNext() {
        add(carlos, MONDAY.minusDays(1).atTime(17, 0), AppointmentStatus.PENDING, "30.00");

        DashboardResponse response = dashboard.today();

        assertThat(response.next()).isNull();
        assertThat(response.pending().overdue()).hasSize(1);
    }

    @Test
    void overdueItemsAreNotInProgress() {
        add(carlos, MONDAY.minusDays(1).atTime(17, 0), AppointmentStatus.PENDING, "30.00");

        assertThat(dashboard.today().pending().overdue().get(0).inProgress()).isFalse();
    }

    @Test
    void toConfirmUntilEndOfTomorrow() {
        add(carlos, MONDAY.atTime(11, 0), AppointmentStatus.PENDING, "30.00");
        add(carlos, MONDAY.plusDays(1).atTime(17, 0), AppointmentStatus.PENDING, "30.00");
        add(carlos, MONDAY.plusDays(2).atTime(8, 0), AppointmentStatus.PENDING, "30.00");
        add(carlos, MONDAY.atTime(9, 50), AppointmentStatus.PENDING, "30.00");

        var pending = dashboard.today().pending();

        assertThat(pending.toConfirm()).extracting(DashboardAppointmentDto::startTime)
                .containsExactly(MONDAY.atTime(11, 0), MONDAY.plusDays(1).atTime(17, 0));
        assertThat(pending.toConfirmTotal()).isEqualTo(2);
    }

    @Test
    void overdueWithinSevenDays() {
        add(carlos, MONDAY.minusDays(7).atTime(8, 0), AppointmentStatus.CONFIRMED, "30.00");
        add(carlos, MONDAY.minusDays(8).atTime(8, 0), AppointmentStatus.CONFIRMED, "30.00");
        add(carlos, MONDAY.minusDays(1).atTime(8, 0), AppointmentStatus.COMPLETED, "30.00");

        var pending = dashboard.today().pending();

        assertThat(pending.overdue()).extracting(DashboardAppointmentDto::startTime)
                .containsExactly(MONDAY.minusDays(7).atTime(8, 0));
        assertThat(pending.overdueTotal()).isEqualTo(1);
    }

    @Test
    void pendingListsCappedAtTwentyWithTotal() {
        for (int i = 0; i < 25; i++) {
            add(carlos, MONDAY.plusDays(1).atTime(8, 0).plusMinutes(20L * i), AppointmentStatus.PENDING, "30.00");
        }

        var pending = dashboard.today().pending();

        assertThat(pending.toConfirm()).hasSize(20);
        assertThat(pending.toConfirmTotal()).isEqualTo(25);
        assertThat(pending.toConfirm().get(0).startTime()).isEqualTo(MONDAY.plusDays(1).atTime(8, 0));
    }

    @Test
    void teamStates() {
        activeProfessionals.clear();
        Professional ana = professional("Ana");
        Professional bruno = professional("Bruno");
        professional("Carla", new BusinessHour(1, LocalTime.of(8, 0), LocalTime.of(18, 0), true));
        add(ana, MONDAY.atTime(9, 45), AppointmentStatus.CONFIRMED, "30.00");

        List<TeamMemberDto> team = dashboard.today().team();

        assertThat(team).extracting(TeamMemberDto::name).containsExactly("Ana", "Bruno", "Carla");
        assertThat(team).extracting(TeamMemberDto::state)
                .containsExactly(TeamMemberState.BUSY, TeamMemberState.FREE, TeamMemberState.OFF);
        assertThat(team.get(0).currentUntil()).isEqualTo(LocalTime.of(10, 15));
        assertThat(team.get(1).currentUntil()).isNull();
        assertThat(team.get(1).professionalId()).isEqualTo(bruno.getId());
    }

    @Test
    void completedAppointmentDoesNotMakeProfessionalBusy() {
        add(carlos, MONDAY.atTime(9, 45), AppointmentStatus.COMPLETED, "30.00");

        assertThat(dashboard.today().team().get(0).state()).isEqualTo(TeamMemberState.FREE);
    }

    @Test
    void teamNextAtAndCount() {
        add(carlos, MONDAY.atTime(11, 0), AppointmentStatus.PENDING, "30.00");
        add(carlos, MONDAY.atTime(14, 0), AppointmentStatus.CONFIRMED, "30.00");
        add(carlos, MONDAY.atTime(15, 0), AppointmentStatus.CANCELED, "30.00");

        TeamMemberDto member = dashboard.today().team().get(0);

        assertThat(member.appointmentsToday()).isEqualTo(2);
        assertThat(member.nextAt()).isEqualTo(LocalTime.of(11, 0));
    }

    @Test
    void teamNextAtIsNullWithoutUpcomingAppointments() {
        add(carlos, MONDAY.atTime(8, 0), AppointmentStatus.COMPLETED, "30.00");

        assertThat(dashboard.today().team().get(0).nextAt()).isNull();
    }

    @Test
    void queriesFromSevenDaysAgoUntilDayAfterTomorrow() {
        dashboard.today();

        verify(appointmentRepository).findWithDetailsBetween(
                LocalDateTime.of(2026, 10, 5, 0, 0), LocalDateTime.of(2026, 10, 14, 0, 0));
    }

    private Professional professional(String name, BusinessHour... hours) {
        Professional professional = new Professional();
        professional.setId(UUID.randomUUID());
        professional.setName(name);
        professional.setActive(true);
        professional.setBusinessHours(new ArrayList<>(List.of(hours)));
        activeProfessionals.add(professional);
        return professional;
    }

    /** Agendamento de 30 min com o cliente "Maria" e o serviço "Corte". */
    private Appointment add(Professional professional, LocalDateTime start, AppointmentStatus status, String price) {
        Customer customer = new Customer();
        customer.setId(UUID.randomUUID());
        customer.setName("Maria");
        customer.setPhone("5586999990000");

        com.agenda.api.model.Service service = new com.agenda.api.model.Service();
        service.setId(UUID.randomUUID());
        service.setName("Corte");

        Appointment appointment = new Appointment();
        appointment.setId(UUID.randomUUID());
        appointment.setCustomer(customer);
        appointment.setService(service);
        appointment.setProfessional(professional);
        appointment.setStartTime(start);
        appointment.setEndTime(start.plusMinutes(30));
        appointment.setStatus(status);
        appointment.setPrice(new BigDecimal(price));
        appointments.add(appointment);
        appointments.sort((a, b) -> a.getStartTime().compareTo(b.getStartTime()));
        return appointment;
    }
}
