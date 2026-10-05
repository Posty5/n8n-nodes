/**
 * Calendar-day helpers. A "day key" is `YYYY-MM-DD`, the date format the
 * Posty5 analytics query takes. Every day-key computation in this package goes
 * through here (AI_RULES §3).
 */

import { DAY_KEY_PATTERN, MS_PER_DAY } from './constants';

/**
 * The day key `date` falls on in the IANA zone `timeZone`.
 * @throws RangeError when `timeZone` is not a zone the runtime knows.
 */
export function toDayKey(date: Date, timeZone: string): string {
	const parts = new Intl.DateTimeFormat('en-US', {
		timeZone,
		year: 'numeric',
		month: '2-digit',
		day: '2-digit',
	}).formatToParts(date);
	const byType = Object.fromEntries(parts.map((item) => [item.type, item.value]));
	return `${byType.year}-${byType.month}-${byType.day}`;
}

/** Whether the runtime knows `timeZone` as an IANA zone. */
export function isKnownTimeZone(timeZone: string): boolean {
	try {
		new Intl.DateTimeFormat('en-US', { timeZone });
		return true;
	} catch {
		return false;
	}
}

/** `dayKey` moved by `days` (negative goes back). */
export function shiftDayKey(dayKey: string, days: number): string {
	const midnight = Date.parse(`${dayKey}T00:00:00.000Z`);
	return new Date(midnight + days * MS_PER_DAY).toISOString().slice(0, 10);
}

/**
 * The day a date parameter names, as a day key; `undefined` when it names none.
 *
 * - A string that starts with `YYYY-MM-DD` (what an n8n `dateTime` field holds,
 *   e.g. `2026-10-01T00:00:00`) → those ten characters, with no zone shift.
 * - A `Date` → its UTC calendar day.
 * - A Luxon `DateTime` (what `$now` / `$today` give in an expression) → its own
 *   calendar day (`toISODate()`).
 */
export function parseDayKey(value: unknown): string | undefined {
	if (typeof value === 'string') {
		const match = DAY_KEY_PATTERN.exec(value.trim());
		return match ? match[0] : undefined;
	}
	if (value instanceof Date) {
		return Number.isNaN(value.getTime()) ? undefined : value.toISOString().slice(0, 10);
	}
	if (value && typeof (value as { toISODate?: unknown }).toISODate === 'function') {
		const isoDate = (value as { toISODate: () => string | null }).toISODate();
		return isoDate ? parseDayKey(isoDate) : undefined;
	}
	return undefined;
}
