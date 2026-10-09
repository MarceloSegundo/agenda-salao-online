package com.agenda.api.repository;

import com.agenda.api.model.Customer;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface CustomerRepository extends TenantScopedRepository<Customer> {
}
