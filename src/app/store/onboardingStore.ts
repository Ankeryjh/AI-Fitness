import {create} from 'zustand';
import {createJSONStorage, persist} from 'zustand/middleware';

import {updateMyGoal} from '../services/meApi';
import {mmkvJSONStorage} from '../services/storage';

export type GoalType = 'chest' | 'back' | 'legs' | 'shoulders' | 'arms' | 'core';

interface GoalSetup {
  goalType: GoalType;
}

interface OnboardingState {
  hasHydrated: boolean;
  isLoggedIn: boolean;
  authToken: string | null;
  hasCompletedGoalSetup: boolean;
  startSessionAfterGoalSetup: boolean;
  email: string;
  goalSetup: GoalSetup;
  setHasHydrated: (value: boolean) => void;
  setAuthSession: (payload: {email: string; token: string}) => void;
  hydrateFromServer: (payload: {email: string; goalType?: GoalType | null}) => void;
  logout: () => void;
  completeGoalSetup: (payload: GoalSetup) => Promise<void>;
  requestStartSession: () => void;
  clearStartSessionRequest: () => void;
}

const defaultGoalSetup: GoalSetup = {
  goalType: 'chest',
};

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    set => ({
      hasHydrated: false,
      isLoggedIn: false,
      authToken: null,
      hasCompletedGoalSetup: false,
      startSessionAfterGoalSetup: false,
      email: '',
      goalSetup: defaultGoalSetup,
      setHasHydrated: value => set({hasHydrated: value}),
      setAuthSession: ({email, token}) =>
        set({
          isLoggedIn: true,
          email: email.trim().toLowerCase(),
          authToken: token,
        }),
      hydrateFromServer: ({email, goalType}) =>
        set(state => ({
          email: email.trim().toLowerCase(),
          goalSetup: {
            goalType: goalType ?? state.goalSetup.goalType,
          },
          hasCompletedGoalSetup: Boolean(goalType) || state.hasCompletedGoalSetup,
        })),
      logout: () =>
        set({
          isLoggedIn: false,
          authToken: null,
          hasCompletedGoalSetup: false,
          startSessionAfterGoalSetup: false,
          email: '',
          goalSetup: defaultGoalSetup,
        }),
      completeGoalSetup: async payload => {
        const token = useOnboardingStore.getState().authToken;
        if (token) {
          await updateMyGoal(token, {goalType: payload.goalType});
        }

        set({
          hasCompletedGoalSetup: true,
          goalSetup: {
            goalType: payload.goalType,
          },
        });
      },
      requestStartSession: () => set({startSessionAfterGoalSetup: true}),
      clearStartSessionRequest: () => set({startSessionAfterGoalSetup: false}),
    }),
    {
      name: 'onboarding-store',
      storage: createJSONStorage(() => mmkvJSONStorage),
      onRehydrateStorage: () => state => {
        if (state?.isLoggedIn && !state.authToken) {
          state.logout();
        }
        state?.setHasHydrated(true);
      },
    },
  ),
);
