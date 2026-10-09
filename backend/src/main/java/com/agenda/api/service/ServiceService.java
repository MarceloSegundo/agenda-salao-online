package com.agenda.api.service;

import com.agenda.api.dto.ServiceRequest;
import com.agenda.api.dto.ServiceResponse;
import com.agenda.api.exception.ResourceNotFoundException;
import com.agenda.api.repository.ServiceRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
public class ServiceService {

    private final ServiceRepository serviceRepository;

    public ServiceService(ServiceRepository serviceRepository) {
        this.serviceRepository = serviceRepository;
    }

    @Transactional
    public ServiceResponse create(ServiceRequest request) {
        com.agenda.api.model.Service service = new com.agenda.api.model.Service();
        service.setName(request.name());
        service.setDescription(request.description());
        service.setPrice(request.price());
        service.setDurationMinutes(request.durationMinutes());
        service.setRequiresOnlinePayment(request.requiresOnlinePayment());
        service.setActive(request.active());

        service = serviceRepository.save(service);

        return mapToResponse(service);
    }

    @Transactional(readOnly = true)
    public ServiceResponse findById(UUID id) {
        com.agenda.api.model.Service service = serviceRepository.findByIdInCurrentTenant(id)
                .orElseThrow(() -> new ResourceNotFoundException("Serviço não encontrado com ID: " + id));
        return mapToResponse(service);
    }

    @Transactional(readOnly = true)
    public java.util.List<ServiceResponse> findAll() {
        return serviceRepository.findAll().stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Transactional
    public ServiceResponse update(UUID id, ServiceRequest request) {
        com.agenda.api.model.Service service = serviceRepository.findByIdInCurrentTenant(id)
                .orElseThrow(() -> new ResourceNotFoundException("Serviço não encontrado com ID: " + id));
        
        service.setName(request.name());
        service.setDescription(request.description());
        service.setPrice(request.price());
        service.setDurationMinutes(request.durationMinutes());
        service.setRequiresOnlinePayment(request.requiresOnlinePayment());
        service.setActive(request.active());
        
        service = serviceRepository.save(service);
        return mapToResponse(service);
    }

    @Transactional
    public void delete(UUID id) {
        com.agenda.api.model.Service service = serviceRepository.findByIdInCurrentTenant(id)
                .orElseThrow(() -> new ResourceNotFoundException("Serviço não encontrado com ID: " + id));
        
        service.setActive(false);
        serviceRepository.save(service);
    }

    private ServiceResponse mapToResponse(com.agenda.api.model.Service service) {
        return new ServiceResponse(
                service.getId(),
                service.getName(),
                service.getDescription(),
                service.getPrice(),
                service.getDurationMinutes(),
                service.isRequiresOnlinePayment(),
                service.isActive()
        );
    }
}
