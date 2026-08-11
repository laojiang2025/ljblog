/** 文本处理的纯逻辑，不触碰 DOM */

export interface TextStats {
	chars: number;
	charsNoSpace: number;
	words: number;
	lines: number;
	paragraphs: number;
	bytes: number;
	chinese: number;
}

/**
 * 统计文本。
 *
 * 字符数按码点算而非 UTF-16 长度，否则 emoji 与部分生僻字会被计成两个。
 * 词数中英分开：中文按字计，英文按空白分词。
 */
export function analyze(text: string): TextStats {
	const chars = [...text].length;
	const chinese = (text.match(/[\u4e00-\u9fa5]/g) ?? []).length;
	const english = text.replace(/[\u4e00-\u9fa5]/g, ' ').trim();
	const englishWords = english ? english.split(/\s+/).filter(Boolean).length : 0;

	return {
		chars,
		charsNoSpace: [...text.replace(/\s/g, '')].length,
		words: chinese + englishWords,
		lines: text === '' ? 0 : text.split('\n').length,
		paragraphs: text.split(/\n\s*\n/).filter((block) => block.trim() !== '').length,
		bytes: new TextEncoder().encode(text).length,
		chinese,
	};
}

export type TextOperation =
	| 'upper'
	| 'lower'
	| 'capitalize'
	| 'trimLines'
	| 'removeEmptyLines'
	| 'dedupe'
	| 'sortAsc'
	| 'sortDesc'
	| 'reverseLines'
	| 'numberLines'
	| 'collapseSpaces';

export const OPERATION_LABELS: Record<TextOperation, string> = {
	upper: '转大写',
	lower: '转小写',
	capitalize: '首字母大写',
	trimLines: '去每行首尾空白',
	removeEmptyLines: '删空行',
	dedupe: '行去重',
	sortAsc: '按行升序',
	sortDesc: '按行降序',
	reverseLines: '行倒序',
	numberLines: '加行号',
	collapseSpaces: '合并连续空格',
};

const byLine = (text: string, fn: (lines: string[]) => string[]): string =>
	fn(text.split('\n')).join('\n');

export function transform(text: string, operation: TextOperation): string {
	switch (operation) {
		case 'upper':
			return text.toUpperCase();
		case 'lower':
			return text.toLowerCase();
		case 'capitalize':
			return text.replace(/\b[a-z]/g, (char) => char.toUpperCase());
		case 'trimLines':
			return byLine(text, (lines) => lines.map((line) => line.trim()));
		case 'removeEmptyLines':
			return byLine(text, (lines) => lines.filter((line) => line.trim() !== ''));
		case 'dedupe':
			return byLine(text, (lines) => [...new Set(lines)]);
		case 'sortAsc':
			return byLine(text, (lines) => [...lines].sort((a, b) => a.localeCompare(b, 'zh-CN')));
		case 'sortDesc':
			return byLine(text, (lines) => [...lines].sort((a, b) => b.localeCompare(a, 'zh-CN')));
		case 'reverseLines':
			return byLine(text, (lines) => [...lines].reverse());
		case 'numberLines':
			return byLine(text, (lines) => {
				const width = String(lines.length).length;
				return lines.map((line, index) => `${String(index + 1).padStart(width, ' ')}  ${line}`);
			});
		case 'collapseSpaces':
			return text.replace(/[ \t]{2,}/g, ' ');
		default:
			return text;
	}
}

/** 按码点截断，避免把一个 emoji 或代理对从中间劈开 */
export function truncate(text: string, length: number, suffix = '…'): string {
	const points = [...text];
	if (length <= 0 || points.length <= length) return text;
	return points.slice(0, length).join('') + suffix;
}

export interface RandomTextOptions {
	chinese: boolean;
	english: boolean;
	numbers: boolean;
	symbols: boolean;
}

const POOLS = {
	chinese: '的一是在不了有和人这中大为上个国我以要他时来用们生到作地于出就分对成会可主发年动同工也能下过子说产种面而方后多定行学法所民得经十三之进着等部度家电力里如水化高自二理起小物现实加量都两体制机当使点从业本去把性好应开它合还因由其些然前外天政四日那社义事平形相全表间样与关各重新线内数正心反你明看原又么利比或但质气第向道命此变条只没结解问意建月公无系军很情者最立代想已通并提直题党程展五果料象员革位入常文总次品式活设及管特件长求老头基资边流路级少图山统接知较将组见计别她手角期根论运农指几九区强放决西被干做必战先回则任取据处队南给色光门即保治北造百规热领七海口东导器压志世金增争济阶油思术极交受联什认六共权收证改清己美再采转更单风切打白教速花带安场身车例真务具万每目至达走积示议声报斗完类八离华名确才科张信马节话米整空元况今集温传土许步群广石记需段研界拉林律叫且究观越织装影算低持音众书布复容儿须际商非验连断深难近矿千周委素技备半办青省列习响约支般史感劳便团往酸历市克何除消构府称太准精值号率族维划选标写存候毛亲快效斯院查江型眼王按格养易置派层片始却专状育厂京识适属圆包火住调满县局照参红细引听该铁价严龙飞',
	english: 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ',
	numbers: '0123456789',
	symbols: '!@#$%^&*()-_=+[]{};:,.<>?/',
} as const;

export function randomText(length: number, options: RandomTextOptions): string {
	const pool = (Object.keys(POOLS) as Array<keyof typeof POOLS>)
		.filter((key) => options[key])
		.map((key) => POOLS[key])
		.join('');

	if (!pool) return '';

	const size = Math.min(Math.max(Math.trunc(length) || 0, 1), 5000);
	const chars = [...pool];
	return Array.from(
		{ length: size },
		() => chars[Math.floor(Math.random() * chars.length)],
	).join('');
}
