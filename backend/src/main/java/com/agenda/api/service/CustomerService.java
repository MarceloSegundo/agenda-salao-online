package com.agenda.api.service;

import com.agenda.api.dto.CustomerRequest;
import com.agenda.api.dto.CustomerResponse;
import com.agenda.api.exception.ConflictException;
import com.agenda.api.exception.ResourceNotFoundException;
import com.agenda.api.model.Customer;
import com.agenda.api.repository.CustomerRepository;
import com.agenda.api.security.TenantContext;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class CustomerService {

    private static final Pageable SEARCH_LIMIT = PageRequest.of(0, 50);

    private final CustomerRepository customerRepository;

    public CustomerService(CustomerRepository customerRepository) {
        this.customerRepository = customerRepository;
    }

    @Transactional
    public CustomerResponse create(CustomerRequest request) {
        String phone = digitsOnly(request.phone());
        assertPhoneAvailable(phone, null);

        Customer customer = new Customer();
        apply(customer, request, phone);
        customer = customerRepository.save(customer);

        return mapToResponse(customer);
    }

    @Transactional
    public CustomerResponse update(UUID id, CustomerRequest request) {
        Customer customer = customerRepository.findByIdInCurrentTenant(id)
                .orElseThrow(() -> new ResourceNotFoundException("Cliente não encontrado com ID: " + id));
        String phone = digitsOnly(request.phone());
        assertPhoneAvailable(phone, id);

        apply(customer, request, phone);
        customer = customerRepository.save(customer);
        return mapToResponse(customer);
    }

    /** Até 50 clientes por nome; o termo casa trecho do nome ou, se tiver dígitos, do telefone. */
    @Transactional(readOnly = true)
    public List<CustomerResponse> search(String term) {
        List<Customer> customers;
        if (term == null || term.isBlank()) {
            customers = customerRepository.findAllByOrderByNameAsc(SEARCH_LIMIT);
        } else {
            String digits = digitsOnly(term);
            customers = digits.isEmpty()
                    ? customerRepository.searchByName(term.trim(), SEARCH_LIMIT)
                    : customerRepository.searchByNameOrPhone(term.trim(), digits, SEARCH_LIMIT);
        }
        return customers.stream().map(this::mapToResponse).toList();
    }

    @Transactional(readOnly = true)
    public CustomerResponse findById(UUID id) {
        Customer customer = customerRepository.findByIdInCurrentTenant(id)
                .orElseThrow(() -> new ResourceNotFoundException("Cliente não encontrado com ID: " + id));
        return mapToResponse(customer);
    }

    private void assertPhoneAvailable(String phone, UUID currentCustomerId) {
        customerRepository.findByPhoneAndTenantId(phone, TenantContext.getCurrentTenant())
                .filter(existing -> !existing.getId().equals(currentCustomerId))
                .ifPresent(existing -> {
                    throw new ConflictException("Já existe um cliente com este telefone.", Map.of(
                            "existingCustomerId", existing.getId().toString(),
                            "existingCustomerName", existing.getName()));
                });
    }

    private static void apply(Customer customer, CustomerRequest request, String phone) {
        customer.setName(request.name().trim());
        customer.setPhone(phone);
        customer.setEmail(request.email() == null || request.email().isBlank() ? null : request.email().trim());
    }

    private static String digitsOnly(String value) {
        return value.replaceAll("\\D", "");
    }

    private CustomerResponse mapToResponse(Customer customer) {
        return new CustomerResponse(
                customer.getId(),
                customer.getName(),
                customer.getPhone(),
                customer.getEmail()
        );
    }
}
