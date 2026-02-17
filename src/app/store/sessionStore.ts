import {create} from 'zustand';
import {createJSONStorage, persist} from 'zustand/middleware';

import {createId} from '../services/id';
import {mmkvJSONStorage} from '../services/storage';
import {Exercise, Session, SessionExercise, SetRecord, WorkoutSummary} from '../types/models';

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
  createSession: () => string;
  endActiveSession: () => void;
  addExerciseToActiveSession: (
    exerciseName: string,
    defaultRestSec: number,
    restSecOverride?: number,
    targetSets?: number,
  ) => string | null;
  completeSet: (input: CompleteSetInput) => SetRecord | null;
  startNextSet: (input: StartNextSetInput) => SetRecord | null;
  updateSetRecord: (input: UpdateSetRecordInput) => SetRecord | null;
  updateSessionExerciseName: (input: UpdateSessionExerciseNameInput) => void;
  updateSessionExerciseTargetSets: (input: UpdateSessionExerciseTargetSetsInput) => void;
}

const defaultExercises: Exercise[] = [
  {id: createId('exercise'), name: 'Bench Press', defaultRestSec: 90},
  {id: createId('exercise'), name: 'Lat Pulldown', defaultRestSec: 90},
  {id: createId('exercise'), name: 'Squat', defaultRestSec: 120},
  {id: createId('exercise'), name: 'Deadlift', defaultRestSec: 150},
];

const findSessionExercise = (
  sessions: Session[],
  sessionExerciseId: string,
): {sessionIndex: number; itemIndex: number} | null => {
  for (let sIndex = 0; sIndex < sessions.length; sIndex += 1) {
    const itemIndex = sessions[sIndex].items.findIndex(item => item.id === sessionExerciseId);
    if (itemIndex >= 0) {
      return {sessionIndex: sIndex, itemIndex};
    }
  }

  return null;
};

const normalizeTargetSets = (value?: number): number => {
  if (!Number.isFinite(value)) {
    return 4;
  }
  return Math.max(1, Math.min(30, Math.round(value as number)));
};

