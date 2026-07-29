package com.agenda.api.service;

import com.agenda.api.dto.TenantRegistrationRequest;
import com.agenda.api.exception.BusinessException;
import com.agenda.api.model.Tenant;
import com.agenda.api.model.User;
import com.agenda.api.repository.TenantRepository;
import com.agenda.api.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class TenantService {

    private final TenantRepository tenantRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public TenantService(TenantRepository tenantRepository, UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.tenantRepository = tenantRepository;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional
    public Tenant registerTenant(TenantRegistrationRequest request) {
        if (userRepository.findByEmail(request.getAdminEmail()).isPresent()) {
            throw new BusinessException("O e-mail já está em uso.");
        }

        // Criar o Tenant (Salão)
        Tenant tenant = new Tenant();
        tenant.setName(request.getSalonName());
        
        String domainSlug = request.getSalonName().toLowerCase().replaceAll("[^a-z0-9]+", "-");
        tenant.setDomain(domainSlug);
        
        tenant = tenantRepository.save(tenant);

        // Criar o Usuário Administrador vinculado ao Salão
        User user = new User();
        user.setName(request.getAdminName());
        user.setEmail(request.getAdminEmail());
        user.setPassword(passwordEncoder.encode(request.getAdminPassword()));
        user.setTenantId(tenant.getId());
        userRepository.save(user);

        return tenant;
    }
}
