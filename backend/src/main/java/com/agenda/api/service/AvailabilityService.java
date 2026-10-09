package com.agenda.api.service;

import com.agenda.api.dto.AvailableSlotResponse;
import com.agenda.api.exception.BusinessException;
import com.agenda.api.exception.ConflictException;
import com.agenda.api.exception.ResourceNotFoundException;
import com.agenda.api.model.Appointment;
import com.agenda.api.model.Professional;
import com.agenda.api.model.Tenant;
import com.agenda.api.model.base.BusinessHour;
import com.agenda.api.repository.AppointmentRepository;
import com.agenda.api.repository.ProfessionalRepository;
import com.agenda.api.repository.ServiceRepository;
import com.agenda.api.repository.TenantRepository;
import com.agenda.api.security.TenantContext;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.TreeMap;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Regras de horário de atendimento, usadas tanto para listar horários livres
 * quanto para validar a criação de um agendamento:
 * expediente = interseção do horário do salão com o do profissional no dia
 * (sem configuração própria no dia, vale o do salão); grade de 30 em 30 min;
 * sem horários no passado nem sobrepostos a agendamentos não cancelados.
 */
@Service
public class AvailabilityService {

    static final int SLOT_STEP_MINUTES = 30;

    private final TenantRepository tenantRepository;
    private final ProfessionalRepository professionalRepository;
    private final ServiceRepository serviceRepository;
    private final AppointmentRepository appointmentRepository;
    private final Clock clock;

    public AvailabilityService(TenantRepository tenantRepository, ProfessionalRepository professionalRepository,
                               ServiceRepository serviceRepository, AppointmentRepository appointmentRepository,
                               Clock clock) {
        this.tenantRepository = tenantRepository;
        this.professionalRepository = professionalRepository;
        this.serviceRepository = serviceRepository;
        this.appointmentRepository = appointmentRepository;
        this.clock = clock;
    }

    /**
     * Horários livres no dia para o serviço. Com {@code professionalId} nulo
     * (modo "qualquer profissional"), cada horário aparece uma vez, atribuído ao
     * profissional livre com menos agendamentos no dia; empate pelo nome.
     */
    @Transactional(readOnly = true)
    public List<AvailableSlotResponse> findAvailableSlots(LocalDate date, UUID serviceId, UUID professionalId) {
        Tenant tenant = currentTenant();
        com.agenda.api.model.Service service = serviceRepository.findByIdInCurrentTenant(serviceId)
                .orElseThrow(() -> new ResourceNotFoundException("Serviço não encontrado"));
        List<Professional> professionals = professionalId != null
                ? List.of(professionalRepository.findByIdInCurrentTenant(professionalId)
                        .orElseThrow(() -> new ResourceNotFoundException("Profissional não encontrado")))
                : professionalRepository.findByActiveTrueOrderByNameAsc();

        LocalDateTime dayStart = date.atStartOfDay();
        Map<UUID, List<Appointment>> appointmentsByProfessional = appointmentRepository
                .findActiveBetween(dayStart, dayStart.plusDays(1)).stream()
                .collect(Collectors.groupingBy(a -> a.getProfessional().getId()));

        // Para cada horário, o melhor candidato: menos agendamentos no dia, depois nome
        Comparator<Professional> preference = Comparator
                .comparingInt((Professional p) -> appointmentsByProfessional.getOrDefault(p.getId(), List.of()).size())
                .thenComparing(Professional::getName);
        TreeMap<LocalTime, Professional> slots = new TreeMap<>();
        for (Professional professional : professionals) {
            List<Appointment> busy = appointmentsByProfessional.getOrDefault(professional.getId(), List.of());
            for (LocalTime time : freeTimes(tenant, professional, date, service.getDurationMinutes(), busy)) {
                slots.merge(time, professional, (current, candidate) ->
                        preference.compare(candidate, current) < 0 ? candidate : current);
            }
        }

        return slots.entrySet().stream()
                .map(e -> new AvailableSlotResponse(e.getKey(), e.getValue().getId(), e.getValue().getName()))
                .toList();
    }

