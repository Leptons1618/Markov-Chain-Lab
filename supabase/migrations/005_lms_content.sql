-- Create courses table to store course data
CREATE TABLE IF NOT EXISTS courses (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  slug TEXT NOT NULL,
  lessons INTEGER DEFAULT 0,
  status TEXT NOT NULL CHECK (status IN ('draft', 'published')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create lessons table to store lesson data
CREATE TABLE IF NOT EXISTS lessons (
  id TEXT PRIMARY KEY,
  course_id TEXT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  content TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('draft', 'published')),
  "order" INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_courses_slug ON courses(slug);
CREATE INDEX IF NOT EXISTS idx_courses_status ON courses(status);
CREATE INDEX IF NOT EXISTS idx_lessons_course_id ON lessons(course_id);
CREATE INDEX IF NOT EXISTS idx_lessons_order ON lessons(course_id, "order");
CREATE INDEX IF NOT EXISTS idx_lessons_status ON lessons(status);

-- Enable RLS (Row Level Security)
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read courses and lessons (public content)
CREATE POLICY "Anyone can read courses"
  ON courses
  FOR SELECT
  USING (true);

CREATE POLICY "Anyone can read lessons"
  ON lessons
  FOR SELECT
  USING (true);

-- Policy: Only service role can manage courses and lessons
CREATE POLICY "Only service role can manage courses"
  ON courses
  FOR ALL
  USING (false)
  WITH CHECK (false);

CREATE POLICY "Only service role can manage lessons"
  ON lessons
  FOR ALL
  USING (false)
  WITH CHECK (false);

-- Function to automatically update updated_at timestamp for courses
CREATE OR REPLACE FUNCTION update_courses_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to automatically update updated_at timestamp for lessons
CREATE OR REPLACE FUNCTION update_lessons_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers to update updated_at on row update
CREATE TRIGGER update_courses_updated_at
  BEFORE UPDATE ON courses
  FOR EACH ROW
  EXECUTE FUNCTION update_courses_updated_at();

CREATE TRIGGER update_lessons_updated_at
  BEFORE UPDATE ON lessons
  FOR EACH ROW
  EXECUTE FUNCTION update_lessons_updated_at();

-- Function to update course lesson count
CREATE OR REPLACE FUNCTION update_course_lesson_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE courses
  SET lessons = (
    SELECT COUNT(*) FROM lessons WHERE course_id = COALESCE(NEW.course_id, OLD.course_id)
  )
  WHERE id = COALESCE(NEW.course_id, OLD.course_id);
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Triggers to update lesson count when lessons are added/removed
CREATE TRIGGER update_course_lesson_count_on_insert
  AFTER INSERT ON lessons
  FOR EACH ROW
  EXECUTE FUNCTION update_course_lesson_count();

CREATE TRIGGER update_course_lesson_count_on_delete
  AFTER DELETE ON lessons
  FOR EACH ROW
  EXECUTE FUNCTION update_course_lesson_count();
