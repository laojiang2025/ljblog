/**
 * 站点壳交互：主题切换 + 移动端导航。
 * 独立于 SpatialHome，避免首页逻辑污染全站。
 */
const THEME_KEY = 'theme';
const DARK_MQ = '(prefers-color-scheme: dark)';
const DESKTOP_MQ = '(min-width: 48rem)';

function readStoredTheme(): 'light' | 'dark' | null {
	try {
		const value = localStorage.getItem(THEME_KEY);
		return value === 'light' || value === 'dark' ? value : null;
	} catch {
		return null;
	}
}

function systemTheme(): 'light' | 'dark' {
	return window.matchMedia(DARK_MQ).matches ? 'dark' : 'light';
}

function currentTheme(): 'light' | 'dark' {
	return document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light';
}

function applyTheme(theme: 'light' | 'dark', root: HTMLElement = document.documentElement) {
	root.dataset.theme = theme;
	root.style.colorScheme = theme;
}

function syncToggleLabels(doc: Document, theme: 'light' | 'dark') {
	const next = theme === 'dark' ? 'light' : 'dark';
	const label = next === 'dark' ? '切换到深色模式' : '切换到浅色模式';
	doc.querySelectorAll('[data-theme-toggle]').forEach((el) => {
		el.setAttribute('aria-label', label);
		el.setAttribute('title', label);
		el.setAttribute('aria-pressed', String(theme === 'dark'));
	});
}

function bootChrome(doc: Document) {
	const controller = new AbortController();
	const { signal } = controller;
	const body = doc.body;
	const mobileNav = doc.querySelector<HTMLDialogElement>('[data-mobile-nav]');
	const openBtn = doc.querySelector<HTMLButtonElement>('[data-open-mobile-nav]');
	const closeBtn = mobileNav?.querySelector<HTMLButtonElement>('[data-close-mobile-nav]');
	const darkMq = window.matchMedia(DARK_MQ);
	const desktopMq = window.matchMedia(DESKTOP_MQ);
	let lastFocus: HTMLElement | null = null;

	const refresh = () => {
		const theme = readStoredTheme() ?? systemTheme();
		applyTheme(theme);
		syncToggleLabels(doc, theme);
	};

	const closeNav = (restore = true) => {
		if (!mobileNav?.open) return;
		mobileNav.close();
		body.removeAttribute('data-scroll-lock');
		if (restore) lastFocus?.focus();
	};

	refresh();

	doc.querySelectorAll('[data-theme-toggle]').forEach((btn) => {
		btn.addEventListener(
			'click',
			() => {
				const next = currentTheme() === 'dark' ? 'light' : 'dark';
				try {
					localStorage.setItem(THEME_KEY, next);
				} catch {
					/* ignore quota / private mode */
				}
				applyTheme(next);
				syncToggleLabels(doc, next);
			},
			{ signal },
		);
	});

	darkMq.addEventListener(
		'change',
		() => {
			if (readStoredTheme() === null) refresh();
		},
		{ signal },
	);

	openBtn?.addEventListener(
		'click',
		() => {
			if (!mobileNav) return;
			lastFocus = openBtn;
			mobileNav.showModal();
			body.setAttribute('data-scroll-lock', 'true');
			requestAnimationFrame(() => closeBtn?.focus());
		},
		{ signal },
	);

	closeBtn?.addEventListener('click', () => closeNav(), { signal });
	mobileNav?.addEventListener('click', (event) => {
		if (event.target === mobileNav) closeNav();
	}, { signal });
	mobileNav?.addEventListener('close', () => body.removeAttribute('data-scroll-lock'), { signal });
	mobileNav?.querySelectorAll('a').forEach((link) => {
		link.addEventListener('click', () => closeNav(false), { signal });
	});
	desktopMq.addEventListener(
		'change',
		(event) => {
			if (event.matches) closeNav(false);
		},
		{ signal },
	);

	return () => {
		controller.abort();
		if (mobileNav?.open) mobileNav.close();
		body.removeAttribute('data-scroll-lock');
	};
}

declare global {
	interface Window {
		__siteChromeStarted?: boolean;
		__siteChromeCleanup?: () => void;
	}
}

export function startSiteChrome() {
	if (window.__siteChromeStarted) return;
	window.__siteChromeStarted = true;

	const boot = () => {
		window.__siteChromeCleanup?.();
		window.__siteChromeCleanup = bootChrome(document);
	};

	document.addEventListener('astro:page-load', boot);
	document.addEventListener('astro:before-swap', (event) => {
		window.__siteChromeCleanup?.();
		window.__siteChromeCleanup = undefined;
		const theme = readStoredTheme() ?? currentTheme();
		applyTheme(theme, event.newDocument.documentElement);
	});
	boot();
}

startSiteChrome();
