-- HealEasy Cohort Dashboard - Supabase Schema
-- Run this in your Supabase SQL editor

-- Batches table
CREATE TABLE batches (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL DEFAULT 'L1 10+2 Detox',
  start_date DATE NOT NULL,
  zoom_link TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Users table
CREATE TABLE users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT NOT NULL UNIQUE,
  dob DATE NOT NULL,
  batch_id UUID REFERENCES batches(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Daily content table (global, same across all batches)
CREATE TABLE daily_content (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  day_number INTEGER NOT NULL UNIQUE CHECK (day_number BETWEEN 1 AND 12),
  title TEXT NOT NULL DEFAULT '',
  notes_url TEXT,
  notes_filename TEXT,
  recording_url TEXT,
  recording_filename TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Initialize 12 days of content
INSERT INTO daily_content (day_number, title) VALUES
  (1, 'Day 1'),
  (2, 'Day 2'),
  (3, 'Day 3'),
  (4, 'Day 4'),
  (5, 'Day 5'),
  (6, 'Day 6'),
  (7, 'Day 7'),
  (8, 'Day 8'),
  (9, 'Day 9'),
  (10, 'Day 10'),
  (11, 'Bonus Day 1'),
  (12, 'Bonus Day 2');

-- Reviews table
CREATE TABLE reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  user_name TEXT NOT NULL,
  day_number INTEGER NOT NULL CHECK (day_number BETWEEN 1 AND 12),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- FAQs table
CREATE TABLE faqs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default FAQs
INSERT INTO faqs (question, answer, display_order) VALUES
  ('Where is the Zoom link for today''s session?', 'The Zoom link is available on your dashboard under "Today''s Session". Click "Join Now" to enter the session.', 1),
  ('How do I access previous day recordings?', 'Go to your dashboard and click on any unlocked day. Recordings become available once the day has passed.', 2),
  ('Can I access Day 5 content on Day 3?', 'Content unlocks automatically as you progress through the program. Future days are locked until their scheduled date.', 3),
  ('What is the session timing?', 'Please check your dashboard for today''s session timing shown alongside the Zoom link.', 4),
  ('I forgot my password. What do I do?', 'Your password is your Date of Birth in DD/MM/YYYY format. Contact support if you need further help.', 5),
  ('How long is each session?', 'Each session is approximately 60–90 minutes. Check your daily content for specific details.', 6);

-- Queries table
CREATE TABLE queries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  user_name TEXT NOT NULL,
  user_phone TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('Link', 'Diet', 'Technical', 'Other')),
  message TEXT NOT NULL,
  is_resolved BOOLEAN DEFAULT false,
  admin_notes TEXT,
  response_read BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Migration: Add columns to existing queries table
-- ALTER TABLE queries ADD COLUMN IF NOT EXISTS admin_notes TEXT;
-- ALTER TABLE queries ADD COLUMN IF NOT EXISTS response_read BOOLEAN DEFAULT true;

-- Announcements table
CREATE TABLE announcements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Content views tracking
CREATE TABLE content_views (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  day_number INTEGER NOT NULL CHECK (day_number BETWEEN 1 AND 12),
  viewed_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, day_number)
);

-- Daily wellness check-ins
CREATE TABLE daily_checkins (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  day_number INTEGER NOT NULL,
  mood INTEGER CHECK (mood BETWEEN 1 AND 5),
  energy INTEGER CHECK (energy BETWEEN 1 AND 5),
  diet_compliance TEXT CHECK (diet_compliance IN ('yes', 'partially', 'no')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, day_number)
);

-- Storage buckets (run these separately in Supabase dashboard or via API)
-- Create bucket: 'notes' for PDF uploads
-- Create bucket: 'recordings' for video uploads
-- Set both buckets to public for easy URL access

-- RLS Policies (disable RLS for simplicity in V0, use service role key server-side)
ALTER TABLE batches DISABLE ROW LEVEL SECURITY;
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE daily_content DISABLE ROW LEVEL SECURITY;
ALTER TABLE reviews DISABLE ROW LEVEL SECURITY;
ALTER TABLE faqs DISABLE ROW LEVEL SECURITY;
ALTER TABLE queries DISABLE ROW LEVEL SECURITY;
ALTER TABLE announcements DISABLE ROW LEVEL SECURITY;
ALTER TABLE content_views DISABLE ROW LEVEL SECURITY;
ALTER TABLE daily_checkins DISABLE ROW LEVEL SECURITY;
