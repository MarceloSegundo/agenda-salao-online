package com.agenda.api.controller;

import com.agenda.api.dto.LoginRequest;
import com.agenda.api.dto.TenantRegistrationRequest;
import org.junit.jupiter.api.BeforeEach;
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

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.TemporalAdjusters;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Garante que um salão não enxerga nem altera dados de outro salão, mesmo
 * conhecendo os UUIDs. O filtro do Hibernate não cobre buscas por chave
 * primária, então este teste cobre exatamente as rotas por id.
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("test")
public class TenantIsolationIntegrationTest {

    @Autowired
    private TestRestTemplate restTemplate;

    private String tokenA;
    private String tokenB;
    private String customerA;
    private String professionalA;
    private String serviceA;
    private String appointmentA;

    @BeforeEach
    void setUp() {
        tokenA = registerAndLogin("Salão A");
        tokenB = registerAndLogin("Salão B");

        customerA = createAs(tokenA, "/api/customers",
                Map.of("name", "Cliente do A", "phone", "5586999990000"));
        professionalA = createAs(tokenA, "/api/professionals",
                Map.of("name", "Profissional do A", "specialization", "Cabelo", "active", true));
        serviceA = createAs(tokenA, "/api/services", serviceBody("Corte do A"));

        // Segunda-feira às 10h: dentro do horário padrão de um salão novo (seg-sex, 8h-18h)
        LocalDateTime nextMonday = LocalDate.now()
                .with(TemporalAdjusters.next(DayOfWeek.MONDAY))
                .atTime(10, 0);
        appointmentA = createAs(tokenA, "/api/appointments", Map.of(
                "customerId", customerA,
                "professionalId", professionalA,
                "serviceId", serviceA,
                "startTime", nextMonday.toString()));
    }

    @Test
    void ownerCanReadItsOwnRecords() {
        assertThat(call(tokenA, HttpMethod.GET, "/api/customers/" + customerA, null).getStatusCode())
                .isEqualTo(HttpStatus.OK);
        assertThat(call(tokenA, HttpMethod.GET, "/api/professionals/" + professionalA, null).getStatusCode())
                .isEqualTo(HttpStatus.OK);
        assertThat(call(tokenA, HttpMethod.GET, "/api/services/" + serviceA, null).getStatusCode())
                .isEqualTo(HttpStatus.OK);
    }

    @Test
    void otherTenantCannotReadRecordsById() {
        assertNotFound(call(tokenB, HttpMethod.GET, "/api/customers/" + customerA, null));
        assertNotFound(call(tokenB, HttpMethod.GET, "/api/professionals/" + professionalA, null));
        assertNotFound(call(tokenB, HttpMethod.GET, "/api/services/" + serviceA, null));
    }

    @Test
    void otherTenantCannotUpdateOrDeleteRecords() {
        assertNotFound(call(tokenB, HttpMethod.PUT, "/api/professionals/" + professionalA,
                Map.of("name", "Sequestrado", "specialization", "x", "active", true)));
        assertNotFound(call(tokenB, HttpMethod.DELETE, "/api/professionals/" + professionalA, null));
        assertNotFound(call(tokenB, HttpMethod.PUT, "/api/services/" + serviceA, serviceBody("Sequestrado")));
        assertNotFound(call(tokenB, HttpMethod.DELETE, "/api/services/" + serviceA, null));
        assertNotFound(call(tokenB, HttpMethod.PATCH, "/api/appointments/" + appointmentA + "/status",
                Map.of("status", "CANCELED")));

        // Os dados do salão A continuam intactos
        Map<?, ?> professional = call(tokenA, HttpMethod.GET, "/api/professionals/" + professionalA, null).getBody();
        assertThat(professional.get("name")).isEqualTo("Profissional do A");
        assertThat(professional.get("active")).isEqualTo(true);
        Map<?, ?> service = call(tokenA, HttpMethod.GET, "/api/services/" + serviceA, null).getBody();
        assertThat(service.get("name")).isEqualTo("Corte do A");
    }

