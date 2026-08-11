/** 时间戳工具的纯逻辑，不触碰 DOM */

export interface TimeBreakdown {
	seconds: number;
	milliseconds: number;
	iso: string;
	utc: string;
	local: string;
	date: string;
	relative: string;
	weekday: string;
}

/** 10 位当秒、13 位当毫秒，是这类工具的通行约定 */
function fromNumeric(text: string): Date | null {
	if (!/^-?\d+$/.test(text)) return null;
	const value = Number(text);
	if (!Number.isSafeInteger(value)) return null;
	const ms = text.replace('-', '').length <= 10 ? value * 1000 : value;
	const date = new Date(ms);
	return Number.isNaN(date.getTime()) ? null : date;
}

export function parseTimeInput(input: string): Date | null {
	const text = input.trim();
	if (!text) return null;

	const numeric = fromNumeric(text);
	if (numeric) return numeric;

	// 'YYYY-MM-DD HH:mm:ss' 在部分浏览器下不合法，补个 T 再交给引擎
	const normalized = /^\d{4}-\d{2}-\d{2}[ T]/.test(text) ? text.replace(' ', 'T') : text;
	const parsed = new Date(normalized);
	return Number.isNaN(parsed.getTime()) ? null : parsed;
}

const UNITS: ReadonlyArray<{ limit: number; divisor: number; unit: Intl.RelativeTimeFormatUnit }> = [
	{ limit: 60_000, divisor: 1000, unit: 'second' },
	{ limit: 3_600_000, divisor: 60_000, unit: 'minute' },
	{ limit: 86_400_000, divisor: 3_600_000, unit: 'hour' },
	{ limit: 2_592_000_000, divisor: 86_400_000, unit: 'day' },
	{ limit: 31_536_000_000, divisor: 2_592_000_000, unit: 'month' },
];

export function describeRelative(date: Date, now: Date = new Date()): string {
	const diff = date.getTime() - now.getTime();
	const abs = Math.abs(diff);
	const formatter = new Intl.RelativeTimeFormat('zh-CN', { numeric: 'auto' });
	const matched = UNITS.find((entry) => abs < entry.limit);
	const { divisor, unit } = matched ?? { divisor: 31_536_000_000, unit: 'year' as const };
	return formatter.format(Math.round(diff / divisor), unit);
}

function pad(value: number): string {
	return String(value).padStart(2, '0');
}

export function formatLocal(date: Date): string {
	return (
		`${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ` +
		`${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
	);
}

export function breakdown(date: Date, now: Date = new Date()): TimeBreakdown {
	return {
		seconds: Math.floor(date.getTime() / 1000),
		milliseconds: date.getTime(),
		iso: date.toISOString(),
		utc: date.toUTCString(),
		local: formatLocal(date),
		date: `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`,
		relative: describeRelative(date, now),
		weekday: date.toLocaleDateString('zh-CN', { weekday: 'long' }),
	};
}
