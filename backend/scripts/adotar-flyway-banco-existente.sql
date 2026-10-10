-- Só para bancos criados antes do Flyway (pelo ddl-auto: update do Hibernate).
-- Troca os nomes gerados pelo Hibernate pelos nomes da V1__schema_inicial.sql, para que
-- migrações futuras que citem essas restrições funcionem igual em banco novo e antigo.
-- Depois disso, suba a aplicação UMA vez com SPRING_FLYWAY_BASELINE_ON_MIGRATE=true
-- (marca a V1 como já aplicada sem executá-la). Ver docs/wiki/getting_started.md.

BEGIN;
ALTER TABLE tenants RENAME CONSTRAINT ukehgpgu3yilhiprwm3wbipxt43 TO uk_tenants_domain;
ALTER TABLE users RENAME CONSTRAINT uk6dotkott2kjsp8vw4d0m25fb7 TO uk_users_email;
ALTER TABLE tenant_business_hours RENAME CONSTRAINT fkamfpj47wodclstekxt76bdj4u TO fk_tenant_business_hours_tenant;
ALTER TABLE professional_business_hours RENAME CONSTRAINT fkm1ugtpssxm6o26l96jh2nsa9d TO fk_professional_business_hours_professional;
ALTER TABLE appointments RENAME CONSTRAINT fkrlbb09f329sfsmftrh7y0yxtk TO fk_appointments_customer;
ALTER TABLE appointments RENAME CONSTRAINT fk70r651dhvcob4dm4icn54of0y TO fk_appointments_professional;
ALTER TABLE appointments RENAME CONSTRAINT fk5iltr7k9pows18hk8nc101vc1 TO fk_appointments_service;
COMMIT;
