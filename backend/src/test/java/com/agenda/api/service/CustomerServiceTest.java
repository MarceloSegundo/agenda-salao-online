package com.agenda.api.service;

import com.agenda.api.dto.CustomerRequest;
import com.agenda.api.dto.CustomerResponse;
import com.agenda.api.exception.ResourceNotFoundException;
import com.agenda.api.model.Customer;
import com.agenda.api.repository.CustomerRepository;
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
public class CustomerServiceTest {

    @Mock
    private CustomerRepository customerRepository;

    @InjectMocks
    private CustomerService customerService;

    private Customer customer;
    private CustomerRequest request;
    private final UUID customerId = UUID.randomUUID();

    @BeforeEach
    void setUp() {
        customer = new Customer();
        customer.setId(customerId);
        customer.setName("Maria Silva");
        customer.setPhone("11999999999");
        customer.setEmail("maria@test.com");

        request = new CustomerRequest("Maria Silva", "11999999999", "maria@test.com");
    }

    @Test
    void shouldCreateCustomer() {
        when(customerRepository.save(any(Customer.class))).thenReturn(customer);

        CustomerResponse response = customerService.create(request);

        assertNotNull(response);
        assertEquals(customer.getId(), response.id());
        assertEquals("Maria Silva", response.name());
        verify(customerRepository, times(1)).save(any(Customer.class));
    }

    @Test
    void shouldFindCustomerById() {
        when(customerRepository.findById(customerId)).thenReturn(Optional.of(customer));

        CustomerResponse response = customerService.findById(customerId);

        assertNotNull(response);
        assertEquals(customerId, response.id());
        verify(customerRepository, times(1)).findById(customerId);
    }

    @Test
    void shouldThrowExceptionWhenCustomerNotFound() {
        when(customerRepository.findById(customerId)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> customerService.findById(customerId));
    }
}
