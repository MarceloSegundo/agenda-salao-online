package com.agenda.api.controller;

import com.agenda.api.support.ApiTestClient;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.test.context.ActiveProfiles;

import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("test")
public class CustomerIntegrationTest {

    @Autowired
    private TestRestTemplate restTemplate;

    private ApiTestClient salon;

    @BeforeEach
    void setUp() {
        salon = ApiTestClient.newSalon(restTemplate, "Salão Clientes");
    }

    @Test
    void searchMatchesNameIgnoringCase() {
        salon.create("/api/customers", Map.of("name", "Ana Paula", "phone", "5586999990001"));
        salon.create("/api/customers", Map.of("name", "Bruno", "phone", "5586999990002"));

        assertThat(names(salon.getList("/api/customers?search=ana"))).containsExactly("Ana Paula");
    }

    @Test
    void searchIgnoresAccentsOnBothSides() {
        salon.create("/api/customers", Map.of("name", "João Lima", "phone", "5586999990001"));
        salon.create("/api/customers", Map.of("name", "Conceição", "phone", "5586999990002"));
        salon.create("/api/customers", Map.of("name", "Bruno", "phone", "5586999990003"));

        assertThat(names(salon.getList("/api/customers?search=joao"))).containsExactly("João Lima");
        assertThat(names(salon.getList("/api/customers?search=CONCEICAO"))).containsExactly("Conceição");
        assertThat(names(salon.getList("/api/customers?search=Jõao"))).containsExactly("João Lima");
    }

    @Test
    void searchByNameDoesNotMatchEveryoneThroughPhone() {
        salon.create("/api/customers", Map.of("name", "Ana Paula", "phone", "5586999990001"));
        salon.create("/api/customers", Map.of("name", "Bruno", "phone", "5586999990002"));

        assertThat(names(salon.getList("/api/customers?search=ana"))).doesNotContain("Bruno");
    }

    @Test
    void searchMatchesPhoneDigits() {
        salon.create("/api/customers", Map.of("name", "Ana Paula", "phone", "5586999990001"));
        salon.create("/api/customers", Map.of("name", "Bruno", "phone", "5586988880002"));

        assertThat(names(salon.getList("/api/customers?search=(86) 99999"))).containsExactly("Ana Paula");
    }

    @Test
    void listWithoutSearchIsSortedByNameAndCappedAt50() {
        for (int i = 51; i >= 1; i--) {
            salon.create("/api/customers", Map.of("name", String.format("Cliente %02d", i), "phone", "55869000000" + String.format("%02d", i)));
        }

        List<String> names = names(salon.getList("/api/customers"));

        assertThat(names).hasSize(50);
        assertThat(names.get(0)).isEqualTo("Cliente 01");
        assertThat(names.get(49)).isEqualTo("Cliente 50");
    }

    @Test
    void samePhoneInSameSalonReturns409WithDetails() {
        String existingId = salon.create("/api/customers", Map.of("name", "Maria Souza", "phone", "5586999990000"));

        ResponseEntity<Map> response = salon.call(HttpMethod.POST, "/api/customers",
                Map.of("name", "Outra Maria", "phone", "+55 (86) 99999-0000"));

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
        Map<?, ?> details = (Map<?, ?>) response.getBody().get("details");
        assertThat(details.get("existingCustomerId")).isEqualTo(existingId);
        assertThat(details.get("existingCustomerName")).isEqualTo("Maria Souza");
    }

    @Test
    void samePhoneInAnotherSalonIsAllowed() {
        salon.create("/api/customers", Map.of("name", "Maria Souza", "phone", "5586999990000"));
        ApiTestClient otherSalon = ApiTestClient.newSalon(restTemplate, "Outro Salão");

        otherSalon.create("/api/customers", Map.of("name", "Maria Souza", "phone", "5586999990000"));
    }

    @Test
    void updateChangesCustomerData() {
        String id = salon.create("/api/customers", Map.of("name", "Maria", "phone", "5586999990000"));

        ResponseEntity<Map> response = salon.call(HttpMethod.PUT, "/api/customers/" + id,
                Map.of("name", "Maria Souza", "phone", "5586999990000", "email", "maria@teste.com"));

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody().get("name")).isEqualTo("Maria Souza");
        assertThat(response.getBody().get("email")).isEqualTo("maria@teste.com");
    }

    private static List<String> names(List<Map<String, Object>> customers) {
        return customers.stream().map(c -> (String) c.get("name")).toList();
    }
}
