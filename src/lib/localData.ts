export const STORAGE_KEYS = {
  models: 'mon_amour_models',
  reservations: 'mon_amour_reservations',
  leads: 'mon_amour_leads',
} as const;

export type StorageKey = keyof typeof STORAGE_KEYS;

export const readLocalCollection = <T,>(key: StorageKey): T[] => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEYS[key]);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

export const writeLocalCollection = <T,>(key: StorageKey, records: T[]) => {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEYS[key], JSON.stringify(records));
};

export const upsertLocalRecord = <T extends { id: string },>(key: StorageKey, record: T) => {
  const collection = readLocalCollection<T>(key);
  const index = collection.findIndex((item) => item.id === record.id);
  if (index >= 0) collection[index] = record;
  else collection.unshift(record);
  writeLocalCollection(key, collection);
};

export const removeLocalRecord = <T extends { id: string },>(key: StorageKey, id: string) => {
  const collection = readLocalCollection<T>(key).filter((item) => item.id !== id);
  writeLocalCollection(key, collection);
};

export const mergeById = <T extends { id: string },>(primary: T[], secondary: T[]): T[] => {
  const map = new Map<string, T>();
  [...secondary, ...primary].forEach((item) => map.set(item.id, item));
  return Array.from(map.values());
};

export const createLocalId = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

export const fileToDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
