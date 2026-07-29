package com.agenda.api.service;

import com.agenda.api.dto.ProfessionalRequest;
import com.agenda.api.dto.ProfessionalResponse;
import com.agenda.api.exception.ResourceNotFoundException;
import com.agenda.api.model.Professional;
import com.agenda.api.repository.ProfessionalRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
public class ProfessionalService {

    private final ProfessionalRepository professionalRepository;

    public ProfessionalService(ProfessionalRepository professionalRepository) {
        this.professionalRepository = professionalRepository;
    }

    @Transactional
    public ProfessionalResponse create(ProfessionalRequest request) {
        Professional professional = new Professional();
        professional.setName(request.name());
        professional.setSpecialization(request.specialization());
        professional.setActive(request.active());

        professional = professionalRepository.save(professional);

        return mapToResponse(professional);
    }

    @Transactional(readOnly = true)
    public ProfessionalResponse findById(UUID id) {
        Professional professional = professionalRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Profissional não encontrado com ID: " + id));
        return mapToResponse(professional);
    }

    private ProfessionalResponse mapToResponse(Professional professional) {
        return new ProfessionalResponse(
                professional.getId(),
                professional.getName(),
                professional.getSpecialization(),
                professional.isActive()
        );
    }
}
