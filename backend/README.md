# Developer API Usage and Billing Platform — Backend

> **Current status:** The root README contains the current startup instructions, roles, monthly aggregation behavior and known billing limitations. The endpoint table and billing discussion below describe the original baseline and have not yet been fully updated. Aggregation requires `organization_id`, `subscription_id`, and `month`; paid-plan invoicing requires the proposed, unapplied migration. Reconciliation is implemented but has not been verified with live databases. Do not use this backend for real billing.

Express backend for the DBMS Level 3 project. There is intentionally no frontend in this package; it can later be consumed by a separate Next.js application.

## Stack
Node.js/CommonJS, Express 5, MySQL 8 (`mysql2`), MongoDB Atlas (official driver), bcrypt, JWT, Zod dependency available for extending request validation, Helmet, CORS and express-rate-limit.

## Architecture
- **MySQL (`api_management`)**: users, roles, organizations, membership, APIs, versions/endpoints, plans/pricing, subscriptions, API keys/scopes/access, daily usage, invoices/items and key audit. Existing SQL schema is treated as authoritative.
- **MongoDB (`api_usage_logs.api_request_events`)**: individual request event documents and analytics aggregation.
- **Express**: authentication, API routes, Mongo event capture, usage aggregation into MySQL and invoice generation.

## Setup
1. Install Node.js 20+ and ensure the existing MySQL schema has already been created. Do not rerun the original SQL file against a populated database: its cleanup section drops existing tables/views/functions.
2. Copy `.env.example` to `.env` and fill in local credentials. Preserve your working WSL-to-Windows MySQL host (`172.19.96.1`) and Atlas URI. Use a unique JWT secret of at least 32 characters. Never commit `.env`.
3. `npm install`
4. `npm run dev`
5. `GET http://localhost:5000/api/health`

The server starts only when both database connections are available. MongoDB indexes are created idempotently at startup.

## Environment
See `.env.example`. The project does not include real credentials. On WSL, your Windows MySQL gateway may change after WSL/network restarts; update `MYSQL_HOST` if required.

## API overview
All endpoints are under `/api`.

| Method | Path | Access | Purpose |
|---|---|---|---|
| GET | `/health` | Public | Server/MySQL/Mongo health |
| POST | `/auth/register` | Public | Register a DEVELOPER account |
| POST | `/auth/login` | Public | Login and receive JWT |
| GET | `/auth/me` | Authenticated | Current user |
| GET/POST | `/organizations` | Authenticated | List accessible orgs / create org and OWNER membership |
| GET | `/apis` | Authenticated | List accessible APIs |
| POST | `/apis` | ADMIN | Create API |
| GET | `/plans` | Authenticated | List plans/features |
| GET/POST | `/subscriptions` | Authenticated / ADMIN | List / create subscription |
| GET/POST | `/keys` | Authenticated | List / create API key (secret shown once) |
| PATCH | `/keys/:id/revoke` | Authenticated | Revoke key (trigger writes audit row) |
| GET | `/usage/summary` | Authenticated | MongoDB request summary |
| GET | `/usage/by-api` | Authenticated | MongoDB per-API aggregation |
| GET | `/usage/logs` | Authenticated | Recent event documents |
| POST | `/usage/events` | Authenticated | Insert one event document |
| POST | `/usage/aggregate` | ADMIN | Aggregate Mongo events into MySQL daily usage |
| GET | `/invoices` | Authenticated | List invoices |
| GET | `/invoices/:id` | Authenticated | Invoice and items |
| POST | `/invoices/generate` | ADMIN | Generate invoice for a period |
| GET | `/dashboard` | Authenticated | MySQL-derived counts and invoiced amount |

For protected routes send `Authorization: Bearer <token>`.

## Example requests
Register:
```bash
curl -X POST http://localhost:5000/api/auth/register -H 'Content-Type: application/json' -d '{"name":"Demo Developer","email":"dev@example.com","password":"change-this-password"}'
```
Login:
```bash
curl -X POST http://localhost:5000/api/auth/login -H 'Content-Type: application/json' -d '{"email":"dev@example.com","password":"change-this-password"}'
```

Record an event (use real organization/API/subscription IDs from MySQL):
```json
{"organization_id":1,"api_id":1,"subscription_id":1,"endpoint":"/v1/translate","http_method":"POST","response_status":200,"response_time_ms":84,"request_size_bytes":120,"response_size_bytes":480,"success":true}
```

Aggregate usage (ADMIN JWT):
```json
{"from":"2026-01-01T00:00:00Z","to":"2026-02-01T00:00:00Z"}
```

## Billing / aggregation semantics and limitations
The usage aggregation groups MongoDB events by organization, API, subscription and UTC date, then upserts `usage_records` using its existing unique key (`organization_id`, `api_id`, `subscription_id`, `usage_date`). It calls the existing `calculate_billable_requests` and `calculate_usage_cost` functions. Re-running the same complete time window replaces each matching daily aggregate rather than incrementing it, preventing duplicate counting for that window. For production-grade late-arriving events and concurrent aggregation, introduce a durable watermark/checkpoint and serialize overlapping runs; this starter does not claim exactly-once processing across concurrent workers.

Invoice generation uses existing invoice tables, `invoice_items`, `refresh_invoice_total`, and the invoice triggers. Existing invoice schema has no unique constraint on organization/subscription/period, so the service checks for an existing invoice inside a transaction, but concurrent invoice generation would require a schema-level unique key to guarantee prevention.

## DBMS concepts used
- Relational PK/FK/unique/check constraints and existing indexes.
- SQL joins for user roles, memberships, subscriptions and invoices.
- SQL aggregates and grouping for dashboard/billing.
- Transactions for organization creation, key creation and invoice generation.
- Existing SQL stored functions for usage cost and billable requests.
- Existing stored procedure and triggers for invoice totals and API-key audit.
- MongoDB document storage, compound indexes and aggregation pipelines.
- Cross-database integration: Mongo events -> MySQL usage records -> invoices.

## Testing
`npm test` runs local smoke tests. These do not replace integration tests against your actual MySQL and Atlas instances. Verify `/api/health`, then test each endpoint with Postman and real seeded IDs. Do not use production data for destructive tests.

## Important security / next hardening
This is a runnable college-project backend baseline, not a security-audited production service. Before public deployment, add comprehensive Zod schemas to every route, enforce organization membership on every object-level operation (including key revocation, event insertion, and invoice detail), add a durable aggregation watermark/locking strategy, and add integration tests. API-key verification middleware for a real API gateway is also a separate extension; key issuance/revocation is implemented here. The registration route intentionally assigns DEVELOPER; ADMIN accounts should be provisioned by a trusted database administrator, not by public registration.
