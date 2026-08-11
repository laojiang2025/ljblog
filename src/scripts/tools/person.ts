import { generatePeople, toCsv, type PersonField } from '../../lib/tools/person';
import { bindCopy, mountTool, setStatus, triggerDownload } from './shared';

mountTool((signal) => {
	const count = document.getElementById('person-count') as HTMLInputElement | null;
	const format = document.getElementById('person-format') as HTMLSelectElement | null;
	const output = document.getElementById('person-output');
	const status = document.getElementById('person-status');
	if (!count || !format || !output || !status) return;

	const checkboxes = Array.from(
		document.querySelectorAll<HTMLInputElement>('.tool-fieldset input[type="checkbox"]'),
	);

	let current = '';

	const selectedFields = (): PersonField[] =>
		checkboxes.filter((box) => box.checked).map((box) => box.value as PersonField);

	const render = (text: string) => {
		current = text;
		// 生成结果可能含逗号引号等字符，用 textContent 原样呈现
		output.textContent = text;
	};

	const actions: Record<string, () => void> = {
		generate() {
			const fields = selectedFields();
			if (fields.length === 0) {
				setStatus(status, '至少选一个字段', 'error');
				return;
			}

			const people = generatePeople(Number(count.value), fields);
			const isCsv = format.value === 'csv';
			render(isCsv ? toCsv(people, fields) : JSON.stringify(people, null, 2));
			setStatus(status, `已生成 ${people.length} 条`, 'ok');
		},
		copy() {
			void bindCopy(current, status);
		},
		download() {
			if (!current) {
				setStatus(status, '还没有数据可下载', 'error');
				return;
			}
			const isCsv = format.value === 'csv';
			triggerDownload(
				// CSV 加 BOM，否则 Excel 打开中文是乱码
				isCsv ? `\uFEFF${current}` : current,
				`person-${Date.now()}.${isCsv ? 'csv' : 'json'}`,
				isCsv ? 'text/csv;charset=utf-8' : 'application/json',
			);
			setStatus(status, '已开始下载', 'ok');
		},
		clear() {
			render('');
			setStatus(status, '已清空', 'ok');
		},
	};

	document.querySelectorAll<HTMLElement>('[data-person-action]').forEach((button) => {
		button.addEventListener('click', () => actions[button.dataset.personAction ?? '']?.(), {
			signal,
		});
	});
});
