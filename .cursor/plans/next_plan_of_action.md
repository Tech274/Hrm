# Next Plan of Action – HIREFLOW HRMS

**Status:** Phases 4, 5, 6 complete. Phase 7 and optional enhancements remain.

---

## Phase 7: Platform & Optional USPs

**Goal:** Public API, webhooks, SSO, document vault, and compliance calendar as scope allows.

### 7.1 Public API (Priority: High)

| Task | Details |
|------|---------|
| **API Keys** | Create `ApiKey` model: hashed key, scope (read/write), createdById. Admin UI to generate keys. |
| **Auth** | Middleware to validate `X-API-Key` header for /api/v1/* routes. |
| **Endpoints** | Read-only: `GET /api/v1/employees`, `GET /api/v1/leave/balances`, `GET /api/v1/leave/requests`. Scoped write: `POST /api/v1/leave/apply`. |
| **Docs** | OpenAPI/Swagger or simple markdown doc for integrators. |

### 7.2 Webhooks (Priority: Medium)

| Task | Details |
|------|---------|
| **Model** | `Webhook` (url, events[], secret, isActive). Events: `candidate.stage_change`, `leave.approved`, etc. |
| **Service** | On event, POST to registered URLs with payload + signature. Retry logic. |
| **Admin UI** | Manage webhooks in Admin (Super Admin only). |

### 7.3 SSO (Priority: Medium)

| Task | Details |
|------|---------|
| **Provider** | SAML 2.0 or OIDC (e.g. Okta, Azure AD). |
| **Config** | Admin page: SSO config (provider URL, metadata, client ID/secret). |
| **Auth flow** | Login page: "Sign in with SSO" → redirect to IdP → callback → create/find user, JWT. |

### 7.4 Document Vault (Priority: Low)

| Task | Details |
|------|---------|
| **Model** | `Document` (userId, type, filename, url/key, version, createdAt). Types: offer_letter, policy, etc. |
| **Storage** | Supabase Storage or S3. Upload via Admin / HR. |
| **UI** | Employee 360: documents tab. Optional acknowledgment per document. |

### 7.5 Compliance Calendar (Priority: Low)

| Task | Details |
|------|---------|
| **Model** | `ComplianceItem` (title, dueDate, type, userId?, status). Types: policy_acknowledgment, training. |
| **API** | CRUD for Admin HR; `GET /api/compliance/due` for current user. |
| **UI** | HR Data page: "Compliance Calendar" section; link to due items. |

---

## Phase 6 – Remaining (Optional)

| Item | Status | Notes |
|------|--------|------|
| Resume parse | Not implemented | Paste/upload in CreateCandidate → AI parse → prefill. Needs OpenAI/other parser. |
| Anomaly alerts | Partial | Can add scheduled job: attendance pattern change, leave spike, long-open reqs → Notification. |
| Manager leave/regularization approval UI | Pending | Backend has endpoints; frontend needs approval actions on Manager Dashboard or dedicated page. |

---

## Implementation Order (Recommended)

| Order | Focus | Effort |
|-------|--------|--------|
| 1 | Manager approval UI for leave/regularization | 0.5–1 day |
| 2 | Public API + API keys | 1–2 days |
| 3 | Webhooks | 1 day |
| 4 | Compliance Calendar (basic) | 0.5–1 day |
| 5 | Document Vault | 1–2 days |
| 6 | SSO | 2–3 days |
| 7 | Resume parse | 0.5–1 day |
| 8 | Anomaly alerts | 0.5 day |

---

## Files to Create/Modify (Phase 7)

**Backend:**
- `prisma/schema.prisma` – ApiKey, Webhook, Document, ComplianceItem
- `routes/apiKeyRoutes.ts`, `webhookRoutes.ts`, `documentRoutes.ts`, `complianceRoutes.ts`
- `middleware/apiKeyAuth.ts`
- `services/webhookService.ts`

**Frontend:**
- Admin: API keys, Webhooks, SSO config
- HR Data: Compliance Calendar section
- Employee 360: Documents tab
- Manager Dashboard: Approve/Reject buttons for leave and regularization
