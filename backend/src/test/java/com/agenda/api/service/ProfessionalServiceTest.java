package com.agenda.api.service;

import com.agenda.api.dto.ProfessionalRequest;
import com.agenda.api.dto.ProfessionalResponse;
import com.agenda.api.exception.ResourceNotFoundException;
import com.agenda.api.model.Professional;
import com.agenda.api.repository.ProfessionalRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class ProfessionalServiceTest {

    @Mock
    private ProfessionalRepository professionalRepository;

    @InjectMocks
    private ProfessionalService professionalService;

    private Professional professional;
    private ProfessionalRequest request;
    private final UUID professionalId = UUID.randomUUID();

    @BeforeEach
    void setUp() {
        professional = new Professional();
        professional.setId(professionalId);
        professional.setName("Carlos");
        professional.setSpecialization("Barbeiro");
        professional.setActive(true);

        request = new ProfessionalRequest("Carlos", "Barbeiro", true, java.util.List.of());
    }

    @Test
    void shouldCreateProfessional() {
        when(professionalRepository.save(any(Professional.class))).thenReturn(professional);

        ProfessionalResponse response = professionalService.create(request);

        assertNotNull(response);
        assertEquals(professional.getId(), response.id());
        assertTrue(response.active());
        verify(professionalRepository, times(1)).save(any(Professional.class));
    }

    @Test
    void shouldFindProfessionalById() {
        when(professionalRepository.findByIdInCurrentTenant(professionalId)).thenReturn(Optional.of(professional));

        ProfessionalResponse response = professionalService.findById(professionalId);

        assertNotNull(response);
        assertEquals(professionalId, response.id());
        verify(professionalRepository, times(1)).findByIdInCurrentTenant(professionalId);
    }
}
