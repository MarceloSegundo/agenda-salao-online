package com.agenda.api.service;

import com.agenda.api.dto.ServiceRequest;
import com.agenda.api.dto.ServiceResponse;
import com.agenda.api.exception.ResourceNotFoundException;
import com.agenda.api.model.Service;
import com.agenda.api.repository.ServiceRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class ServiceServiceTest {

    @Mock
    private ServiceRepository serviceRepository;

    @InjectMocks
    private ServiceService serviceService;

    private Service service;
    private ServiceRequest request;
    private final UUID serviceId = UUID.randomUUID();

    @BeforeEach
    void setUp() {
        service = new Service();
        service.setId(serviceId);
        service.setName("Corte de Cabelo");
        service.setDescription("Corte masculino");
        service.setPrice(new BigDecimal("50.00"));
        service.setDurationMinutes(30);
        service.setRequiresOnlinePayment(false);
        service.setActive(true);

        request = new ServiceRequest("Corte de Cabelo", "Corte masculino", new BigDecimal("50.00"), 30, false, true);
    }

    @Test
    void shouldCreateService() {
        when(serviceRepository.save(any(Service.class))).thenReturn(service);

        ServiceResponse response = serviceService.create(request);

        assertNotNull(response);
        assertEquals(service.getId(), response.id());
        assertEquals(new BigDecimal("50.00"), response.price());
        verify(serviceRepository, times(1)).save(any(Service.class));
    }

    @Test
    void shouldFindServiceById() {
        when(serviceRepository.findByIdInCurrentTenant(serviceId)).thenReturn(Optional.of(service));

        ServiceResponse response = serviceService.findById(serviceId);

        assertNotNull(response);
        assertEquals(serviceId, response.id());
        verify(serviceRepository, times(1)).findByIdInCurrentTenant(serviceId);
    }
}
