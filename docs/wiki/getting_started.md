# Getting Started

Welcome to the **Agenda Salão Online** project! This guide will help you set up the development environment.

## Prerequisites

- **Java 21** or newer
- **Maven**
- **Node.js 18+** (for the WhatsApp Microservice and future Frontend)
- **PostgreSQL 15+**

## Repository Structure

- `/backend` - The Spring Boot Java API
- `/whatsapp-service` - The Node.js microservice for WhatsApp messaging
- `/frontend` - (Coming Soon) The React application
- `/docs` - Architecture Decision Records (ADRs) and Wiki

## 1. Setting up the Database

1. Ensure PostgreSQL is running.
2. Create a database named `agendadb`.
3. On startup the backend applies the Flyway migrations in `backend/src/main/resources/db/migration`. Hibernate only validates the schema (`ddl-auto: validate`), so every schema change needs a new `V<n>__description.sql` file; never edit a migration that has already been applied.

### Database created before Flyway

A database created by the old `ddl-auto: update` already has the tables but no `flyway_schema_history`, so Flyway refuses to start ("Found non-empty schema(s) ... but no schema history table"). Adopt it once:

1. Run `backend/scripts/adotar-flyway-banco-existente.sql` (renames the Hibernate-generated constraint names to the ones in `V1__schema_inicial.sql`):
   ```bash
   docker exec -i agenda_db psql -U postgres -d agendadb < backend/scripts/adotar-flyway-banco-existente.sql
   ```
2. Start the backend once with `SPRING_FLYWAY_BASELINE_ON_MIGRATE=true`. Flyway records V1 as already applied without running it. Later starts don't need the variable.

## 2. Setting up the Backend

1. Navigate to the `backend` directory.
2. Create a `.env` file based on the `.env.example` (or use the defaults).
3. The default configuration connects to `localhost:5432` with user `postgres` and password `postgres`.
4. Run the application:
   ```bash
   ./mvnw spring-boot:run
   ```
5. The API will be available at `http://localhost:8080`.

## 3. Setting up the WhatsApp Microservice

1. Navigate to the `whatsapp-service` directory.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the service:
   ```bash
   node index.js
   ```
4. **Important:** Watch the terminal output. A QR Code will be generated. Open WhatsApp on your phone, go to "Linked Devices", and scan the QR Code to authenticate the session.
5. The service will be available at `http://localhost:3000`.

## Development Workflows

- **Testing the Backend:**
  We use JUnit 5 and Mockito. To run tests:
  ```bash
  cd backend
  ./mvnw test
  ```
  The tests use an in-memory H2 database in PostgreSQL mode, built by the same Flyway migrations, so a migration that doesn't match the entities fails the build.

- **Making API Calls:**
  Register a salon (`POST /api/tenants/register`), log in (`POST /api/auth/login`) and send the returned token. The salon (tenant) is taken from the token; there is no tenant header.
  Example request:
  ```bash
  curl -X GET http://localhost:8080/api/professionals \
       -H "Authorization: Bearer <token>"
  ```