    @Test
    void otherTenantCannotBookUsingAnotherTenantsRecords() {
        LocalDateTime nextTuesday = LocalDate.now()
                .with(TemporalAdjusters.next(DayOfWeek.TUESDAY))
                .atTime(10, 0);

        assertNotFound(call(tokenB, HttpMethod.POST, "/api/appointments", Map.of(
                "customerId", customerA,
                "professionalId", professionalA,
                "serviceId", serviceA,
                "startTime", nextTuesday.toString())));
    }

    @Test
    void listsOnlyContainOwnRecords() {
        assertThat(idsFrom(tokenB, "/api/professionals")).doesNotContain(professionalA);
        assertThat(idsFrom(tokenB, "/api/services")).doesNotContain(serviceA);
        LocalDate appointmentDay = LocalDate.now().with(TemporalAdjusters.next(DayOfWeek.MONDAY));
        assertThat(idsFrom(tokenB, "/api/appointments?date=" + appointmentDay)).doesNotContain(appointmentA);
        assertThat(idsFrom(tokenA, "/api/appointments?date=" + appointmentDay)).contains(appointmentA);

        assertThat(idsFrom(tokenA, "/api/professionals")).contains(professionalA);
    }

    @Test
    void customerSearchOnlyReturnsOwnCustomers() {
        assertThat(idsFrom(tokenB, "/api/customers?search=Cliente")).doesNotContain(customerA);
        assertThat(idsFrom(tokenB, "/api/customers")).doesNotContain(customerA);
        assertThat(idsFrom(tokenA, "/api/customers?search=Cliente")).contains(customerA);
    }

    @Test
    void otherTenantCannotUpdateCustomer() {
        assertNotFound(call(tokenB, HttpMethod.PUT, "/api/customers/" + customerA,
                Map.of("name", "Sequestrado", "phone", "5586999990099")));

        Map<?, ?> customer = call(tokenA, HttpMethod.GET, "/api/customers/" + customerA, null).getBody();
        assertThat(customer.get("name")).isEqualTo("Cliente do A");
    }

    @Test
    void availabilityRejectsAnotherTenantsProfessional() {
        String serviceB = createAs(tokenB, "/api/services", serviceBody("Corte do B"));
        LocalDate nextMonday = LocalDate.now().with(TemporalAdjusters.next(DayOfWeek.MONDAY));

        assertNotFound(call(tokenB, HttpMethod.GET, "/api/appointments/availability?date=" + nextMonday
                + "&serviceId=" + serviceB + "&professionalId=" + professionalA, null));
    }

    private String registerAndLogin(String salonName) {
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
        return (String) loggedIn.getBody().get("token");
    }

    private String createAs(String token, String path, Map<String, ?> body) {
        ResponseEntity<Map> response = call(token, HttpMethod.POST, path, body);
        assertThat(response.getStatusCode()).as("POST %s", path).isEqualTo(HttpStatus.CREATED);
        return (String) response.getBody().get("id");
    }

    private ResponseEntity<Map> call(String token, HttpMethod method, String path, Object body) {
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(token);
        return restTemplate.exchange(path, method, new HttpEntity<>(body, headers), Map.class);
    }

    @SuppressWarnings("unchecked")
    private List<String> idsFrom(String token, String path) {
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(token);
        ResponseEntity<List> response = restTemplate.exchange(path, HttpMethod.GET, new HttpEntity<>(headers), List.class);
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        return ((List<Map<String, Object>>) response.getBody()).stream()
                .map(item -> (String) item.get("id"))
                .toList();
    }

    private static Map<String, Object> serviceBody(String name) {
        return Map.of(
                "name", name,
                "price", 50,
                "durationMinutes", 30,
                "requiresOnlinePayment", false,
                "active", true);
    }

    private static void assertNotFound(ResponseEntity<?> response) {
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
    }
}
