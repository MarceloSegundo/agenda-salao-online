# 1. Multi-Tenant Architecture via Discriminator Column

Date: 2026-07-28

## Status

Accepted

## Context

The application is a SaaS platform allowing multiple salons to manage their appointments, professionals, and services. A critical requirement is that data belonging to one salon (tenant) must never leak or be accessible by another salon.
There are a few approaches to multi-tenancy:
1. Separate Database per Tenant
2. Separate Schema per Tenant
3. Shared Database with Discriminator Column (`tenant_id`)

## Decision

We decided to use the **Shared Database with Discriminator Column** approach.

We implemented this by:
- Creating a `BaseTenantEntity` annotated with `@MappedSuperclass` which includes the `tenantId`.
- Applying Hibernate's `@FilterDef` and `@Filter` to enforce that all queries automatically include `tenant_id = ?`.
- Managing the current tenant in a `ThreadLocal` via `TenantContext`.
- Populating the `TenantContext` only from the signed JWT, in `JwtAuthenticationFilter`, and clearing it in a `finally` block at the end of every request.

## Consequences

**Positive:**
- Simpler infrastructure management (only one database needed).
- Easier to deploy and manage migrations.
- Reduced database resource overhead.

**Negative:**
- Requires discipline: every new entity that belongs to a tenant MUST extend `BaseTenantEntity` and apply the Hibernate `@Filter`, otherwise data leakage could occur.
- Performance implications: large tables might need partitioning by `tenant_id` in the future.
- Security: the Hibernate Filter only applies to queries (JPQL/Criteria). Lookups by primary key (`findById`, i.e. `EntityManager.find`) bypass it. See the update below.

## Update (2026-10-09)

The original decision assumed the Hibernate Filter alone prevented cross-tenant access. It does not cover primary-key lookups, and a salon that knew another salon's record UUID could read, change or book with it.

Changes:
- Tenant entities' repositories extend `TenantScopedRepository`, and services load records by id with `findByIdInCurrentTenant` (`findByIdAndTenantId` with the tenant from the token).
- The `TenantInterceptor` that accepted the tenant from an `X-Tenant-ID` header was removed: the tenant comes only from the signed JWT.
- `TenantIsolationIntegrationTest` registers two salons and asserts `404` for cross-tenant reads, updates, deletes and bookings, and that lists only contain the caller's records.
