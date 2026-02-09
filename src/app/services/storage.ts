import {MMKV} from 'react-native-mmkv';

export const mmkv = new MMKV({
  id: 'ai-fitness-storage',
});

export const mmkvJSONStorage = {
  setItem: (name: string, value: string) => {
    mmkv.set(name, value);
  },
  getItem: (name: string) => {
    const value = mmkv.getString(name);
    return value ?? null;
  },
  removeItem: (name: string) => {
    mmkv.delete(name);
  },
};

export const loadJSON = <T>(key: string, fallback: T): T => {
  const raw = mmkv.getString(key);
  if (!raw) {
    return fallback;
  }

  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
};

export const saveJSON = <T>(key: string, value: T): void => {
  mmkv.set(key, JSON.stringify(value));
};
