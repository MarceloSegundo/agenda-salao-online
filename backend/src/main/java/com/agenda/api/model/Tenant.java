package com.agenda.api.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "tenants")
public class Tenant {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false, unique = true)
    private String domain; // ex: salao-do-joao

    private boolean active = true;

    @Column(name = "opening_time")
    private java.time.LocalTime openingTime = java.time.LocalTime.of(8, 0); // Default 08:00

    @Column(name = "closing_time")
    private java.time.LocalTime closingTime = java.time.LocalTime.of(18, 0); // Default 18:00

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }

    // Getters and Setters
    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    
    public String getDomain() { return domain; }
    public void setDomain(String domain) { this.domain = domain; }
    
    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }
    
    public java.time.LocalTime getOpeningTime() { return openingTime; }
    public void setOpeningTime(java.time.LocalTime openingTime) { this.openingTime = openingTime; }
    
    public java.time.LocalTime getClosingTime() { return closingTime; }
    public void setClosingTime(java.time.LocalTime closingTime) { this.closingTime = closingTime; }
    
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
