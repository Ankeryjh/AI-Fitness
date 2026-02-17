import {MMKV} from 'react-native-mmkv';

let mmkv: MMKV | null = null;
const memoryStorage = new Map<string, string>();

try {
  mmkv = new MMKV({
    id: 'ai-fitness-storage',
  });
} catch {
  mmkv = null;
}

const safeSet = (name: string, value: string): void => {
  if (mmkv) {
    try {
      mmkv.set(name, value);
      return;
    } catch {
      // Fall back to memory storage when native storage is unavailable.
    }
  }
  memoryStorage.set(name, value);
};

const safeGet = (name: string): string | null => {
  if (mmkv) {
    try {
      const value = mmkv.getString(name);
      return value ?? null;
    } catch {
      // Fall back to memory storage when native storage is unavailable.
    }
  }
  return memoryStorage.get(name) ?? null;
};

const safeRemove = (name: string): void => {
  if (mmkv) {
    try {
      mmkv.delete(name);
      return;
    } catch {
      // Fall back to memory storage when native storage is unavailable.
    }
  }
  memoryStorage.delete(name);
};

export const mmkvJSONStorage = {
  setItem: (name: string, value: string) => {
    safeSet(name, value);
  },
  getItem: (name: string) => {
    return safeGet(name);
  },
  removeItem: (name: string) => {
    safeRemove(name);
  },
};

export const loadJSON = <T>(key: string, fallback: T): T => {
  const raw = safeGet(key);
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
  safeSet(key, JSON.stringify(value));
};
