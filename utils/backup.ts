import { Category, DailyLog, Habit } from '../types';
import {
    getStorageEntriesByPrefix,
    getStorageValue,
    listStorageKeys,
    NOTES_KEY_PREFIX,
    removeStorageValue,
    setStorageValue,
    setStorageValues,
    STORAGE_KEYS
} from './storage';

export interface FragmentsBackupV1 {
    schemaVersion: 1;
    exportedAt: string;
    data: {
        habits: Habit[];
        categories: Category[];
        logs: Record<string, DailyLog>;
        settings: {
            timezone: string;
            weekStart: 'monday' | 'sunday';
        };
        notes: Record<string, unknown>;
        preferences: Record<string, unknown>;
    };
}

const PREFERENCE_KEYS = [
    STORAGE_KEYS.sortBy,
    STORAGE_KEYS.filterCategory,
    STORAGE_KEYS.collapsedGroups,
    STORAGE_KEYS.headerCollapsed,
    STORAGE_KEYS.detailTab,
    STORAGE_KEYS.showFullMonth,
] as const;

const isObject = (value: unknown): value is Record<string, unknown> =>
    typeof value === 'object' && value !== null && !Array.isArray(value);

const normalizeWeekStart = (value: unknown): 'monday' | 'sunday' =>
    value === 'sunday' ? 'sunday' : 'monday';

export const buildBackup = async (): Promise<FragmentsBackupV1> => {
    const [habits, categories, logs, timezone, weekStart, notes] = await Promise.all([
        getStorageValue<Habit[]>(STORAGE_KEYS.habits),
        getStorageValue<Category[]>(STORAGE_KEYS.categories),
        getStorageValue<Record<string, DailyLog>>(STORAGE_KEYS.logs),
        getStorageValue<string>(STORAGE_KEYS.timezone),
        getStorageValue<'monday' | 'sunday'>(STORAGE_KEYS.weekStart),
        getStorageEntriesByPrefix(NOTES_KEY_PREFIX),
    ]);

    const preferencesEntries = await Promise.all(
        PREFERENCE_KEYS.map(async key => [key, await getStorageValue(key)] as const)
    );
    const preferences = preferencesEntries.reduce<Record<string, unknown>>((acc, [key, value]) => {
        if (typeof value !== 'undefined') acc[key] = value;
        return acc;
    }, {});

    return {
        schemaVersion: 1,
        exportedAt: new Date().toISOString(),
        data: {
            habits: Array.isArray(habits) ? habits : [],
            categories: Array.isArray(categories) ? categories : [],
            logs: isObject(logs) ? (logs as Record<string, DailyLog>) : {},
            settings: {
                timezone: typeof timezone === 'string' ? timezone : Intl.DateTimeFormat().resolvedOptions().timeZone,
                weekStart: normalizeWeekStart(weekStart),
            },
            notes,
            preferences,
        },
    };
};

export const parseBackup = (rawText: string): FragmentsBackupV1 => {
    let parsed: unknown;
    try {
        parsed = JSON.parse(rawText) as unknown;
    } catch {
        throw new Error('Backup file is not valid JSON.');
    }
    if (!isObject(parsed)) throw new Error('Backup file is not a JSON object.');
    if (parsed.schemaVersion !== 1) throw new Error('Unsupported backup schema version.');
    if (!isObject(parsed.data)) throw new Error('Backup data payload is missing.');

    const data = parsed.data as Record<string, unknown>;
    const settings = isObject(data.settings) ? data.settings : {};

    return {
        schemaVersion: 1,
        exportedAt: typeof parsed.exportedAt === 'string' ? parsed.exportedAt : new Date().toISOString(),
        data: {
            habits: Array.isArray(data.habits) ? (data.habits as Habit[]) : [],
            categories: Array.isArray(data.categories) ? (data.categories as Category[]) : [],
            logs: isObject(data.logs) ? (data.logs as Record<string, DailyLog>) : {},
            settings: {
                timezone: typeof settings.timezone === 'string'
                    ? settings.timezone
                    : Intl.DateTimeFormat().resolvedOptions().timeZone,
                weekStart: normalizeWeekStart(settings.weekStart),
            },
            notes: isObject(data.notes) ? data.notes : {},
            preferences: isObject(data.preferences) ? data.preferences : {},
        },
    };
};

export const applyBackup = async (backup: FragmentsBackupV1): Promise<void> => {
    const mainEntries: Record<string, unknown> = {
        [STORAGE_KEYS.habits]: backup.data.habits,
        [STORAGE_KEYS.categories]: backup.data.categories,
        [STORAGE_KEYS.logs]: backup.data.logs,
        [STORAGE_KEYS.timezone]: backup.data.settings.timezone,
        [STORAGE_KEYS.weekStart]: backup.data.settings.weekStart,
        [STORAGE_KEYS.activeTimers]: {},
        [STORAGE_KEYS.migratedFlag]: true,
    };

    const keys = await listStorageKeys();
    const noteKeys = keys.filter(key => key.startsWith(NOTES_KEY_PREFIX));
    await Promise.all(noteKeys.map(key => removeStorageValue(key)));

    await setStorageValues(mainEntries);
    const importedNotes = Object.entries(backup.data.notes).reduce<Record<string, unknown>>((acc, [key, value]) => {
        if (key.startsWith(NOTES_KEY_PREFIX)) {
            acc[key] = value;
        }
        return acc;
    }, {});
    await setStorageValues(importedNotes);

    for (const key of PREFERENCE_KEYS) {
        if (Object.prototype.hasOwnProperty.call(backup.data.preferences, key)) {
            await setStorageValue(key, backup.data.preferences[key]);
        } else {
            await removeStorageValue(key);
        }
    }
};
