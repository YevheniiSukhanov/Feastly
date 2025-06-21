// src/lib/utils.ts

/**
 * Returns the YYYY-MM-DD string representation of a Date object.
 * @param date The Date object.
 * @returns A string in "YYYY-MM-DD" format.
 */
export function getYYYYMMDD(date: Date): string {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
}

/**
 * Returns the start of the week (Monday) for a given date, in UTC.
 * This ensures consistent date comparisons across different timezones when dealing with Prisma.
 * @param date The date to calculate the start of the week from.
 * @returns A Date object representing the Monday 00:00:00.000Z of that week.
 */
export function getStartOfWeekUTC(date: Date): Date {
    const d = new Date(date);
    const day = d.getUTCDay(); // 0 = Sunday (UTC), 1 = Monday (UTC) ...
    const diff = day === 0 ? 6 : day - 1; // Number of days back to Monday (UTC)
    d.setUTCDate(d.getUTCDate() - diff);
    d.setUTCHours(0, 0, 0, 0); // Reset time to midnight UTC
    return d;
}

/**
 * Formats a date string (YYYY-MM-DD) or Date object into a readable Ukrainian format.
 * E.g., "15 червня"
 * @param dateInput The date string (YYYY-MM-DD) or Date object.
 * @returns A formatted date string.
 */
export function formatDayMonth(dateInput: string | Date): string {
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  return new Intl.DateTimeFormat('uk-UA', { day: 'numeric', month: 'long' }).format(date);
}

/**
 * Formats a date into a full readable Ukrainian format with year.
 * E.g., "15 червня 2025"
 * @param date The Date object.
 * @returns A formatted date string.
 */
export function formatFullDate(date: Date): string {
  return new Intl.DateTimeFormat('uk-UA', { day: 'numeric', month: 'long', year: 'numeric' }).format(date);
}

/**
 * Returns the start of the day (midnight) for a given Date object, in UTC.
 * This function is used to normalize Date objects to the start of the day in UTC.
 * @param date The Date object to normalize.
 * @returns A new Date object representing the midnight (00:00:00.000) of that day in UTC.
 */
export function getStartOfDayUTC(date: Date): Date {
    const d = new Date(date); // Створюємо новий об'єкт Date, щоб не змінювати оригінал
    d.setUTCHours(0, 0, 0, 0); // Встановлюємо час на північ UTC
    return d;
}
