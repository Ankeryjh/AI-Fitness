import {create} from 'zustand';
import {createJSONStorage, persist} from 'zustand/middleware';

import {mmkvJSONStorage} from '../services/storage';

export type GoalType = 'chest' | 'back' | 'legs' | 'shoulders' | 'arms' | 'core';

interface GoalSetup {
  goalType: GoalType;
}

interface OnboardingState {
  hasHydrated: boolean;
  isLoggedIn: boolean;
  hasCompletedGoalSetup: boolean;
  email: string;
  goalSetup: GoalSetup;
  setHasHydrated: (value: boolean) => void;
  login: (email: string) => void;
  logout: () => void;
  completeGoalSetup: (payload: GoalSetup) => void;
}

const defaultGoalSetup: GoalSetup = {
  goalType: 'chest',
};

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    set => ({
      hasHydrated: false,
      isLoggedIn: false,
      hasCompletedGoalSetup: false,
      email: '',
      goalSetup: defaultGoalSetup,
      setHasHydrated: value => set({hasHydrated: value}),
      login: email => set({isLoggedIn: true, email: email.trim().toLowerCase()}),
      logout: () =>
        set({
          isLoggedIn: false,
          hasCompletedGoalSetup: false,
          email: '',
          goalSetup: defaultGoalSetup,
        }),
      completeGoalSetup: payload =>
        set({
          hasCompletedGoalSetup: true,
          goalSetup: {
            goalType: payload.goalType,
          },
        }),
    }),
    {
      name: 'onboarding-store',
      storage: createJSONStorage(() => mmkvJSONStorage),
      onRehydrateStorage: () => state => {
        state?.setHasHydrated(true);
      },
    },
  ),
);
