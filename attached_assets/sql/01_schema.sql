-- ============================================================
-- "AI শিখি বাংলায়" — Complete Supabase Database Schema
-- Run this entire script in your Supabase SQL Editor
-- ============================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- for full-text search


-- ============================================================
-- ENUMS
-- ============================================================

CREATE TYPE user_role AS ENUM ('super_admin', 'admin', 'moderator', 'student');
CREATE TYPE course_type AS ENUM ('video', 'pdf', 'template');
CREATE TYPE lesson_type AS ENUM ('video', 'pdf', 'template', 'text');
CREATE TYPE payment_status AS ENUM ('pending', 'success', 'failed', 'refunded');
CREATE TYPE payment_method AS ENUM ('sslcommerz', 'stripe', 'manual');
CREATE TYPE discount_type AS ENUM ('percentage', 'flat_bdt', 'flat_usd');
CREATE TYPE post_status AS ENUM ('draft', 'published', 'scheduled');
CREATE TYPE vote_type AS ENUM ('up', 'down');
CREATE TYPE target_type AS ENUM ('post', 'reply');
CREATE TYPE notification_type AS ENUM ('reply', 'announcement', 'enrollment', 'certificate', 'warning', 'report_resolved');
CREATE TYPE currency AS ENUM ('BDT', 'USD');


-- ============================================================
-- TABLE: profiles
-- ============================================================

CREATE TABLE public.profiles (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id        UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  name           TEXT NOT NULL DEFAULT '',
  email          TEXT NOT NULL DEFAULT '',
  avatar_url     TEXT,
  bio            TEXT,
  role           user_role NOT NULL DEFAULT 'student',
  is_banned      BOOLEAN NOT NULL DEFAULT FALSE,
  social_links   JSONB DEFAULT '{}',
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles RLS
CREATE POLICY "Public profiles are viewable by everyone"
  ON public.profiles FOR SELECT USING (TRUE);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can update any profile"
  ON public.profiles FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.user_id = auth.uid()
        AND p.role IN ('admin', 'super_admin')
    )
  );

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
    NEW.email
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();


-- ============================================================
-- TABLE: courses
-- ============================================================

CREATE TABLE public.courses (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title           TEXT NOT NULL,
  slug            TEXT NOT NULL UNIQUE,
  description     TEXT,
  short_desc      TEXT,
  type            course_type NOT NULL DEFAULT 'video',
  category        TEXT,
  tags            TEXT[] DEFAULT '{}',
  price_bdt       NUMERIC(10,2) NOT NULL DEFAULT 0,
  price_usd       NUMERIC(10,2) NOT NULL DEFAULT 0,
  is_free         BOOLEAN NOT NULL DEFAULT FALSE,
  thumbnail_url   TEXT,
  trailer_url     TEXT,
  what_you_learn  TEXT[] DEFAULT '{}',
  requirements    TEXT[] DEFAULT '{}',
  certificate_enabled  BOOLEAN NOT NULL DEFAULT TRUE,
  quiz_pass_percent    INTEGER NOT NULL DEFAULT 70,
  quiz_retry_allowed   BOOLEAN NOT NULL DEFAULT TRUE,
  is_published    BOOLEAN NOT NULL DEFAULT FALSE,
  published_at    TIMESTAMPTZ,
  meta_title      TEXT,
  meta_description TEXT,
  og_image        TEXT,
  instructor_id   UUID REFERENCES public.profiles(id),
  total_duration  INTEGER DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Published courses visible to everyone"
  ON public.courses FOR SELECT
  USING (is_published = TRUE OR (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.user_id = auth.uid()
        AND p.role IN ('admin', 'super_admin')
    )
  ));

CREATE POLICY "Admins can insert courses"
  ON public.courses FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.user_id = auth.uid()
        AND p.role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Admins can update courses"
  ON public.courses FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.user_id = auth.uid()
        AND p.role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Admins can delete courses"
  ON public.courses FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.user_id = auth.uid()
        AND p.role IN ('admin', 'super_admin')
    )
  );

CREATE TRIGGER courses_updated_at
  BEFORE UPDATE ON public.courses
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE INDEX idx_courses_slug ON public.courses(slug);
CREATE INDEX idx_courses_category ON public.courses(category);
CREATE INDEX idx_courses_is_published ON public.courses(is_published);


-- ============================================================
-- TABLE: sections
-- ============================================================

CREATE TABLE public.sections (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id    UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  title        TEXT NOT NULL,
  order_index  INTEGER NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.sections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Sections visible if course is visible"
  ON public.sections FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.courses c
      WHERE c.id = course_id
        AND (c.is_published = TRUE OR EXISTS (
          SELECT 1 FROM public.profiles p
          WHERE p.user_id = auth.uid()
            AND p.role IN ('admin', 'super_admin')
        ))
    )
  );

CREATE POLICY "Admins can manage sections"
  ON public.sections FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.user_id = auth.uid()
        AND p.role IN ('admin', 'super_admin')
    )
  );

CREATE INDEX idx_sections_course_id ON public.sections(course_id);


-- ============================================================
-- TABLE: lessons
-- ============================================================

