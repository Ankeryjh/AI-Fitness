import {apiRequest} from './api';

export interface BackendSetRecord {
  id: string;
  sessionExerciseId: string;
  index: number;
  weight: number | null;
  reps: number | null;
  rpe: number | null;
  note: string | null;
  setEndAt: string | null;
  nextSetStartAt: string | null;
  restActualSec: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface BackendSessionExercise {
  id: string;
  sessionId: string;
  exerciseId: string;
  exerciseName: string;
  defaultRestSec: number;
  customName: string | null;
  targetSets: number;
  restSecOverride: number | null;
  sortOrder: number;
  sets: BackendSetRecord[];
}

export interface BackendSession {
  id: string;
  userId: string;
  focusArea: string | null;
  startAt: string;
  endAt: string | null;
  createdAt: string;
  updatedAt: string;
  items: BackendSessionExercise[];
}

export interface ListSessionsResult {
  list: BackendSession[];
  nextCursor: string | null;
}

export interface AddSessionExerciseInput {
  exerciseName: string;
  defaultRestSec: number;
  restSecOverride?: number | null;
  targetSets?: number;
  customName?: string;
}

export interface PatchSessionExerciseInput {
  customName?: string;
  targetSets?: number;
}

export interface CreateSetInput {
  weight?: number | null;
  reps?: number | null;
  rpe?: number | null;
  note?: string | null;
  endedAt?: string;
}

export interface StartNextSetInput {
  startedAt?: string;
}

export interface PatchSetRecordInput {
  weight?: number | null;
  reps?: number | null;
  rpe?: number | null;
  note?: string | null;
}

const encode = (value: string): string => encodeURIComponent(value);

export const createWorkoutSession = async (
  token: string,
  payload: {focusArea?: string},
): Promise<BackendSession> =>
  apiRequest('/sessions', {
    method: 'POST',
    token,
    body: payload,
  });

export const endWorkoutSession = async (token: string, sessionId: string): Promise<BackendSession> =>
  apiRequest(`/sessions/${encode(sessionId)}/end`, {
    method: 'POST',
    token,
  });

export const listWorkoutSessions = async (
  token: string,
  query?: {cursor?: string; limit?: number},
): Promise<ListSessionsResult> => {
  const params: string[] = [];
  if (query?.cursor) {
    params.push(`cursor=${encodeURIComponent(query.cursor)}`);
  }
  if (typeof query?.limit === 'number') {
    params.push(`limit=${encodeURIComponent(String(query.limit))}`);
  }

  const suffix = params.length > 0 ? `?${params.join('&')}` : '';
  return apiRequest(`/sessions${suffix}`, {
    method: 'GET',
    token,
  });
};

export const getWorkoutSessionById = async (
  token: string,
  sessionId: string,
): Promise<BackendSession> =>
  apiRequest(`/sessions/${encode(sessionId)}`, {
    method: 'GET',
    token,
  });

export const addExerciseToSession = async (
  token: string,
  sessionId: string,
  payload: AddSessionExerciseInput,
): Promise<BackendSessionExercise> =>
  apiRequest(`/sessions/${encode(sessionId)}/exercises`, {
    method: 'POST',
    token,
    body: payload,
  });

export const patchSessionExercise = async (
  token: string,
  sessionExerciseId: string,
  payload: PatchSessionExerciseInput,
): Promise<Omit<BackendSessionExercise, 'exerciseName' | 'defaultRestSec' | 'sets'>> =>
  apiRequest(`/session-exercises/${encode(sessionExerciseId)}`, {
    method: 'PATCH',
    token,
    body: payload,
  });

export const createSessionExerciseSet = async (
  token: string,
  sessionExerciseId: string,
  payload: CreateSetInput,
): Promise<BackendSetRecord> =>
  apiRequest(`/session-exercises/${encode(sessionExerciseId)}/sets`, {
    method: 'POST',
    token,
    body: payload,
  });

export const startNextSetForSessionExercise = async (
  token: string,
  sessionExerciseId: string,
  payload: StartNextSetInput,
): Promise<BackendSetRecord> =>
  apiRequest(`/session-exercises/${encode(sessionExerciseId)}/start-next-set`, {
    method: 'POST',
    token,
    body: payload,
  });

export const patchSetRecord = async (
  token: string,
  setId: string,
  payload: PatchSetRecordInput,
): Promise<BackendSetRecord> =>
  apiRequest(`/set-records/${encode(setId)}`, {
    method: 'PATCH',
    token,
    body: payload,
  });
