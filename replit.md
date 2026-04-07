# AI শিখি বাংলায় — Digital Course Platform

## Overview
Bangladesh-focused bilingual (Bengali + English) AI course selling platform with multi-role access control.

## IMPORTANT: No Static Pages
**সব কিছু dynamic** — কোনো static page নেই। সব content Supabase থেকে লোড হয়। PolicyPage, AboutPage, ContactPage, BlogPage সব dynamic DB-driven content।

## Tech Stack
- **Frontend**: React + Vite (artifacts/ai-shikhi-banglay)
- **Backend/DB**: Supabase (PostgreSQL + RLS + Auth + Storage)
- **Routing**: Wouter v3
- **Styling**: Tailwind CSS v4 (dark theme by default)
- **State**: TanStack Query + AuthContext
- **Payments**: SSLCommerz (bKash/Nagad/Rocket/Card)
- **Email**: Resend API
- **GitHub**: https://github.com/aishikhibanglay-art/aishikhibanglay-2.0
- **Domain**: https://www.aishikhibanglay.com

## Architecture
- Monorepo (pnpm workspaces)
- Artifact path: `artifacts/ai-shikhi-banglay`
- Preview path: `/`
- API: `artifacts/api-server` (Express + Supabase admin)

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

### Step 4 — Public Pages ✅
- `/` — Dynamic home page (hero, stats, featured courses, blog)
- `/courses` — Course listing with search/filter/category
- `/courses/:slug` — Course detail, enrollment, SSLCommerz payment
- `/blog` — Blog listing from Supabase
- `/blog/:slug` — Full blog post
- `/about`, `/contact`, `/community` — Dynamic pages
- `/privacy-policy`, `/terms`, `/refund-policy`, `/cookie-policy` — Dynamic from DB

### Step 5 — SSLCommerz Payment ✅
- `/checkout/:slug` — Order summary + SSLCommerz redirect
- `/payment/success`, `/payment/fail` — Callbacks with enrollment creation
- API: `/api/payment/initiate`, `/api/payment/success`, `/api/payment/fail`, `/api/coupon/validate`

### Step 6 — Super Admin Dashboard (Full) ✅
**Layout**: `/admin` — dark rose/gray theme, collapsible sidebar, role-based nav

**Pages:**
- `/admin` — Overview: revenue, enrollments, users stats
- `/admin/analytics` — Revenue charts, user growth, top courses, payment methods, CSV export
- `/admin/users` — User list, role change, ban/unban, search, pagination (super_admin only)
- `/admin/courses` — Course management: approve/reject, featured, edit button
- `/admin/courses/new` + `/admin/courses/:id/edit` — Full course editor (chapters + lessons)
- `/admin/categories` — CRUD categories with emoji + color
- `/admin/enrollments` — View all enrollments, manual enroll, CSV export, delete
- `/admin/payments` — Payment list with CSV export
- `/admin/coupons` — Full coupon CRUD (%, fixed, expiry, per-course, max-uses)
- `/admin/blog` + `/admin/blog/new` + `/admin/blog/:id/edit` — Blog management + SEO editor
- `/admin/reviews` — Review moderation (approve/hide/delete, rating filter)
- `/admin/community` — Community post moderation
- `/admin/notifications` — Send site-wide/targeted notifications with type icons + read tracking
- `/admin/email-templates` — 5 email templates with live preview
- `/admin/settings` — Site settings (general, contact, payment, social) (super_admin only)

## Role Hierarchy
- `super_admin` — Full access including settings, users
- `admin` — All management except settings/users
- `moderator` — Community moderation only
- `student` — Dashboard, courses, certificates

## Theme Colors
- Admin: rose/orange (`from-rose-500 to-orange-500`)
- Student: violet/indigo (`from-violet-500 to-indigo-600`)
- Public: violet/indigo dark

## Environment Variables
- `VITE_SUPABASE_URL` — Supabase project URL
- `VITE_SUPABASE_ANON_KEY` — Supabase anon key
- `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` — API server (admin access)
- `SSLCOMMERZ_STORE_ID`, `SSLCOMMERZ_STORE_PASSWORD` — Payment
- `RESEND_API_KEY` — Email
- `SESSION_SECRET` — API session

## Pending Features
- Bunny.net video player integration (CourseLearning page)
- PDF certificate generation (react-pdf)
- Resend email sending (enrollment, welcome, certificate emails)
- Student notification bell in dashboard

## Important Notes
- wouter v3: use `Redirect` not `Navigate`, `useParams`, `useSearch()` for query params
- Admin CustomPages removed — no static pages allowed, all content is dynamic
- `api/index.ts` has `// @ts-nocheck` (Express v5 type conflict workaround)
- CORS allows `www.aishikhibanglay.com` and `aishikhibanglay.com`
- Bunny.net video — never expose signed URLs directly; generate server-side
- Payment webhooks must verify signatures before processing
