package com.agenda.api.service;

import com.agenda.api.dto.BusinessHourDto;
import com.agenda.api.dto.TenantRegistrationRequest;
import com.agenda.api.exception.BusinessException;
import com.agenda.api.model.Tenant;
import com.agenda.api.model.base.BusinessHour;
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
        
        String baseDomain = request.getSalonName().toLowerCase().replaceAll("[^a-z0-9]+", "-");
        // Remove traços duplos e traços no final
        baseDomain = baseDomain.replaceAll("-+", "-").replaceAll("-$", "");
        if (baseDomain.isEmpty()) {
            baseDomain = "salao";
        }

        String domainSlug = baseDomain;
        int counter = 1;
        while (tenantRepository.findByDomain(domainSlug).isPresent()) {
            domainSlug = baseDomain + "-" + java.util.UUID.randomUUID().toString().substring(0, 4);
            // Pra evitar loops infinitos caso a UUID coincida (raro, mas possível), usamos também um contador opcional
            // Mas o UUID.substring já resolve muito bem no mercado
        }
        tenant.setDomain(domainSlug);
        
        // Criar horários padrão de Seg a Sex
        java.util.List<BusinessHour> defaultHours = new java.util.ArrayList<>();
        for (int i = 1; i <= 7; i++) {
            boolean isWeekend = (i == 6 || i == 7);
            defaultHours.add(new BusinessHour(
                i,
                java.time.LocalTime.of(8, 0),
                java.time.LocalTime.of(18, 0),
                isWeekend // Fechado nos fins de semana por padrão
            ));
        }
        tenant.setBusinessHours(defaultHours);
        
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

    @Transactional(readOnly = true)
    public com.agenda.api.dto.TenantResponse getCurrentTenant() {
        java.util.UUID tenantId = com.agenda.api.security.TenantContext.getCurrentTenant();
        if (tenantId == null) {
            throw new BusinessException("Contexto de Tenant não encontrado.");
        }
        
        Tenant tenant = tenantRepository.findById(tenantId)
                .orElseThrow(() -> new BusinessException("Tenant não encontrado."));
                
        return mapToResponse(tenant);
    }

    @Transactional
    public com.agenda.api.dto.TenantResponse updateSettings(com.agenda.api.dto.TenantSettingsRequest request) {
        java.util.UUID tenantId = com.agenda.api.security.TenantContext.getCurrentTenant();
        if (tenantId == null) {
            throw new BusinessException("Contexto de Tenant não encontrado.");
        }
        
        Tenant tenant = tenantRepository.findById(tenantId)
                .orElseThrow(() -> new BusinessException("Tenant não encontrado."));
                
        if (request.salonName() != null) {
            tenant.setName(request.salonName().trim());
        }

        if (request.businessHours() != null) {
            java.util.List<BusinessHour> updatedHours = request.businessHours().stream()
                .map(dto -> new BusinessHour(dto.dayOfWeek(), dto.openingTime(), dto.closingTime(), dto.isClosed()))
                .toList();
            
            // Hibernate clears and inserts since it's an ElementCollection
            tenant.getBusinessHours().clear();
            tenant.getBusinessHours().addAll(updatedHours);
        }
        
        tenant = tenantRepository.save(tenant);
        return mapToResponse(tenant);
    }
    
    private com.agenda.api.dto.TenantResponse mapToResponse(Tenant tenant) {
        return new com.agenda.api.dto.TenantResponse(
                tenant.getId(),
                tenant.getName(),
                tenant.getDomain(),
                tenant.getBusinessHours() != null ? tenant.getBusinessHours().stream()
                    .map(bh -> new BusinessHourDto(bh.getDayOfWeek(), bh.getOpeningTime(), bh.getClosingTime(), bh.isClosed()))
                    .toList() : java.util.List.of(),
                tenant.isActive()
        );
    }
}
