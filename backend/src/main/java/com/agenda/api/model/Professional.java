package com.agenda.api.model;

import com.agenda.api.model.base.BaseTenantEntity;
import com.agenda.api.model.base.BusinessHour;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.CollectionTable;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "professionals")
public class Professional extends BaseTenantEntity {

    @Column(nullable = false)
    private String name;

    private String specialization;

    private boolean active = true;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "professional_business_hours", joinColumns = @JoinColumn(name = "professional_id"))
    private List<BusinessHour> businessHours = new ArrayList<>();

    // Getters and Setters
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    
    public String getSpecialization() { return specialization; }
    public void setSpecialization(String specialization) { this.specialization = specialization; }
    
    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }

    public List<BusinessHour> getBusinessHours() { return businessHours; }
    public void setBusinessHours(List<BusinessHour> businessHours) { this.businessHours = businessHours; }
}
