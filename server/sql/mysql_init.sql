CREATE DATABASE IF NOT EXISTS ai_fitness CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
USE ai_fitness;

SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS set_records;
DROP TABLE IF EXISTS session_exercises;
DROP TABLE IF EXISTS workout_sessions;
DROP TABLE IF EXISTS exercises;
DROP TABLE IF EXISTS user_goals;
DROP TABLE IF EXISTS user_settings;
DROP TABLE IF EXISTS user_profiles;
DROP TABLE IF EXISTS users;
SET FOREIGN_KEY_CHECKS = 1;

CREATE TABLE IF NOT EXISTS users (
  id CHAR(36) NOT NULL PRIMARY KEY DEFAULT (UUID()),
  email VARCHAR(320) NOT NULL,
  password_hash VARCHAR(255) NULL,
  auth_provider VARCHAR(32) NOT NULL DEFAULT 'email',
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  UNIQUE KEY uk_users_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS user_profiles (
  user_id CHAR(36) NOT NULL PRIMARY KEY,
  display_name VARCHAR(50) NULL,
  avatar_url VARCHAR(500) NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  CONSTRAINT fk_user_profiles_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS user_settings (
  user_id CHAR(36) NOT NULL PRIMARY KEY,
  default_rest_sec INT NOT NULL DEFAULT 90,
  step_sec INT NOT NULL DEFAULT 15,
  sound_enabled TINYINT(1) NOT NULL DEFAULT 1,
  vibration_enabled TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  CONSTRAINT chk_user_settings_rest CHECK (default_rest_sec BETWEEN 15 AND 600),
  CONSTRAINT chk_user_settings_step CHECK (step_sec BETWEEN 5 AND 120),
  CONSTRAINT fk_user_settings_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS user_goals (
  id CHAR(36) NOT NULL PRIMARY KEY DEFAULT (UUID()),
  user_id CHAR(36) NOT NULL,
  goal_type ENUM('chest', 'back', 'legs', 'shoulders', 'arms', 'core') NOT NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  started_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  ended_at DATETIME(3) NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  KEY idx_user_goals_user_created (user_id, created_at),
  CONSTRAINT fk_user_goals_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS exercises (
  id CHAR(36) NOT NULL PRIMARY KEY DEFAULT (UUID()),
  owner_user_id CHAR(36) NULL,
  name VARCHAR(100) NOT NULL,
  default_rest_sec INT NOT NULL DEFAULT 90,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  UNIQUE KEY uk_exercises_owner_name (owner_user_id, name),
  KEY idx_exercises_owner (owner_user_id),
  CONSTRAINT chk_exercises_rest CHECK (default_rest_sec BETWEEN 15 AND 600),
  CONSTRAINT fk_exercises_owner FOREIGN KEY (owner_user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS workout_sessions (
  id CHAR(36) NOT NULL PRIMARY KEY DEFAULT (UUID()),
  user_id CHAR(36) NOT NULL,
  focus_area VARCHAR(32) NULL,
  start_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  end_at DATETIME(3) NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  KEY idx_workout_sessions_user_start (user_id, start_at DESC),
  KEY idx_workout_sessions_user_end (user_id, end_at),
  CONSTRAINT fk_workout_sessions_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS session_exercises (
  id CHAR(36) NOT NULL PRIMARY KEY DEFAULT (UUID()),
  session_id CHAR(36) NOT NULL,
  exercise_id CHAR(36) NOT NULL,
  custom_name VARCHAR(100) NULL,
  target_sets INT NOT NULL DEFAULT 4,
  rest_sec_override INT NULL,
  sort_order INT NOT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  UNIQUE KEY uk_session_exercises_order (session_id, sort_order),
  KEY idx_session_exercises_session_order (session_id, sort_order),
  CONSTRAINT chk_session_exercises_target CHECK (target_sets BETWEEN 1 AND 30),
  CONSTRAINT chk_session_exercises_rest CHECK (rest_sec_override IS NULL OR rest_sec_override BETWEEN 15 AND 600),
  CONSTRAINT chk_session_exercises_sort CHECK (sort_order > 0),
  CONSTRAINT fk_session_exercises_session FOREIGN KEY (session_id) REFERENCES workout_sessions(id) ON DELETE CASCADE,
  CONSTRAINT fk_session_exercises_exercise FOREIGN KEY (exercise_id) REFERENCES exercises(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS set_records (
  id CHAR(36) NOT NULL PRIMARY KEY DEFAULT (UUID()),
  session_exercise_id CHAR(36) NOT NULL,
  set_index INT NOT NULL,
  weight DECIMAL(8, 2) NULL,
  reps INT NULL,
  rpe DECIMAL(3, 1) NULL,
  note TEXT NULL,
  set_end_at DATETIME(3) NULL,
  next_set_start_at DATETIME(3) NULL,
  rest_actual_sec INT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  UNIQUE KEY uk_set_records_index (session_exercise_id, set_index),
  KEY idx_set_records_session_exercise_rest (session_exercise_id, next_set_start_at),
  CONSTRAINT chk_set_records_set_index CHECK (set_index > 0),
  CONSTRAINT chk_set_records_weight CHECK (weight IS NULL OR (weight >= 0 AND weight <= 500)),
  CONSTRAINT chk_set_records_reps CHECK (reps IS NULL OR (reps >= 0 AND reps <= 100)),
  CONSTRAINT chk_set_records_rpe CHECK (rpe IS NULL OR (rpe >= 0 AND rpe <= 10)),
  CONSTRAINT chk_set_records_rest CHECK (rest_actual_sec IS NULL OR rest_actual_sec >= 0),
  CONSTRAINT fk_set_records_session_exercise FOREIGN KEY (session_exercise_id) REFERENCES session_exercises(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

INSERT INTO exercises (owner_user_id, name, default_rest_sec)
VALUES
  (NULL, 'Bench Press', 90),
  (NULL, 'Lat Pulldown', 90),
  (NULL, 'Squat', 120),
  (NULL, 'Deadlift', 150),
  (NULL, '杠铃卧推', 90),
  (NULL, '高位下拉', 90),
  (NULL, '深蹲', 120),
  (NULL, '哑铃推举', 90),
  (NULL, '杠铃弯举', 75),
  (NULL, '卷腹', 60)
ON DUPLICATE KEY UPDATE default_rest_sec = VALUES(default_rest_sec);
