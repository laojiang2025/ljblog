/**
 * 生成默认社交分享图 public/og-default.png（1200×630）。
 * 配色取自 global.css 深色主题令牌，品牌文案取自 src/consts.ts，
 * 改品牌后跑 `npm run og` 重新生成一次即可。
 */
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import sharp from 'sharp';
import { SITE } from '../src/consts.ts';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const outFile = path.join(root, 'public', 'og-default.png');

const FONTS = `'Segoe UI', 'Microsoft YaHei', 'PingFang SC', 'Noto Sans CJK SC', sans-serif`;
const MONO = `'JetBrains Mono', 'Cascadia Code', Consolas, monospace`;

const esc = (s) =>
	String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const tags = SITE.tags.slice(0, 4);
const tagPills = tags
	.map((tag, i) => {
		const x = 96 + tags.slice(0, i).reduce((w, t) => w + t.length * 15 + 66, 0);
		const width = tag.length * 15 + 46;
		return `
			<g>
				<rect x="${x}" y="486" width="${width}" height="52" rx="26" fill="rgba(85,201,175,0.14)" stroke="#29433a"/>
				<text x="${x + width / 2}" y="520" text-anchor="middle" font-family="${MONO}" font-size="22" fill="#55c9af">${esc(tag)}</text>
			</g>`;
	})
	.join('');

const svg = `<svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
	<defs>
		<radialGradient id="glow" cx="86%" cy="8%" r="90%">
			<stop offset="0%" stop-color="rgba(85,201,175,0.22)"/>
			<stop offset="52%" stop-color="rgba(85,201,175,0.05)"/>
			<stop offset="100%" stop-color="rgba(85,201,175,0)"/>
		</radialGradient>
	</defs>

	<rect width="1200" height="630" fill="#0b1512"/>
	<rect width="1200" height="630" fill="url(#glow)"/>
	<rect x="24" y="24" width="1152" height="582" rx="30" fill="none" stroke="#29433a" stroke-width="2"/>

	<!-- 品牌块 -->
	<rect x="96" y="96" width="96" height="96" rx="24" fill="#55c9af"/>
	<text x="144" y="158" text-anchor="middle" font-family="${MONO}" font-size="42" font-weight="700" fill="#0b1512">${esc(SITE.author)}</text>

	<!-- 标题与标语 -->
	<text x="96" y="330" font-family="${FONTS}" font-size="104" font-weight="800" fill="#edf5f1">${esc(SITE.title)}</text>
	<text x="96" y="398" font-family="${FONTS}" font-size="40" font-weight="600" fill="#55c9af" letter-spacing="6">${esc(SITE.label)}</text>
	<text x="96" y="452" font-family="${FONTS}" font-size="28" fill="#a6b9b0">${esc(SITE.description)}</text>

	${tagPills}
</svg>`;

await sharp(Buffer.from(svg)).png({ compressionLevel: 9 }).toFile(outFile);
const { width, height, size } = await sharp(outFile).metadata();
console.log(`og-default.png 已生成：${width}×${height}，${Math.round((size ?? 0) / 1024)} KB`);
