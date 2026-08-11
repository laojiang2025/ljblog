/**
 * 工具箱纯逻辑自检：npm run check:tools
 *
 * 这些逻辑没有 DOM 依赖，所以能直接在 Node 里跑断言，不必开浏览器。
 * 迁移剩余工具或改动解析逻辑时先跑一遍，避免回归。
 */
import { formatJson, highlightJson, minifyJson, parseJson } from '../src/lib/tools/json.ts';
import { breakdown, parseTimeInput } from '../src/lib/tools/time.ts';
import { decode, parseUrl } from '../src/lib/tools/url.ts';
import {
	generatePeople,
	idCardCheckCode,
	luhnCheckDigit,
	toCsv,
	PERSON_FIELDS,
} from '../src/lib/tools/person.ts';
import { analyze, randomText, transform, truncate } from '../src/lib/tools/text.ts';
import { diffLines } from '../src/lib/tools/diff.ts';

let pass = 0;
let fail = 0;

function check(name: string, actual: unknown, expected: unknown) {
	const a = JSON.stringify(actual);
	const e = JSON.stringify(expected);
	if (a === e) {
		pass += 1;
		console.log(`  ok   ${name}`);
	} else {
		fail += 1;
		console.log(`  FAIL ${name}\n       expected ${e}\n       actual   ${a}`);
	}
}

console.log('[json]');
const formatted = formatJson('{"b":1,"a":[1,2]}');
check('format', formatted.ok && formatted.value, '{\n  "b": 1,\n  "a": [\n    1,\n    2\n  ]\n}');
const minified = minifyJson('{ "a" : 1 }');
check('minify', minified.ok && minified.value, '{"a":1}');

// 定位不依赖引擎报错文案，各浏览器下应一致
const locateCases: Array<[string, number, number]> = [
	['{"a": }', 1, 7],
	['{"a": 1,}', 1, 9],
	['{"a" 1}', 1, 6],
	['{\n  "a": 1,\n  "b": \n}', 4, 1],
	['{"name":"x","list":[1,2,,3]}', 1, 25],
	['[1,,2,3]', 1, 4],
	["{'a': 1}", 1, 2],
	['{"a": 1} trailing', 1, 10],
	['{"a": "unclosed}', 1, 17],
	['{"a": 01}', 1, 8],
	['{"a": "bad \\q escape"}', 1, 12],
	['[\n  1,\n  2\n', 3, 4],
	['\n\n{"a" 1}', 3, 6],
];
for (const [source, line, column] of locateCases) {
	const result = parseJson(source);
	check(
		`locate ${JSON.stringify(source)}`,
		result.ok === false && [result.error.line, result.error.column],
		[line, column],
	);
}
check('empty rejected', parseJson('   ').ok, false);
check('valid multiline accepted', parseJson('{\n "a": [1, {"b": null}]\n}').ok, true);

const xss = highlightJson('{"a": "<img src=x onerror=alert(1)>"}');
check('xss: no raw tag', xss.includes('<img'), false);
check('xss: escaped', xss.includes('&lt;img'), true);
check('xss: only span markup', /<(?!\/?span)/.test(xss), false);
check('xss: quotes escaped', xss.includes('&quot;'), true);

console.log('[time]');
check('10-digit as seconds', parseTimeInput('1767225600')?.getTime(), 1767225600000);
check('13-digit as millis', parseTimeInput('1767225600123')?.getTime(), 1767225600123);
check('space-separated date', parseTimeInput('2026-01-01 12:00:00') instanceof Date, true);
check('garbage rejected', parseTimeInput('not-a-date'), null);
const parts = breakdown(new Date(1767225600000));
check('seconds field', parts.seconds, 1767225600);
check('iso field', parts.iso, '2026-01-01T00:00:00.000Z');

console.log('[url]');
const parsed = parseUrl('https://example.com:8443/a/b?q=astro&page=2#frag');
check('protocol', parsed.ok && parsed.value.protocol, 'https');
check('port', parsed.ok && parsed.value.port, '8443');
check('params', parsed.ok && parsed.value.params, [
	{ key: 'q', value: 'astro' },
	{ key: 'page', value: '2' },
]);
const bare = parseUrl('example.com/x');
check('protocol-less gets https', bare.ok && bare.value.origin, 'https://example.com');
check('empty rejected', parseUrl('  ').ok, false);
check('bad escape rejected', decode('%E0%A4%A').ok, false);

