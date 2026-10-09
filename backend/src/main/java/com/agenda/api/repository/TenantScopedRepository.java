package com.agenda.api.repository;

import com.agenda.api.model.base.BaseTenantEntity;
import com.agenda.api.security.TenantContext;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.repository.NoRepositoryBean;

import java.util.Optional;
import java.util.UUID;

/**
 * Repositório base das entidades de salão.
 *
 * O filtro do Hibernate ({@code tenantFilter}) só vale para consultas; busca por
 * chave primária ({@code findById}, que usa {@code EntityManager.find}) não passa
 * por ele. Por isso os serviços devem usar {@link #findByIdInCurrentTenant(UUID)}
 * em vez de {@code findById}.
 */
@NoRepositoryBean
public interface TenantScopedRepository<T extends BaseTenantEntity> extends JpaRepository<T, UUID> {

    Optional<T> findByIdAndTenantId(UUID id, UUID tenantId);

    default Optional<T> findByIdInCurrentTenant(UUID id) {
        return findByIdAndTenantId(id, TenantContext.getCurrentTenant());
    }
}
