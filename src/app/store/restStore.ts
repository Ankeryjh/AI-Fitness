import {create} from 'zustand';

import {
  cancelRestNotification,
  scheduleRestDoneNotification,
} from '../services/notifications';
import {RestState} from '../types/models';

interface StartRestInput {
  durationSec: number;
  sessionExerciseId: string;
  exerciseName: string;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
}

interface NotificationMeta {
  exerciseName: string;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
}

interface RestTimerState {
  restState: RestState;
  restDurationSec: number;
  restStartAtMs: number | null;
  restTargetAtMs: number | null;
  pauseAccumulatedMs: number;
  pausedAtMs: number | null;
  notificationId: string | null;
  notificationMeta: NotificationMeta | null;
  activeSessionExerciseId: string | null;
  startRest: (input: StartRestInput) => Promise<void>;
  pauseRest: () => Promise<void>;
  resumeRest: () => Promise<void>;
  addTime: (stepSec: number) => Promise<void>;
  markDoneIfNeeded: (nowMs?: number) => void;
  getRemainingMs: (nowMs?: number) => number;
  resetToIdle: () => Promise<void>;
}

const resolveNow = (state: RestTimerState, nowMs?: number): number => {
  if (typeof nowMs === 'number') {
    return nowMs;
  }

  if (state.restState === 'PAUSED') {
    return state.pausedAtMs ?? Date.now();
  }

  return Date.now();
};

export const useRestStore = create<RestTimerState>((set, get) => ({
  restState: 'IDLE',
  restDurationSec: 90,
  restStartAtMs: null,
  restTargetAtMs: null,
  pauseAccumulatedMs: 0,
  pausedAtMs: null,
  notificationId: null,
  notificationMeta: null,
  activeSessionExerciseId: null,
  startRest: async ({
    durationSec,
    sessionExerciseId,
    exerciseName,
    soundEnabled,
    vibrationEnabled,
  }) => {
    const existingId = get().notificationId;
    if (existingId) {
      await cancelRestNotification(existingId);
    }

    const now = Date.now();
    const restTargetAtMs = now + durationSec * 1000;

    const notificationId = await scheduleRestDoneNotification({
      targetAtMs: restTargetAtMs,
      exerciseName,
      soundEnabled,
      vibrationEnabled,
    });

    set({
      restState: 'RESTING',
      restDurationSec: durationSec,
      restStartAtMs: now,
      restTargetAtMs,
      pauseAccumulatedMs: 0,
      pausedAtMs: null,
      notificationId,
      notificationMeta: {
        exerciseName,
        soundEnabled,
        vibrationEnabled,
      },
      activeSessionExerciseId: sessionExerciseId,
    });
  },
  pauseRest: async () => {
    const state = get();
    if (state.restState !== 'RESTING') {
      return;
    }

    if (state.notificationId) {
      await cancelRestNotification(state.notificationId);
    }

    set({
      restState: 'PAUSED',
      pausedAtMs: Date.now(),
      notificationId: null,
    });
  },
  resumeRest: async () => {
    const state = get();
    if (state.restState !== 'PAUSED') {
      return;
    }

    const now = Date.now();
    const pausedAtMs = state.pausedAtMs ?? now;

    const nextPauseAccumulatedMs = state.pauseAccumulatedMs + (now - pausedAtMs);
    const effectiveTargetAtMs = (state.restTargetAtMs ?? now) + nextPauseAccumulatedMs;
    const nextRemainingMs = effectiveTargetAtMs - now;

    let nextNotificationId: string | null = null;
    if (nextRemainingMs > 0 && state.notificationMeta) {
      nextNotificationId = await scheduleRestDoneNotification({
        targetAtMs: effectiveTargetAtMs,
        ...state.notificationMeta,
      });
    }

    set({
      restState: nextRemainingMs <= 0 ? 'DONE' : 'RESTING',
      pausedAtMs: null,
      pauseAccumulatedMs: nextPauseAccumulatedMs,
      notificationId: nextNotificationId,
    });
  },
  addTime: async stepSec => {
    const state = get();
    if (!state.restTargetAtMs) {
      return;
    }

    const nextTarget = state.restTargetAtMs + stepSec * 1000;
    const now = resolveNow(state);
    const remainingMs = nextTarget + state.pauseAccumulatedMs - now;
    const nextState =
      remainingMs <= 0
        ? 'DONE'
        : state.restState === 'DONE'
          ? 'RESTING'
          : state.restState;

    let nextNotificationId: string | null = state.notificationId;
    const shouldSchedule =
      (state.restState === 'RESTING' || state.restState === 'DONE') &&
      remainingMs > 0 &&
      state.notificationMeta;

    if (state.notificationId) {
      await cancelRestNotification(state.notificationId);
      nextNotificationId = null;
    }

    if (shouldSchedule && state.notificationMeta) {
      nextNotificationId = await scheduleRestDoneNotification({
        targetAtMs: nextTarget + state.pauseAccumulatedMs,
        ...state.notificationMeta,
      });
    }

    set({
      restTargetAtMs: nextTarget,
      restState: nextState,
      notificationId: nextNotificationId,
    });
  },
  markDoneIfNeeded: nowMs => {
    const state = get();
    if (state.restState !== 'RESTING' && state.restState !== 'DONE') {
      return;
    }

    const current = resolveNow(state, nowMs);
    const target = state.restTargetAtMs;
    if (!target) {
      return;
    }

    const remainingMs = target + state.pauseAccumulatedMs - current;
    if (remainingMs <= 0 && state.restState !== 'DONE') {
      set({restState: 'DONE'});
      return;
    }

    if (remainingMs > 0 && state.restState === 'DONE') {
      set({restState: 'RESTING'});
    }
  },
  getRemainingMs: nowMs => {
    const state = get();
    if (!state.restTargetAtMs) {
      return state.restDurationSec * 1000;
    }

    const now = resolveNow(state, nowMs);
    return state.restTargetAtMs + state.pauseAccumulatedMs - now;
  },
  resetToIdle: async () => {
    const existingId = get().notificationId;
    if (existingId) {
      await cancelRestNotification(existingId);
    }

    set({
      restState: 'IDLE',
      restStartAtMs: null,
      restTargetAtMs: null,
      pauseAccumulatedMs: 0,
      pausedAtMs: null,
      notificationId: null,
      notificationMeta: null,
      activeSessionExerciseId: null,
    });
  },
}));
