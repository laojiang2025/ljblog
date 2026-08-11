import { copyText } from '../../lib/clipboard';

const STATUS_RESET_MS = 2600;

let statusTimer: number | undefined;

export function setStatus(el: HTMLElement, message: string, tone: 'ok' | 'error') {
	el.textContent = message;
	el.dataset.tone = tone;
	window.clearTimeout(statusTimer);
	statusTimer = window.setTimeout(() => {
		el.textContent = '';
		delete el.dataset.tone;
	}, STATUS_RESET_MS);
}

export async function bindCopy(text: string, status: HTMLElement) {
	if (!text) {
		setStatus(status, '还没有可复制的内容', 'error');
		return;
	}
	const ok = await copyText(text);
	setStatus(status, ok ? '已复制到剪贴板' : '复制失败，请手动选择', ok ? 'ok' : 'error');
}

export function triggerDownload(content: string, filename: string, mime: string) {
	const url = URL.createObjectURL(new Blob([content], { type: mime }));
	const link = document.createElement('a');
	link.href = url;
	link.download = filename;
	document.body.appendChild(link);
	link.click();
	link.remove();
	URL.revokeObjectURL(url);
}

/**
 * 工具页统一的挂载方式：每次软导航先撤掉上一轮监听再重绑，
 * 与 site-chrome / workstation 的生命周期约定保持一致。
 */
export function mountTool(setup: (signal: AbortSignal) => void) {
	let cleanup: (() => void) | undefined;

	const start = () => {
		cleanup?.();
		const controller = new AbortController();
		setup(controller.signal);
		cleanup = () => controller.abort();
	};

	document.addEventListener('astro:page-load', start);
	document.addEventListener('astro:before-swap', () => {
		cleanup?.();
		cleanup = undefined;
	});

	start();
}
