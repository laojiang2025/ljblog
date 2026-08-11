/** JSON 工具的纯逻辑，不触碰 DOM，便于单独复用与验证 */

export interface JsonFailure {
	message: string;
	line: number | null;
	column: number | null;
}

export type JsonResult<T> = { ok: true; value: T } | { ok: false; error: JsonFailure };

interface Position {
	line: number;
	column: number;
}

function locate(text: string, offset: number): Position {
	const capped = Math.min(offset, text.length);
	const before = text.slice(0, capped).split('\n');
	return { line: before.length, column: before[before.length - 1].length + 1 };
}

/**
 * 自己扫一遍找出首个语法错误的偏移量。
 *
 * 不从引擎的报错文案反推位置，是因为那套文案既不稳定也不统一：V8 近期
 * 改过格式，同一个错误有时给 position、有时只给一段原文片段；Firefox 措辞
 * 完全不同；Safari 干脆不带位置。自己扫描才能让各浏览器下的定位一致。
 * 仅在 JSON.parse 已经判定失败时调用，因此只需找到第一个出错点。
 */
function findSyntaxError(text: string): number | null {
	let at = 0;

	const stop = (offset: number = at): never => {
		throw { offset };
	};

	const skipSpace = () => {
		while (at < text.length && /\s/.test(text[at])) at += 1;
	};

	const expect = (char: string) => {
		if (text[at] !== char) stop();
		at += 1;
	};

	const readString = () => {
		expect('"');
		while (at < text.length) {
			const char = text[at];
			if (char === '"') {
				at += 1;
				return;
			}
			if (char === '\\') {
				const next = text[at + 1];
				if (next === undefined || !'"\\/bfnrtu'.includes(next)) stop(at);
				if (next === 'u') {
					if (!/^[\dA-Fa-f]{4}$/.test(text.slice(at + 2, at + 6))) stop(at);
					at += 6;
					continue;
				}
				at += 2;
				continue;
			}
			// 控制字符必须转义
			if (char < ' ') stop(at);
			at += 1;
		}
		stop(text.length);
	};

	const readNumber = () => {
		const match = /^-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?/.exec(text.slice(at));
		if (!match) stop();
		at += match[0].length;
	};

	const readLiteral = () => {
		for (const word of ['true', 'false', 'null']) {
			if (text.startsWith(word, at)) {
				at += word.length;
				return true;
			}
		}
		return false;
	};

	const readValue = () => {
		skipSpace();
		if (at >= text.length) stop(text.length);

		const char = text[at];
		if (char === '{') return readObject();
		if (char === '[') return readArray();
		if (char === '"') return readString();
		if (char === '-' || (char >= '0' && char <= '9')) return readNumber();
		if (readLiteral()) return;
		stop();
	};

	const readObject = () => {
		expect('{');
		skipSpace();
		if (text[at] === '}') {
			at += 1;
			return;
		}
		for (;;) {
			skipSpace();
			readString();
			skipSpace();
			expect(':');
			readValue();
			skipSpace();
			if (text[at] === ',') {
				at += 1;
				continue;
			}
			expect('}');
			return;
		}
	};

	const readArray = () => {
		expect('[');
		skipSpace();
		if (text[at] === ']') {
			at += 1;
			return;
		}
		for (;;) {
			readValue();
			skipSpace();
			if (text[at] === ',') {
				at += 1;
				continue;
			}
			expect(']');
			return;
		}
	};

	try {
		readValue();
		skipSpace();
		// 值之后还有内容，同样是错误
		if (at < text.length) return at;
		return null;
	} catch (thrown) {
		const offset = (thrown as { offset?: number })?.offset;
		return typeof offset === 'number' ? offset : null;
	}
}

export function parseJson(input: string): JsonResult<unknown> {
	const text = input.trim();
	if (!text) {
		return { ok: false, error: { message: '内容为空', line: null, column: null } };
	}

	try {
		return { ok: true, value: JSON.parse(text) };
	} catch (error) {
		const message = error instanceof Error ? error.message : String(error);
		const offset = findSyntaxError(text);
		// 行列按原始输入算，否则开头有空行时报出的行号和用户看到的对不上
		const lead = input.length - input.trimStart().length;
		const position = offset === null ? null : locate(input, lead + offset);
		return {
			ok: false,
			error: { message, line: position?.line ?? null, column: position?.column ?? null },
		};
	}
}

export function formatJson(input: string, indent = 2): JsonResult<string> {
	const parsed = parseJson(input);
	return parsed.ok ? { ok: true, value: JSON.stringify(parsed.value, null, indent) } : parsed;
}

export function minifyJson(input: string): JsonResult<string> {
	const parsed = parseJson(input);
	return parsed.ok ? { ok: true, value: JSON.stringify(parsed.value) } : parsed;
}

function escapeHtml(text: string): string {
	return text
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;');
}

const TOKEN =
	/("(?:\\.|[^"\\])*")(\s*:)|("(?:\\.|[^"\\])*")|(-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)|\b(true|false|null)\b/g;

/**
 * 生成带高亮的 HTML。
 *
 * 关键在于分段转义：先用 token 正则切开原文，命中与未命中的片段都各自
 * 走 escapeHtml 再拼接，所以形如 {"a":"<img onerror=...>"} 的输入只会
 * 显示成文本，不会被当作标签解析。
 */
export function highlightJson(json: string): string {
	let result = '';
	let lastIndex = 0;

	for (const match of json.matchAll(TOKEN)) {
		const index = match.index ?? 0;
		result += escapeHtml(json.slice(lastIndex, index));

		const [raw, key, colon, str, num, literal] = match;
		if (key) {
			result += `<span class="tok-key">${escapeHtml(key)}</span>${escapeHtml(colon)}`;
		} else if (str) {
			result += `<span class="tok-str">${escapeHtml(str)}</span>`;
		} else if (num) {
			result += `<span class="tok-num">${escapeHtml(num)}</span>`;
		} else if (literal) {
			result += `<span class="tok-lit">${escapeHtml(literal)}</span>`;
		} else {
			result += escapeHtml(raw);
		}

		lastIndex = index + raw.length;
	}

	return result + escapeHtml(json.slice(lastIndex));
}
