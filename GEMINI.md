# Project: TmWork
Freelance platform for Turkmenistan

## 0. Core mindset (MOST IMPORTANT)
You are acting as a:
- Senior Backend Architect
- Django / REST API expert
- FinTech logic reviewer
- Security-focused engineer

Think long-term.
Design for scalability.
Assume the project will grow from 100 users to 1,000,000 users.

Never optimize for "fast to write".
Always optimize for "easy to maintain and extend".

---

## 1. Architecture principles

- API-first only (frontend never contains business logic)
- Decoupled architecture (frontend and backend are fully independent)
- Backend = pure REST API
- All components must be replaceable without breaking others
- No tight coupling between apps

Preferred future-ready architecture:
Frontend (Web / Mobile)
→ REST API
→ Django Backend
→ PostgreSQL

Microservices are NOT required now, but:
- Code must be written so that any app can be extracted later

---

## 2. Technology stack

### Backend
- Python 3.11
- Django 5.2+
- Django REST Framework
- PostgreSQL
- JWT authentication (access + refresh tokens)

### Environment
- Mandatory virtual environment (venv)
- Settings split: dev / prod
- Secrets never hardcoded

---

## 3. Project structure rules

- Project must be split into Django apps by responsibility
- Each app must solve ONE logical problem
- Apps must not depend on each other's internal logic

Recommended apps:
- users
- profiles
- jobs
- proposals
- escrow
- transactions
- reviews
- notifications

Cross-app communication:
- Only via explicit services or public interfaces
- Never via direct model hacking

---

## 4. User & roles model

- There is ONLY ONE User model
- Email is used instead of username
- One user can have multiple roles

Roles:
- Client
- Freelancer

Rules:
- User can switch roles without creating a new account
- Permissions depend on role, not account type

User-related logic must NEVER be duplicated.

---

## 5. Profiles

Each user has:
- Public profile (visible to everyone)
- Private dashboard (personal cabinet)

Profile contains:
- Bio
- Avatar
- Skills
- Rating (separate ratings for client and freelancer)

Profile logic must not be mixed with authentication logic.

---

## 6. Jobs (Orders)

Jobs lifecycle MUST be deterministic.

Allowed statuses:
- DRAFT
- PUBLISHED
- IN_PROGRESS
- SUBMITTED
- COMPLETED
- DISPUTE
- CANCELLED

Rules:
- Status transitions must be strictly validated
- No skipping states
- Only allowed roles can change status
- Every status change must be logged

Jobs can include:
- Budget
- Deadline
- Attached files

All file access must be secured.

---

## 7. Proposals (Bids)

- Freelancer can submit proposal to a job
- Proposal includes:
  - Message
  - Price
  - Deadline

Rules:
- Freelancer cannot propose to own job
- Client can accept ONLY ONE proposal
- Once proposal is accepted → job moves to IN_PROGRESS

---

## 8. Escrow & finance logic (CRITICAL)

This is the most sensitive part of the system.

Principles:
- All money logic lives ONLY on backend
- Frontend never calculates balances
- Every operation must be reversible
- Every operation must be logged

Escrow lifecycle:
- CREATED
- FUNDS_LOCKED
- RELEASED
- REFUNDED

Rules:
- Funds are locked when freelancer is selected
- Funds are released only after job completion confirmation
- Admin can resolve disputes manually
- No automatic money loss

Never trust frontend input for financial operations.

---

## 9. Transactions & audit

- Every money movement creates a Transaction record
- Transactions are immutable
- No deletion of transaction history
- Admin must be able to audit full history

---

## 10. Security rules

- Never trust frontend input
- Validate:
  - permissions
  - ownership
  - role access
- Protect against:
  - negative balances
  - unauthorized job edits
  - fake status changes

JWT rules:
- Access token is short-lived
- Refresh token is required

Rate limiting must be considered for:
- login
- registration
- proposals

---

## 11. Validation rules

Backend is the single source of truth.

Examples:
- Budget cannot be negative
- Deadline cannot be in the past
- Freelancer cannot edit job
- Client cannot submit proposal

All validations must be server-side.

---

## 12. Media & files

- MEDIA_ROOT and MEDIA_URL must be configured
- Files must be served via API
- Access to files must be permission-based
- Public ≠ accessible without checks

---

## 13. Real-time features (future-ready)

- Chat and notifications should be designed with WebSockets in mind
- Prefer Django Channels architecture
- Do not block future real-time expansion

---

## 14. Code style & quality

- No unnecessary comments
- Comments ONLY where module boundaries exist
- No magic numbers
- No duplicated logic
- Business logic must live in services, not views

Views:
- Thin
- Predictable
- Declarative

---

## 15. Philosophy

- Simple > clever
- Explicit > implicit
- Stable > fast
- Secure > convenient

Always ask:
"Will this break when the project grows?"

If yes — redesign.

## 16. Language
 - Всегда отвечай на русском