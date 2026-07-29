package com.agenda.api.repository;

import com.agenda.api.model.Appointment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.UUID;

@Repository
public interface AppointmentRepository extends JpaRepository<Appointment, UUID> {
    
    @Query("SELECT COUNT(a) > 0 FROM Appointment a WHERE a.professional.id = :professionalId " +
           "AND a.status != 'CANCELLED' " +
           "AND ((a.startTime < :endTime AND a.endTime > :startTime))")
    boolean hasOverlappingAppointment(@Param("professionalId") UUID professionalId,
                                      @Param("startTime") LocalDateTime startTime,
                                      @Param("endTime") LocalDateTime endTime);
}
