package com.agenda.api.support;

import com.agenda.api.dto.LoginRequest;
import com.agenda.api.dto.TenantRegistrationRequest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Atalhos para os testes de integração: registra um salão, faz login e
 * chama a API com o token dele.
 */
public final class ApiTestClient {

    private final TestRestTemplate restTemplate;
    private final String token;

    private ApiTestClient(TestRestTemplate restTemplate, String token) {
        this.restTemplate = restTemplate;
        this.token = token;
    }

    public static ApiTestClient newSalon(TestRestTemplate restTemplate, String salonName) {
        String email = "admin-" + UUID.randomUUID() + "@teste.com";

        TenantRegistrationRequest register = new TenantRegistrationRequest();
        register.setSalonName(salonName);
        register.setAdminName("Admin");
        register.setAdminEmail(email);
        register.setAdminPassword("senha123");
        ResponseEntity<Map> registered = restTemplate.postForEntity("/api/tenants/register", register, Map.class);
        assertThat(registered.getStatusCode()).isEqualTo(HttpStatus.CREATED);

        LoginRequest login = new LoginRequest();
        login.setEmail(email);
        login.setPassword("senha123");
        ResponseEntity<Map> loggedIn = restTemplate.postForEntity("/api/auth/login", login, Map.class);
        assertThat(loggedIn.getStatusCode()).isEqualTo(HttpStatus.OK);
        return new ApiTestClient(restTemplate, (String) loggedIn.getBody().get("token"));
    }

    public ResponseEntity<Map> call(HttpMethod method, String path, Object body) {
        return restTemplate.exchange(path, method, new HttpEntity<>(body, headers()), Map.class);
    }

    @SuppressWarnings("unchecked")
    public List<Map<String, Object>> getList(String path) {
        ResponseEntity<List> response = restTemplate.exchange(path, HttpMethod.GET, new HttpEntity<>(headers()), List.class);
        assertThat(response.getStatusCode()).as("GET %s", path).isEqualTo(HttpStatus.OK);
        return (List<Map<String, Object>>) response.getBody();
    }

    /** POST que precisa dar 201; devolve o id criado. */
    public String create(String path, Map<String, ?> body) {
        ResponseEntity<Map> response = call(HttpMethod.POST, path, body);
        assertThat(response.getStatusCode()).as("POST %s -> %s", path, response.getBody()).isEqualTo(HttpStatus.CREATED);
        return (String) response.getBody().get("id");
    }

    private HttpHeaders headers() {
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(token);
        return headers;
    }
}
