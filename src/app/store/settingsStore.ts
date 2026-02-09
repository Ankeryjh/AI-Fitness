import {create} from 'zustand';
import {createJSONStorage, persist} from 'zustand/middleware';

import {mmkvJSONStorage} from '../services/storage';

interface SettingsState {
  defaultRestSec: number;
  stepSec: number;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  setDefaultRestSec: (value: number) => void;
  setStepSec: (value: number) => void;
  setSoundEnabled: (value: boolean) => void;
  setVibrationEnabled: (value: boolean) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    set => ({
      defaultRestSec: 90,
      stepSec: 15,
      soundEnabled: true,
      vibrationEnabled: true,
      setDefaultRestSec: value =>
        set({defaultRestSec: Math.max(15, Math.min(600, Math.round(value)))}),
      setStepSec: value =>
        set({stepSec: Math.max(5, Math.min(120, Math.round(value)))}),
      setSoundEnabled: value => set({soundEnabled: value}),
      setVibrationEnabled: value => set({vibrationEnabled: value}),
    }),
    {
      name: 'settings-store',
      storage: createJSONStorage(() => mmkvJSONStorage),
    },
  ),
);
