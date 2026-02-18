CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE OR REPLACE FUNCTION touch_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(320) NOT NULL UNIQUE,
  password_hash VARCHAR(255),
  auth_provider VARCHAR(32) NOT NULL DEFAULT 'email',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_profiles (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  display_name VARCHAR(50),
  avatar_url VARCHAR(500),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_settings (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  default_rest_sec INT NOT NULL DEFAULT 90 CHECK (default_rest_sec BETWEEN 15 AND 600),
  step_sec INT NOT NULL DEFAULT 15 CHECK (step_sec BETWEEN 5 AND 120),
  sound_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  vibration_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  goal_type VARCHAR(32) NOT NULL CHECK (goal_type IN ('chest', 'back', 'legs', 'shoulders', 'arms', 'core')),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  default_rest_sec INT NOT NULL DEFAULT 90 CHECK (default_rest_sec BETWEEN 15 AND 600),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS workout_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  focus_area VARCHAR(32),
  start_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  end_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS session_exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES workout_sessions(id) ON DELETE CASCADE,
  exercise_id UUID NOT NULL REFERENCES exercises(id) ON DELETE RESTRICT,
  custom_name VARCHAR(100),
  target_sets INT NOT NULL DEFAULT 4 CHECK (target_sets BETWEEN 1 AND 30),
  rest_sec_override INT CHECK (rest_sec_override BETWEEN 15 AND 600),
  sort_order INT NOT NULL CHECK (sort_order > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (session_id, sort_order)
);

CREATE TABLE IF NOT EXISTS set_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_exercise_id UUID NOT NULL REFERENCES session_exercises(id) ON DELETE CASCADE,
  set_index INT NOT NULL CHECK (set_index > 0),
  weight NUMERIC(8, 2) CHECK (weight >= 0 AND weight <= 500),
  reps INT CHECK (reps >= 0 AND reps <= 100),
  rpe NUMERIC(3, 1) CHECK (rpe >= 0 AND rpe <= 10),
  note TEXT,
  set_end_at TIMESTAMPTZ,
  next_set_start_at TIMESTAMPTZ,
  rest_actual_sec INT CHECK (rest_actual_sec >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (session_exercise_id, set_index)
);

CREATE UNIQUE INDEX IF NOT EXISTS ux_user_goals_one_active
  ON user_goals (user_id)
  WHERE is_active = TRUE;

CREATE UNIQUE INDEX IF NOT EXISTS ux_exercises_system_name
  ON exercises (LOWER(name))
  WHERE owner_user_id IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS ux_exercises_owner_name
  ON exercises (owner_user_id, LOWER(name))
  WHERE owner_user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_workout_sessions_user_start
  ON workout_sessions (user_id, start_at DESC);

CREATE INDEX IF NOT EXISTS idx_workout_sessions_user_end
  ON workout_sessions (user_id, end_at);

CREATE INDEX IF NOT EXISTS idx_session_exercises_session_order
  ON session_exercises (session_id, sort_order);

CREATE INDEX IF NOT EXISTS idx_set_records_session_exercise_index
  ON set_records (session_exercise_id, set_index);

CREATE INDEX IF NOT EXISTS idx_set_records_session_exercise_rest
  ON set_records (session_exercise_id, next_set_start_at);

DROP TRIGGER IF EXISTS trg_users_updated_at ON users;
CREATE TRIGGER trg_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

DROP TRIGGER IF EXISTS trg_user_profiles_updated_at ON user_profiles;
CREATE TRIGGER trg_user_profiles_updated_at
BEFORE UPDATE ON user_profiles
FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

DROP TRIGGER IF EXISTS trg_user_settings_updated_at ON user_settings;
CREATE TRIGGER trg_user_settings_updated_at
BEFORE UPDATE ON user_settings
FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

DROP TRIGGER IF EXISTS trg_user_goals_updated_at ON user_goals;
CREATE TRIGGER trg_user_goals_updated_at
BEFORE UPDATE ON user_goals
FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

DROP TRIGGER IF EXISTS trg_exercises_updated_at ON exercises;
CREATE TRIGGER trg_exercises_updated_at
BEFORE UPDATE ON exercises
FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

DROP TRIGGER IF EXISTS trg_workout_sessions_updated_at ON workout_sessions;
CREATE TRIGGER trg_workout_sessions_updated_at
BEFORE UPDATE ON workout_sessions
FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

DROP TRIGGER IF EXISTS trg_session_exercises_updated_at ON session_exercises;
CREATE TRIGGER trg_session_exercises_updated_at
BEFORE UPDATE ON session_exercises
FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

DROP TRIGGER IF EXISTS trg_set_records_updated_at ON set_records;
CREATE TRIGGER trg_set_records_updated_at
BEFORE UPDATE ON set_records
FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

WITH defaults(name, default_rest_sec) AS (
  VALUES
    ('Bench Press', 90),
    ('Lat Pulldown', 90),
    ('Squat', 120),
    ('Deadlift', 150),
    ('杠铃卧推', 90),
    ('高位下拉', 90),
    ('深蹲', 120),
    ('哑铃推举', 90),
    ('杠铃弯举', 75),
    ('卷腹', 60)
)
INSERT INTO exercises (owner_user_id, name, default_rest_sec)
SELECT NULL, d.name, d.default_rest_sec
FROM defaults d
WHERE NOT EXISTS (
  SELECT 1 FROM exercises e
  WHERE e.owner_user_id IS NULL AND LOWER(e.name) = LOWER(d.name)
);
