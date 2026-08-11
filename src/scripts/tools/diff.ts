import { diffLines, type DiffOptions, type DiffRow } from '../../lib/tools/diff';
import { mountTool, setStatus } from './shared';

const MARKS: Record<DiffRow['kind'], string> = { equal: ' ', add: '+', remove: '-' };

mountTool((signal) => {
	const left = document.getElementById('diff-left') as HTMLTextAreaElement | null;
	const right = document.getElementById('diff-right') as HTMLTextAreaElement | null;
	const output = document.getElementById('diff-output');
	const status = document.getElementById('diff-status');
	if (!left || !right || !output || !status) return;

	const readOptions = (): DiffOptions => {
		const read = (name: string) =>
			document.querySelector<HTMLInputElement>(`[data-diff-opt="${name}"]`)?.checked ?? false;
		return {
			ignoreCase: read('ignoreCase'),
			ignoreWhitespace: read('ignoreWhitespace'),
			ignoreEmptyLines: read('ignoreEmptyLines'),
		};
	};

	// 逐格 textContent 写入，行内容不会被当成标签解析
	const renderRow = (row: DiffRow) => {
		const line = document.createElement('div');
		line.className = `tool-diff__row tool-diff__row--${row.kind}`;

		const leftNo = document.createElement('span');
		leftNo.className = 'tool-diff__no';
		leftNo.textContent = row.left === null ? '' : String(row.left);

		const rightNo = document.createElement('span');
		rightNo.className = 'tool-diff__no';
		rightNo.textContent = row.right === null ? '' : String(row.right);

		const mark = document.createElement('span');
		mark.className = 'tool-diff__mark';
		mark.textContent = MARKS[row.kind];

		const text = document.createElement('span');
		text.className = 'tool-diff__text';
		text.textContent = row.text;

		line.append(leftNo, rightNo, mark, text);
		return line;
	};

	const actions: Record<string, () => void> = {
		compare() {
			if (!left.value && !right.value) {
				setStatus(status, '两侧都是空的', 'error');
				return;
			}

			const result = diffLines(left.value, right.value, readOptions());
			const fragment = document.createDocumentFragment();
			result.rows.forEach((row) => fragment.appendChild(renderRow(row)));
			output.replaceChildren(fragment);
			output.hidden = false;

			const { added, removed, similarity } = result.stats;
			const percent = Math.round(similarity * 100);
			const note = result.truncated ? '（文本过大，已退化为整段替换）' : '';
			setStatus(
				status,
				added === 0 && removed === 0
					? '两段文本一致'
					: `新增 ${added} 行，删除 ${removed} 行，相似度 ${percent}%${note}`,
				added === 0 && removed === 0 ? 'ok' : 'error',
			);
		},
		swap() {
			[left.value, right.value] = [right.value, left.value];
			setStatus(status, '已交换两侧', 'ok');
		},
		clear() {
			left.value = '';
			right.value = '';
			output.replaceChildren();
			output.hidden = true;
			setStatus(status, '已清空', 'ok');
			left.focus();
		},
	};

	document.querySelectorAll<HTMLElement>('[data-diff-action]').forEach((button) => {
		button.addEventListener('click', () => actions[button.dataset.diffAction ?? '']?.(), {
			signal,
		});
	});
});