CREATE TABLE public.lessons (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  section_id            UUID NOT NULL REFERENCES public.sections(id) ON DELETE CASCADE,
  course_id             UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  title                 TEXT NOT NULL,
  type                  lesson_type NOT NULL DEFAULT 'video',
  content_url           TEXT,
  content_text          TEXT,
  is_free_preview       BOOLEAN NOT NULL DEFAULT FALSE,
  duration_seconds      INTEGER DEFAULT 0,
  order_index           INTEGER NOT NULL DEFAULT 0,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Free preview lessons visible to everyone"
  ON public.lessons FOR SELECT
  USING (
    is_free_preview = TRUE
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.user_id = auth.uid()
        AND p.role IN ('admin', 'super_admin')
    )
    OR EXISTS (
      SELECT 1 FROM public.enrollments e
      WHERE e.user_id = auth.uid()
        AND e.course_id = lessons.course_id
    )
  );

CREATE POLICY "Admins can manage lessons"
  ON public.lessons FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.user_id = auth.uid()
        AND p.role IN ('admin', 'super_admin')
    )
  );

CREATE TRIGGER lessons_updated_at
  BEFORE UPDATE ON public.lessons
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE INDEX idx_lessons_course_id ON public.lessons(course_id);
CREATE INDEX idx_lessons_section_id ON public.lessons(section_id);


-- ============================================================
-- TABLE: enrollments
-- ============================================================

CREATE TABLE public.enrollments (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  course_id    UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  enrolled_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  payment_id   UUID,
  UNIQUE(user_id, course_id)
);

ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own enrollments"
  ON public.enrollments FOR SELECT
  USING (
    user_id = (SELECT id FROM public.profiles WHERE user_id = auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.user_id = auth.uid()
        AND p.role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "System and admins can insert enrollments"
  ON public.enrollments FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.user_id = auth.uid()
        AND p.role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Admins can delete enrollments"
  ON public.enrollments FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.user_id = auth.uid()
        AND p.role IN ('admin', 'super_admin')
    )
  );

CREATE INDEX idx_enrollments_user_id ON public.enrollments(user_id);
CREATE INDEX idx_enrollments_course_id ON public.enrollments(course_id);


-- ============================================================
-- TABLE: progress
-- ============================================================

CREATE TABLE public.progress (
  id                     UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id                UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  lesson_id              UUID NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  course_id              UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  completed              BOOLEAN NOT NULL DEFAULT FALSE,
  last_position_seconds  INTEGER DEFAULT 0,
  updated_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, lesson_id)
);

ALTER TABLE public.progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own progress"
  ON public.progress FOR SELECT
  USING (
    user_id = (SELECT id FROM public.profiles WHERE user_id = auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.user_id = auth.uid()
        AND p.role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Users can upsert their own progress"
  ON public.progress FOR INSERT
  WITH CHECK (
    user_id = (SELECT id FROM public.profiles WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can update their own progress"
  ON public.progress FOR UPDATE
  USING (
    user_id = (SELECT id FROM public.profiles WHERE user_id = auth.uid())
  );

CREATE POLICY "Admins can delete/reset progress"
  ON public.progress FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.user_id = auth.uid()
        AND p.role IN ('admin', 'super_admin')
    )
  );

CREATE TRIGGER progress_updated_at
  BEFORE UPDATE ON public.progress
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE INDEX idx_progress_user_course ON public.progress(user_id, course_id);


-- ============================================================
-- TABLE: orders
-- ============================================================

CREATE TABLE public.orders (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  course_id       UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  amount          NUMERIC(10,2) NOT NULL,
  currency        currency NOT NULL DEFAULT 'BDT',
  payment_method  payment_method NOT NULL,
  payment_status  payment_status NOT NULL DEFAULT 'pending',
  gateway_ref     TEXT,
  coupon_id       UUID,
  discount_amount NUMERIC(10,2) DEFAULT 0,
  invoice_url     TEXT,
  notes           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own orders"
  ON public.orders FOR SELECT
  USING (
    user_id = (SELECT id FROM public.profiles WHERE user_id = auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.user_id = auth.uid()
        AND p.role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "System can insert orders"
  ON public.orders FOR INSERT
  WITH CHECK (TRUE);

CREATE POLICY "Admins can update orders"
  ON public.orders FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.user_id = auth.uid()
        AND p.role IN ('admin', 'super_admin')
    )
  );

CREATE TRIGGER orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE INDEX idx_orders_user_id ON public.orders(user_id);
CREATE INDEX idx_orders_course_id ON public.orders(course_id);
CREATE INDEX idx_orders_status ON public.orders(payment_status);


-- ============================================================
-- TABLE: coupons
-- ============================================================

CREATE TABLE public.coupons (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code           TEXT NOT NULL UNIQUE,
  discount_type  discount_type NOT NULL DEFAULT 'percentage',
  discount_value NUMERIC(10,2) NOT NULL,
  expiry_date    TIMESTAMPTZ,
  usage_limit    INTEGER,
  used_count     INTEGER NOT NULL DEFAULT 0,
  is_active      BOOLEAN NOT NULL DEFAULT TRUE,
  applicable_courses UUID[] DEFAULT NULL, -- NULL = all courses
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active coupons code only"
  ON public.coupons FOR SELECT
  USING (is_active = TRUE OR EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = auth.uid()
      AND p.role IN ('admin', 'super_admin')
  ));

CREATE POLICY "Admins can manage coupons"
  ON public.coupons FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.user_id = auth.uid()
        AND p.role IN ('admin', 'super_admin')
    )
  );


-- ============================================================
-- TABLE: certificates
-- ============================================================

CREATE TABLE public.certificates (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id          UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  course_id        UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  issued_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  certificate_uid  TEXT NOT NULL UNIQUE DEFAULT gen_random_uuid()::TEXT,
  revoked          BOOLEAN NOT NULL DEFAULT FALSE,
  UNIQUE(user_id, course_id)
);

ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own certificates"
  ON public.certificates FOR SELECT
  USING (
    user_id = (SELECT id FROM public.profiles WHERE user_id = auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.user_id = auth.uid()
        AND p.role IN ('admin', 'super_admin')
    )
    OR TRUE -- public verification via certificate_uid
  );

CREATE POLICY "System can insert certificates"
  ON public.certificates FOR INSERT
  WITH CHECK (TRUE);

CREATE POLICY "Admins can revoke certificates"
  ON public.certificates FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.user_id = auth.uid()
        AND p.role IN ('admin', 'super_admin')
    )
  );

