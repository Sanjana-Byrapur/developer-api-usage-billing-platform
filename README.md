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

