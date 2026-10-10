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

    // Nome em minúsculas e sem acento; translate existe no PostgreSQL e no H2. O termo chega já normalizado.
    String UNACCENTED_NAME = "function('translate' as String, lower(c.name), "
            + "'áàâãäåéèêëíìîïóòôõöúùûüçñý', 'aaaaaaeeeeiiiiooooouuuucny')";

    @Query("select c from Customer c where " + UNACCENTED_NAME + " like concat('%', :term, '%') order by c.name")
    List<Customer> searchByName(@Param("term") String term, Pageable pageable);

    @Query("select c from Customer c where " + UNACCENTED_NAME + " like concat('%', :term, '%') "
            + "or c.phone like concat('%', :digits, '%') order by c.name")
    List<Customer> searchByNameOrPhone(@Param("term") String term, @Param("digits") String digits, Pageable pageable);
}
