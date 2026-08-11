/**
 * 工具箱纯逻辑自检：npm run check:tools
 *
 * 这些逻辑没有 DOM 依赖，所以能直接在 Node 里跑断言，不必开浏览器。
 * 迁移剩余工具或改动解析逻辑时先跑一遍，避免回归。
 */
import { formatJson, highlightJson, minifyJson, parseJson } from '../src/lib/tools/json.ts';
import { breakdown, parseTimeInput } from '../src/lib/tools/time.ts';
import { decode, parseUrl } from '../src/lib/tools/url.ts';

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

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
