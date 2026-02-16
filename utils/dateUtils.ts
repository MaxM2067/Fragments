/**
 * Formats a date as YYYY-MM-DD in the specified timezone.
 * Defaults to the user's local timezone if none is provided.
 */
export const formatDateInTimezone = (date: Date, timezone?: string): string => {
    const tz = timezone || Intl.DateTimeFormat().resolvedOptions().timeZone;

    // Use Intl.DateTimeFormat to get the date parts in the target timezone
    const formatter = new Intl.DateTimeFormat('en-CA', {
        timeZone: tz,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    });

    return formatter.format(date); // en-CA returns YYYY-MM-DD
};

/**
 * Gets "today" as a YYYY-MM-DD string in the specified timezone.
 */
export const getTodayInTimezone = (timezone?: string): string => {
    return formatDateInTimezone(new Date(), timezone);
};

/**
 * Returns an array of YYYY-MM-DD strings for the last N days (including today)
 * in the specified timezone.
 */
export const getLastNDaysInTimezone = (n: number, timezone?: string): string[] => {
    const dates: string[] = [];
    const now = new Date();

    for (let i = 0; i < n; i++) {
        const d = new Date(now);
        d.setDate(d.getDate() - (n - 1 - i));
        dates.push(formatDateInTimezone(d, timezone));
    }

    return dates;
};

/**
 * Returns the current UTC offset string for a timezone (e.g., "+08:00" or "-05:00").
 */
export const getTimezoneOffset = (timezone: string): string => {
    try {
        const now = new Date();
        const fmt = new Intl.DateTimeFormat('en-US', {
            timeZone: timezone,
            timeZoneName: 'shortOffset',
        });
        const parts = fmt.formatToParts(now);
        const offsetPart = parts.find(p => p.type === 'timeZoneName');
        const offset = offsetPart ? offsetPart.value : ''; // e.g. "GMT+8" or "GMT-5"

        if (!offset || offset === 'GMT') return '+00:00';

        // Convert "GMT+8" to "+08:00"
        const match = offset.match(/GMT([+-])(\d+)(?::(\d+))?/);
        if (!match) return '+00:00';

        const [_, sign, hours, minutes = '00'] = match;
        const h = hours.padStart(2, '0');
        const m = minutes.padStart(2, '0');
        return `${sign}${h}:${m}`;
    } catch {
        return '+00:00';
    }
};

/**
 * Returns a display label for a timezone, e.g., "(UTC+08:00) Asia/Shanghai".
 */
export const getTimezoneLabel = (timezone: string): string => {
    if (timezone === 'UTC') return '(UTC) Coordinated Universal Time';
    const offset = getTimezoneOffset(timezone);
    return `(UTC${offset}) ${timezone.replace(/_/g, ' ')}`;
};

/**
 * Returns the current time in the specified timezone as "HH:mm".
 */
export const getTimeInTimezone = (timezone: string): string => {
    try {
        return new Intl.DateTimeFormat('en-US', {
            timeZone: timezone,
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
        }).format(new Date());
    } catch {
        return '--:--';
    }
};
