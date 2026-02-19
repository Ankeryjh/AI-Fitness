import {create} from 'zustand';
import {createJSONStorage, persist} from 'zustand/middleware';

import {
  BackendSession,
  BackendSessionExercise,
  BackendSetRecord,
  addExerciseToSession,
  createSessionExerciseSet,
  createWorkoutSession,
  endWorkoutSession,
  listWorkoutSessions,
  patchSessionExercise,
  patchSetRecord,
  startNextSetForSessionExercise,
} from '../services/sessionApi';
import {mmkvJSONStorage} from '../services/storage';
import {Exercise, Session, SessionExercise, SetRecord, WorkoutSummary} from '../types/models';
import {useOnboardingStore} from './onboardingStore';

interface CompleteSetInput {
  sessionExerciseId: string;
  weight?: number;
  reps?: number;
  rpe?: number;
  note?: string;
  endedAtMs?: number;
}

interface StartNextSetInput {
  sessionExerciseId: string;
  startedAtMs?: number;
}

interface UpdateSetRecordInput {
  sessionExerciseId: string;
  setId: string;
  weight?: number;
  reps?: number;
  rpe?: number;
  note?: string;
}

interface UpdateSessionExerciseNameInput {
  sessionExerciseId: string;
  customName: string;
}

interface UpdateSessionExerciseTargetSetsInput {
  sessionExerciseId: string;
  targetSets: number;
}

interface SessionState {
  exercises: Exercise[];
  sessions: Session[];
  activeSessionId: string | null;
  isSyncing: boolean;
  syncSessionsFromServer: (limit?: number) => Promise<void>;
  createSession: (focusArea?: string) => Promise<string>;
  endActiveSession: () => Promise<void>;
  addExerciseToActiveSession: (
    exerciseName: string,
    defaultRestSec: number,
    restSecOverride?: number,
    targetSets?: number,
  ) => Promise<string | null>;
  completeSet: (input: CompleteSetInput) => Promise<SetRecord | null>;
  startNextSet: (input: StartNextSetInput) => Promise<SetRecord | null>;
  updateSetRecord: (input: UpdateSetRecordInput) => Promise<SetRecord | null>;
  updateSessionExerciseName: (input: UpdateSessionExerciseNameInput) => Promise<void>;
  updateSessionExerciseTargetSets: (input: UpdateSessionExerciseTargetSetsInput) => Promise<void>;
  clearAll: () => void;
}

const defaultExercises: Exercise[] = [
  {id: 'preset_bench_press', name: 'Bench Press', defaultRestSec: 90},
  {id: 'preset_lat_pulldown', name: 'Lat Pulldown', defaultRestSec: 90},
  {id: 'preset_squat', name: 'Squat', defaultRestSec: 120},
  {id: 'preset_deadlift', name: 'Deadlift', defaultRestSec: 150},
];

const normalizeTargetSets = (value?: number): number => {
  if (!Number.isFinite(value)) {
    return 4;
  }
  return Math.max(1, Math.min(30, Math.round(value as number)));
};

const toOptional = <T>(value: T | null | undefined): T | undefined =>
  value === null || value === undefined ? undefined : value;

const getAuthTokenOrThrow = (): string => {
  const token = useOnboardingStore.getState().authToken;
  if (!token) {
    throw new Error('Missing auth token. Please login again.');
  }
  return token;
};

const mapBackendSetRecord = (record: BackendSetRecord): SetRecord => ({
  id: record.id,
  index: record.index,
  weight: toOptional(record.weight),
  reps: toOptional(record.reps),
  rpe: toOptional(record.rpe),
  note: toOptional(record.note),
  setEndAt: toOptional(record.setEndAt),
  nextSetStartAt: toOptional(record.nextSetStartAt),
  restActualSec: toOptional(record.restActualSec),
});

const mapBackendSessionExercise = (
  item: BackendSessionExercise,
): {item: SessionExercise; exercise: Exercise} => ({
  item: {
    id: item.id,
    sessionId: item.sessionId,
    exerciseId: item.exerciseId,
    customName: toOptional(item.customName),
    targetSets: toOptional(item.targetSets),
    restSecOverride: toOptional(item.restSecOverride),
    sets: item.sets.map(mapBackendSetRecord),
  },
  exercise: {
    id: item.exerciseId,
    name: item.exerciseName,
    defaultRestSec: item.defaultRestSec,
  },
});

const mapBackendSession = (
  backendSession: BackendSession,
): {session: Session; exercises: Exercise[]} => {
  const mappedItems = backendSession.items.map(mapBackendSessionExercise);

  return {
    session: {
      id: backendSession.id,
      startAt: backendSession.startAt,
      endAt: toOptional(backendSession.endAt),
      focusArea: toOptional(backendSession.focusArea),
      items: mappedItems.map(entry => entry.item),
    },
    exercises: mappedItems.map(entry => entry.exercise),
  };
};