CREATE INDEX idx_certificates_user_id ON public.certificates(user_id);
CREATE INDEX idx_certificates_uid ON public.certificates(certificate_uid);


-- ============================================================
-- TABLE: quiz_questions
-- ============================================================

CREATE TABLE public.quiz_questions (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id      UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  question       TEXT NOT NULL,
  options        JSONB NOT NULL DEFAULT '[]', -- array of {label, value}
  correct_answer TEXT NOT NULL,
  explanation    TEXT,
  order_index    INTEGER NOT NULL DEFAULT 0,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enrolled students can view quiz questions"
  ON public.quiz_questions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.enrollments e
      JOIN public.profiles p ON p.id = e.user_id
      WHERE p.user_id = auth.uid()
        AND e.course_id = quiz_questions.course_id
    )
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.user_id = auth.uid()
        AND p.role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Admins can manage quiz questions"
  ON public.quiz_questions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.user_id = auth.uid()
        AND p.role IN ('admin', 'super_admin')
    )
  );

CREATE INDEX idx_quiz_questions_course_id ON public.quiz_questions(course_id);


-- ============================================================
-- TABLE: quiz_attempts
-- ============================================================

CREATE TABLE public.quiz_attempts (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  course_id    UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  score        NUMERIC(5,2) NOT NULL DEFAULT 0,
  passed       BOOLEAN NOT NULL DEFAULT FALSE,
  answers      JSONB DEFAULT '{}',
  attempted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own quiz attempts"
  ON public.quiz_attempts FOR SELECT
  USING (
    user_id = (SELECT id FROM public.profiles WHERE user_id = auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.user_id = auth.uid()
        AND p.role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Users can insert their own quiz attempts"
  ON public.quiz_attempts FOR INSERT
  WITH CHECK (
    user_id = (SELECT id FROM public.profiles WHERE user_id = auth.uid())
  );

CREATE INDEX idx_quiz_attempts_user_course ON public.quiz_attempts(user_id, course_id);


-- ============================================================
-- TABLE: blog_categories
-- ============================================================

CREATE TABLE public.blog_categories (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name       TEXT NOT NULL,
  slug       TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.blog_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Blog categories visible to everyone"
  ON public.blog_categories FOR SELECT USING (TRUE);

CREATE POLICY "Admins can manage blog categories"
  ON public.blog_categories FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.user_id = auth.uid()
        AND p.role IN ('admin', 'super_admin')
    )
  );


-- ============================================================
-- TABLE: blog_posts
-- ============================================================

CREATE TABLE public.blog_posts (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title            TEXT NOT NULL,
  slug             TEXT NOT NULL UNIQUE,
  content          TEXT,
  excerpt          TEXT,
  thumbnail_url    TEXT,
  category         TEXT,
  category_id      UUID REFERENCES public.blog_categories(id),
  tags             TEXT[] DEFAULT '{}',
  author_id        UUID NOT NULL REFERENCES public.profiles(id),
  status           post_status NOT NULL DEFAULT 'draft',
  published_at     TIMESTAMPTZ,
  scheduled_at     TIMESTAMPTZ,
  read_time        INTEGER DEFAULT 5,
  meta_title       TEXT,
  meta_description TEXT,
  og_image         TEXT,
  view_count       INTEGER NOT NULL DEFAULT 0,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Published posts visible to everyone"
  ON public.blog_posts FOR SELECT
  USING (
    status = 'published'
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.user_id = auth.uid()
        AND p.role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Admins can manage blog posts"
  ON public.blog_posts FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.user_id = auth.uid()
        AND p.role IN ('admin', 'super_admin')
    )
  );

CREATE TRIGGER blog_posts_updated_at
  BEFORE UPDATE ON public.blog_posts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE INDEX idx_blog_posts_slug ON public.blog_posts(slug);
CREATE INDEX idx_blog_posts_status ON public.blog_posts(status);


-- ============================================================
-- TABLE: community_posts
-- ============================================================

CREATE TABLE public.community_posts (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  content     TEXT NOT NULL,
  category    TEXT,
  image_url   TEXT,
  is_pinned   BOOLEAN NOT NULL DEFAULT FALSE,
  is_hidden   BOOLEAN NOT NULL DEFAULT FALSE,
  is_featured BOOLEAN NOT NULL DEFAULT FALSE,
  upvotes     INTEGER NOT NULL DEFAULT 0,
  downvotes   INTEGER NOT NULL DEFAULT 0,
  reply_count INTEGER NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.community_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Visible community posts viewable by everyone"
  ON public.community_posts FOR SELECT
  USING (
    is_hidden = FALSE
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.user_id = auth.uid()
        AND p.role IN ('admin', 'super_admin', 'moderator')
    )
  );

CREATE POLICY "Logged-in users can create posts"
  ON public.community_posts FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND NOT EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.user_id = auth.uid()
        AND p.is_banned = TRUE
    )
  );

