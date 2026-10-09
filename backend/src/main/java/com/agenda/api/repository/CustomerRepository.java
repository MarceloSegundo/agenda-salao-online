package com.agenda.api.repository;

import com.agenda.api.model.Customer;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface CustomerRepository extends TenantScopedRepository<Customer> {

    Optional<Customer> findByPhoneAndTenantId(String phone, UUID tenantId);

    List<Customer> findAllByOrderByNameAsc(Pageable pageable);

    @Query("select c from Customer c where lower(c.name) like lower(concat('%', :term, '%')) order by c.name")
    List<Customer> searchByName(@Param("term") String term, Pageable pageable);

    @Query("select c from Customer c where lower(c.name) like lower(concat('%', :term, '%')) "
            + "or c.phone like concat('%', :digits, '%') order by c.name")
    List<Customer> searchByNameOrPhone(@Param("term") String term, @Param("digits") String digits, Pageable pageable);
}
