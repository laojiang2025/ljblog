import type { APIContext } from 'astro';
import { SITE } from '../consts';

/** robots.txt 也从站点唯一真源取域名，换域名零改动 */
export function GET(context: APIContext) {
	const site = context.site ?? new URL(SITE.url);
	const body = [
		'User-agent: *',
		'Allow: /',
		'',
		`Sitemap: ${new URL('/sitemap-index.xml', site).href}`,
		'',
	].join('\n');

	return new Response(body, {
		headers: { 'Content-Type': 'text/plain; charset=utf-8' },
	});
}