CREATE POLICY "Users can update their own posts"
  ON public.community_posts FOR UPDATE
  USING (
    user_id = (SELECT id FROM public.profiles WHERE user_id = auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.user_id = auth.uid()
        AND p.role IN ('admin', 'super_admin', 'moderator')
    )
  );

CREATE POLICY "Admins and moderators can delete posts"
  ON public.community_posts FOR DELETE
  USING (
    user_id = (SELECT id FROM public.profiles WHERE user_id = auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.user_id = auth.uid()
        AND p.role IN ('admin', 'super_admin', 'moderator')
    )
  );

CREATE TRIGGER community_posts_updated_at
  BEFORE UPDATE ON public.community_posts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE INDEX idx_community_posts_user_id ON public.community_posts(user_id);
CREATE INDEX idx_community_posts_is_hidden ON public.community_posts(is_hidden);


-- ============================================================
-- TABLE: community_replies
-- ============================================================

CREATE TABLE public.community_replies (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id         UUID NOT NULL REFERENCES public.community_posts(id) ON DELETE CASCADE,
  parent_reply_id UUID REFERENCES public.community_replies(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content         TEXT NOT NULL,
  is_hidden       BOOLEAN NOT NULL DEFAULT FALSE,
  upvotes         INTEGER NOT NULL DEFAULT 0,
  downvotes       INTEGER NOT NULL DEFAULT 0,
  depth           INTEGER NOT NULL DEFAULT 0, -- 0=direct reply, 1=reply to reply, 2=max
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.community_replies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Visible replies viewable by everyone"
  ON public.community_replies FOR SELECT
  USING (
    is_hidden = FALSE
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.user_id = auth.uid()
        AND p.role IN ('admin', 'super_admin', 'moderator')
    )
  );

CREATE POLICY "Logged-in users can reply"
  ON public.community_replies FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND NOT EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.user_id = auth.uid()
        AND p.is_banned = TRUE
    )
  );

CREATE POLICY "Users and mods can update replies"
  ON public.community_replies FOR UPDATE
  USING (
    user_id = (SELECT id FROM public.profiles WHERE user_id = auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.user_id = auth.uid()
        AND p.role IN ('admin', 'super_admin', 'moderator')
    )
  );

CREATE POLICY "Users and mods can delete replies"
  ON public.community_replies FOR DELETE
  USING (
    user_id = (SELECT id FROM public.profiles WHERE user_id = auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.user_id = auth.uid()
        AND p.role IN ('admin', 'super_admin', 'moderator')
    )
  );

CREATE TRIGGER community_replies_updated_at
  BEFORE UPDATE ON public.community_replies
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE INDEX idx_community_replies_post_id ON public.community_replies(post_id);


-- ============================================================
-- TABLE: community_votes
-- ============================================================

CREATE TABLE public.community_votes (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  target_id   UUID NOT NULL,
  target_type target_type NOT NULL,
  vote_type   vote_type NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, target_id, target_type)
);

ALTER TABLE public.community_votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Logged-in users can vote"
  ON public.community_votes FOR ALL
  USING (
    user_id = (SELECT id FROM public.profiles WHERE user_id = auth.uid())
  )
  WITH CHECK (
    user_id = (SELECT id FROM public.profiles WHERE user_id = auth.uid())
  );

CREATE INDEX idx_community_votes_target ON public.community_votes(target_id, target_type);


-- ============================================================
-- TABLE: community_reports
-- ============================================================

CREATE TABLE public.community_reports (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reporter_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  target_id   UUID NOT NULL,
  target_type target_type NOT NULL,
  reason      TEXT NOT NULL,
  resolved    BOOLEAN NOT NULL DEFAULT FALSE,
  resolved_by UUID REFERENCES public.profiles(id),
  resolved_at TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.community_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can create reports"
  ON public.community_reports FOR INSERT
  WITH CHECK (
    reporter_id = (SELECT id FROM public.profiles WHERE user_id = auth.uid())
  );

CREATE POLICY "Mods and admins can view reports"
  ON public.community_reports FOR SELECT
  USING (
    reporter_id = (SELECT id FROM public.profiles WHERE user_id = auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.user_id = auth.uid()
        AND p.role IN ('admin', 'super_admin', 'moderator')
    )
  );

CREATE POLICY "Mods and admins can resolve reports"
  ON public.community_reports FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.user_id = auth.uid()
        AND p.role IN ('admin', 'super_admin', 'moderator')
    )
  );


-- ============================================================
-- TABLE: community_rules
-- ============================================================

CREATE TABLE public.community_rules (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  rule_text   TEXT NOT NULL,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.community_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Rules visible to everyone"
  ON public.community_rules FOR SELECT USING (TRUE);

CREATE POLICY "Admins and mods can manage rules"
  ON public.community_rules FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.user_id = auth.uid()
        AND p.role IN ('admin', 'super_admin', 'moderator')
    )
  );


