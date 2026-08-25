/**
 * 全站点击埋点：
 * - 事件委托捕获所有 <a>、<button> 与 [data-track] 元素的点击；
 * - 自动归类来源区块（header / nav / side-dock / footer / content）；
 * - 数据出口可插拔：配置了百度统计 ID 就上报百度（自定义事件 + SPA 翻页 PV），
 *   未配置时进入本地调试队列（window.__analyticsQueue + console），埋点结构不变。
 * 想换 GA / Umami 等平台时，只需在 dispatch() 里加一个出口。
 */
import { ANALYTICS } from '../consts';

export interface TrackEvent {
	category: string;
	action: string;
	label: string;
	page: string;
	ts: number;
}

declare global {
	interface Window {
		_hmt?: unknown[];
		__analyticsQueue?: TrackEvent[];
		__analyticsStarted?: boolean;
	}
}

function loadBaidu(id: string) {
	window._hmt = window._hmt || [];
	const script = document.createElement('script');
	script.async = true;
	script.src = `https://hm.baidu.com/hm.js?${id}`;
	document.head.appendChild(script);
}

function dispatch(event: TrackEvent) {
	(window.__analyticsQueue ??= []).push(event);
	// 百度统计：_trackEvent(category, action, label)
	window._hmt?.push(['_trackEvent', event.category, event.action, event.label]);
	if (ANALYTICS.debug) {
		console.debug('[track]', event.category, event.action, event.label, event.page);
	}
}

function categoryOf(el: Element): string {
	if (el.closest('[data-side-dock]')) return 'side-dock';
	if (el.closest('header')) return 'header';
	if (el.closest('[data-mobile-nav]')) return 'mobile-nav';
	if (el.closest('footer')) return 'footer';
	return 'content';
}

function labelOf(el: Element): string {
	const explicit = (el as HTMLElement).dataset?.track;
	if (explicit) return explicit;
	const aria = el.getAttribute('aria-label');
	if (aria) return aria;
	const text = (el.textContent ?? '').trim().replace(/\s+/g, ' ').slice(0, 60);
	if (text) return text;
	if (el instanceof HTMLAnchorElement && el.href) return el.href;
	return 'unknown';
}

function bindClicks() {
	document.addEventListener(
		'click',
		(event) => {
			const origin = event.target;
			if (!(origin instanceof Element)) return;
			const el = origin.closest('a, button, [data-track]');
			if (!el) return;
			const label = labelOf(el);
			const href = el instanceof HTMLAnchorElement ? el.getAttribute('href') ?? '' : '';
			dispatch({
				category: categoryOf(el),
				action: 'click',
				label: href && href !== label ? `${label} → ${href}` : label,
				page: location.pathname,
				ts: Date.now(),
			});
		},
		{ capture: true, passive: true },
	);
}

function bindSpaPageviews() {
	// hm.js 自带首屏 PV；这里只补 ClientRouter 的后续软导航
	let firstLoad = true;
	document.addEventListener('astro:page-load', () => {
		if (firstLoad) {
			firstLoad = false;
			return;
		}
		window._hmt?.push(['_trackPageview', location.pathname]);
		if (ANALYTICS.debug) console.debug('[track] pageview', location.pathname);
	});
}

/** 站点代码优先取 consts 配置，其次取构建时环境变量 PUBLIC_BAIDU_ID（部署平台配置即可，无需改代码） */
function resolveBaiduId(): string {
	return ANALYTICS.baiduId || String(import.meta.env.PUBLIC_BAIDU_ID ?? '');
}

export function startAnalytics() {
	if (window.__analyticsStarted) return;
	window.__analyticsStarted = true;
	const baiduId = resolveBaiduId();
	if (baiduId) loadBaidu(baiduId);
	bindClicks();
	bindSpaPageviews();
}

startAnalytics();
