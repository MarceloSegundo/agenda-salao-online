package com.agenda.api.controller;

import com.agenda.api.support.ApiTestClient;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.test.context.ActiveProfiles;

import java.util.Map;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("test")
public class ApiInfrastructureIntegrationTest {

    @Autowired
    private TestRestTemplate restTemplate;

    @Test
    void openApiDocsAreAvailable() {
        assertThat(restTemplate.getForEntity("/v3/api-docs", String.class).getStatusCode())
                .isEqualTo(HttpStatus.OK);
    }

    @Test
    void wrongHttpMethodReturns405() {
        ApiTestClient salon = ApiTestClient.newSalon(restTemplate, "Salão Infra");

        assertThat(salon.call(HttpMethod.DELETE, "/api/tenants/me", null).getStatusCode())
                .isEqualTo(HttpStatus.METHOD_NOT_ALLOWED);
    }

    @Test
    void malformedIdReturns400() {
        ApiTestClient salon = ApiTestClient.newSalon(restTemplate, "Salão Infra");

        assertThat(salon.call(HttpMethod.GET, "/api/customers/abc", null).getStatusCode())
                .isEqualTo(HttpStatus.BAD_REQUEST);
    }

    @Test
    void creatingAppointmentWithoutTokenIsForbidden() {
        Map<String, Object> body = Map.of(
                "customerId", UUID.randomUUID(),
                "professionalId", UUID.randomUUID(),
                "serviceId", UUID.randomUUID(),
                "startTime", "2099-01-05T10:00:00");

        assertThat(restTemplate.postForEntity("/api/appointments", body, String.class).getStatusCode())
                .isEqualTo(HttpStatus.FORBIDDEN);
    }

    @Test
    void unreadableBodyReturns400() {
        ApiTestClient salon = ApiTestClient.newSalon(restTemplate, "Salão Infra");

        // "CANCELLED" não existe no enum (o certo é CANCELED)
        assertThat(salon.call(HttpMethod.PATCH, "/api/appointments/" + UUID.randomUUID() + "/status",
                Map.of("status", "CANCELLED")).getStatusCode())
                .isEqualTo(HttpStatus.BAD_REQUEST);
    }

    @Test
    void unknownRouteReturns404() {
        ApiTestClient salon = ApiTestClient.newSalon(restTemplate, "Salão Infra");

        assertThat(salon.call(HttpMethod.GET, "/api/rota-que-nao-existe", null).getStatusCode())
                .isEqualTo(HttpStatus.NOT_FOUND);
    }

    @Test
    void unsupportedContentTypeReturns415() {
        ApiTestClient salon = ApiTestClient.newSalon(restTemplate, "Salão Infra");

        assertThat(salon.postText("/api/customers", "nome=Maria").getStatusCode())
                .isEqualTo(HttpStatus.UNSUPPORTED_MEDIA_TYPE);
    }
}
