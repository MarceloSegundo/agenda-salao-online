package com.agenda.api.repository;

import com.agenda.api.model.Appointment;
import org.springframework.stereotype.Repository;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Repository
public interface AppointmentRepository extends TenantScopedRepository<Appointment> {
    
    @Query("SELECT COUNT(a) > 0 FROM Appointment a WHERE a.professional.id = :professionalId " +
           "AND a.status <> com.agenda.api.model.AppointmentStatus.CANCELED " +
           "AND ((a.startTime < :endTime AND a.endTime > :startTime))")
    boolean hasOverlappingAppointment(@Param("professionalId") UUID professionalId,
                                      @Param("startTime") LocalDateTime startTime,
                                      @Param("endTime") LocalDateTime endTime);

    List<Appointment> findByStartTimeGreaterThanEqualAndStartTimeLessThanOrderByStartTimeAsc(LocalDateTime start, LocalDateTime end);

    /** Agendamentos não cancelados com início em [start, end). */
    @Query("SELECT a FROM Appointment a WHERE a.startTime >= :start AND a.startTime < :end "
            + "AND a.status <> com.agenda.api.model.AppointmentStatus.CANCELED")
    List<Appointment> findActiveBetween(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);
}