console.log('[person]');
const people = generatePeople(50, PERSON_FIELDS);
check('count', people.length, 50);
check('count clamped to at least 1', generatePeople(0, ['name']).length, 1);
check('only requested fields', Object.keys(generatePeople(1, ['name', 'phone'])[0]).sort(), [
	'name',
	'phone',
]);
check(
	'id card checksum valid',
	people.every((p) => idCardCheckCode(p.idCard!.slice(0, 17)) === p.idCard!.slice(17)),
	true,
);
check(
	'id card birthday matches field',
	people.every((p) => p.idCard!.slice(6, 14) === p.birthday!.replace(/-/g, '')),
	true,
);
check(
	'id card gender digit matches field',
	people.every((p) => (Number(p.idCard![16]) % 2 === 1 ? '男' : '女') === p.gender),
	true,
);
check(
	'bank card passes luhn',
	people.every((p) => luhnCheckDigit(p.bankCard!.slice(0, -1)) === p.bankCard!.slice(-1)),
	true,
);
check(
	'bank card length 16-19',
	people.every((p) => p.bankCard!.length >= 16 && p.bankCard!.length <= 19),
	true,
);
check(
	'phone is 11 digits',
	people.every((p) => /^1\d{10}$/.test(p.phone!)),
	true,
);
const csv = toCsv([{ name: 'a,b', address: 'has "quote"' }], ['name', 'address']);
check('csv escapes comma and quote', csv.split('\n')[1], '"a,b","has ""quote"""');

console.log('[text]');
const stats = analyze('hello world\n\n你好 世界');
check('chars counts code points', analyze('a😀').chars, 2);
check('words mixes zh and en', stats.words, 6);
check('paragraphs', stats.paragraphs, 2);
check('bytes utf8', analyze('你好').bytes, 6);
check('dedupe', transform('a\nb\na', 'dedupe'), 'a\nb');
check('sortAsc', transform('c\na\nb', 'sortAsc'), 'a\nb\nc');
check('removeEmptyLines', transform('a\n\n \nb', 'removeEmptyLines'), 'a\nb');
check('numberLines pads', transform('x\ny', 'numberLines'), '1  x\n2  y');
check('capitalize', transform('hello world', 'capitalize'), 'Hello World');
check('truncate keeps emoji intact', truncate('😀😀😀', 2, ''), '😀😀');
check('truncate no-op when short', truncate('abc', 10), 'abc');
check('randomText length', [...randomText(20, { chinese: true, english: false, numbers: false, symbols: false })].length, 20);
check(
	'randomText empty pool',
	randomText(10, { chinese: false, english: false, numbers: false, symbols: false }),
	'',
);

console.log('[diff]');
const same = diffLines('a\nb', 'a\nb');
check('identical has no changes', [same.stats.added, same.stats.removed], [0, 0]);
const changed = diffLines('a\nb\nc', 'a\nx\nc');
check('one line replaced', [changed.stats.added, changed.stats.removed], [1, 1]);
check(
	'unchanged lines keep both numbers',
	changed.rows.filter((r) => r.kind === 'equal').map((r) => [r.left, r.right]),
	[
		[1, 1],
		[3, 3],
	],
);
check('pure insert', diffLines('a\nc', 'a\nb\nc').stats, {
	added: 1,
	removed: 0,
	equal: 2,
	similarity: 2 / 3,
});
check('ignoreCase', diffLines('Abc', 'abc', { ignoreCase: true }).stats.added, 0);
check('ignoreWhitespace', diffLines('a  b', 'a b', { ignoreWhitespace: true }).stats.added, 0);
check('crlf normalized', diffLines('a\r\nb', 'a\nb').stats.added, 0);
check(
	'row order preserved',
	diffLines('a\nb', 'b').rows.map((r) => r.kind),
	['remove', 'equal'],
);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
