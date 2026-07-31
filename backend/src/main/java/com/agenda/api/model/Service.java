package com.agenda.api.model;

import com.agenda.api.model.base.BaseTenantEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import java.math.BigDecimal;

@Entity
@Table(name = "services")
public class Service extends BaseTenantEntity {

    @Column(nullable = false)
    private String name;

    private String description;

    @Column(nullable = false)
    private BigDecimal price;

    @Column(nullable = false)
    private Integer durationMinutes; // Duração estimada em minutos

    @Column(nullable = false)
    private boolean requiresOnlinePayment = false; // Se true, o agendamento só confirma mediante pagamento.

    @Column(nullable = false, columnDefinition = "boolean default true")
    private boolean active = true; // Para soft delete

    // Getters and Setters
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    
    public BigDecimal getPrice() { return price; }
    public void setPrice(BigDecimal price) { this.price = price; }
    
    public Integer getDurationMinutes() { return durationMinutes; }
    public void setDurationMinutes(Integer durationMinutes) { this.durationMinutes = durationMinutes; }
    
    public boolean isRequiresOnlinePayment() { return requiresOnlinePayment; }
    public void setRequiresOnlinePayment(boolean requiresOnlinePayment) { this.requiresOnlinePayment = requiresOnlinePayment; }

    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }
}
