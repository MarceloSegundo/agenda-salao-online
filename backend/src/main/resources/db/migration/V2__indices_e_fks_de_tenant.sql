-- Toda tabela de salão passa a apontar para tenants, e as consultas por salão ganham índice.
-- customers não precisa de índice próprio em tenant_id: uk_customers_tenant_phone (tenant_id, phone)
-- já começa por ele.

ALTER TABLE users ADD CONSTRAINT fk_users_tenant FOREIGN KEY (tenant_id) REFERENCES tenants (id);
ALTER TABLE customers ADD CONSTRAINT fk_customers_tenant FOREIGN KEY (tenant_id) REFERENCES tenants (id);
ALTER TABLE professionals ADD CONSTRAINT fk_professionals_tenant FOREIGN KEY (tenant_id) REFERENCES tenants (id);
ALTER TABLE services ADD CONSTRAINT fk_services_tenant FOREIGN KEY (tenant_id) REFERENCES tenants (id);
ALTER TABLE appointments ADD CONSTRAINT fk_appointments_tenant FOREIGN KEY (tenant_id) REFERENCES tenants (id);

CREATE INDEX idx_users_tenant ON users (tenant_id);
CREATE INDEX idx_professionals_tenant ON professionals (tenant_id);
CREATE INDEX idx_services_tenant ON services (tenant_id);

-- Horários de funcionamento: carregados junto com o salão ou o profissional dono deles
CREATE INDEX idx_tenant_business_hours_tenant ON tenant_business_hours (tenant_id);
CREATE INDEX idx_professional_business_hours_professional ON professional_business_hours (professional_id);

-- Agenda do dia: tenant_id = ? and start_time >= ? and start_time < ?
CREATE INDEX idx_appointments_tenant_start ON appointments (tenant_id, start_time);
-- Conflito e disponibilidade: professional_id = ? and start_time < ? and end_time > ?
CREATE INDEX idx_appointments_professional_start ON appointments (professional_id, start_time);
