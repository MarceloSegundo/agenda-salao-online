package com.agenda.api.model;

import com.agenda.api.model.base.BaseTenantEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;

@Entity
@Table(name = "professionals")
public class Professional extends BaseTenantEntity {

    @Column(nullable = false)
    private String name;

    private String specialization;

    private boolean active = true;

    // Getters and Setters
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    
    public String getSpecialization() { return specialization; }
    public void setSpecialization(String specialization) { this.specialization = specialization; }
    
    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }
}
