import { mountTool } from './tools/shared';

/** 筛选维度与题目 li 上的 data 属性同名，新增维度只需两边各加一个 key */
const GROUPS = ['direction', 'difficulty'] as const;

type Group = (typeof GROUPS)[number];

mountTool((signal) => {
	const items = Array.from(document.querySelectorAll<HTMLElement>('.qa-item'));
	const search = document.getElementById('qa-search') as HTMLInputElement | null;
	const count = document.getElementById('qa-count');
	const empty = document.getElementById('qa-empty');
	if (items.length === 0 || !count || !empty) return;

	const active: Record<Group, string> = { direction: '', difficulty: '' };

	const apply = () => {
		const keyword = (search?.value ?? '').trim().toLowerCase();
		let visible = 0;

		items.forEach((item) => {
			const matched =
				GROUPS.every((group) => !active[group] || item.dataset[group] === active[group]) &&
				(!keyword || (item.dataset.keywords ?? '').includes(keyword));

			item.hidden = !matched;
			if (matched) visible += 1;
		});

		count.textContent = visible === items.length ? `共 ${items.length} 道` : `匹配 ${visible} 道`;
		empty.hidden = visible > 0;
	};

	document.querySelectorAll<HTMLElement>('[data-filter-group]').forEach((container) => {
		const group = container.dataset.filterGroup as Group;
		const chips = Array.from(container.querySelectorAll<HTMLButtonElement>('.qa-chip'));

		chips.forEach((chip) => {
			chip.addEventListener(
				'click',
				() => {
					active[group] = chip.dataset.value ?? '';
					chips.forEach((other) => {
						other.setAttribute('aria-pressed', String(other === chip));
					});
					apply();
				},
				{ signal },
			);
		});
	});

	search?.addEventListener('input', apply, { signal });

	const setOpen = (open: boolean) => {
		items.forEach((item) => {
			const details = item.querySelector('details');
			if (details && !item.hidden) details.open = open;
		});
	};

	document.querySelector('[data-qa-action="expand"]')?.addEventListener(
		'click',
		() => setOpen(true),
		{ signal },
	);
	document.querySelector('[data-qa-action="collapse"]')?.addEventListener(
		'click',
		() => setOpen(false),
		{ signal },
	);

	apply();
});