export const useSessionStore = create<SessionState>()(
  persist(
    (set, get) => ({
      exercises: defaultExercises,
      sessions: [],
      activeSessionId: null,
      createSession: () => {
        const id = createId('session');
        const session: Session = {
          id,
          startAt: new Date().toISOString(),
          items: [],
        };

        set(state => ({
          sessions: [session, ...state.sessions],
          activeSessionId: id,
        }));

        return id;
      },
      endActiveSession: () => {
        const activeSessionId = get().activeSessionId;
        if (!activeSessionId) {
          return;
        }

        const endAt = new Date().toISOString();

        set(state => ({
          activeSessionId: null,
          sessions: state.sessions.map(session =>
            session.id === activeSessionId ? {...session, endAt} : session,
          ),
        }));
      },
      addExerciseToActiveSession: (exerciseName, defaultRestSec, restSecOverride, targetSets) => {
        const activeSessionId = get().activeSessionId;
        if (!activeSessionId) {
          return null;
        }

        const normalized = exerciseName.trim();
        if (!normalized) {
          return null;
        }

        const existingExercise = get().exercises.find(
          ex => ex.name.toLowerCase() === normalized.toLowerCase(),
        );

        const exerciseId = existingExercise?.id ?? createId('exercise');
        const shouldInsertExercise = !existingExercise;

        const sessionExerciseId = createId('session_exercise');
        const newSessionExercise: SessionExercise = {
          id: sessionExerciseId,
          sessionId: activeSessionId,
          exerciseId,
          targetSets: normalizeTargetSets(targetSets),
          restSecOverride,
          sets: [],
        };

        set(state => ({
          exercises: shouldInsertExercise
            ? [
                ...state.exercises,
                {
                  id: exerciseId,
                  name: normalized,
                  defaultRestSec,
                },
              ]
            : state.exercises,
          sessions: state.sessions.map(session =>
            session.id === activeSessionId
              ? {...session, items: [...session.items, newSessionExercise]}
              : session,
          ),
        }));

        return sessionExerciseId;
      },
      completeSet: ({sessionExerciseId, weight, reps, rpe, note, endedAtMs}) => {
        const locate = findSessionExercise(get().sessions, sessionExerciseId);
        if (!locate) {
          return null;
        }

        const endedAt = new Date(endedAtMs ?? Date.now()).toISOString();
        let createdSet: SetRecord | null = null;

        set(state => {
          const nextSessions = [...state.sessions];
          const session = nextSessions[locate.sessionIndex];
          const item = session.items[locate.itemIndex];
          const setRecord: SetRecord = {
            id: createId('set'),
            index: item.sets.length + 1,
            weight,
            reps,
            rpe,
            note,
            setEndAt: endedAt,
          };
          createdSet = setRecord;

          const nextItem: SessionExercise = {
            ...item,
            sets: [...item.sets, setRecord],
          };

          const nextItems = [...session.items];
          nextItems[locate.itemIndex] = nextItem;
          nextSessions[locate.sessionIndex] = {...session, items: nextItems};

          return {sessions: nextSessions};
        });

        return createdSet;
      },
      startNextSet: ({sessionExerciseId, startedAtMs}) => {
        const locate = findSessionExercise(get().sessions, sessionExerciseId);
        if (!locate) {
          return null;
        }

        const startedAt = new Date(startedAtMs ?? Date.now()).toISOString();
        let updatedSet: SetRecord | null = null;

        set(state => {
          const nextSessions = [...state.sessions];
          const session = nextSessions[locate.sessionIndex];
          const item = session.items[locate.itemIndex];
          const targetSetIndex = [...item.sets]
            .reverse()
            .findIndex(setRecord => setRecord.setEndAt && !setRecord.nextSetStartAt);

          if (targetSetIndex < 0) {
            return state;
          }

          const actualIndex = item.sets.length - 1 - targetSetIndex;
          const existingSet = item.sets[actualIndex];
          const endMs = existingSet.setEndAt ? new Date(existingSet.setEndAt).getTime() : 0;
          const startMs = new Date(startedAt).getTime();

          const patched: SetRecord = {
            ...existingSet,
            nextSetStartAt: startedAt,
            restActualSec: Math.max(0, Math.round((startMs - endMs) / 1000)),
          };
          updatedSet = patched;

          const nextSets = [...item.sets];
          nextSets[actualIndex] = patched;

          const nextItems = [...session.items];
          nextItems[locate.itemIndex] = {
            ...item,
            sets: nextSets,
          };

          nextSessions[locate.sessionIndex] = {
            ...session,
            items: nextItems,
          };

          return {sessions: nextSessions};
        });

        return updatedSet;
      },
      updateSetRecord: ({sessionExerciseId, setId, weight, reps, rpe, note}) => {
        const locate = findSessionExercise(get().sessions, sessionExerciseId);
        if (!locate) {
          return null;
        }

        let updatedSet: SetRecord | null = null;

        set(state => {
          const nextSessions = [...state.sessions];
          const session = nextSessions[locate.sessionIndex];
          const item = session.items[locate.itemIndex];
          const setIndex = item.sets.findIndex(setRecord => setRecord.id === setId);

          if (setIndex < 0) {
            return state;
          }

          const target = item.sets[setIndex];
          const patched: SetRecord = {
            ...target,
            weight,
            reps,
            rpe,
            note,
          };
          updatedSet = patched;

          const nextSets = [...item.sets];
          nextSets[setIndex] = patched;

          const nextItems = [...session.items];
          nextItems[locate.itemIndex] = {
            ...item,
            sets: nextSets,
          };

          nextSessions[locate.sessionIndex] = {
            ...session,
            items: nextItems,
          };

          return {sessions: nextSessions};
        });

        return updatedSet;
      },
      updateSessionExerciseName: ({sessionExerciseId, customName}) => {
        const locate = findSessionExercise(get().sessions, sessionExerciseId);
        if (!locate) {
          return;
        }

        set(state => {
          const nextSessions = [...state.sessions];
          const session = nextSessions[locate.sessionIndex];
          const item = session.items[locate.itemIndex];

          const nextItem: SessionExercise = {
            ...item,
            customName,
          };

          const nextItems = [...session.items];
          nextItems[locate.itemIndex] = nextItem;

          nextSessions[locate.sessionIndex] = {
            ...session,
            items: nextItems,
          };

          return {sessions: nextSessions};
        });
      },
      updateSessionExerciseTargetSets: ({sessionExerciseId, targetSets}) => {
        const locate = findSessionExercise(get().sessions, sessionExerciseId);
        if (!locate) {
          return;
        }

        set(state => {
          const nextSessions = [...state.sessions];
          const session = nextSessions[locate.sessionIndex];
          const item = session.items[locate.itemIndex];

          const nextItem: SessionExercise = {
            ...item,
            targetSets: normalizeTargetSets(targetSets),
          };

          const nextItems = [...session.items];
          nextItems[locate.itemIndex] = nextItem;

          nextSessions[locate.sessionIndex] = {
            ...session,
            items: nextItems,
          };

          return {sessions: nextSessions};
        });
      },
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
