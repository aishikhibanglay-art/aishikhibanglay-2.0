-- ============================================================
-- Fix: Dashboard Views — Security Invoker
-- Run this in Supabase SQL Editor to fix the security warning
-- ============================================================

-- Drop existing views
DROP VIEW IF EXISTS public.super_admin_dashboard;
DROP VIEW IF EXISTS public.admin_dashboard;
DROP VIEW IF EXISTS public.moderator_dashboard;


-- ============================================================
-- 1. Super Admin Dashboard (SECURITY INVOKER)
-- ============================================================

CREATE OR REPLACE VIEW public.super_admin_dashboard
WITH (security_invoker = true)
AS
SELECT
  (SELECT COUNT(*) FROM public.profiles WHERE role = 'student')                                  AS total_students,
  (SELECT COUNT(*) FROM public.profiles WHERE role = 'admin')                                    AS total_admins,
  (SELECT COUNT(*) FROM public.profiles WHERE role = 'moderator')                                AS total_moderators,
  (SELECT COUNT(*) FROM public.profiles WHERE is_banned = TRUE)                                  AS banned_users,
  (SELECT COUNT(*) FROM public.courses)                                                           AS total_courses,
  (SELECT COUNT(*) FROM public.courses WHERE is_published = TRUE)                                AS published_courses,
  (SELECT COUNT(*) FROM public.enrollments)                                                       AS total_enrollments,
  (SELECT COALESCE(SUM(amount),0) FROM public.orders WHERE payment_status = 'success')           AS total_revenue,
  (SELECT COALESCE(SUM(amount),0) FROM public.orders WHERE payment_status = 'success' AND DATE(created_at) = CURRENT_DATE) AS revenue_today,
  (SELECT COALESCE(SUM(amount),0) FROM public.orders WHERE payment_status = 'success' AND created_at >= DATE_TRUNC('month', NOW())) AS revenue_this_month,
  (SELECT COUNT(*) FROM public.community_reports WHERE resolved = FALSE)                         AS pending_reports,
  (SELECT COUNT(*) FROM public.community_posts WHERE is_hidden = FALSE)                          AS total_community_posts,
  (SELECT COUNT(*) FROM public.certificates)                                                      AS total_certificates,
  (SELECT COUNT(*) FROM public.blog_posts WHERE status = 'published')                            AS total_blog_posts;


-- ============================================================
-- 2. Admin Dashboard (SECURITY INVOKER)
-- ============================================================

CREATE OR REPLACE VIEW public.admin_dashboard
WITH (security_invoker = true)
AS
SELECT
  (SELECT COUNT(*) FROM public.profiles WHERE role = 'student')                                  AS total_students,
  (SELECT COUNT(*) FROM public.courses WHERE is_published = TRUE)                                AS published_courses,
  (SELECT COUNT(*) FROM public.courses WHERE is_published = FALSE)                               AS draft_courses,
  (SELECT COUNT(*) FROM public.enrollments)                                                       AS total_enrollments,
  (SELECT COALESCE(SUM(amount),0) FROM public.orders WHERE payment_status = 'success' AND DATE(created_at) = CURRENT_DATE) AS revenue_today,
  (SELECT COALESCE(SUM(amount),0) FROM public.orders WHERE payment_status = 'success' AND created_at >= DATE_TRUNC('week', NOW())) AS revenue_this_week,
  (SELECT COALESCE(SUM(amount),0) FROM public.orders WHERE payment_status = 'success' AND created_at >= DATE_TRUNC('month', NOW())) AS revenue_this_month,
  (SELECT COALESCE(SUM(amount),0) FROM public.orders WHERE payment_status = 'success')           AS revenue_all_time,
  (SELECT COUNT(*) FROM public.orders WHERE payment_status = 'success')                          AS successful_orders,
  (SELECT COUNT(*) FROM public.orders WHERE payment_status = 'failed')                           AS failed_orders,
  (SELECT COUNT(*) FROM public.blog_posts WHERE status = 'published')                            AS published_blog_posts,
  (SELECT COUNT(*) FROM public.community_reports WHERE resolved = FALSE)                         AS unresolved_reports,
  (SELECT COUNT(*) FROM public.coupons WHERE is_active = TRUE)                                   AS active_coupons;


-- ============================================================
-- 3. Moderator Dashboard (SECURITY INVOKER)
-- ============================================================

CREATE OR REPLACE VIEW public.moderator_dashboard
WITH (security_invoker = true)
AS
SELECT
  (SELECT COUNT(*) FROM public.community_posts WHERE is_hidden = FALSE)   AS total_visible_posts,
  (SELECT COUNT(*) FROM public.community_posts WHERE is_hidden = TRUE)    AS hidden_posts,
  (SELECT COUNT(*) FROM public.community_posts WHERE is_pinned = TRUE)    AS pinned_posts,
  (SELECT COUNT(*) FROM public.community_replies WHERE is_hidden = FALSE) AS total_replies,
  (SELECT COUNT(*) FROM public.community_reports WHERE resolved = FALSE)  AS pending_reports,
  (SELECT COUNT(*) FROM public.community_reports WHERE resolved = TRUE)   AS resolved_reports,
  (SELECT COUNT(*) FROM public.community_rules)                            AS total_rules,
  (SELECT COUNT(*) FROM public.profiles WHERE is_banned = TRUE)            AS banned_users;


-- ============================================================
-- ✅ Done! Views are now SECURITY INVOKER (RLS respected)
-- ============================================================
