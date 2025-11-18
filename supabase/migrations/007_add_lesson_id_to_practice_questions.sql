-- Add lesson_id column to practice_questions table
ALTER TABLE practice_questions
ADD COLUMN IF NOT EXISTS lesson_id TEXT REFERENCES lessons(id) ON DELETE SET NULL;

-- Create index for faster lookups by lesson
CREATE INDEX IF NOT EXISTS idx_practice_questions_lesson_id ON practice_questions(lesson_id);

-- Update RLS policy to allow reading questions by lesson
-- (The existing policy already allows reading published questions)
