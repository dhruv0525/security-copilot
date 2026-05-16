import { STORAGE_KEYS } from "./constants";

type StorageKey = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS];

/** Type-safe wrapper around chrome.storage.local */
export const storage = {
  get: <T>(key: StorageKey): Promise<T | null> =>
    new Promise((resolve) => {
      chrome.storage.local.get(key, (result) => {
        resolve((result[key] as T) ?? null);
      });
    }),

  set: <T>(key: StorageKey, value: T): Promise<void> =>
    new Promise((resolve, reject) => {
      chrome.storage.local.set({ [key]: value }, () => {
        if (chrome.runtime.lastError) reject(chrome.runtime.lastError);
        else resolve();
      });
    }),

  remove: (key: StorageKey): Promise<void> =>
    new Promise((resolve) => {
      chrome.storage.local.remove(key, resolve);
    }),
};