-- ============================================================
-- TABLE: custom_pages
-- ============================================================

CREATE TABLE public.custom_pages (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title        TEXT NOT NULL,
  slug         TEXT NOT NULL UNIQUE,
  content      TEXT,
  is_published BOOLEAN NOT NULL DEFAULT FALSE,
  meta_title       TEXT,
  meta_description TEXT,
  og_image         TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.custom_pages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Published pages visible to everyone"
  ON public.custom_pages FOR SELECT
  USING (
    is_published = TRUE
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.user_id = auth.uid()
        AND p.role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Admins can manage custom pages"
  ON public.custom_pages FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.user_id = auth.uid()
        AND p.role IN ('admin', 'super_admin')
    )
  );

CREATE TRIGGER custom_pages_updated_at
  BEFORE UPDATE ON public.custom_pages
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE INDEX idx_custom_pages_slug ON public.custom_pages(slug);


-- ============================================================
-- TABLE: site_settings
-- ============================================================

CREATE TABLE public.site_settings (
  key        TEXT PRIMARY KEY,
  value      JSONB,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Site settings readable by everyone"
  ON public.site_settings FOR SELECT USING (TRUE);

CREATE POLICY "Only admins can modify site settings"
  ON public.site_settings FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.user_id = auth.uid()
        AND p.role IN ('admin', 'super_admin')
    )
  );

-- Seed default site settings
INSERT INTO public.site_settings (key, value) VALUES
  ('site_name', '"AI শিখি বাংলায়"'),
  ('site_tagline', '"বাংলায় AI শিখুন, ভবিষ্যৎ গড়ুন"'),
  ('site_logo_url', 'null'),
  ('site_favicon_url', 'null'),
  ('primary_color', '"#6366f1"'),
  ('contact_email', '"info@aishikhibanglay.com"'),
  ('contact_phone', 'null'),
  ('whatsapp_number', 'null'),
  ('whatsapp_button_enabled', 'false'),
  ('social_links', '{"facebook":"","youtube":"","instagram":"","tiktok":"","linkedin":"","twitter":""}'),
  ('header_nav', '[]'),
  ('footer_col1', '[]'),
  ('footer_col2', '[]'),
  ('footer_col3', '{}'),
  ('footer_copyright', '"© 2025 AI শিখি বাংলায়. All rights reserved."'),
  ('google_analytics_id', 'null'),
  ('facebook_pixel_id', 'null'),
  ('adsense_publisher_id', 'null'),
  ('adsense_enabled', 'false'),
  ('adsense_header_id', 'null'),
  ('adsense_mid_id', 'null'),
  ('adsense_sidebar_id', 'null'),
  ('adsense_footer_id', 'null'),
  ('meta_title', '"AI শিখি বাংলায় - বাংলায় AI শিখুন"'),
  ('meta_description', '"বাংলাদেশের সেরা AI শিক্ষামূলক প্ল্যাটফর্ম"'),
  ('og_image', 'null'),
  ('google_site_verification', 'null'),
  ('robots_txt', '"User-agent: *\nAllow: /"'),
  ('stripe_enabled', 'false'),
  ('sslcommerz_enabled', 'true'),
  ('language', '"bn"');


-- ============================================================
-- TABLE: notifications
-- ============================================================

CREATE TABLE public.notifications (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type       notification_type NOT NULL,
  message    TEXT NOT NULL,
  link       TEXT,
  is_read    BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notifications"
  ON public.notifications FOR SELECT
  USING (
    user_id = (SELECT id FROM public.profiles WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can mark their notifications as read"
  ON public.notifications FOR UPDATE
  USING (
    user_id = (SELECT id FROM public.profiles WHERE user_id = auth.uid())
  );

CREATE POLICY "System can insert notifications"
  ON public.notifications FOR INSERT
  WITH CHECK (TRUE);

CREATE INDEX idx_notifications_user_id ON public.notifications(user_id, is_read);


-- ============================================================
-- TABLE: lesson_notes
-- ============================================================

CREATE TABLE public.lesson_notes (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  lesson_id  UUID NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  content    TEXT NOT NULL DEFAULT '',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, lesson_id)
);

ALTER TABLE public.lesson_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own notes"
  ON public.lesson_notes FOR ALL
  USING (
    user_id = (SELECT id FROM public.profiles WHERE user_id = auth.uid())
  )
  WITH CHECK (
    user_id = (SELECT id FROM public.profiles WHERE user_id = auth.uid())
  );

CREATE TRIGGER lesson_notes_updated_at
  BEFORE UPDATE ON public.lesson_notes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();


-- ============================================================
-- TABLE: lesson_qa
-- ============================================================

CREATE TABLE public.lesson_qa (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lesson_id   UUID NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  question    TEXT NOT NULL,
  answer      TEXT,
  answered_by UUID REFERENCES public.profiles(id),
  answered_at TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.lesson_qa ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enrolled users can view Q&A"
  ON public.lesson_qa FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.lessons l
      JOIN public.enrollments e ON e.course_id = l.course_id
      JOIN public.profiles p ON p.id = e.user_id
      WHERE l.id = lesson_qa.lesson_id
        AND p.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.user_id = auth.uid()
        AND p.role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Enrolled users can ask questions"
  ON public.lesson_qa FOR INSERT
  WITH CHECK (
    user_id = (SELECT id FROM public.profiles WHERE user_id = auth.uid())
  );

CREATE POLICY "Admins can answer questions"
  ON public.lesson_qa FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.user_id = auth.uid()
        AND p.role IN ('admin', 'super_admin')
    )
  );

CREATE INDEX idx_lesson_qa_lesson_id ON public.lesson_qa(lesson_id);


-- ============================================================
-- TABLE: course_reviews
-- ============================================================

CREATE TABLE public.course_reviews (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  course_id  UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  rating     INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  review     TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, course_id)
);

