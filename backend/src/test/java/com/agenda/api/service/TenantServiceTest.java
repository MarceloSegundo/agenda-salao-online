package com.agenda.api.service;

import com.agenda.api.dto.BusinessHourDto;
import com.agenda.api.dto.TenantResponse;
import com.agenda.api.dto.TenantSettingsRequest;
import com.agenda.api.model.Tenant;
import com.agenda.api.model.base.BusinessHour;
import com.agenda.api.repository.TenantRepository;
import com.agenda.api.repository.UserRepository;
import com.agenda.api.security.TenantContext;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class TenantServiceTest {

    @Mock
    private TenantRepository tenantRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @InjectMocks
    private TenantService tenantService;

    private Tenant tenant;
    private final UUID tenantId = UUID.randomUUID();

    @BeforeEach
    void setUp() {
        TenantContext.setCurrentTenant(tenantId);

        tenant = new Tenant();
        tenant.setId(tenantId);
        tenant.setName("Salão da Maria");
        tenant.setBusinessHours(new ArrayList<>(List.of(
                new BusinessHour(1, LocalTime.of(8, 0), LocalTime.of(18, 0), false))));

        when(tenantRepository.findById(tenantId)).thenReturn(Optional.of(tenant));
        when(tenantRepository.save(any(Tenant.class))).thenAnswer(inv -> inv.getArgument(0));
    }

    @AfterEach
    void tearDown() {
        TenantContext.clear();
    }

    @Test
    void shouldKeepNameWhenOnlyBusinessHoursAreSent() {
        TenantSettingsRequest request = new TenantSettingsRequest(null, List.of(
                new BusinessHourDto(1, LocalTime.of(9, 0), LocalTime.of(17, 0), false)));

        TenantResponse response = tenantService.updateSettings(request);

        assertEquals("Salão da Maria", response.name());
        assertEquals(LocalTime.of(9, 0), response.businessHours().get(0).openingTime());
    }

    @Test
    void shouldKeepBusinessHoursWhenOnlyNameIsSent() {
        TenantSettingsRequest request = new TenantSettingsRequest("Salão da Maria & Filhas", null);

        TenantResponse response = tenantService.updateSettings(request);

        assertEquals("Salão da Maria & Filhas", response.name());
        assertEquals(1, response.businessHours().size());
        assertEquals(LocalTime.of(8, 0), response.businessHours().get(0).openingTime());
    }
}
