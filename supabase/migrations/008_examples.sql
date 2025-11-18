-- Create examples table to store example Markov chains
CREATE TABLE IF NOT EXISTS examples (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('classic', 'modern')),
  difficulty TEXT NOT NULL CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
  applications TEXT[], -- Array of application areas
  interactive_demo BOOLEAN DEFAULT false,
  design JSONB NOT NULL, -- Stores states and transitions
  explanation TEXT,
  lesson_connections JSONB, -- Array of lesson connection objects
  mathematical_details JSONB, -- Transition matrix, stationary distribution, key insights
  real_world_context TEXT,
  practice_questions TEXT[], -- Array of practice question strings
  status TEXT NOT NULL CHECK (status IN ('draft', 'published')) DEFAULT 'published',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_examples_category ON examples(category);
CREATE INDEX IF NOT EXISTS idx_examples_difficulty ON examples(difficulty);
CREATE INDEX IF NOT EXISTS idx_examples_status ON examples(status);
CREATE INDEX IF NOT EXISTS idx_examples_applications ON examples USING GIN(applications);

-- Enable RLS (Row Level Security)
ALTER TABLE examples ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read published examples
CREATE POLICY "Anyone can read published examples"
  ON examples
  FOR SELECT
  USING (status = 'published');

-- Policy: Only service role can manage examples
CREATE POLICY "Only service role can manage examples"
  ON examples
  FOR ALL
  USING (false)
  WITH CHECK (false);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_examples_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update updated_at on row update
CREATE TRIGGER update_examples_updated_at
  BEFORE UPDATE ON examples
  FOR EACH ROW
  EXECUTE FUNCTION update_examples_updated_at();
