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
- Using a `TenantInterceptor` (Spring `HandlerInterceptor`) to extract the tenant identifier from the HTTP request headers (`X-Tenant-ID`) and populate the `TenantContext`.

## Consequences

**Positive:**
- Simpler infrastructure management (only one database needed).
- Easier to deploy and manage migrations.
- Reduced database resource overhead.

**Negative:**
- Requires discipline: every new entity that belongs to a tenant MUST extend `BaseTenantEntity` and apply the Hibernate `@Filter`, otherwise data leakage could occur.
- Performance implications: large tables might need partitioning by `tenant_id` in the future.
- Security: if the application logic bypasses the `TenantContext`, it may query the whole database. (This is mitigated by the Hibernate Filter which requires the parameter to be set).
