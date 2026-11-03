package com.agenda.api.controller;

import com.agenda.api.support.ApiTestClient;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Primary;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.test.context.ActiveProfiles;

import java.time.Clock;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.temporal.TemporalAdjusters;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("test")
class DashboardIntegrationTest {

    private static final ZoneId ZONE = ZoneId.of("America/Sao_Paulo");
    // "Hoje" é a próxima segunda (dia útil num salão novo, seg-sex 8h-18h), às 09:00
    private static final LocalDate TODAY = LocalDate.now(ZONE).with(TemporalAdjusters.next(DayOfWeek.MONDAY));

    @TestConfiguration
    static class FixedClockConfig {
        @Bean
        @Primary
        Clock fixedClock() {
            return Clock.fixed(TODAY.atTime(9, 0).atZone(ZONE).toInstant(), ZONE);
        }
    }

    @Autowired
    private TestRestTemplate restTemplate;

    @Test
    void withoutTokenIsForbidden() {
        assertThat(restTemplate.getForEntity("/api/dashboard/today", String.class).getStatusCode())
                .isEqualTo(HttpStatus.FORBIDDEN);
    }

    @Test
    void emptySalonReturnsZeros() {
        Map<String, Object> dashboard = today(ApiTestClient.newSalon(restTemplate, "Salão Vazio"));

        Map<String, Object> summary = map(dashboard, "summary");
        assertThat(dashboard.get("date")).isEqualTo(TODAY.toString());
        assertThat(dashboard.get("salonName")).isEqualTo("Salão Vazio");
        assertThat(summary.get("total")).isEqualTo(0);
        assertThat(((Number) summary.get("expectedRevenue")).doubleValue()).isZero();
        assertThat(dashboard.get("next")).isNull();
        assertThat((List<?>) map(dashboard, "pending").get("toConfirm")).isEmpty();
        assertThat((List<?>) dashboard.get("team")).isEmpty();
    }

    @Test
    void showsTodaysAppointment() {
        ApiTestClient salon = bookedSalon("Salão Cheio");

        Map<String, Object> dashboard = today(salon);

        Map<String, Object> summary = map(dashboard, "summary");
        assertThat(summary.get("total")).isEqualTo(1);
        assertThat(summary.get("toConfirm")).isEqualTo(1);
        assertThat(((Number) summary.get("expectedRevenue")).doubleValue()).isEqualTo(50.0);
        Map<String, Object> next = map(dashboard, "next");
        assertThat(next.get("customerName")).isEqualTo("Maria");
        assertThat(next.get("customerPhone")).isEqualTo("5586999990000");
        assertThat(next.get("startTime")).isEqualTo(TODAY + "T10:00:00");
        assertThat(next.get("inProgress")).isEqualTo(false);
        Map<?, ?> carlos = (Map<?, ?>) ((List<?>) dashboard.get("team")).get(0);
        assertThat(carlos.get("state")).isEqualTo("FREE");
        assertThat(carlos.get("nextAt")).isEqualTo("10:00");
    }

    @Test
    void otherSalonDoesNotSeeTheAppointment() {
        bookedSalon("Salão A");

        Map<String, Object> dashboard = today(ApiTestClient.newSalon(restTemplate, "Salão B"));

        assertThat(map(dashboard, "summary").get("total")).isEqualTo(0);
        assertThat(dashboard.get("next")).isNull();
        assertThat((List<?>) dashboard.get("team")).isEmpty();
    }

    private ApiTestClient bookedSalon(String name) {
        ApiTestClient salon = ApiTestClient.newSalon(restTemplate, name);
        String customerId = salon.create("/api/customers", Map.of("name", "Maria", "phone", "5586999990000"));
        String professionalId = salon.create("/api/professionals", Map.of("name", "Carlos", "active", true));
        String serviceId = salon.create("/api/services", Map.of(
                "name", "Corte", "price", 50, "durationMinutes", 30,
                "requiresOnlinePayment", false, "active", true));
        salon.create("/api/appointments", Map.of(
                "customerId", customerId,
                "professionalId", professionalId,
                "serviceId", serviceId,
                "startTime", TODAY + "T10:00:00"));
        return salon;
    }

    @SuppressWarnings("unchecked")
    private static Map<String, Object> today(ApiTestClient salon) {
        ResponseEntity<Map> response = salon.call(HttpMethod.GET, "/api/dashboard/today", null);
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        return response.getBody();
    }

    @SuppressWarnings("unchecked")
    private static Map<String, Object> map(Map<String, Object> source, String key) {
        return (Map<String, Object>) source.get(key);
    }
}
