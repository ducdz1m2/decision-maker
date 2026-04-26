-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  full_name TEXT,
  phone TEXT,
  address TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Factors table (30-50 predefined factors)
CREATE TABLE factors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  icon TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Decisions table
CREATE TABLE decisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Decision factors (selected factors for a decision with importance weights)
CREATE TABLE decision_factors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  decision_id UUID NOT NULL REFERENCES decisions(id) ON DELETE CASCADE,
  factor_id UUID NOT NULL REFERENCES factors(id) ON DELETE CASCADE,
  importance_weight DECIMAL(5,2) NOT NULL CHECK (importance_weight >= 0 AND importance_weight <= 100),
  UNIQUE(decision_id, factor_id)
);

-- Decision options (the choices being compared)
CREATE TABLE decision_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  decision_id UUID NOT NULL REFERENCES decisions(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Option scores (AHP comparison scores)
CREATE TABLE option_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  option_id UUID NOT NULL REFERENCES decision_options(id) ON DELETE CASCADE,
  factor_id UUID NOT NULL REFERENCES factors(id) ON DELETE CASCADE,
  score DECIMAL(5,2) NOT NULL CHECK (score >= 0),
  UNIQUE(option_id, factor_id)
);

-- Decision results (final calculated scores)
CREATE TABLE decision_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  decision_id UUID NOT NULL REFERENCES decisions(id) ON DELETE CASCADE,
  option_id UUID NOT NULL REFERENCES decision_options(id) ON DELETE CASCADE,
  final_score DECIMAL(10,4) NOT NULL,
  rank INTEGER NOT NULL,
  UNIQUE(decision_id, option_id)
);

-- Indexes for better performance
CREATE INDEX idx_decisions_user_id ON decisions(user_id);
CREATE INDEX idx_decision_factors_decision_id ON decision_factors(decision_id);
CREATE INDEX idx_decision_options_decision_id ON decision_options(decision_id);
CREATE INDEX idx_option_scores_option_id ON option_scores(option_id);
CREATE INDEX idx_decision_results_decision_id ON decision_results(decision_id);
