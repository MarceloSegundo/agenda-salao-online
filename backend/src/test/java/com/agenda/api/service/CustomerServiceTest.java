package com.agenda.api.service;

import com.agenda.api.dto.CustomerRequest;
import com.agenda.api.dto.CustomerResponse;
import com.agenda.api.exception.ConflictException;
import com.agenda.api.exception.ResourceNotFoundException;
import com.agenda.api.model.Customer;
import com.agenda.api.repository.CustomerRepository;
import com.agenda.api.security.TenantContext;
import org.junit.jupiter.api.AfterEach;
import org.mockito.ArgumentCaptor;
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
    private final UUID tenantId = UUID.randomUUID();

    @BeforeEach
    void setUp() {
        TenantContext.setCurrentTenant(tenantId);
        customer = new Customer();
        customer.setId(customerId);
        customer.setName("Maria Silva");
        customer.setPhone("11999999999");
        customer.setEmail("maria@test.com");

        request = new CustomerRequest("Maria Silva", "11999999999", "maria@test.com");
    }

    @AfterEach
    void tearDown() {
        TenantContext.clear();
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
        when(customerRepository.findByIdInCurrentTenant(customerId)).thenReturn(Optional.of(customer));

        CustomerResponse response = customerService.findById(customerId);

        assertNotNull(response);
        assertEquals(customerId, response.id());
        verify(customerRepository, times(1)).findByIdInCurrentTenant(customerId);
    }

    @Test
    void shouldThrowExceptionWhenCustomerNotFound() {
        when(customerRepository.findByIdInCurrentTenant(customerId)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> customerService.findById(customerId));
    }

    @Test
    void shouldNormalizePhoneToDigitsOnCreate() {
        when(customerRepository.save(any(Customer.class))).thenAnswer(inv -> inv.getArgument(0));

        customerService.create(new CustomerRequest("Maria Silva", "+55 (86) 99999-0000", null));

        ArgumentCaptor<Customer> saved = ArgumentCaptor.forClass(Customer.class);
        verify(customerRepository).save(saved.capture());
        assertEquals("5586999990000", saved.getValue().getPhone());
    }

    @Test
    void shouldRejectDuplicatePhoneWithExistingCustomerDetails() {
        when(customerRepository.findByPhoneAndTenantId("11999999999", tenantId)).thenReturn(Optional.of(customer));

        ConflictException ex = assertThrows(ConflictException.class,
                () -> customerService.create(new CustomerRequest("Outra Pessoa", "11999999999", null)));

        assertEquals("Maria Silva", ex.getDetails().get("existingCustomerName"));
        assertEquals(customerId.toString(), ex.getDetails().get("existingCustomerId"));
        verify(customerRepository, never()).save(any());
    }

    @Test
    void shouldAllowUpdateKeepingOwnPhone() {
        when(customerRepository.findByIdInCurrentTenant(customerId)).thenReturn(Optional.of(customer));
        when(customerRepository.findByPhoneAndTenantId("11999999999", tenantId)).thenReturn(Optional.of(customer));
        when(customerRepository.save(any(Customer.class))).thenAnswer(inv -> inv.getArgument(0));

        CustomerResponse response = customerService.update(customerId, new CustomerRequest("Maria S.", "11999999999", null));

        assertEquals("Maria S.", response.name());
    }

    @Test
    void shouldRejectUpdateToAnotherCustomersPhone() {
        Customer other = new Customer();
        other.setId(UUID.randomUUID());
        other.setName("Joana");
        other.setPhone("11888888888");
        when(customerRepository.findByIdInCurrentTenant(customerId)).thenReturn(Optional.of(customer));
        when(customerRepository.findByPhoneAndTenantId("11888888888", tenantId)).thenReturn(Optional.of(other));

        assertThrows(ConflictException.class,
                () -> customerService.update(customerId, new CustomerRequest("Maria Silva", "11888888888", null)));
        verify(customerRepository, never()).save(any());
    }
}
