import {
	analyze,
	randomText,
	transform,
	truncate,
	type RandomTextOptions,
	type TextOperation,
	type TextStats,
} from '../../lib/tools/text';
import { bindCopy, mountTool, setStatus } from './shared';

const STAT_KEYS: Array<keyof TextStats> = [
	'chars',
	'charsNoSpace',
	'words',
	'lines',
	'paragraphs',
	'chinese',
	'bytes',
];

mountTool((signal) => {
	const input = document.getElementById('text-input') as HTMLTextAreaElement | null;
	const status = document.getElementById('text-status');
	if (!input || !status) return;

	const statNodes = new Map<keyof TextStats, HTMLElement>();
	STAT_KEYS.forEach((key) => {
		const node = document.getElementById(`stat-${key}`);
		if (node) statNodes.set(key, node);
	});

	// 只留一步，够撤销误操作即可，不做完整历史栈
	let previous: string | null = null;

	const refresh = () => {
		const stats = analyze(input.value);
		statNodes.forEach((node, key) => {
			node.textContent = stats[key].toLocaleString('zh-CN');
		});
	};

	const apply = (next: string, message: string) => {
		previous = input.value;
		input.value = next;
		refresh();
		setStatus(status, message, 'ok');
	};

	const poolOptions = (): RandomTextOptions => {
		const read = (name: string) =>
			document.querySelector<HTMLInputElement>(`[data-pool="${name}"]`)?.checked ?? false;
		return {
			chinese: read('chinese'),
			english: read('english'),
			numbers: read('numbers'),
			symbols: read('symbols'),
		};
	};

	const actions: Record<string, () => void> = {
		truncate() {
			const length = Number(
				(document.getElementById('text-truncate') as HTMLInputElement | null)?.value ?? 0,
			);
			if (!input.value) {
				setStatus(status, '还没有文本', 'error');
				return;
			}
			apply(truncate(input.value, length), `已截断到 ${length} 字`);
		},
		random() {
			const length = Number(
				(document.getElementById('text-random-count') as HTMLInputElement | null)?.value ?? 0,
			);
			const generated = randomText(length, poolOptions());
			if (!generated) {
				setStatus(status, '至少勾选一种字符类型', 'error');
				return;
			}
			apply(generated, `已生成 ${[...generated].length} 个字符`);
		},
		copy() {
			void bindCopy(input.value, status);
		},
		undo() {
			if (previous === null) {
				setStatus(status, '没有可撤销的操作', 'error');
				return;
			}
			input.value = previous;
			previous = null;
			refresh();
			setStatus(status, '已撤销', 'ok');
		},
		clear() {
			apply('', '已清空');
			input.focus();
		},
	};

	document.querySelectorAll<HTMLElement>('[data-text-op]').forEach((button) => {
		button.addEventListener(
			'click',
			() => {
				if (!input.value) {
					setStatus(status, '还没有文本', 'error');
					return;
				}
				const operation = button.dataset.textOp as TextOperation;
				apply(transform(input.value, operation), `${button.textContent?.trim()} 完成`);
			},
			{ signal },
		);
	});

	document.querySelectorAll<HTMLElement>('[data-text-action]').forEach((button) => {
		button.addEventListener('click', () => actions[button.dataset.textAction ?? '']?.(), {
			signal,
		});
	});

	input.addEventListener('input', refresh, { signal });
	refresh();
});
