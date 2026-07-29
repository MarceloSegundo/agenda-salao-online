# 2. WhatsApp Notification via Separate Node.js Microservice

Date: 2026-07-28

## Status

Accepted

## Context

The system needs to send WhatsApp messages to customers when their appointments are successfully created or updated.
There are a few options for implementing WhatsApp messaging:
1. Use the official WhatsApp Cloud API (Requires Meta business verification and incurs per-message costs).
2. Use an unofficial Java library directly embedded in the Spring Boot application.
3. Use `whatsapp-web.js` (an unofficial open-source library built on top of Puppeteer) as a separate Node.js microservice.

## Decision

We decided to use **`whatsapp-web.js` encapsulated in a standalone Node.js microservice**.

The Java backend (`AppointmentService`) communicates with this Node.js service asynchronously via HTTP POST (`RestClient` + `@Async`) to avoid blocking the main transaction threads.

## Consequences

**Positive:**
- Bypasses the need for official Meta verification and fees for early-stage validation of the product.
- Decouples the fragile web-scraping/Puppeteer logic of `whatsapp-web.js` from the robust Java backend.
- Node.js is widely considered the best ecosystem for these Puppeteer-based WhatsApp wrappers.

**Negative:**
- Adds infrastructure complexity: we now have to deploy and manage a Node.js process alongside the Spring Boot process.
- The authentication mechanism (QR Code scanning) must be done manually on the server terminal when the session expires or is first initiated.
- Unofficial APIs can break if WhatsApp Web updates its DOM structure.
