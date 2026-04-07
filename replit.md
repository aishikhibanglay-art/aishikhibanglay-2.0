# AI শিখি বাংলায় — Digital Course Platform

## Overview
Bangladesh-focused bilingual (Bengali + English) AI course selling platform with multi-role access control.

## Tech Stack
- **Frontend**: React + Vite (artifacts/ai-shikhi-banglay)
- **Backend/DB**: Supabase (PostgreSQL + RLS + Auth + Storage)
- **Routing**: Wouter v3
- **Styling**: Tailwind CSS v4 (dark theme by default)
- **State**: TanStack Query + AuthContext

## Architecture
- Monorepo (pnpm workspaces)
- Artifact path: `artifacts/ai-shikhi-banglay`
- Preview path: `/`

## Completed Steps

### Step 1 — Database Schema ✅
- `attached_assets/sql/01_schema.sql` — 26 tables, RLS policies, 4 roles
- `attached_assets/sql/02_fix_dashboard_views.sql` — security_invoker views fix
- Storage buckets needed: course-thumbnails, course-content, blog-images, avatars, certificates, media-library

### Step 2 — Auth System ✅
- `/login` — Email+Password, Google OAuth, Facebook OAuth
- `/signup` — Registration with email verification
- `/forgot-password` — Password reset email
- `/reset-password` — New password with strength indicator
- `/auth/callback` — OAuth callback with role-based redirect
- AuthContext — global user state, profile, role
- ProtectedRoute — role-based access, banned user block

### Step 3 — Student Dashboard ✅
- `/dashboard` — Overview: stats, continuing courses, quick links
- `/dashboard/courses` — My courses with progress, filter, search
- `/dashboard/courses/:id/learn` — Course player with curriculum sidebar
- `/dashboard/courses/:id/quiz` — MCQ quiz with scoring
- `/dashboard/certificates` — Certificate cards with download/share
- `/dashboard/community` — Community posts with create/like
- `/dashboard/profile` — Profile edit + password change
- `/dashboard/billing` — Payment history with status

### Step 4 — Super Admin Dashboard ✅
- `/admin` — Overview dashboard: stats, recent users, recent payments
- `/admin/users` — User management: list, role change, ban/unban, pagination
- `/admin/courses` — Course management: approve/reject, featured, delete
- `/admin/payments` — Payment history with CSV export button
- `/admin/community` — Community moderation: approve/pin/remove posts
- `/admin/settings` — Site settings: general, contact, payment, security, social

## Role Hierarchy
- `super_admin` — Full access including settings
- `admin` — All management except settings
- `moderator` — Community moderation only
- `student` — Dashboard, courses, certificates

## Environment Variables (Required)
- `VITE_SUPABASE_URL` — Supabase project URL
- `VITE_SUPABASE_ANON_KEY` — Supabase anon key

## Pending Steps
- Public pages (Home, Course listing, Blog)
- Course creation UI (admin)
- Bunny.net video integration
- SSLCommerz payment (bKash/Nagad/Rocket)
- Resend email notifications
- PDF certificates (react-pdf)
- Blog management UI

## Important Notes
- All Supabase routes must be configured in Auth → URL Configuration
- Google/Facebook OAuth must be enabled in Supabase Auth providers
- Bunny.net video — never expose signed URLs directly; generate server-side
- Payment webhooks must verify signatures before processing
