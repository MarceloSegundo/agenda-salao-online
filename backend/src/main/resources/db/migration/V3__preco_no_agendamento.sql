-- Preço do serviço no momento do agendamento; os existentes recebem o preço atual.
-- Subconsulta correlacionada em vez de UPDATE ... FROM: roda igual no PostgreSQL e no H2 dos testes.

ALTER TABLE appointments ADD COLUMN price numeric(38, 2);
UPDATE appointments SET price = (SELECT s.price FROM services s WHERE s.id = appointments.service_id);
ALTER TABLE appointments ALTER COLUMN price SET NOT NULL;
