package com.agenda.api.controller;

import com.agenda.api.dto.CustomerRequest;
import com.agenda.api.dto.CustomerResponse;
import com.agenda.api.service.CustomerService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/customers")
public class CustomerController {

    private final CustomerService customerService;

    public CustomerController(CustomerService customerService) {
        this.customerService = customerService;
    }

    @PostMapping
    public ResponseEntity<CustomerResponse> create(@RequestBody @Valid CustomerRequest request) {
        CustomerResponse response = customerService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping
    public ResponseEntity<List<CustomerResponse>> search(@RequestParam(required = false) String search) {
        return ResponseEntity.ok(customerService.search(search));
    }

    @PutMapping("/{id}")
    public ResponseEntity<CustomerResponse> update(@PathVariable UUID id, @RequestBody @Valid CustomerRequest request) {
        return ResponseEntity.ok(customerService.update(id, request));
    }

    @GetMapping("/{id}")
    public ResponseEntity<CustomerResponse> findById(@PathVariable UUID id) {
        CustomerResponse response = customerService.findById(id);
        return ResponseEntity.ok(response);
    }
}