const mergeExercises = (base: Exercise[], incoming: Exercise[]): Exercise[] => {
  const map = new Map<string, Exercise>();

  for (const exercise of base) {
    map.set(exercise.id, exercise);
  }
  for (const exercise of incoming) {
    map.set(exercise.id, exercise);
  }

  return Array.from(map.values());
};

const applySetRecordPatch = (
  sessions: Session[],
  sessionExerciseId: string,
  setRecord: SetRecord,
): Session[] =>
  sessions.map(session => ({
    ...session,
    items: session.items.map(item => {
      if (item.id !== sessionExerciseId) {
        return item;
      }

      const existingSetIndex = item.sets.findIndex(entry => entry.id === setRecord.id);
      const nextSets = [...item.sets];

      if (existingSetIndex >= 0) {
        nextSets[existingSetIndex] = setRecord;
      } else {
        nextSets.push(setRecord);
      }

      nextSets.sort((a, b) => a.index - b.index);
      return {
        ...item,
        sets: nextSets,
      };
    }),
  }));

const applySessionExercisePatch = (
  sessions: Session[],
  sessionExerciseId: string,
  patch: Partial<SessionExercise>,
): Session[] =>
  sessions.map(session => ({
    ...session,
    items: session.items.map(item =>
      item.id === sessionExerciseId
        ? {
            ...item,
            ...patch,
          }
        : item,
    ),
  }));

