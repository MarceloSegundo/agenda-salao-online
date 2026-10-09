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
3. The backend will automatically run migrations (currently via `hibernate.ddl-auto: update`, moving to Flyway/Liquibase soon).

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
  The tests use an in-memory H2 database.

- **Making API Calls:**
  Register a salon (`POST /api/tenants/register`), log in (`POST /api/auth/login`) and send the returned token. The salon (tenant) is taken from the token; there is no tenant header.
  Example request:
  ```bash
  curl -X GET http://localhost:8080/api/professionals \
       -H "Authorization: Bearer <token>"
  ```
