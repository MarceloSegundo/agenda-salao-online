package com.agenda.api.model;

import com.agenda.api.model.base.BaseTenantEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

@Entity
@Table(name = "customers", uniqueConstraints = @UniqueConstraint(name = "uk_customers_tenant_phone", columnNames = {"tenant_id", "phone"}))
public class Customer extends BaseTenantEntity {

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private String phone; // Para notificações do WhatsApp

    private String email;

    // Getters and Setters
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    
    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }
    
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
}
