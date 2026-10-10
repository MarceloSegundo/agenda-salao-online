-- Schema que o Hibernate gerava com ddl-auto: update até a adoção do Flyway.
-- Os nomes das restrições trocam os hashes do Hibernate por nomes legíveis.

CREATE TABLE tenants (
    id         uuid                        NOT NULL,
    name       character varying(255)      NOT NULL,
    domain     character varying(255)      NOT NULL,
    active     boolean                     NOT NULL,
    created_at timestamp(6) without time zone NOT NULL,
    CONSTRAINT tenants_pkey PRIMARY KEY (id),
    CONSTRAINT uk_tenants_domain UNIQUE (domain)
);

CREATE TABLE tenant_business_hours (
    tenant_id    uuid                        NOT NULL,
    day_of_week  integer,
    opening_time time(6) without time zone,
    closing_time time(6) without time zone,
    is_closed    boolean,
    CONSTRAINT fk_tenant_business_hours_tenant FOREIGN KEY (tenant_id) REFERENCES tenants (id)
);

CREATE TABLE users (
    id         uuid                        NOT NULL,
    tenant_id  uuid                        NOT NULL,
    name       character varying(255)      NOT NULL,
    email      character varying(255)      NOT NULL,
    password   character varying(255)      NOT NULL,
    created_at timestamp(6) without time zone NOT NULL,
    updated_at timestamp(6) without time zone,
    CONSTRAINT users_pkey PRIMARY KEY (id),
    CONSTRAINT uk_users_email UNIQUE (email)
);

CREATE TABLE customers (
    id         uuid                        NOT NULL,
    tenant_id  uuid                        NOT NULL,
    name       character varying(255)      NOT NULL,
    phone      character varying(255)      NOT NULL,
    email      character varying(255),
    created_at timestamp(6) without time zone NOT NULL,
    updated_at timestamp(6) without time zone,
    CONSTRAINT customers_pkey PRIMARY KEY (id),
    CONSTRAINT uk_customers_tenant_phone UNIQUE (tenant_id, phone)
);

CREATE TABLE professionals (
    id             uuid                        NOT NULL,
    tenant_id      uuid                        NOT NULL,
    name           character varying(255)      NOT NULL,
    specialization character varying(255),
    active         boolean                     NOT NULL,
    created_at     timestamp(6) without time zone NOT NULL,
    updated_at     timestamp(6) without time zone,
    CONSTRAINT professionals_pkey PRIMARY KEY (id)
);

CREATE TABLE professional_business_hours (
    professional_id uuid                        NOT NULL,
    day_of_week     integer,
    opening_time    time(6) without time zone,
    closing_time    time(6) without time zone,
    is_closed       boolean,
    CONSTRAINT fk_professional_business_hours_professional FOREIGN KEY (professional_id) REFERENCES professionals (id)
);

CREATE TABLE services (
    id                      uuid                        NOT NULL,
    tenant_id               uuid                        NOT NULL,
    name                    character varying(255)      NOT NULL,
    description             character varying(255),
    price                   numeric(38, 2)              NOT NULL,
    duration_minutes        integer                     NOT NULL,
    requires_online_payment boolean                     NOT NULL,
    active                  boolean DEFAULT true        NOT NULL,
    created_at              timestamp(6) without time zone NOT NULL,
    updated_at              timestamp(6) without time zone,
    CONSTRAINT services_pkey PRIMARY KEY (id)
);

CREATE TABLE appointments (
    id              uuid                        NOT NULL,
    tenant_id       uuid                        NOT NULL,
    customer_id     uuid                        NOT NULL,
    professional_id uuid                        NOT NULL,
    service_id      uuid                        NOT NULL,
    start_time      timestamp(6) without time zone NOT NULL,
    end_time        timestamp(6) without time zone NOT NULL,
    status          character varying(255)      NOT NULL,
    created_at      timestamp(6) without time zone NOT NULL,
    updated_at      timestamp(6) without time zone,
    CONSTRAINT appointments_pkey PRIMARY KEY (id),
    CONSTRAINT appointments_status_check CHECK (status IN ('PENDING', 'CONFIRMED', 'CANCELED', 'COMPLETED')),
    CONSTRAINT fk_appointments_customer FOREIGN KEY (customer_id) REFERENCES customers (id),
    CONSTRAINT fk_appointments_professional FOREIGN KEY (professional_id) REFERENCES professionals (id),
    CONSTRAINT fk_appointments_service FOREIGN KEY (service_id) REFERENCES services (id)
);
