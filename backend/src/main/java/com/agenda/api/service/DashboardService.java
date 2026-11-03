package com.agenda.api.service;

import com.agenda.api.dto.dashboard.DashboardAppointmentDto;
import com.agenda.api.dto.dashboard.DashboardResponse;
import com.agenda.api.dto.dashboard.DaySummaryDto;
import com.agenda.api.dto.dashboard.PendingDto;
import com.agenda.api.dto.dashboard.TeamMemberDto;
import com.agenda.api.dto.dashboard.TeamMemberState;
import com.agenda.api.exception.BusinessException;
import com.agenda.api.model.Appointment;
import com.agenda.api.model.AppointmentStatus;
import com.agenda.api.model.Professional;
import com.agenda.api.model.Tenant;
import com.agenda.api.repository.AppointmentRepository;
import com.agenda.api.repository.ProfessionalRepository;
import com.agenda.api.repository.TenantRepository;
import com.agenda.api.security.TenantContext;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Clock;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.Comparator;
import java.util.List;
import java.util.function.Predicate;

/**
 * Operação do dia para a tela inicial. Uma consulta traz os agendamentos de
 * hoje − 7 dias até o fim de amanhã; os blocos saem dela em memória.
 * "Em aberto" = PENDING ou CONFIRMED.
 */
@Service
public class DashboardService {

    static final int OVERDUE_DAYS = 7;
    static final int PENDING_LIMIT = 20;

    private final TenantRepository tenantRepository;
    private final ProfessionalRepository professionalRepository;
    private final AppointmentRepository appointmentRepository;
    private final AvailabilityService availabilityService;
    private final Clock clock;

    public DashboardService(TenantRepository tenantRepository, ProfessionalRepository professionalRepository,
                            AppointmentRepository appointmentRepository, AvailabilityService availabilityService,
                            Clock clock) {
        this.tenantRepository = tenantRepository;
        this.professionalRepository = professionalRepository;
        this.appointmentRepository = appointmentRepository;
        this.availabilityService = availabilityService;
        this.clock = clock;
    }

    @Transactional(readOnly = true)
    public DashboardResponse today() {
        Tenant tenant = tenantRepository.findById(TenantContext.getCurrentTenant())
                .orElseThrow(() -> new BusinessException("Tenant atual não encontrado."));
        LocalDateTime now = LocalDateTime.now(clock);
        LocalDate today = now.toLocalDate();
        LocalDateTime todayStart = today.atStartOfDay();
        LocalDateTime tomorrowStart = todayStart.plusDays(1);
        LocalDateTime overdueStart = todayStart.minusDays(OVERDUE_DAYS);
        LocalDateTime windowEnd = todayStart.plusDays(2);

        List<Appointment> window = appointmentRepository.findWithDetailsBetween(overdueStart, windowEnd).stream()
                .filter(a -> !a.getStartTime().isBefore(overdueStart) && a.getStartTime().isBefore(windowEnd))
                .sorted(Comparator.comparing(Appointment::getStartTime)
                        .thenComparing(a -> a.getCustomer().getName()))
                .toList();
        List<Appointment> ofToday = window.stream()
                .filter(a -> !a.getStartTime().isBefore(todayStart) && a.getStartTime().isBefore(tomorrowStart))
                .toList();

        DashboardAppointmentDto next = ofToday.stream()
                .filter(a -> isOpen(a) && a.getEndTime().isAfter(now))
                .findFirst()
                .map(a -> toDto(a, now))
                .orElse(null);

        List<Appointment> toConfirm = window.stream()
                .filter(a -> a.getStatus() == AppointmentStatus.PENDING && !a.getStartTime().isBefore(now))
                .toList();
        List<Appointment> overdue = window.stream()
                .filter(a -> isOpen(a) && !a.getEndTime().isAfter(now))
                .toList();
        PendingDto pending = new PendingDto(
                limited(toConfirm, now), toConfirm.size(),
                limited(overdue, now), overdue.size());

        List<TeamMemberDto> team = professionalRepository.findByActiveTrueOrderByNameAsc().stream()
                .map(p -> teamMember(tenant, p, ofToday, now))
                .toList();

        return new DashboardResponse(today, tenant.getName(), summary(ofToday), next, pending, team);
    }

    private static DaySummaryDto summary(List<Appointment> ofToday) {
        return new DaySummaryDto(
                count(ofToday, a -> a.getStatus() != AppointmentStatus.CANCELED),
                count(ofToday, a -> a.getStatus() == AppointmentStatus.COMPLETED),
                count(ofToday, a -> a.getStatus() == AppointmentStatus.PENDING),
                count(ofToday, a -> a.getStatus() == AppointmentStatus.CANCELED),
                sum(ofToday, a -> a.getStatus() != AppointmentStatus.CANCELED),
                sum(ofToday, a -> a.getStatus() == AppointmentStatus.COMPLETED));
    }

    private TeamMemberDto teamMember(Tenant tenant, Professional professional, List<Appointment> ofToday,
                                     LocalDateTime now) {
        List<Appointment> own = ofToday.stream()
                .filter(a -> a.getProfessional().getId().equals(professional.getId()))
                .toList();
        Appointment current = own.stream()
                .filter(a -> isOpen(a) && !a.getStartTime().isAfter(now) && a.getEndTime().isAfter(now))
                .findFirst()
                .orElse(null);
        LocalTime nextAt = own.stream()
                .filter(a -> isOpen(a) && a.getStartTime().isAfter(now))
                .findFirst()
                .map(a -> a.getStartTime().toLocalTime())
                .orElse(null);

        // Atendimento em andamento vale mesmo fora do expediente
        TeamMemberState state = current != null ? TeamMemberState.BUSY
                : availabilityService.isWithinWorkingHours(tenant, professional, now) ? TeamMemberState.FREE
                : TeamMemberState.OFF;

        return new TeamMemberDto(
                professional.getId(),
                professional.getName(),
                count(own, a -> a.getStatus() != AppointmentStatus.CANCELED),
                state,
                current != null ? current.getEndTime().toLocalTime() : null,
                nextAt);
    }

    private static boolean isOpen(Appointment appointment) {
        return appointment.getStatus() == AppointmentStatus.PENDING
                || appointment.getStatus() == AppointmentStatus.CONFIRMED;
    }

    private static int count(List<Appointment> appointments, Predicate<Appointment> filter) {
        return (int) appointments.stream().filter(filter).count();
    }

    private static BigDecimal sum(List<Appointment> appointments, Predicate<Appointment> filter) {
        return appointments.stream().filter(filter).map(Appointment::getPrice).reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private static List<DashboardAppointmentDto> limited(List<Appointment> appointments, LocalDateTime now) {
        return appointments.stream().limit(PENDING_LIMIT).map(a -> toDto(a, now)).toList();
    }

    private static DashboardAppointmentDto toDto(Appointment appointment, LocalDateTime now) {
        return new DashboardAppointmentDto(
                appointment.getId(),
                appointment.getCustomer().getName(),
                appointment.getCustomer().getPhone(),
                appointment.getService().getName(),
                appointment.getProfessional().getName(),
                appointment.getStartTime(),
                appointment.getEndTime(),
                appointment.getStatus(),
                !appointment.getStartTime().isAfter(now) && appointment.getEndTime().isAfter(now));
    }
}