ALTER TABLE public.course_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Reviews visible to everyone"
  ON public.course_reviews FOR SELECT USING (TRUE);

CREATE POLICY "Enrolled users can leave reviews"
  ON public.course_reviews FOR INSERT
  WITH CHECK (
    user_id = (SELECT id FROM public.profiles WHERE user_id = auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.enrollments e
      WHERE e.user_id = (SELECT id FROM public.profiles WHERE user_id = auth.uid())
        AND e.course_id = course_reviews.course_id
    )
  );

CREATE POLICY "Users can update their own reviews"
  ON public.course_reviews FOR UPDATE
  USING (
    user_id = (SELECT id FROM public.profiles WHERE user_id = auth.uid())
  );

CREATE INDEX idx_course_reviews_course_id ON public.course_reviews(course_id);


-- ============================================================
-- DASHBOARD VIEWS (4 separate dashboard tables/views)
-- ============================================================

-- 1. Super Admin Dashboard Stats View
CREATE OR REPLACE VIEW public.super_admin_dashboard AS
SELECT
  (SELECT COUNT(*) FROM public.profiles WHERE role = 'student') AS total_students,
  (SELECT COUNT(*) FROM public.profiles WHERE role = 'admin') AS total_admins,
  (SELECT COUNT(*) FROM public.profiles WHERE role = 'moderator') AS total_moderators,
  (SELECT COUNT(*) FROM public.profiles WHERE is_banned = TRUE) AS banned_users,
  (SELECT COUNT(*) FROM public.courses) AS total_courses,
  (SELECT COUNT(*) FROM public.courses WHERE is_published = TRUE) AS published_courses,
  (SELECT COUNT(*) FROM public.enrollments) AS total_enrollments,
  (SELECT COALESCE(SUM(amount), 0) FROM public.orders WHERE payment_status = 'success') AS total_revenue_all,
  (SELECT COALESCE(SUM(amount), 0) FROM public.orders WHERE payment_status = 'success' AND DATE(created_at) = CURRENT_DATE) AS revenue_today,
  (SELECT COALESCE(SUM(amount), 0) FROM public.orders WHERE payment_status = 'success' AND created_at >= DATE_TRUNC('month', NOW())) AS revenue_this_month,
  (SELECT COUNT(*) FROM public.community_reports WHERE resolved = FALSE) AS pending_reports,
  (SELECT COUNT(*) FROM public.community_posts WHERE is_hidden = FALSE) AS total_community_posts,
  (SELECT COUNT(*) FROM public.certificates) AS total_certificates,
  (SELECT COUNT(*) FROM public.blog_posts WHERE status = 'published') AS total_blog_posts;

-- 2. Admin Dashboard Stats View
CREATE OR REPLACE VIEW public.admin_dashboard AS
SELECT
  (SELECT COUNT(*) FROM public.profiles WHERE role = 'student') AS total_students,
  (SELECT COUNT(*) FROM public.courses WHERE is_published = TRUE) AS published_courses,
  (SELECT COUNT(*) FROM public.courses WHERE is_published = FALSE) AS draft_courses,
  (SELECT COUNT(*) FROM public.enrollments) AS total_enrollments,
  (SELECT COALESCE(SUM(amount), 0) FROM public.orders WHERE payment_status = 'success' AND DATE(created_at) = CURRENT_DATE) AS revenue_today,
  (SELECT COALESCE(SUM(amount), 0) FROM public.orders WHERE payment_status = 'success' AND created_at >= DATE_TRUNC('week', NOW())) AS revenue_this_week,
  (SELECT COALESCE(SUM(amount), 0) FROM public.orders WHERE payment_status = 'success' AND created_at >= DATE_TRUNC('month', NOW())) AS revenue_this_month,
  (SELECT COALESCE(SUM(amount), 0) FROM public.orders WHERE payment_status = 'success') AS revenue_all_time,
  (SELECT COUNT(*) FROM public.orders WHERE payment_status = 'success') AS successful_orders,
  (SELECT COUNT(*) FROM public.orders WHERE payment_status = 'failed') AS failed_orders,
  (SELECT COUNT(*) FROM public.blog_posts WHERE status = 'published') AS published_blog_posts,
  (SELECT COUNT(*) FROM public.community_reports WHERE resolved = FALSE) AS unresolved_reports,
  (SELECT COUNT(*) FROM public.coupons WHERE is_active = TRUE) AS active_coupons;

