-- Premier League Predictor Database Schema
-- PostgreSQL Schema for Supabase/Vercel Postgres

-- Teams table
CREATE TABLE teams (
  id INTEGER PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  code VARCHAR(10),
  country VARCHAR(100),
  founded INTEGER,
  national BOOLEAN DEFAULT FALSE,
  logo TEXT,
  venue_id INTEGER,
  venue_name VARCHAR(255),
  venue_capacity INTEGER,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Leagues table
CREATE TABLE leagues (
  id INTEGER PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  country VARCHAR(100),
  logo TEXT,
  flag TEXT,
  season INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Fixtures table
CREATE TABLE fixtures (
  id INTEGER PRIMARY KEY,
  referee VARCHAR(255),
  timezone VARCHAR(50),
  date TIMESTAMP NOT NULL,
  timestamp_unix BIGINT,
  status_long VARCHAR(50),
  status_short VARCHAR(10),
  status_elapsed INTEGER,
  league_id INTEGER REFERENCES leagues(id),
  season INTEGER NOT NULL,
  round VARCHAR(100),
  home_team_id INTEGER REFERENCES teams(id),
  away_team_id INTEGER REFERENCES teams(id),
  home_goals INTEGER,
  away_goals INTEGER,
  halftime_home_goals INTEGER,
  halftime_away_goals INTEGER,
  fulltime_home_goals INTEGER,
  fulltime_away_goals INTEGER,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Team Statistics table
CREATE TABLE team_statistics (
  id SERIAL PRIMARY KEY,
  team_id INTEGER REFERENCES teams(id),
  season INTEGER NOT NULL,
  league_id INTEGER REFERENCES leagues(id),
  played INTEGER DEFAULT 0,
  wins INTEGER DEFAULT 0,
  draws INTEGER DEFAULT 0,
  losses INTEGER DEFAULT 0,
  goals_for INTEGER DEFAULT 0,
  goals_against INTEGER DEFAULT 0,
  goal_difference INTEGER DEFAULT 0,
  points INTEGER DEFAULT 0,
  home_wins INTEGER DEFAULT 0,
  home_draws INTEGER DEFAULT 0,
  home_losses INTEGER DEFAULT 0,
  away_wins INTEGER DEFAULT 0,
  away_draws INTEGER DEFAULT 0,
  away_losses INTEGER DEFAULT 0,
  form VARCHAR(20),
  clean_sheets INTEGER DEFAULT 0,
  failed_to_score INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(team_id, season, league_id)
);

-- Standings table
CREATE TABLE standings (
  id SERIAL PRIMARY KEY,
  team_id INTEGER REFERENCES teams(id),
  league_id INTEGER REFERENCES leagues(id),
  season INTEGER NOT NULL,
  rank_position INTEGER NOT NULL,
  points INTEGER DEFAULT 0,
  goals_diff INTEGER DEFAULT 0,
  group_name VARCHAR(50),
  form VARCHAR(20),
  status VARCHAR(50),
  description TEXT,
  played INTEGER DEFAULT 0,
  win INTEGER DEFAULT 0,
  draw INTEGER DEFAULT 0,
  lose INTEGER DEFAULT 0,
  goals_for INTEGER DEFAULT 0,
  goals_against INTEGER DEFAULT 0,
  home_played INTEGER DEFAULT 0,
  home_win INTEGER DEFAULT 0,
  home_draw INTEGER DEFAULT 0,
  home_lose INTEGER DEFAULT 0,
  home_goals_for INTEGER DEFAULT 0,
  home_goals_against INTEGER DEFAULT 0,
  away_played INTEGER DEFAULT 0,
  away_win INTEGER DEFAULT 0,
  away_draw INTEGER DEFAULT 0,
  away_lose INTEGER DEFAULT 0,
  away_goals_for INTEGER DEFAULT 0,
  away_goals_against INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(team_id, league_id, season)
);

-- Predictions table
CREATE TABLE predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fixture_id INTEGER REFERENCES fixtures(id),
  home_team_id INTEGER REFERENCES teams(id),
  away_team_id INTEGER REFERENCES teams(id),
  prediction VARCHAR(20) NOT NULL CHECK (prediction IN ('HOME_WIN', 'DRAW', 'AWAY_WIN')),
  confidence DECIMAL(5,2) NOT NULL CHECK (confidence >= 0 AND confidence <= 100),
  algorithm_version VARCHAR(50) NOT NULL,
  home_form_score DECIMAL(5,2),
  away_form_score DECIMAL(5,2),
  head_to_head_score DECIMAL(5,2),
  home_advantage DECIMAL(5,2),
  goal_difference_factor DECIMAL(5,2),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Head to Head records table
CREATE TABLE head_to_head (
  id SERIAL PRIMARY KEY,
  team1_id INTEGER REFERENCES teams(id),
  team2_id INTEGER REFERENCES teams(id),
  fixture_id INTEGER REFERENCES fixtures(id),
  season INTEGER NOT NULL,
  result VARCHAR(20) CHECK (result IN ('TEAM1_WIN', 'DRAW', 'TEAM2_WIN')),
  team1_goals INTEGER,
  team2_goals INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);

-- API Request Logs table (to track API usage)
CREATE TABLE api_request_logs (
  id SERIAL PRIMARY KEY,
  endpoint VARCHAR(255) NOT NULL,
  parameters JSONB,
  response_status INTEGER,
  response_size INTEGER,
  request_timestamp TIMESTAMP DEFAULT NOW(),
  daily_count INTEGER DEFAULT 1
);

-- Indexes for better performance
CREATE INDEX idx_fixtures_date ON fixtures(date);
CREATE INDEX idx_fixtures_teams ON fixtures(home_team_id, away_team_id);
CREATE INDEX idx_fixtures_league_season ON fixtures(league_id, season);
CREATE INDEX idx_team_statistics_team_season ON team_statistics(team_id, season);
CREATE INDEX idx_standings_league_season ON standings(league_id, season);
CREATE INDEX idx_standings_rank ON standings(rank_position);
CREATE INDEX idx_predictions_fixture ON predictions(fixture_id);
CREATE INDEX idx_head_to_head_teams ON head_to_head(team1_id, team2_id);
CREATE INDEX idx_api_logs_date ON api_request_logs(request_timestamp);

-- Functions to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for auto-updating timestamps
CREATE TRIGGER update_teams_updated_at BEFORE UPDATE ON teams FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_leagues_updated_at BEFORE UPDATE ON leagues FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_fixtures_updated_at BEFORE UPDATE ON fixtures FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_team_statistics_updated_at BEFORE UPDATE ON team_statistics FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_standings_updated_at BEFORE UPDATE ON standings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_predictions_updated_at BEFORE UPDATE ON predictions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();