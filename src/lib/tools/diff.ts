/** 文本差异对比的纯逻辑，不触碰 DOM */

export type DiffKind = 'equal' | 'add' | 'remove';

export interface DiffRow {
	kind: DiffKind;
	/** 左侧（原文）行号，新增行没有 */
	left: number | null;
	/** 右侧（新文）行号，删除行没有 */
	right: number | null;
	text: string;
}

export interface DiffOptions {
	ignoreCase?: boolean;
	ignoreWhitespace?: boolean;
	ignoreEmptyLines?: boolean;
}

export interface DiffStats {
	added: number;
	removed: number;
	equal: number;
	/** 相同行占总行数的比例，0-1 */
	similarity: number;
}

export interface DiffResult {
	rows: DiffRow[];
	stats: DiffStats;
	/** 超出规模上限时退化为整段替换，用于给界面提示 */
	truncated: boolean;
}

/**
 * LCS 用的 DP 表格上限。
 *
 * 表格是 (n+1)*(m+1) 的 Uint32Array，四百万格约 16MB；再大就该提示用户
 * 缩小范围，而不是让浏览器标签页直接卡死。
 */
const MAX_CELLS = 4_000_000;

function normalize(line: string, options: DiffOptions): string {
	let key = line;
	if (options.ignoreWhitespace) key = key.replace(/\s+/g, ' ').trim();
	if (options.ignoreCase) key = key.toLowerCase();
	return key;
}

function splitLines(text: string, options: DiffOptions): string[] {
	const lines = text.replace(/\r\n?/g, '\n').split('\n');
	return options.ignoreEmptyLines ? lines.filter((line) => line.trim() !== '') : lines;
}

function buildStats(rows: DiffRow[]): DiffStats {
	let added = 0;
	let removed = 0;
	let equal = 0;
	for (const row of rows) {
		if (row.kind === 'add') added += 1;
		else if (row.kind === 'remove') removed += 1;
		else equal += 1;
	}
	const total = added + removed + equal;
	return { added, removed, equal, similarity: total === 0 ? 1 : equal / total };
}

/** 整段替换：规模过大时的退化输出 */
function wholesale(left: string[], right: string[]): DiffRow[] {
	return [
		...left.map((text, index) => ({ kind: 'remove' as const, left: index + 1, right: null, text })),
		...right.map((text, index) => ({ kind: 'add' as const, left: null, right: index + 1, text })),
	];
}

export function diffLines(
	source: string,
	target: string,
	options: DiffOptions = {},
): DiffResult {
	const left = splitLines(source, options);
	const right = splitLines(target, options);
	const leftKeys = left.map((line) => normalize(line, options));
	const rightKeys = right.map((line) => normalize(line, options));

	const rows: DiffRow[] = [];
	let head = 0;
	// 先吃掉公共前缀，绝大多数改动只集中在局部，这一步能把 DP 规模压下来
	while (head < left.length && head < right.length && leftKeys[head] === rightKeys[head]) {
		rows.push({ kind: 'equal', left: head + 1, right: head + 1, text: left[head] });
		head += 1;
	}

	let tail = 0;
	while (
		tail < left.length - head &&
		tail < right.length - head &&
		leftKeys[left.length - 1 - tail] === rightKeys[right.length - 1 - tail]
	) {
		tail += 1;
	}

	const midLeft = left.slice(head, left.length - tail);
	const midRight = right.slice(head, right.length - tail);
	const midLeftKeys = leftKeys.slice(head, left.length - tail);
	const midRightKeys = rightKeys.slice(head, right.length - tail);

	const n = midLeft.length;
	const m = midRight.length;
	let truncated = false;

	if ((n + 1) * (m + 1) > MAX_CELLS) {
		truncated = true;
		rows.push(
			...wholesale(midLeft, midRight).map((row) => ({
				...row,
				left: row.left === null ? null : row.left + head,
				right: row.right === null ? null : row.right + head,
			})),
		);
	} else if (n > 0 || m > 0) {
		const width = m + 1;
		const dp = new Uint32Array((n + 1) * width);
		for (let i = n - 1; i >= 0; i -= 1) {
			for (let j = m - 1; j >= 0; j -= 1) {
				dp[i * width + j] =
					midLeftKeys[i] === midRightKeys[j]
						? dp[(i + 1) * width + j + 1] + 1
						: Math.max(dp[(i + 1) * width + j], dp[i * width + j + 1]);
			}
		}

		let i = 0;
		let j = 0;
		while (i < n && j < m) {
			if (midLeftKeys[i] === midRightKeys[j]) {
				rows.push({ kind: 'equal', left: head + i + 1, right: head + j + 1, text: midLeft[i] });
				i += 1;
				j += 1;
			} else if (dp[(i + 1) * width + j] >= dp[i * width + j + 1]) {
				rows.push({ kind: 'remove', left: head + i + 1, right: null, text: midLeft[i] });
				i += 1;
			} else {
				rows.push({ kind: 'add', left: null, right: head + j + 1, text: midRight[j] });
				j += 1;
			}
		}
		while (i < n) {
			rows.push({ kind: 'remove', left: head + i + 1, right: null, text: midLeft[i] });
			i += 1;
		}
		while (j < m) {
			rows.push({ kind: 'add', left: null, right: head + j + 1, text: midRight[j] });
			j += 1;
		}
	}

	for (let k = tail; k > 0; k -= 1) {
		const leftIndex = left.length - k;
		const rightIndex = right.length - k;
		rows.push({
			kind: 'equal',
			left: leftIndex + 1,
			right: rightIndex + 1,
			text: left[leftIndex],
		});
	}

	return { rows, stats: buildStats(rows), truncated };
}
