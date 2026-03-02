const DB_NAME = 'fragments-db';
const DB_VERSION = 1;
const STORE_NAME = 'kv';

type StoredRecord = {
    key: string;
    value: unknown;
};

export const STORAGE_KEYS = {
    habits: 'habitly_habits',
    categories: 'habitly_categories',
    logs: 'habitly_logs',
    timezone: 'habitly_timezone',
    weekStart: 'habitly_week_start',
    activeTimers: 'habitly_active_timers',
    detailTab: 'habitly_detail_tab',
    showFullMonth: 'habitly_show_full_month',
    sortBy: 'habitly_sort_by',
    filterCategory: 'habitly_filter_category',
    collapsedGroups: 'habitly_collapsed_groups',
    headerCollapsed: 'habitly_header_collapsed',
    migratedFlag: 'habitly_storage_migrated_v1',
} as const;

export const NOTES_KEY_PREFIX = 'habitly_notes_';

let dbPromise: Promise<IDBDatabase> | null = null;

const isIndexedDbAvailable = () => typeof window !== 'undefined' && typeof window.indexedDB !== 'undefined';

const openDb = (): Promise<IDBDatabase> => {
    if (!isIndexedDbAvailable()) {
        return Promise.reject(new Error('IndexedDB is not available in this environment.'));
    }
    if (dbPromise) return dbPromise;

    dbPromise = new Promise((resolve, reject) => {
        const request = window.indexedDB.open(DB_NAME, DB_VERSION);
        request.onupgradeneeded = () => {
            const db = request.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME, { keyPath: 'key' });
            }
        };
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error || new Error('Failed to open IndexedDB.'));
    });

    return dbPromise;
};

const readFromLocalStorageFallback = <T>(key: string): T | undefined => {
    const raw = localStorage.getItem(key);
    if (raw === null) return undefined;
    try {
        return JSON.parse(raw) as T;
    } catch {
        return raw as T;
    }
};

const writeToLocalStorageFallback = (key: string, value: unknown) => {
    localStorage.setItem(key, JSON.stringify(value));
};

const readOnlyTransaction = async () => {
    const db = await openDb();
    return db.transaction(STORE_NAME, 'readonly').objectStore(STORE_NAME);
};

const readWriteTransaction = async () => {
    const db = await openDb();
    return db.transaction(STORE_NAME, 'readwrite').objectStore(STORE_NAME);
};

export const getStorageValue = async <T>(key: string): Promise<T | undefined> => {
    if (!isIndexedDbAvailable()) return readFromLocalStorageFallback<T>(key);
    try {
        const store = await readOnlyTransaction();
        return await new Promise<T | undefined>((resolve, reject) => {
            const req = store.get(key);
            req.onsuccess = () => {
                const result = req.result as StoredRecord | undefined;
                resolve(result ? (result.value as T) : undefined);
            };
            req.onerror = () => reject(req.error || new Error(`Failed to read key "${key}".`));
        });
    } catch {
        return readFromLocalStorageFallback<T>(key);
    }
};

export const setStorageValue = async (key: string, value: unknown): Promise<void> => {
    if (!isIndexedDbAvailable()) {
        writeToLocalStorageFallback(key, value);
        return;
    }
    try {
        const store = await readWriteTransaction();
        await new Promise<void>((resolve, reject) => {
            const req = store.put({ key, value } as StoredRecord);
            req.onsuccess = () => resolve();
            req.onerror = () => reject(req.error || new Error(`Failed to write key "${key}".`));
        });
    } catch {
        writeToLocalStorageFallback(key, value);
    }
};

export const removeStorageValue = async (key: string): Promise<void> => {
    if (!isIndexedDbAvailable()) {
        localStorage.removeItem(key);
        return;
    }
    try {
        const store = await readWriteTransaction();
        await new Promise<void>((resolve, reject) => {
            const req = store.delete(key);
            req.onsuccess = () => resolve();
            req.onerror = () => reject(req.error || new Error(`Failed to delete key "${key}".`));
        });
    } catch {
        localStorage.removeItem(key);
    }
};

export const listStorageKeys = async (): Promise<string[]> => {
    if (!isIndexedDbAvailable()) {
        return Object.keys(localStorage);
    }
    try {
        const store = await readOnlyTransaction();
        return await new Promise<string[]>((resolve, reject) => {
            const req = store.getAllKeys();
            req.onsuccess = () => resolve((req.result as IDBValidKey[]).map(String));
            req.onerror = () => reject(req.error || new Error('Failed to list keys.'));
        });
    } catch {
        return Object.keys(localStorage);
    }
};

export const getStorageEntriesByPrefix = async (prefix: string): Promise<Record<string, unknown>> => {
    const keys = await listStorageKeys();
    const matches = keys.filter(key => key.startsWith(prefix));
    const entries = await Promise.all(matches.map(async key => [key, await getStorageValue(key)] as const));

    return entries.reduce<Record<string, unknown>>((acc, [key, value]) => {
        if (typeof value !== 'undefined') acc[key] = value;
        return acc;
    }, {});
};

export const setStorageValues = async (entries: Record<string, unknown>): Promise<void> => {
    const tasks = Object.entries(entries).map(([key, value]) => setStorageValue(key, value));
    await Promise.all(tasks);
};

const parseForMigration = (raw: string): unknown => {
    try {
        return JSON.parse(raw);
    } catch {
        return raw;
    }
};

export const migrateLocalStorageToIndexedDb = async (): Promise<void> => {
    if (typeof window === 'undefined') return;
    const alreadyMigrated = await getStorageValue<boolean>(STORAGE_KEYS.migratedFlag);
    if (alreadyMigrated) return;

    const staticKeys = [
        STORAGE_KEYS.habits,
        STORAGE_KEYS.categories,
        STORAGE_KEYS.logs,
        STORAGE_KEYS.timezone,
        STORAGE_KEYS.weekStart,
        STORAGE_KEYS.activeTimers,
        STORAGE_KEYS.detailTab,
        STORAGE_KEYS.showFullMonth,
        STORAGE_KEYS.sortBy,
        STORAGE_KEYS.filterCategory,
        STORAGE_KEYS.collapsedGroups,
        STORAGE_KEYS.headerCollapsed,
    ];

    const migrationEntries: Record<string, unknown> = {};
    for (const key of staticKeys) {
        const raw = localStorage.getItem(key);
        if (raw === null) continue;
        migrationEntries[key] = parseForMigration(raw);
    }

    for (const key of Object.keys(localStorage)) {
        if (!key.startsWith(NOTES_KEY_PREFIX)) continue;
        const raw = localStorage.getItem(key);
        if (raw === null) continue;
        migrationEntries[key] = parseForMigration(raw);
    }

    await setStorageValues(migrationEntries);
    await setStorageValue(STORAGE_KEYS.migratedFlag, true);
};
