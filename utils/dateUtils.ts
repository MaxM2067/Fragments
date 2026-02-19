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

/**
 * Returns an array of 7 YYYY-MM-DD date strings for a given week.
 * weekOffset = 0 means current week, -1 = previous week, etc.
 * Week starts on Monday.
 */
export const getWeekDaysInTimezone = (weekOffset: number = 0, timezone?: string): string[] => {
    const tz = timezone || Intl.DateTimeFormat().resolvedOptions().timeZone;
    const now = new Date();

    // Get today's date parts in the target timezone
    const parts = new Intl.DateTimeFormat('en-CA', {
        timeZone: tz,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    }).formatToParts(now);

    const year = parseInt(parts.find(p => p.type === 'year')!.value);
    const month = parseInt(parts.find(p => p.type === 'month')!.value) - 1;
    const day = parseInt(parts.find(p => p.type === 'day')!.value);

    // Create a date object for "today" in local context
    // This allows us to use standard d.setDate() safely for day arithmetic
    const today = new Date(year, month, day);
    const dayOfWeek = today.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat
    // We want Monday as start. If today is Sunday (0), offset to -6. If Monday (1), offset is 0.
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(today);
    monday.setDate(today.getDate() + mondayOffset + (weekOffset * 7));

    const dates: string[] = [];
    for (let i = 0; i < 7; i++) {
        const d = new Date(monday);
        d.setDate(monday.getDate() + i);
        const yy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        dates.push(`${yy}-${mm}-${dd}`);
    }
    return dates;
};

export interface CalendarDay {
    date: string; // YYYY-MM-DD
    dayOfMonth: number;
    isCurrentMonth: boolean;
}

/**
 * Returns a full calendar grid (6-row max) for the given year/month.
 * Each row has 7 days (Mon–Sun). Pads with prev/next month days.
 */
export const getMonthCalendarInTimezone = (year: number, month: number): CalendarDay[] => {
    // month is 1-based (1=Jan, 12=Dec)
    const firstOfMonth = new Date(year, month - 1, 1);
    const lastOfMonth = new Date(year, month, 0);
    const daysInMonth = lastOfMonth.getDate();

    // Day of week: 0=Sun, we want Mon=0
    let startDow = firstOfMonth.getDay(); // 0=Sun
    startDow = startDow === 0 ? 6 : startDow - 1; // Convert to Mon=0

    const days: CalendarDay[] = [];

    // Pad start with previous month days
    if (startDow > 0) {
        const prevMonthLast = new Date(year, month - 1, 0);
        const prevMonthDays = prevMonthLast.getDate();
        for (let i = startDow - 1; i >= 0; i--) {
            const d = prevMonthDays - i;
            const prevMonth = month - 1 <= 0 ? 12 : month - 1;
            const prevYear = month - 1 <= 0 ? year - 1 : year;
            days.push({
                date: `${prevYear}-${String(prevMonth).padStart(2, '0')}-${String(d).padStart(2, '0')}`,
                dayOfMonth: d,
                isCurrentMonth: false,
            });
        }
    }

    // Current month days
    for (let d = 1; d <= daysInMonth; d++) {
        days.push({
            date: `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`,
            dayOfMonth: d,
            isCurrentMonth: true,
        });
    }

    // Pad end to fill last row (up to 42 = 6 rows)
    const totalSlots = Math.ceil(days.length / 7) * 7;
    let nextDay = 1;
    const nextMonth = month + 1 > 12 ? 1 : month + 1;
    const nextYear = month + 1 > 12 ? year + 1 : year;
    while (days.length < totalSlots) {
        days.push({
            date: `${nextYear}-${String(nextMonth).padStart(2, '0')}-${String(nextDay).padStart(2, '0')}`,
            dayOfMonth: nextDay,
            isCurrentMonth: false,
        });
        nextDay++;
    }

    return days;
};