    /**
     * Valida um agendamento: 422 (BusinessException) para regra violada,
     * 409 (ConflictException) se o profissional já tem agendamento no intervalo.
     */
    public void assertBookable(Tenant tenant, Professional professional, LocalDateTime start, LocalDateTime end) {
        if (!professional.isActive()) {
            throw new BusinessException("O profissional selecionado não está ativo.");
        }
        Optional<TimeWindow> window = workingWindow(tenant, professional, start.getDayOfWeek());
        if (window.isEmpty()) {
            throw new BusinessException("O salão ou o profissional não está disponível neste dia.");
        }
        boolean sameDay = end.toLocalDate().equals(start.toLocalDate());
        if (!sameDay || start.toLocalTime().isBefore(window.get().open())
                || end.toLocalTime().isAfter(window.get().close())) {
            throw new BusinessException("O horário agendado está fora do horário de funcionamento.");
        }
        if (start.isBefore(LocalDateTime.now(clock))) {
            throw new BusinessException("O horário de início não pode estar no passado.");
        }
        if (appointmentRepository.hasOverlappingAppointment(professional.getId(), start, end)) {
            throw new ConflictException("O profissional já possui um agendamento neste horário.");
        }
    }

    private List<LocalTime> freeTimes(Tenant tenant, Professional professional, LocalDate date,
                                      int durationMinutes, List<Appointment> busy) {
        if (!professional.isActive()) {
            return List.of();
        }
        Optional<TimeWindow> window = workingWindow(tenant, professional, date.getDayOfWeek());
        if (window.isEmpty()) {
            return List.of();
        }
        LocalDateTime now = LocalDateTime.now(clock);
        LocalDateTime close = date.atTime(window.get().close());
        List<LocalTime> times = new ArrayList<>();
        for (LocalDateTime start = date.atTime(window.get().open());
             !start.plusMinutes(durationMinutes).isAfter(close);
             start = start.plusMinutes(SLOT_STEP_MINUTES)) {
            LocalDateTime end = start.plusMinutes(durationMinutes);
            if (!start.isBefore(now) && !overlaps(busy, start, end)) {
                times.add(start.toLocalTime());
            }
        }
        return times;
    }

    private static boolean overlaps(List<Appointment> busy, LocalDateTime start, LocalDateTime end) {
        return busy.stream().anyMatch(a -> a.getStartTime().isBefore(end) && a.getEndTime().isAfter(start));
    }

    /** Interseção do horário do salão com o do profissional; vazio se fechado ou sem interseção. */
    private static Optional<TimeWindow> workingWindow(Tenant tenant, Professional professional, DayOfWeek day) {
        Optional<BusinessHour> salon = hoursFor(tenant.getBusinessHours(), day);
        if (salon.isEmpty() || salon.get().isClosed()) {
            return Optional.empty();
        }
        LocalTime open = salon.get().getOpeningTime();
        LocalTime close = salon.get().getClosingTime();

        Optional<BusinessHour> own = hoursFor(professional.getBusinessHours(), day);
        if (own.isPresent()) {
            if (own.get().isClosed()) {
                return Optional.empty();
            }
            open = max(open, own.get().getOpeningTime());
            close = min(close, own.get().getClosingTime());
        }
        return open.isBefore(close) ? Optional.of(new TimeWindow(open, close)) : Optional.empty();
    }

    private static Optional<BusinessHour> hoursFor(List<BusinessHour> hours, DayOfWeek day) {
        return hours == null ? Optional.empty()
                : hours.stream().filter(h -> h.getDayOfWeek() == day.getValue()).findFirst();
    }

    private Tenant currentTenant() {
        return tenantRepository.findById(TenantContext.getCurrentTenant())
                .orElseThrow(() -> new BusinessException("Tenant atual não encontrado."));
    }

    private static LocalTime max(LocalTime a, LocalTime b) {
        return a.isAfter(b) ? a : b;
    }

    private static LocalTime min(LocalTime a, LocalTime b) {
        return a.isBefore(b) ? a : b;
    }

    private record TimeWindow(LocalTime open, LocalTime close) {}
}