-- 3. Moderator Dashboard Stats View
CREATE OR REPLACE VIEW public.moderator_dashboard AS
SELECT
  (SELECT COUNT(*) FROM public.community_posts WHERE is_hidden = FALSE) AS total_visible_posts,
  (SELECT COUNT(*) FROM public.community_posts WHERE is_hidden = TRUE) AS hidden_posts,
  (SELECT COUNT(*) FROM public.community_posts WHERE is_pinned = TRUE) AS pinned_posts,
  (SELECT COUNT(*) FROM public.community_replies WHERE is_hidden = FALSE) AS total_replies,
  (SELECT COUNT(*) FROM public.community_reports WHERE resolved = FALSE) AS pending_reports,
  (SELECT COUNT(*) FROM public.community_reports WHERE resolved = TRUE) AS resolved_reports,
  (SELECT COUNT(*) FROM public.community_rules) AS total_rules,
  (SELECT COUNT(*) FROM public.profiles WHERE is_banned = TRUE) AS banned_users;

-- 4. Student Dashboard Stats (function — per user)
CREATE OR REPLACE FUNCTION public.student_dashboard(p_user_id UUID)
RETURNS TABLE (
  enrolled_courses      BIGINT,
  completed_courses     BIGINT,
  in_progress_courses   BIGINT,
  total_certificates    BIGINT,
  community_posts       BIGINT,
  completed_quizzes     BIGINT,
  unread_notifications  BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    (SELECT COUNT(*) FROM public.enrollments e WHERE e.user_id = p_user_id)::BIGINT,
    (SELECT COUNT(DISTINCT pr.course_id)
     FROM public.progress pr
     WHERE pr.user_id = p_user_id
       AND pr.completed = TRUE
       AND (
         SELECT COUNT(*) FROM public.lessons l WHERE l.course_id = pr.course_id
       ) = (
         SELECT COUNT(*) FROM public.progress pr2
         WHERE pr2.user_id = p_user_id
           AND pr2.course_id = pr.course_id
           AND pr2.completed = TRUE
       )
    )::BIGINT,
    (SELECT COUNT(DISTINCT e.course_id)
     FROM public.enrollments e
     WHERE e.user_id = p_user_id
       AND EXISTS (
         SELECT 1 FROM public.progress pr
         WHERE pr.user_id = p_user_id
           AND pr.course_id = e.course_id
           AND pr.completed = TRUE
       )
    )::BIGINT,
    (SELECT COUNT(*) FROM public.certificates c WHERE c.user_id = p_user_id AND c.revoked = FALSE)::BIGINT,
    (SELECT COUNT(*) FROM public.community_posts cp WHERE cp.user_id = p_user_id)::BIGINT,
    (SELECT COUNT(*) FROM public.quiz_attempts qa WHERE qa.user_id = p_user_id AND qa.passed = TRUE)::BIGINT,
    (SELECT COUNT(*) FROM public.notifications n WHERE n.user_id = p_user_id AND n.is_read = FALSE)::BIGINT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ============================================================
-- TABLE: email_templates
-- ============================================================

CREATE TABLE public.email_templates (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name       TEXT NOT NULL UNIQUE,
  subject    TEXT NOT NULL,
  body_html  TEXT NOT NULL,
  variables  TEXT[] DEFAULT '{}',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage email templates"
  ON public.email_templates FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.user_id = auth.uid()
        AND p.role IN ('admin', 'super_admin')
    )
  );

-- Seed default email templates
INSERT INTO public.email_templates (name, subject, body_html, variables) VALUES
  ('welcome', 'AI শিখি বাংলায়-তে স্বাগতম, {student_name}!', '<h1>স্বাগতম {student_name}!</h1><p>আপনার একাউন্ট সফলভাবে তৈরি হয়েছে।</p>', ARRAY['{student_name}', '{login_url}']),
  ('enrollment_confirmation', 'কোর্স এনরোলমেন্ট নিশ্চিত: {course_name}', '<h1>অভিনন্দন {student_name}!</h1><p>আপনি {course_name} কোর্সে সফলভাবে ভর্তি হয়েছেন।</p><a href="{course_url}">কোর্স শুরু করুন</a>', ARRAY['{student_name}', '{course_name}', '{course_url}']),
  ('payment_receipt', 'পেমেন্ট রসিদ - {course_name}', '<h1>পেমেন্ট সম্পন্ন</h1><p>কোর্স: {course_name}</p><p>পরিমাণ: {amount}</p><p>তারিখ: {date}</p>', ARRAY['{student_name}', '{course_name}', '{amount}', '{date}', '{transaction_id}']),
  ('password_reset', 'পাসওয়ার্ড রিসেট করুন', '<h1>পাসওয়ার্ড রিসেট</h1><p>নিচের লিংকে ক্লিক করুন:</p><a href="{reset_url}">পাসওয়ার্ড রিসেট করুন</a>', ARRAY['{reset_url}']),
  ('certificate_earned', 'সার্টিফিকেট অর্জিত: {course_name}', '<h1>অভিনন্দন {student_name}!</h1><p>আপনি {course_name} কোর্স সম্পন্ন করেছেন।</p><a href="{certificate_url}">সার্টিফিকেট ডাউনলোড করুন</a>', ARRAY['{student_name}', '{course_name}', '{certificate_url}']),
  ('course_completion', 'কোর্স সম্পন্ন: {course_name}', '<h1>অভিনন্দন!</h1><p>আপনি {course_name} কোর্সটি সফলভাবে শেষ করেছেন।</p>', ARRAY['{student_name}', '{course_name}']);

