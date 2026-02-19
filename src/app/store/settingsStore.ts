import {create} from 'zustand';
import {createJSONStorage, persist} from 'zustand/middleware';

import {fetchMySettings, updateMySettings} from '../services/meApi';
import {mmkvJSONStorage} from '../services/storage';
import {useOnboardingStore} from './onboardingStore';

interface SettingsState {
  defaultRestSec: number;
  stepSec: number;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  syncFromServer: () => Promise<void>;
  hydrateFromServer: (payload: {
    defaultRestSec: number;
    stepSec: number;
    soundEnabled: boolean;
    vibrationEnabled: boolean;
  }) => void;
  setDefaultRestSec: (value: number) => void;
  setStepSec: (value: number) => void;
  setSoundEnabled: (value: boolean) => void;
  setVibrationEnabled: (value: boolean) => void;
  resetToDefault: () => void;
}

const normalizeDefaultRestSec = (value: number): number => Math.max(15, Math.min(600, Math.round(value)));
const normalizeStepSec = (value: number): number => Math.max(5, Math.min(120, Math.round(value)));

const pushSettingsPatch = async (patch: {
  defaultRestSec?: number;
  stepSec?: number;
  soundEnabled?: boolean;
  vibrationEnabled?: boolean;
}): Promise<void> => {
  const token = useOnboardingStore.getState().authToken;
  if (!token) {
    return;
  }
  await updateMySettings(token, patch);
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    set => ({
      defaultRestSec: 90,
      stepSec: 15,
      soundEnabled: true,
      vibrationEnabled: true,
      syncFromServer: async () => {
        const token = useOnboardingStore.getState().authToken;
        if (!token) {
          return;
        }

        const settings = await fetchMySettings(token);
        set({
          defaultRestSec: normalizeDefaultRestSec(settings.defaultRestSec),
          stepSec: normalizeStepSec(settings.stepSec),
          soundEnabled: settings.soundEnabled,
          vibrationEnabled: settings.vibrationEnabled,
        });
      },
      hydrateFromServer: payload =>
        set({
          defaultRestSec: normalizeDefaultRestSec(payload.defaultRestSec),
          stepSec: normalizeStepSec(payload.stepSec),
          soundEnabled: payload.soundEnabled,
          vibrationEnabled: payload.vibrationEnabled,
        }),
      setDefaultRestSec: value => {
        const normalized = normalizeDefaultRestSec(value);
        set({defaultRestSec: normalized});
        void pushSettingsPatch({defaultRestSec: normalized});
      },
      setStepSec: value => {
        const normalized = normalizeStepSec(value);
        set({stepSec: normalized});
        void pushSettingsPatch({stepSec: normalized});
      },
      setSoundEnabled: value => {
        set({soundEnabled: value});
        void pushSettingsPatch({soundEnabled: value});
      },
      setVibrationEnabled: value => {
        set({vibrationEnabled: value});
        void pushSettingsPatch({vibrationEnabled: value});
      },
      resetToDefault: () =>
        set({
          defaultRestSec: 90,
          stepSec: 15,
          soundEnabled: true,
          vibrationEnabled: true,
        }),
    }),
    {
      name: 'settings-store',
      storage: createJSONStorage(() => mmkvJSONStorage),
    },
  ),
);
