package com.agenda.api.repository;

import com.agenda.api.model.Professional;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface ProfessionalRepository extends TenantScopedRepository<Professional> {
}
