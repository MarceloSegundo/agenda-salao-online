# Agenda Salão Online

A modern, multi-tenant SaaS platform built to help beauty salons, barbershops, and spas manage their appointments, customers, and professionals.

## Vision

The vision of **Agenda Salão Online** is to provide an easy-to-use, robust, and cost-effective scheduling platform. By using a single deployment architecture (Shared Database Multi-Tenancy) and modern stacks (Java 21, GraalVM, React), we aim to offer maximum performance with minimum cloud hosting costs.

## Documentation

All architectural decisions and onboarding guides are available in the `docs/` folder:

- **[Architecture Wiki](docs/wiki/architecture.md):** Understand the components, domain models, and how multi-tenancy works.
- **[Getting Started](docs/wiki/getting_started.md):** Learn how to run the Backend API and the Node.js Microservices locally.

### Architecture Decision Records (ADRs)

We keep a log of important architectural decisions in the `docs/adr/` directory:
- [0001 - Multi-Tenant Architecture](docs/adr/0001-multi-tenant-architecture.md)
- [0002 - WhatsApp Notification Microservice](docs/adr/0002-whatsapp-integration.md)

## Tech Stack

- **Backend:** Java 21, Spring Boot 3, Spring Data JPA, GraalVM
- **Database:** PostgreSQL
- **Microservices:** Node.js, Express, whatsapp-web.js (for notifications)
- **Frontend:** React, Vite, Tailwind CSS V4 (In progress)
