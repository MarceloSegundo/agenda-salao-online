package com.agenda.api.repository;

import com.agenda.api.model.Professional;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import java.util.UUID;

@Repository
public interface ProfessionalRepository extends TenantScopedRepository<Professional> {

    List<Professional> findByActiveTrueOrderByNameAsc();

    /**
     * Carrega o profissional travando a linha (SELECT ... FOR UPDATE): criações
     * simultâneas para o mesmo profissional passam uma de cada vez pela checagem
     * de conflito de horário.
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select p from Professional p where p.id = :id and p.tenantId = :tenantId")
    Optional<Professional> findByIdForUpdate(@Param("id") UUID id, @Param("tenantId") UUID tenantId);
}
