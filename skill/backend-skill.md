---
name: Backend Architecture Guide
description: Master backend architecture, security, and development discipline for FreelanceOS.
---

# 🏗️ MASTER BACKEND ARCHITECTURE GUIDE: FreelanceOS

## SECTION 1 — PURPOSE

This document governs the construction and evolution of the FreelanceOS backend. It serves as the authoritative operating manual for any agent or engineer working in this repository.

### Goals
*   **Security First**: Baked-in protection, not an afterthought.
*   **Clean Architecture**: Separation of concerns and predictable patterns.
*   **Predictable Data Flow**: Clear paths for data from database to UI.
*   **Safe Supabase Usage**: Leveraging Supabase features correctly and securely.
*   **Scalable System Design**: Built for growth and maintainability.
*   **Agent-Safe Development**: Explicit rules to prevent destructive or insecure changes by AI agents.

> [!IMPORTANT]
> This file defines **rules and principles**, not specific schemas. Database tables, columns, and API endpoints are to be defined during feature development following these guardrails.

---

## SECTION 2 — CORE BACKEND PRINCIPLES

*   **Never Trust Client Input**: All data coming from the frontend is potentially malicious.
*   **Server-Side Validation**: Every request must be validated on the server layer before processing.
*   **Protective Authorization**: Every operation must verify that the user is authorized to perform that specific action on that specific resource.
*   **Server-Side Logic**: Business rules and sensitive operations must remain on the server, never solely on the client.
*   **Clarity over Cleverness**: Code must be readable, maintainable, and predictable.

---

## SECTION 3 — SUPABASE ARCHITECTURE MODEL

Supabase is the core infrastructure provider for FreelanceOS.

### Responsibilities
*   **Primary Database**: PostgreSQL for structured data.
*   **Authentication**: Managed identity and session handling.
*   **Storage**: Secure file storage for project assets and user documents.
*   **Secure Data Access**: Controlled via Row Level Security (RLS) and Server-side functions.

### Security Rules
*   **Enable RLS**: Every table created must have Row Level Security enabled.
*   **Key Hierarchy**: `service_role` keys must **NEVER** reach the client. Only `anon` or `authenticated` roles are allowed in the browser.
*   **Privileged Operations**: Any operation requiring elevated permissions must be executed in a secure server context (Edge Functions or Server Actions).

### Environment Discipline
Agents must verify the current project environment (`development`, `staging`, or `production`) before applying any changes or migrations.

---

## SECTION 4 — DATA FLOW DISCIPLINE

Data must follow a strict, one-way directional flow:
**Frontend → Server Layer (API/Action) → Business Logic → Database Access → Response**

### Rules
*   **No Direct Manipulation**: The UI must not directly manipulate database logic or bypass the server layer.
*   **Business Logic Location**: Rules governing how data changes (e.g., "calculate commission", "check project status") must live in server-side code.
*   **Filtered Returns**: Only return the minimum data required by the UI. Strip sensitive internal fields (e.g., internal IDs, audit timestamps, private metadata).

---

## SECTION 5 — AUTHENTICATION MODEL

Identity management is handled conceptually and via Supabase Auth.

*   **Identity Source of Truth**: Supabase Auth manages user lifecycle and tokens.
*   **Session Verification**: The server must verify a valid session for every protected request.
*   **Identity Integrity**: Never trust user-provided identifiers (like `user_id`) in a request body if they can be derived from the authenticated session.

---

## SECTION 6 — AUTHORIZATION MODEL

Access control is mandatory and pervasive.

*   **Scoped Access**: Data access must always be scoped to the authenticated user or their organization/workspace.
*   **Prevent IDOR**: Ensure users cannot access or modify records by simply changing an ID in a request.
*   **Verification**: Operations must check both that a user is "who they say they are" (Auth) and "allowed to do what they are trying to do" (Authz).

---

## SECTION 7 — DATABASE SECURITY EXPECTATIONS

The database is the ultimate gatekeeper.

*   **Secure Context**: Every record must belong to a secure context (e.g., `user_id` or `org_id`).
*   **Access Boundaries**: Queries must be written to respect owner/permission boundaries.
*   **Malicious Assumption**: Assume all client-side queries are crafted by a malicious user. Design RLS policies accordingly.

---

## SECTION 8 — SERVER / API DESIGN GUIDELINES

When building APIs or Server Actions, follow these structural rules:

*   **Consistency**: Use a unified error and response format.
*   **Validation First**: Input validation happens before any business logic is executed.
*   **Layered Separation**: Keep transport logic (HTTP/JSON) separate from business logic (Service/Domain layer).
*   **Fail Safe**: Errors should be descriptive for developers but safe for users (don't leak stack traces or db details).

---

## SECTION 9 — INPUT VALIDATION POLICY

*   **Reject Malformed**: If data doesn't match the expected schema, reject it immediately.
*   **No Extra Fields**: Strip or reject unexpected fields in request payloads.
*   **Sanitization**: Sanitize text inputs to prevent XSS and injection attacks.
*   **Schema Enforcement**: Use libraries like Zod or similar for strict type and value validation.

---

## SECTION 10 — STORAGE SECURITY

*   **Private by Default**: Files in Supabase Storage must not be public unless explicitly required.
*   **Signed URLs**: Use time-limited signed URLs for accessing sensitive files.
*   **Upload Validation**: Validate file types/sizes on the server before allowing upload.

---

## SECTION 11 — LOGGING AND MONITORING

*   **Structured Logs**: Use JSON format for logs to allow easy indexing and searching.
*   **Security Events**: Log significant actions (login, failed auth, deletions, permission changes).
*   **No Secrets**: Never log passwords, API keys, or personally identifiable information (PII) unnecessarily.

---

## SECTION 12 — MIGRATION DISCIPLINE

*   **Immutable History**: Use migration files for structural database changes.
*   **No Manual Production Edits**: Never modify production schema via the dashboard or raw SQL outside of a migration.
*   **Rollback Path**: Where possible, ensure migrations have a clear reversal path.

---

## SECTION 13 — SAFE MCP USAGE

Agents with MCP access to Supabase must:
*   **Environment Check**: Always check `project_id` and environment names before executing SQL or mutations.
*   **Dry Run**: Describe the intended schema change before applying it.
*   **Prefer Migrations**: Use `apply_migration` over `execute_sql` for structural changes.
*   **No Experimentation**: Perform playground tests on local or development branches only.

---

## SECTION 14 — SECURITY CHECKLIST

Complete these checks before considering backend code "done":
- [ ] **Authentication**: Is the endpoint/function protected?
- [ ] **Authorization**: Is the user allowed to act on this specific record?
- [ ] **Validation**: Are inputs strictly checked for type and format?
- [ ] **Secrets**: Are any keys or secrets exposed in code or logs?
- [ ] **Database**: Is RLS enabled on all involved tables?
- [ ] **Injection**: Are queries safe from SQL injection (parameterized)?

---

## SECTION 15 — DEVELOPMENT PHILOSOPHY

The FreelanceOS backend should be **Modular, Understandable, Secure, Scalable, and Predictable**.

Avoid the "Big Ball of Mud" by maintaining strict boundaries. If a function is doing too much, break it down. If a security check is reused, abstract it. Keep it simple, keep it safe.