CREATE TRIGGER email_templates_updated_at
  BEFORE UPDATE ON public.email_templates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();


-- ============================================================
-- Seed default custom pages
-- ============================================================

INSERT INTO public.custom_pages (title, slug, content, is_published) VALUES
  ('আমাদের সম্পর্কে', 'about', '<h1>আমাদের সম্পর্কে</h1><p>AI শিখি বাংলায় হলো বাংলাদেশের প্রথম AI শিক্ষামূলক প্ল্যাটফর্ম।</p>', TRUE),
  ('যোগাযোগ', 'contact', '<h1>যোগাযোগ করুন</h1>', TRUE),
  ('গোপনীয়তা নীতি', 'privacy-policy', '<h1>গোপনীয়তা নীতি</h1><p>আমরা আপনার তথ্য সুরক্ষিত রাখি।</p>', TRUE),
  ('শর্তাবলী', 'terms', '<h1>শর্তাবলী</h1><p>এই ওয়েবসাইট ব্যবহার করে আপনি আমাদের শর্তাবলীতে সম্মত হচ্ছেন।</p>', TRUE),
  ('রিফান্ড নীতি', 'refund-policy', '<h1>রিফান্ড নীতি</h1><p>পেমেন্টের ৭ দিনের মধ্যে রিফান্ডের আবেদন করা যাবে।</p>', TRUE),
  ('কুকি নীতি', 'cookie-policy', '<h1>কুকি নীতি</h1><p>আমরা সেবার মান উন্নয়নে কুকি ব্যবহার করি।</p>', TRUE);


-- ============================================================
-- Seed default community rules
-- ============================================================

INSERT INTO public.community_rules (rule_text, order_index) VALUES
  ('সম্মানজনক ভাষা ব্যবহার করুন। অশ্লীল বা অসম্মানজনক মন্তব্য নিষিদ্ধ।', 1),
  ('স্প্যাম বা বিজ্ঞাপন পোস্ট করবেন না।', 2),
  ('অন্যদের ব্যক্তিগত তথ্য শেয়ার করবেন না।', 3),
  ('প্রাসঙ্গিক বিষয়ে পোস্ট করুন।', 4),
  ('কপিরাইট বিষয়বস্তু শেয়ার করবেন না।', 5);


-- ============================================================
-- Helper function: check if user is admin/super_admin
-- ============================================================

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE user_id = auth.uid()
      AND role IN ('admin', 'super_admin')
  );
$$ LANGUAGE SQL SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE user_id = auth.uid()
      AND role = 'super_admin'
  );
$$ LANGUAGE SQL SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_moderator_or_above()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE user_id = auth.uid()
      AND role IN ('admin', 'super_admin', 'moderator')
  );
$$ LANGUAGE SQL SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS TEXT AS $$
  SELECT role::TEXT FROM public.profiles WHERE user_id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER;


-- ============================================================
-- TABLE: course_categories
-- ============================================================

CREATE TABLE public.course_categories (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name       TEXT NOT NULL,
  slug       TEXT NOT NULL UNIQUE,
  icon       TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.course_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Categories visible to everyone"
  ON public.course_categories FOR SELECT USING (TRUE);

CREATE POLICY "Admins can manage categories"
  ON public.course_categories FOR ALL
  USING (public.is_admin());

-- Seed default categories
INSERT INTO public.course_categories (name, slug, order_index) VALUES
  ('AI ও Machine Learning', 'ai-machine-learning', 1),
  ('ChatGPT ও Prompt Engineering', 'chatgpt-prompt', 2),
  ('Python Programming', 'python', 3),
  ('Data Science', 'data-science', 4),
  ('Web Development', 'web-development', 5),
  ('Digital Marketing', 'digital-marketing', 6),
  ('Graphic Design', 'graphic-design', 7),
  ('Freelancing', 'freelancing', 8);


-- ============================================================
-- REALTIME: Enable for community and notifications
-- ============================================================

ALTER PUBLICATION supabase_realtime ADD TABLE public.community_posts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.community_replies;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;


-- ============================================================
-- Storage Buckets (run after creating buckets in Supabase dashboard)
-- ============================================================

-- After creating these buckets in Storage dashboard, apply these policies:
-- Buckets to create:
--   1. "course-thumbnails"  (public)
--   2. "course-content"     (private — signed URLs only)
--   3. "blog-images"        (public)
--   4. "avatars"            (public)
--   5. "certificates"       (private)
--   6. "media-library"      (private)

-- ============================================================
-- DONE: Schema creation complete!
-- ============================================================
-- Tables created:
-- ✅ profiles           ✅ courses            ✅ sections
-- ✅ lessons            ✅ enrollments        ✅ progress
-- ✅ orders             ✅ coupons            ✅ certificates
-- ✅ quiz_questions     ✅ quiz_attempts      ✅ blog_categories
-- ✅ blog_posts         ✅ community_posts    ✅ community_replies
-- ✅ community_votes    ✅ community_reports  ✅ community_rules
-- ✅ custom_pages       ✅ site_settings      ✅ notifications
-- ✅ lesson_notes       ✅ lesson_qa          ✅ course_reviews
-- ✅ email_templates    ✅ course_categories
-- Dashboard Views:
-- ✅ super_admin_dashboard  ✅ admin_dashboard
-- ✅ moderator_dashboard    ✅ student_dashboard (function)
-- ============================================================
