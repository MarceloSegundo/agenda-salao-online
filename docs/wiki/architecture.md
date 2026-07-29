# Project Architecture

This document describes the high-level architecture of the **Agenda Salão Online** SaaS platform.

## Architecture Overview

The system is built as a distributed application with three main components:

1. **Frontend (React + Vite)** (Planned)
   - Single Page Application built with React.
   - Manages UI for both Salon Owners (Admin Panel) and Customers (Booking Page).
   - Communicates with the Backend via REST API.

2. **Backend API (Java + Spring Boot 3 + GraalVM)**
   - The core monolith managing business logic, persistence, and multi-tenancy.
   - Uses **Spring Web**, **Spring Data JPA**, and **Jakarta Validation**.
   - Connected to a **PostgreSQL** database.
   - Designed for fast startup and low memory footprint via Native Compilation (GraalVM).
   
3. **WhatsApp Notification Service (Node.js)**
   - An independent microservice built with **Express** and **whatsapp-web.js**.
   - Responsible for interacting with WhatsApp Web via Puppeteer.
   - The Backend API sends asynchronous HTTP requests to this service to dispatch messages to end-users without blocking the main transaction threads.

## Domain Model

The core domain consists of the following entities:

- **Tenant:** Represents a specific Salon/Business.
- **Customer:** A client who books services.
- **Professional:** An employee or contractor working at the Salon.
- **Service:** A provided service (e.g., Haircut, Manicure) with duration and price.
- **Appointment:** The reservation connecting a Customer, Professional, Service, and a Time Slot.

All domain entities (except Tenant itself) extend `BaseTenantEntity` which holds the `tenant_id` used for logical isolation.

## Security and Tenancy

- **Multi-Tenancy:** Implemented using Hibernate Filters (`tenantFilter`) which automatically append `tenant_id = ?` to all JPA queries.
- **Authentication:** (Planned) Will use JWT (JSON Web Tokens) where the `tenant_id` will be securely embedded in the token payload.

## Observability

- **Error Handling:** Centralized through `@RestControllerAdvice` (`GlobalExceptionHandler`), ensuring consistent API responses.
- **Tracing:** A `traceId` (UUID) is generated via a Web Filter (`MdcFilter`) for every incoming request. This ID is included in logs and error responses to simplify debugging.
