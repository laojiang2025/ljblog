import { formatJson, highlightJson, minifyJson, parseJson } from '../../lib/tools/json';
import { bindCopy, mountTool, setStatus, triggerDownload } from './shared';

mountTool((signal) => {
	const input = document.getElementById('json-input') as HTMLTextAreaElement | null;
	const output = document.getElementById('json-output');
	const status = document.getElementById('json-status');
	const indent = document.getElementById('json-indent') as HTMLSelectElement | null;
	if (!input || !output || !status || !indent) return;

	let current = '';

	const render = (text: string) => {
		current = text;
		// highlightJson 内部逐段转义，用户输入不会被当成标签解析
		output.innerHTML = highlightJson(text);
	};

	const fail = (message: string, line: number | null, column: number | null) => {
		const where = line ? `（第 ${line} 行，第 ${column} 列）` : '';
		setStatus(status, `解析失败：${message}${where}`, 'error');
	};

	const indentValue = (): string | number => {
		const raw = Number(indent.value);
		return raw === 0 ? '\t' : raw;
	};

	const actions: Record<string, () => void> = {
		format() {
			const result = formatJson(input.value, indentValue() as number);
			if (result.ok) {
				render(result.value);
				setStatus(status, '已格式化', 'ok');
			} else {
				fail(result.error.message, result.error.line, result.error.column);
			}
		},
		minify() {
			const result = minifyJson(input.value);
			if (result.ok) {
				render(result.value);
				setStatus(status, `已压缩为 ${result.value.length} 个字符`, 'ok');
			} else {
				fail(result.error.message, result.error.line, result.error.column);
			}
		},
		escape() {
			const result = parseJson(input.value);
			if (result.ok) {
				render(JSON.stringify(JSON.stringify(result.value)));
				setStatus(status, '已转义为可嵌入的字符串字面量', 'ok');
			} else {
				fail(result.error.message, result.error.line, result.error.column);
			}
		},
		clear() {
			input.value = '';
			render('');
			setStatus(status, '已清空', 'ok');
			input.focus();
		},
		copy() {
			void bindCopy(current, status);
		},
		reuse() {
			if (!current) {
				setStatus(status, '还没有结果可回填', 'error');
				return;
			}
			input.value = current;
			setStatus(status, '结果已回填到输入框', 'ok');
		},
		download() {
			if (!current) {
				setStatus(status, '还没有结果可下载', 'error');
				return;
			}
			triggerDownload(current, `json-${Date.now()}.json`, 'application/json');
			setStatus(status, '已开始下载', 'ok');
		},
	};

	document.querySelectorAll<HTMLElement>('[data-json-action]').forEach((button) => {
		button.addEventListener('click', () => actions[button.dataset.jsonAction ?? '']?.(), {
			signal,
		});
	});
});
