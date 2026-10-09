package com.agenda.api.service;

import com.agenda.api.dto.BusinessHourDto;
import com.agenda.api.dto.ProfessionalRequest;
import com.agenda.api.dto.ProfessionalResponse;
import com.agenda.api.exception.ResourceNotFoundException;
import com.agenda.api.model.Professional;
import com.agenda.api.model.base.BusinessHour;
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

        if (request.businessHours() != null) {
            java.util.List<BusinessHour> hours = request.businessHours().stream()
                .map(dto -> new BusinessHour(dto.dayOfWeek(), dto.openingTime(), dto.closingTime(), dto.isClosed()))
                .toList();
            professional.getBusinessHours().addAll(hours);
        }

        professional = professionalRepository.save(professional);

        return mapToResponse(professional);
    }

    @Transactional(readOnly = true)
    public ProfessionalResponse findById(UUID id) {
        Professional professional = professionalRepository.findByIdInCurrentTenant(id)
                .orElseThrow(() -> new ResourceNotFoundException("Profissional não encontrado com ID: " + id));
        return mapToResponse(professional);
    }

    @Transactional(readOnly = true)
    public java.util.List<ProfessionalResponse> findAll() {
        return professionalRepository.findAll().stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Transactional
    public ProfessionalResponse update(UUID id, ProfessionalRequest request) {
        Professional professional = professionalRepository.findByIdInCurrentTenant(id)
                .orElseThrow(() -> new ResourceNotFoundException("Profissional não encontrado com ID: " + id));
        
        professional.setName(request.name());
        professional.setSpecialization(request.specialization());
        professional.setActive(request.active());
        
        if (request.businessHours() != null) {
            java.util.List<BusinessHour> updatedHours = request.businessHours().stream()
                .map(dto -> new BusinessHour(dto.dayOfWeek(), dto.openingTime(), dto.closingTime(), dto.isClosed()))
                .toList();
            
            professional.getBusinessHours().clear();
            professional.getBusinessHours().addAll(updatedHours);
        } else {
            professional.getBusinessHours().clear();
        }
        
        professional = professionalRepository.save(professional);
        return mapToResponse(professional);
    }

    @Transactional
    public void delete(UUID id) {
        Professional professional = professionalRepository.findByIdInCurrentTenant(id)
                .orElseThrow(() -> new ResourceNotFoundException("Profissional não encontrado com ID: " + id));
        
        // Soft delete
        professional.setActive(false);
        professionalRepository.save(professional);
    }

    private ProfessionalResponse mapToResponse(Professional professional) {
        return new ProfessionalResponse(
                professional.getId(),
                professional.getName(),
                professional.getSpecialization(),
                professional.isActive(),
                professional.getBusinessHours() != null ? professional.getBusinessHours().stream()
                    .map(bh -> new BusinessHourDto(bh.getDayOfWeek(), bh.getOpeningTime(), bh.getClosingTime(), bh.isClosed()))
                    .toList() : java.util.List.of()
        );
    }
}
