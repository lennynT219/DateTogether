-- Enable pgcrypto for gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Dates table
CREATE TABLE IF NOT EXISTS dates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT,
  description TEXT,
  category TEXT NOT NULL CHECK (category IN ('predefined', 'free')),
  order_index INTEGER NOT NULL UNIQUE,
  completed BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMPTZ,
  completed_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Memories table
CREATE TABLE IF NOT EXISTS memories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date_id UUID NOT NULL REFERENCES dates(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  location TEXT,
  note TEXT,
  created_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_dates_order_index ON dates(order_index);
CREATE INDEX IF NOT EXISTS idx_memories_date_id ON memories(date_id);

-- updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER dates_updated_at
  BEFORE UPDATE ON dates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();
