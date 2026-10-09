package com.agenda.api.security;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.List;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicReference;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class JwtAuthenticationFilterTest {

    @Mock
    private JwtService jwtService;

    @Mock
    private CustomUserDetailsService userDetailsService;

    @InjectMocks
    private JwtAuthenticationFilter filter;

    @AfterEach
    void tearDown() {
        TenantContext.clear();
        SecurityContextHolder.clearContext();
    }

    @Test
    void shouldSetTenantFromTokenDuringRequestAndClearItAfterwards() throws Exception {
        UUID tenantId = UUID.randomUUID();
        UserDetails user = new User("dono@salao.com", "hash", List.of());
        when(jwtService.extractUsername("token")).thenReturn("dono@salao.com");
        when(userDetailsService.loadUserByUsername("dono@salao.com")).thenReturn(user);
        when(jwtService.isTokenValid("token", user)).thenReturn(true);
        when(jwtService.extractTenantId("token")).thenReturn(tenantId);

        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/professionals");
        request.addHeader("Authorization", "Bearer token");
        AtomicReference<UUID> tenantSeenByChain = new AtomicReference<>();

        filter.doFilter(request, new MockHttpServletResponse(),
                (req, res) -> tenantSeenByChain.set(TenantContext.getCurrentTenant()));

        assertEquals(tenantId, tenantSeenByChain.get());
        // A thread volta para o pool: o tenant não pode vazar para a próxima requisição
        assertNull(TenantContext.getCurrentTenant());
    }

    @Test
    void shouldClearTenantEvenWhenTheChainFails() {
        TenantContext.setCurrentTenant(UUID.randomUUID());
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/professionals");

        assertThrows(IllegalStateException.class, () -> filter.doFilter(request, new MockHttpServletResponse(),
                (req, res) -> { throw new IllegalStateException("falha no meio da requisição"); }));

        assertNull(TenantContext.getCurrentTenant());
    }
}
