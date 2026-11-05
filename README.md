# Developer API Usage and Billing Platform

A DBMS mini-project built using MySQL to manage API usage, subscription plans, billing calculations, invoices, and API key auditing.

## Overview

The Developer API Usage and Billing Platform helps manage organizations that use APIs under different subscription plans. It tracks API usage, calculates billable requests and usage costs, maintains invoice totals, and records API key activities.

## Features

- **Database Management:** Relational tables for organizations, users, APIs, subscriptions, usage records, invoices, and API keys.
- **Views:** Summarize API usage, monthly usage, and organization billing.
- **Stored Functions:** Calculate billable requests and API usage costs.
- **Stored Procedure:** Refresh invoice subtotals and totals.
- **Triggers:** Maintain invoice totals and audit API key creation and revocation.
- **Indexes:** Improve query performance.
- **Transactions:** Demonstrate committing and rolling back database changes.
- **SQL Queries:** Use joins, aggregate functions, grouping, and subqueries for data analysis.

## Technologies Used

- MySQL 8.0.16+
- SQL

## Getting Started

1. Install MySQL Server 8.0.16 or a compatible newer version.
2. Open MySQL Workbench or another MySQL client.
3. Open the SQL script in the `sql/` directory.
4. Execute the script in a test database environment.
5. Run the sample queries to explore API usage, billing calculations, invoice totals, and audit logs.

**Note:** Review the SQL script before execution. Setup scripts may create or reset database objects.

## Advanced DBMS Concepts

This project demonstrates views, stored functions, a stored procedure, triggers, indexes, transaction management, joins, aggregate functions, and subqueries.

## Local application status and startup

The Next.js frontend and Express backend are in `frontend` and `backend`. Node.js 20+, MySQL 8 and MongoDB are required. The backend expects an existing compatible schema. **Do not run `api_management.sql` on an existing database**: it contains destructive cleanup commands. The sample users in that script have placeholder password hashes and are not usable login credentials.

Set the following names in your existing backend `.env` (do not overwrite it): `PORT`, `NODE_ENV`, `FRONTEND_URL`, `MYSQL_HOST`, `MYSQL_PORT`, `MYSQL_USER`, `MYSQL_PASSWORD`, `MYSQL_DATABASE`, `MONGODB_URI`, `MONGODB_DATABASE`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `BCRYPT_ROUNDS`. The frontend may use `NEXT_PUBLIC_API_BASE_URL` in `.env.local`; it must contain only the public backend URL, never a database credential. See `backend/.env.example` for placeholders. Startup no longer creates MongoDB indexes automatically.

In separate PowerShell windows, from the project directory:

```powershell
Set-Location .\backend
npm install
npm run dev
```

```powershell
Set-Location .\frontend
npm install
npm run dev
```

Open `http://localhost:3000`; backend health is `/api/health`. Existing developer accounts can sign in; registration is available through `POST /api/auth/register`. An organization creator becomes its owner. Organization names are globally unique; an existing name does not grant access. Contact its owner for membership through a separate administrative process.

Alternatively, after installing both packages, start both development servers from the project root in separate PowerShell windows with:

```powershell
.\dev.ps1
```

### Current limitations and billing assumptions

Organizations, dashboard, APIs, keys, subscriptions, usage and invoices load backend data. API registration is permitted for organization owners/admins and platform admins. Subscription creation, usage aggregation and invoice generation remain platform-admin actions. Viewers cannot mutate organization data; developers may create keys and record events. Platform admins have global access. The original demo layouts are retained in `legacy.tsx` files and are not routed.

Usage aggregation now takes an organization ID, subscription ID and `month` (`YYYY-MM`) and shares the subscription allowance across all APIs for that UTC calendar month, in day/API-ID order. It rejects missing full-day pricing and existing unmatched SQL usage rather than deleting records. Reaggregation is blocked when an overlapping invoice exists. This allocation order and calendar month are assumptions: the report does not define them. Prices changing during a day are not supported. Existing manual or seeded usage may prevent aggregation.

The existing invoice-item schema requires an API for every line, so a monthly plan fee cannot be represented accurately. `backend/migrations/001_invoice_plan_fee.sql` is a proposed, unapplied migration that makes the API reference nullable and adds a description for non-API lines; existing rows are retained. Applying it requires explicit approval. The application includes code to create the fee line after the migration; until then, paid-plan invoices return a clear error. The assumed fee is one full monthly fee per calendar month, without proration. Invoice generation reconciles Mongo events with aggregated MySQL counts, allowance and pricing while locking the subscription. It rejects stale or missing aggregation. The displayed unit price is an effective average when rates differ within a month. MySQL row locking serializes cooperating application operations for the same subscription, but direct database writers do not participate. Cross-database operations are not atomic and have not been verified against the live databases. API keys are issued and revoked but are not verified by a gateway. No payment provider, payment processing, or real external gateway is implemented.

### Demonstration steps (not yet end-to-end verified)

1. Sign in with an existing account; create an organization from **Organizations** or use one you belong to.
2. An owner or organization admin registers an API in **API Management**. A platform admin creates a subscription in **Subscriptions** and configures matching API pricing in **API Management**. Pricing must cover the entire UTC day of each event.
3. Create a key in **API Keys** and save the one-time secret. Keys demonstrate issuance and revocation only.
4. In **API Usage Logs**, select the organization, API and subscription and record an illustrative event. The page displays recent MongoDB events for that organization.
5. A platform admin uses **Billing & Invoices** to aggregate a complete UTC month and generate an invoice for a free plan, then views its lines. Paid plans require the approved migration. Aggregation can update existing matching daily records; it refuses unmatched records. Invoices block later event recording and reaggregation for their month, so choose the month carefully. Treat results as an unverified demonstration until live testing is approved and performed.

For checks, run `npm test` in `backend`, and `npm run lint` and `npm run build` in `frontend`. No live records should be created for testing until their owner approves the exact test actions.

