---
name: BPN Vendor Portal Project
description: Full-stack Next.js vendor onboarding portal built for Bare Performance Nutrition — status, architecture, key files
type: project
---

Built a production-ready Next.js 14 vendor onboarding portal in `C:\Users\josh\Dropbox (Personal)\Bryker & Co\Asset Management\BPN\Claude\Vendor Set Up Form`.

**Why:** Replace paper-based BPN vendor onboarding (W-9 + vendor setup form + ACH authorization) with a single digital multi-step wizard.

**Stack:** Next.js 14 (App Router), Tailwind CSS, SQLite (better-sqlite3), pdf-lib, jose (JWT), zod validation

**Key files:**
- `setup.ps1` — one-click install + launch script (installs Node.js if needed)
- `.env.local` — admin password, JWT secret, encryption key (all need changing before production)
- `lib/db.ts` — SQLite database, auto-initializes `data/submissions.db`
- `lib/encryption.ts` — AES-256-GCM for TIN + bank account numbers
- `lib/pdf-generator.ts` — generates W-9, Vendor Setup, ACH, and merged PDFs
- `middleware.ts` — JWT auth guard for all `/admin/*` and `/api/admin/*` routes

**Routes:**
- `/form` — 4-step vendor wizard (public)
- `/form/success` — confirmation page
- `/admin` — admin login (password from .env.local)
- `/admin/dashboard` — submissions table with search + status filter + CSV export
- `/admin/submission/[id]` — full detail view with PDF downloads + status management

**Default admin password:** `BPN-Admin-2024!` (in .env.local)

**How to apply:** Node.js must be installed first — run `setup.ps1` in PowerShell as admin for one-click setup. After install: `npm run dev`.
