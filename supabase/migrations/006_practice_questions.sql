-- Create practice_questions table to store practice questions
CREATE TABLE IF NOT EXISTS practice_questions (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  question TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('multiple_choice', 'text_input', 'numeric_input')),
  options JSONB, -- For multiple choice: [{"id": "a", "text": "Option A", "correct": true}, ...]
  correct_answer TEXT, -- For text/numeric input: the correct answer
  hint TEXT,
  solution TEXT NOT NULL,
  math_explanation TEXT, -- Step-by-step math explanation
  difficulty TEXT CHECK (difficulty IN ('easy', 'medium', 'hard')),
  tags TEXT[], -- Array of tags for categorization
  status TEXT NOT NULL CHECK (status IN ('draft', 'published')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_practice_questions_type ON practice_questions(type);
CREATE INDEX IF NOT EXISTS idx_practice_questions_status ON practice_questions(status);
CREATE INDEX IF NOT EXISTS idx_practice_questions_difficulty ON practice_questions(difficulty);
CREATE INDEX IF NOT EXISTS idx_practice_questions_tags ON practice_questions USING GIN(tags);

-- Enable RLS (Row Level Security)
ALTER TABLE practice_questions ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read published practice questions
CREATE POLICY "Anyone can read published practice questions"
  ON practice_questions
  FOR SELECT
  USING (status = 'published');

-- Policy: Only service role can manage practice questions
CREATE POLICY "Only service role can manage practice questions"
  ON practice_questions
  FOR ALL
  USING (false)
  WITH CHECK (false);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_practice_questions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update updated_at on row update
CREATE TRIGGER update_practice_questions_updated_at
  BEFORE UPDATE ON practice_questions
  FOR EACH ROW
  EXECUTE FUNCTION update_practice_questions_updated_at();