export const useSessionStore = create<SessionState>()(
  persist(
    (set, get) => ({
      exercises: defaultExercises,
      sessions: [],
      activeSessionId: null,
      isSyncing: false,
      syncSessionsFromServer: async (limit = 50) => {
        const token = getAuthTokenOrThrow();

        set({isSyncing: true});
        try {
          const result = await listWorkoutSessions(token, {limit});
          const mapped = result.list.map(mapBackendSession);
          const sessions = mapped.map(entry => entry.session);
          const exerciseList = mapped.flatMap(entry => entry.exercises);
          const nextExercises =
            exerciseList.length > 0
              ? mergeExercises(defaultExercises, exerciseList)
              : get().exercises.length > 0
                ? get().exercises
                : defaultExercises;

          const previousActive = get().activeSessionId;
          const nextActive =
            previousActive && sessions.some(session => session.id === previousActive && !session.endAt)
              ? previousActive
              : sessions.find(session => !session.endAt)?.id ?? null;

          set({
            sessions,
            exercises: nextExercises,
            activeSessionId: nextActive,
          });
        } finally {
          set({isSyncing: false});
        }
      },
      createSession: async focusArea => {
        const token = getAuthTokenOrThrow();
        const created = await createWorkoutSession(token, {
          focusArea: focusArea?.trim() || undefined,
        });

        const mapped = mapBackendSession(created);

        set(state => ({
          sessions: [mapped.session, ...state.sessions.filter(session => session.id !== mapped.session.id)],
          exercises: mergeExercises(state.exercises, mapped.exercises),
          activeSessionId: mapped.session.id,
        }));

        return mapped.session.id;
      },
      endActiveSession: async () => {
        const activeSessionId = get().activeSessionId;
        if (!activeSessionId) {
          return;
        }

        const token = getAuthTokenOrThrow();
        const ended = await endWorkoutSession(token, activeSessionId);

        set(state => ({
          activeSessionId: null,
          sessions: state.sessions.map(session =>
            session.id === ended.id
              ? {
                  ...session,
                  endAt: toOptional(ended.endAt),
                }
              : session,
          ),
        }));
      },
      addExerciseToActiveSession: async (exerciseName, defaultRestSec, restSecOverride, targetSets) => {
        const activeSessionId = get().activeSessionId;
        if (!activeSessionId) {
          return null;
        }

        const normalizedName = exerciseName.trim();
        if (!normalizedName) {
          return null;
        }

        const token = getAuthTokenOrThrow();
        const created = await addExerciseToSession(token, activeSessionId, {
          exerciseName: normalizedName,
          defaultRestSec,
          restSecOverride: restSecOverride ?? null,
          targetSets: normalizeTargetSets(targetSets),
        });

        const mapped = mapBackendSessionExercise(created);

        set(state => ({
          exercises: mergeExercises(state.exercises, [mapped.exercise]),
          sessions: state.sessions.map(session => {
            if (session.id !== activeSessionId) {
              return session;
            }

            const exists = session.items.some(item => item.id === mapped.item.id);
            return {
              ...session,
              items: exists
                ? session.items.map(item => (item.id === mapped.item.id ? mapped.item : item))
                : [...session.items, mapped.item],
            };
          }),
        }));

        return mapped.item.id;
      },
      completeSet: async ({sessionExerciseId, weight, reps, rpe, note, endedAtMs}) => {
        const token = getAuthTokenOrThrow();
        const created = await createSessionExerciseSet(token, sessionExerciseId, {
          weight: weight ?? null,
          reps: reps ?? null,
          rpe: rpe ?? null,
          note: note ?? null,
          endedAt: new Date(endedAtMs ?? Date.now()).toISOString(),
        });

        const mappedSet = mapBackendSetRecord(created);

        set(state => ({
          sessions: applySetRecordPatch(state.sessions, sessionExerciseId, mappedSet),
        }));

        return mappedSet;
      },
      startNextSet: async ({sessionExerciseId, startedAtMs}) => {
        const token = getAuthTokenOrThrow();
        const updated = await startNextSetForSessionExercise(token, sessionExerciseId, {
          startedAt: new Date(startedAtMs ?? Date.now()).toISOString(),
        });

        const mappedSet = mapBackendSetRecord(updated);

        set(state => ({
          sessions: applySetRecordPatch(state.sessions, sessionExerciseId, mappedSet),
        }));

        return mappedSet;
      },
      updateSetRecord: async ({sessionExerciseId, setId, weight, reps, rpe, note}) => {
        const payload: {
          weight?: number | null;
          reps?: number | null;
          rpe?: number | null;
          note?: string | null;
        } = {};

        if (weight !== undefined) {
          payload.weight = weight;
        }
        if (reps !== undefined) {
          payload.reps = reps;
        }
        if (rpe !== undefined) {
          payload.rpe = rpe;
        }
        if (note !== undefined) {
          payload.note = note;
        }

        if (Object.keys(payload).length === 0) {
          return null;
        }

        const token = getAuthTokenOrThrow();
        const updated = await patchSetRecord(token, setId, payload);
        const mappedSet = mapBackendSetRecord(updated);

        set(state => ({
          sessions: applySetRecordPatch(state.sessions, sessionExerciseId, mappedSet),
        }));

        return mappedSet;
      },
      updateSessionExerciseName: async ({sessionExerciseId, customName}) => {
        const normalizedName = customName.trim();
        if (!normalizedName) {
          return;
        }

        const token = getAuthTokenOrThrow();
        const updated = await patchSessionExercise(token, sessionExerciseId, {
          customName: normalizedName,
        });

        set(state => ({
          sessions: applySessionExercisePatch(state.sessions, sessionExerciseId, {
            customName: toOptional(updated.customName),
          }),
        }));
      },
      updateSessionExerciseTargetSets: async ({sessionExerciseId, targetSets}) => {
        const token = getAuthTokenOrThrow();
        const normalizedTargetSets = normalizeTargetSets(targetSets);
        const updated = await patchSessionExercise(token, sessionExerciseId, {
          targetSets: normalizedTargetSets,
        });

        set(state => ({
          sessions: applySessionExercisePatch(state.sessions, sessionExerciseId, {
            targetSets: toOptional(updated.targetSets),
          }),
        }));
      },
      clearAll: () =>
        set({
          exercises: defaultExercises,
          sessions: [],
          activeSessionId: null,
        }),
    }),
    {
      name: 'session-store',
      storage: createJSONStorage(() => mmkvJSONStorage),
    },
  ),
);

export interface SessionExerciseSnapshot {
  session: Session;
  item: SessionExercise;
  exercise: Exercise | undefined;
}

export const getSessionExerciseSnapshot = (
  sessionExerciseId: string,
): SessionExerciseSnapshot | null => {
  const {sessions, exercises} = useSessionStore.getState();

  for (const session of sessions) {
    const item = session.items.find(sessionItem => sessionItem.id === sessionExerciseId);
    if (!item) {
      continue;
    }

    return {
      session,
      item,
      exercise: exercises.find(ex => ex.id === item.exerciseId),
    };
  }

  return null;
};

export const getSessionById = (sessionId: string): Session | undefined =>
  useSessionStore.getState().sessions.find(session => session.id === sessionId);

export const getWorkoutSummary = (session: Session): WorkoutSummary => {
  const startMs = new Date(session.startAt).getTime();
  const endMs = new Date(session.endAt ?? new Date().toISOString()).getTime();

  const allSets = session.items.flatMap(item => item.sets);
  const rests = allSets
    .map(setRecord => setRecord.restActualSec)
    .filter((value): value is number => typeof value === 'number');

  const averageRestSec =
    rests.length > 0
      ? Math.round(rests.reduce((sum, current) => sum + current, 0) / rests.length)
      : 0;

  return {
    totalDurationSec: Math.max(0, Math.round((endMs - startMs) / 1000)),
    totalSets: allSets.length,
    averageRestSec,
  };
};
