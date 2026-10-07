# Agenda Salão Online

Plataforma SaaS de agendamento para salões de beleza, barbearias e spas. Cada salão se cadastra, gerencia profissionais, serviços e clientes e registra agendamentos, com os dados isolados dos outros salões no mesmo banco.

> **Status: em desenvolvimento.** A API do backend está funcional e testada; o frontend em React está em andamento. Projeto pessoal de [Marcelo Segundo](https://marcelosegundo.github.io).

## Stack

- **Backend:** Java 21, Spring Boot 3.4, Spring Security com JWT stateless, Spring Data JPA, springdoc-openapi (Swagger)
- **Banco:** PostgreSQL 15 (H2 em memória nos testes)
- **Notificações:** microsserviço Node.js com `whatsapp-web.js`
- **Frontend:** React, Vite, Tailwind CSS v4 (em andamento)

## Decisões de arquitetura

As decisões ficam registradas como ADRs em [`docs/adr/`](docs/adr/):

- **[ADR 0001: multi-tenancy com coluna discriminadora](docs/adr/0001-multi-tenant-architecture.md).** Banco compartilhado com `tenant_id` em vez de banco ou schema por salão. Toda entidade de salão herda de `BaseTenantEntity`, um filtro do Hibernate adiciona `tenant_id = ?` às consultas e o tenant atual vive num `ThreadLocal`. **Limitação conhecida:** o filtro do Hibernate não se aplica a buscas por id (`findById`), então essas rotas ainda precisam validar o tenant explicitamente (ver débitos técnicos). O trade-off está documentado no ADR: infraestrutura mais simples e barata, em troca de disciplina (toda entidade nova de salão precisa herdar `BaseTenantEntity` e aplicar o filtro) e de um possível particionamento por `tenant_id` no futuro.
- **[ADR 0002: notificação por WhatsApp num microsserviço separado](docs/adr/0002-whatsapp-integration.md).** `whatsapp-web.js` isolado num serviço Node.js, chamado de forma assíncrona pelo backend, em vez da Cloud API oficial (verificação da Meta e custo por mensagem) ou de uma biblioteca não oficial embutida na JVM.

Visão geral dos componentes e do modelo de domínio: [`docs/wiki/architecture.md`](docs/wiki/architecture.md).

## API

| Recurso | Rotas | Autenticação |
|---|---|---|
| Salão (tenant) | `POST /api/tenants/register` | Não |
| Login | `POST /api/auth/login` | Não |
| Clientes | `/api/customers` | JWT |
| Profissionais | `/api/professionals` | JWT |
| Serviços | `/api/services` | JWT |
| Agendamentos | `/api/appointments` | JWT |

Com o backend rodando, a documentação interativa fica em `http://localhost:8080/swagger-ui.html`.

## Como rodar

Pré-requisitos: Java 21+, Docker (para o PostgreSQL) e Node.js 18+ se for usar o serviço de WhatsApp.

```bash
docker compose up -d                 # PostgreSQL em localhost:5432
cd backend
export JWT_SECRET="uma-chave-aleatoria-com-pelo-menos-32-caracteres"
./mvnw spring-boot:run               # API em http://localhost:8080
```

`JWT_SECRET` é obrigatório: sem ele a aplicação não sobe. As demais variáveis estão em [`backend/.env.example`](backend/.env.example). O passo a passo completo, incluindo o serviço de WhatsApp, está em [`docs/wiki/getting_started.md`](docs/wiki/getting_started.md).

## Testes

```bash
cd backend
./mvnw test
```

Testes unitários dos serviços (JUnit 5 + Mockito) e testes de integração do fluxo de autenticação, com H2 em memória. O script [`test_api.ps1`](test_api.ps1) exercita o fluxo ponta a ponta contra a API rodando: cadastro do salão, login e CRUDs.

## Próximos passos

Os débitos técnicos conhecidos, com a solução planejada para cada um, estão em [`docs/wiki/technical_debt.md`](docs/wiki/technical_debt.md). Em resumo, mais a troca do schema gerado pelo Hibernate por migrações versionadas:

- buscas por id sem checagem de tenant → `findByIdAndTenantId` e teste de isolamento entre salões;
- notificações hoje síncronas → eventos do Spring com listener `@Async`;
- JWT guardado no `localStorage` do frontend → cookie `HttpOnly` e `Secure`;
- login e cadastro sem rate limiting → Bucket4j por IP;
- mensagens fixas no código → `messages.properties` e suporte a i18n;
- schema gerado pelo Hibernate → migrações versionadas com Flyway.
