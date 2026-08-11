/**
 * 工作台交互：侧边锚点高亮、启动命令复制、回到顶部。
 * 与 site-chrome 保持同一套生命周期约定，按 astro:page-load 重新绑定，
 * 以兼容 ClientRouter 的软导航（否则从其它页面返回工作台后监听会全部失效）。
 */
import { copyText } from '../lib/clipboard';

const COPY_FEEDBACK_MS = 1800;
const SCROLL_TOP_THRESHOLD = 420;

function bindCopyButtons(signal: AbortSignal, timers: Set<number>) {
	document.querySelectorAll<HTMLButtonElement>('[data-copy]').forEach((btn) => {
		const label = btn.querySelector('span');
		const original = label?.textContent ?? '';

		btn.addEventListener(
			'click',
			async () => {
				const command = btn.dataset.copy;
				if (!command) return;

				const ok = await copyText(command);
				btn.dataset.state = ok ? 'done' : 'fail';
				if (label) label.textContent = ok ? '已复制' : '复制失败';

				const timer = window.setTimeout(() => {
					delete btn.dataset.state;
					if (label) label.textContent = original;
					timers.delete(timer);
				}, COPY_FEEDBACK_MS);
				timers.add(timer);
			},
			{ signal },
		);
	});
}

function bindScrollTop(signal: AbortSignal) {
	const btn = document.querySelector<HTMLButtonElement>('[data-scroll-top]');
	if (!btn) return;

	const sync = () => {
		btn.hidden = window.scrollY < SCROLL_TOP_THRESHOLD;
	};

	window.addEventListener('scroll', sync, { passive: true, signal });
	btn.addEventListener(
		'click',
		() => {
			const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
			window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' });
		},
		{ signal },
	);
	sync();
}

function boot(): () => void {
	const controller = new AbortController();
	const { signal } = controller;
	const timers = new Set<number>();

	bindCopyButtons(signal, timers);
	bindScrollTop(signal);

	return () => {
		controller.abort();
		timers.forEach((timer) => window.clearTimeout(timer));
		timers.clear();
	};
}

declare global {
	interface Window {
		__workstationStarted?: boolean;
		__workstationCleanup?: () => void;
	}
}

export function startWorkstation() {
	if (window.__workstationStarted) return;
	window.__workstationStarted = true;

	const start = () => {
		window.__workstationCleanup?.();
		// 工作台之外的页面没有这些节点，boot 内部的查询会自然返回空集合
		window.__workstationCleanup = boot();
	};

	document.addEventListener('astro:page-load', start);
	document.addEventListener('astro:before-swap', () => {
		window.__workstationCleanup?.();
		window.__workstationCleanup = undefined;
	});
	start();
}

startWorkstation();
