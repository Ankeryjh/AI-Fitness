export type RestState = 'IDLE' | 'RESTING' | 'PAUSED' | 'DONE';

export interface Exercise {
  id: string;
  name: string;
  defaultRestSec: number;
}

export interface SetRecord {
  id: string;
  index: number;
  weight?: number;
  reps?: number;
  rpe?: number;
  note?: string;
  setEndAt?: string;
  nextSetStartAt?: string;
  restActualSec?: number;
}

export interface SessionExercise {
  id: string;
  sessionId: string;
  exerciseId: string;
  restSecOverride?: number;
  sets: SetRecord[];
}

export interface Session {
  id: string;
  startAt: string;
  endAt?: string;
  items: SessionExercise[];
}

export interface WorkoutSummary {
  totalDurationSec: number;
  totalSets: number;
  averageRestSec: number;
}
