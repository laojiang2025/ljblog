import { breakdown, parseTimeInput, formatLocal } from '../../lib/tools/time';
import { bindCopy, mountTool, setStatus } from './shared';

const FIELD_IDS = [
	'seconds',
	'milliseconds',
	'local',
	'iso',
	'utc',
	'weekday',
	'relative',
] as const;

type FieldId = (typeof FIELD_IDS)[number];

mountTool((signal) => {
	const input = document.getElementById('time-input') as HTMLInputElement | null;
	const status = document.getElementById('time-status');
	if (!input || !status) return;

	const outputs = new Map<FieldId, HTMLElement>();
	FIELD_IDS.forEach((id) => {
		const el = document.getElementById(`time-${id}`);
		if (el) outputs.set(id, el);
	});

	const reset = () => outputs.forEach((el) => (el.textContent = '—'));

	const convert = () => {
		const date = parseTimeInput(input.value);
		if (!date) {
			reset();
			setStatus(status, '无法识别，试试 1767225600 或 2026-01-01 12:00:00', 'error');
			return;
		}

		const parts = breakdown(date);
		FIELD_IDS.forEach((id) => {
			const el = outputs.get(id);
			if (el) el.textContent = String(parts[id]);
		});
		setStatus(status, '已转换', 'ok');
	};

	const actions: Record<string, () => void> = {
		convert,
		now() {
			input.value = formatLocal(new Date());
			convert();
		},
		clear() {
			input.value = '';
			reset();
			setStatus(status, '已清空', 'ok');
			input.focus();
		},
	};

	document.querySelectorAll<HTMLElement>('[data-time-action]').forEach((button) => {
		button.addEventListener('click', () => actions[button.dataset.timeAction ?? '']?.(), {
			signal,
		});
	});

	document.querySelectorAll<HTMLElement>('[data-time-copy]').forEach((button) => {
		button.addEventListener(
			'click',
			() => {
				const value = outputs.get(button.dataset.timeCopy as FieldId)?.textContent ?? '';
				void bindCopy(value === '—' ? '' : value, status);
			},
			{ signal },
		);
	});

	input.addEventListener(
		'keydown',
		(event) => {
			if (event.key === 'Enter') convert();
		},
		{ signal },
	);
});
