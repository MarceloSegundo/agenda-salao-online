package com.agenda.api.controller;

import com.agenda.api.dto.LoginRequest;
import com.agenda.api.dto.TenantRegistrationRequest;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.test.context.ActiveProfiles;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("test")
public class AuthIntegrationTest {

    @Autowired
    private TestRestTemplate restTemplate;

    @Test
    void shouldRegisterTenantAndLoginSuccessfully() {
        // 1. Registrar Salão e Admin
        TenantRegistrationRequest registerRequest = new TenantRegistrationRequest();
        registerRequest.setSalonName("Salão Beleza Total");
        registerRequest.setAdminName("João Admin");
        registerRequest.setAdminEmail("joao@beleza.com");
        registerRequest.setAdminPassword("senha123");

        ResponseEntity<Map> registerResponse = restTemplate.postForEntity(
                "/api/tenants/register", registerRequest, Map.class);
        
        assertThat(registerResponse.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        assertThat(registerResponse.getBody()).isNotNull();
        assertThat(registerResponse.getBody().get("name")).isEqualTo("Salão Beleza Total");
        assertThat(registerResponse.getBody().get("id")).isNotNull();

        // 2. Fazer Login
        LoginRequest loginRequest = new LoginRequest();
        loginRequest.setEmail("joao@beleza.com");
        loginRequest.setPassword("senha123");

        ResponseEntity<Map> loginResponse = restTemplate.postForEntity(
                "/api/auth/login", loginRequest, Map.class);
        
        assertThat(loginResponse.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(loginResponse.getBody()).isNotNull();
        
        String token = (String) loginResponse.getBody().get("token");
        assertThat(token).isNotNull();
        assertThat(loginResponse.getBody().get("email")).isEqualTo("joao@beleza.com");

        // 3. Tentar acessar rota protegida SEM token (deve dar 401/403)
        ResponseEntity<String> forbiddenResponse = restTemplate.getForEntity("/api/customers", String.class);
        assertThat(forbiddenResponse.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);

        // 4. Acessar rota protegida COM token
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(token);
        HttpEntity<Void> entity = new HttpEntity<>(headers);
        
        ResponseEntity<String> successResponse = restTemplate.exchange(
                "/api/customers", HttpMethod.GET, entity, String.class);
        
        // Pode ser 200 OK ou 204 No Content / lista vazia, mas não deve ser 401/403
        assertThat(successResponse.getStatusCode()).isNotEqualTo(HttpStatus.FORBIDDEN);
        assertThat(successResponse.getStatusCode()).isNotEqualTo(HttpStatus.UNAUTHORIZED);
    }

    @Test
    void loginWithWrongPassword_ShouldFail() {
        LoginRequest loginRequest = new LoginRequest();
        loginRequest.setEmail("inexistente@teste.com");
        loginRequest.setPassword("errada");

        ResponseEntity<Map> loginResponse = restTemplate.postForEntity(
                "/api/auth/login", loginRequest, Map.class);
        
        assertThat(loginResponse.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
    }
}
