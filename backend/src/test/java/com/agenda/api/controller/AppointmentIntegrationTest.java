package com.agenda.api.controller;

import com.agenda.api.support.ApiTestClient;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;
import org.springframework.test.context.ActiveProfiles;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.temporal.TemporalAdjusters;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("test")
public class AppointmentIntegrationTest {

    @Autowired
    private TestRestTemplate restTemplate;

    private ApiTestClient salon;
    private String customerId;
    private String professionalId;
    private String serviceId;
    // Salão novo abre seg-sex, 8h-18h
    private final LocalDate monday = LocalDate.now().with(TemporalAdjusters.next(DayOfWeek.MONDAY));
    private final LocalDate tuesday = monday.plusDays(1);

    @BeforeEach
    void setUp() {
        salon = ApiTestClient.newSalon(restTemplate, "Salão Agenda");
        customerId = salon.create("/api/customers", Map.of("name", "Maria", "phone", "5586999990000"));
        professionalId = salon.create("/api/professionals", Map.of("name", "Carlos", "active", true));
        serviceId = salon.create("/api/services", Map.of(
                "name", "Corte", "price", 50, "durationMinutes", 30,
                "requiresOnlinePayment", false, "active", true));
    }

    @Test
    void dayListingReturnsOnlyThatDaySorted() {
        book(monday, "14:00");
        book(monday, "09:00");
        book(tuesday, "09:00");

        List<Map<String, Object>> day = salon.getList("/api/appointments?date=" + monday);

        assertThat(day).extracting(a -> (String) a.get("startTime"))
                .containsExactly(monday + "T09:00:00", monday + "T14:00:00");
    }

    @Test
    void dayListingIncludesCanceled() {
        String id = book(monday, "09:00");
        salon.call(HttpMethod.PATCH, "/api/appointments/" + id + "/status", Map.of("status", "CANCELED"));

        List<Map<String, Object>> day = salon.getList("/api/appointments?date=" + monday);

        assertThat(day).extracting(a -> a.get("status")).containsExactly("CANCELED");
    }

    @Test
    void availabilityEndpointReturnsHHmmSlots() {
        List<Map<String, Object>> slots = salon.getList(
                "/api/appointments/availability?date=" + monday + "&serviceId=" + serviceId + "&professionalId=" + professionalId);

        assertThat(slots.get(0).get("time")).isEqualTo("08:00");
        assertThat(slots.get(0).get("professionalId")).isEqualTo(professionalId);
    }

    @Test
    void availabilityWithMalformedDateReturns400() {
        assertThat(salon.call(HttpMethod.GET,
                "/api/appointments/availability?date=12-10-2026&serviceId=" + serviceId, null).getStatusCode())
                .isEqualTo(HttpStatus.BAD_REQUEST);
    }

    @Test
    void availabilityWithUnknownServiceReturns404() {
        assertThat(salon.call(HttpMethod.GET,
                "/api/appointments/availability?date=" + monday + "&serviceId=" + UUID.randomUUID(), null).getStatusCode())
                .isEqualTo(HttpStatus.NOT_FOUND);
    }

    @Test
    void concurrentBookingsOfSameSlotYieldOne201AndOne409() throws Exception {
        Map<String, Object> body = bookingBody(monday, "10:00");
        CountDownLatch start = new CountDownLatch(1);
        ExecutorService pool = Executors.newFixedThreadPool(2);
        try {
            List<Future<HttpStatusCode>> results = new ArrayList<>();
            for (int i = 0; i < 2; i++) {
                results.add(pool.submit(() -> {
                    start.await();
                    return salon.call(HttpMethod.POST, "/api/appointments", body).getStatusCode();
                }));
            }
            start.countDown();

            List<HttpStatusCode> statuses = new ArrayList<>();
            for (Future<HttpStatusCode> result : results) {
                statuses.add(result.get());
            }
            assertThat(statuses).containsExactlyInAnyOrder(HttpStatus.CREATED, HttpStatus.CONFLICT);
        } finally {
            pool.shutdownNow();
        }
    }

    @Test
    void canceledAppointmentFreesTheSlot() {
        String id = book(monday, "11:00");
        salon.call(HttpMethod.PATCH, "/api/appointments/" + id + "/status", Map.of("status", "CANCELED"));

        book(monday, "11:00");
    }

    private String book(LocalDate date, String time) {
        return salon.create("/api/appointments", bookingBody(date, time));
    }

    private Map<String, Object> bookingBody(LocalDate date, String time) {
        return Map.of(
                "customerId", customerId,
                "professionalId", professionalId,
                "serviceId", serviceId,
                "startTime", date + "T" + time + ":00");
    }
}
