package com.agenda.api.repository;

import com.agenda.api.model.Service;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface ServiceRepository extends TenantScopedRepository<Service> {
}
