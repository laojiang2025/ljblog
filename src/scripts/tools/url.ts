import { decode, encode, parseUrl, type UrlParam } from '../../lib/tools/url';
import { mountTool, setStatus } from './shared';

const PART_IDS = ['protocol', 'hostname', 'port', 'pathname', 'search', 'hash', 'origin'] as const;

type PartId = (typeof PART_IDS)[number];

mountTool((signal) => {
	const input = document.getElementById('url-input') as HTMLTextAreaElement | null;
	const status = document.getElementById('url-status');
	const tbody = document.getElementById('url-params');
	const count = document.getElementById('url-param-count');
	if (!input || !status || !tbody || !count) return;

	const outputs = new Map<PartId, HTMLElement>();
	PART_IDS.forEach((id) => {
		const el = document.getElementById(`url-${id}`);
		if (el) outputs.set(id, el);
	});

	const emptyRow = () => {
		const row = document.createElement('tr');
		row.className = 'tool-table__empty';
		const cell = document.createElement('td');
		cell.colSpan = 2;
		cell.textContent = '没有查询参数';
		row.appendChild(cell);
		return row;
	};

	// 用 textContent 逐格写入，参数值原样呈现且不会被解析成标签
	const renderParams = (params: UrlParam[]) => {
		tbody.replaceChildren();
		count.textContent = params.length > 0 ? `${params.length} 个` : '';

		if (params.length === 0) {
			tbody.appendChild(emptyRow());
			return;
		}

		params.forEach((param) => {
			const row = document.createElement('tr');
			const key = document.createElement('td');
			key.textContent = param.key;
			const value = document.createElement('td');
			value.textContent = param.value;
			row.append(key, value);
			tbody.appendChild(row);
		});
	};

	const reset = () => {
		outputs.forEach((el) => (el.textContent = '—'));
		renderParams([]);
		count.textContent = '';
	};

	const actions: Record<string, () => void> = {
		parse() {
			const result = parseUrl(input.value);
			if (!result.ok) {
				reset();
				setStatus(status, result.error, 'error');
				return;
			}

			PART_IDS.forEach((id) => {
				const el = outputs.get(id);
				if (el) el.textContent = result.value[id] || '—';
			});
			renderParams(result.value.params);
			setStatus(status, '已解析', 'ok');
		},
		encode() {
			if (!input.value.trim()) {
				setStatus(status, '请先输入内容', 'error');
				return;
			}
			input.value = encode(input.value);
			setStatus(status, '已编码', 'ok');
		},
		decode() {
			const result = decode(input.value);
			if (!result.ok) {
				setStatus(status, result.error, 'error');
				return;
			}
			input.value = result.value;
			setStatus(status, '已解码', 'ok');
		},
		clear() {
			input.value = '';
			reset();
			setStatus(status, '已清空', 'ok');
			input.focus();
		},
	};

	document.querySelectorAll<HTMLElement>('[data-url-action]').forEach((button) => {
		button.addEventListener('click', () => actions[button.dataset.urlAction ?? '']?.(), {
			signal,
		});
	});
});
