package com.agenda.api.security;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

import java.util.UUID;

@Component
public class TenantInterceptor implements HandlerInterceptor {

    private static final String TENANT_HEADER = "X-Tenant-ID";

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
        // Se o JwtAuthenticationFilter já setou o Tenant (em rotas protegidas), não sobrescrevemos.
        if (TenantContext.getCurrentTenant() == null) {
            String tenantId = request.getHeader(TENANT_HEADER);
            if (tenantId != null && !tenantId.isEmpty()) {
                TenantContext.setCurrentTenant(UUID.fromString(tenantId));
            }
        }
        return true;
    }

    @Override
    public void afterCompletion(HttpServletRequest request, HttpServletResponse response, Object handler, Exception ex) throws Exception {
        TenantContext.clear();
    }
}
