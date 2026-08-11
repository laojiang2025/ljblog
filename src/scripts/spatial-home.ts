/**
 * SpatialHome：桌面端无限画布（拖拽 / 滚轮 / 方向键），移动端退化为纵向文档流。
 * 设计取自 jasonai.me 的节点图交互模型，品牌与视觉独立实现。
 */
const SPATIAL_MQ = '(min-width: 64rem) and (pointer: fine)';
const REDUCE_MQ = '(prefers-reduced-motion: reduce)';

/**
 * 节点集合由模板决定，脚本不再持有硬编码清单：
 * 分区节点是从工作台数据循环渲染的，增删分区不该反过来要求改这个文件。
 */
type HomeNodeId = string;

type Point = { x: number; y: number };

function isNodeId(value: string | null | undefined): value is HomeNodeId {
	if (!value) return false;
	// 取值可能来自 URL hash，属外部输入，进选择器前必须转义
	return !!document.querySelector(`[data-home-node="${CSS.escape(value)}"]`);
}

function isPanelId(value: string | null | undefined): value is 'wechat' {
	return value === 'wechat';
}

/** 正交折线：水平 → 垂直 → 水平，中间用小圆角过渡 */
function buildElbowPath(from: Point, to: Point, radius = 8): string {
	if (Math.abs(from.y - to.y) < 1) return `M ${from.x} ${from.y} H ${to.x}`;
	const midX = from.x + (to.x - from.x) / 2;
	const dir = to.y > from.y ? 1 : -1;
	const r = Math.min(radius, Math.abs(to.y - from.y) / 2, Math.abs(to.x - from.x) / 4);
	return [
		`M ${from.x} ${from.y}`,
		`H ${midX - r}`,
		`Q ${midX} ${from.y} ${midX} ${from.y + dir * r}`,
		`V ${to.y - dir * r}`,
		`Q ${midX} ${to.y} ${midX + r} ${to.y}`,
		`H ${to.x}`,
	].join(' ');
}

function setHash(nodeEl: HTMLElement | null, mode: 'push' | 'replace') {
	const url = new URL(window.location.href);
	url.hash = nodeEl ? nodeEl.id : '';
	history[`${mode}State`](history.state, '', url);
}

function readHashNode(): HomeNodeId | null {
	const raw = decodeURIComponent(window.location.hash.replace(/^#/, ''));
	if (!raw) return null;
	const node = document.getElementById(raw)?.dataset.homeNode ?? null;
	return isNodeId(node) ? node : null;
}

function isInteractiveTarget(target: EventTarget | null): boolean {
	return (
		target instanceof Element &&
		!!target.closest('a, button, input, textarea, select, summary, dialog, [data-no-pan]')
	);
}

function bootSpatial(root: HTMLElement) {
	const map = root.querySelector<HTMLElement>('[data-home-map]');
	const scene = root.querySelector<HTMLElement>('[data-home-scene]');
	const connectors = root.querySelector<SVGSVGElement>('[data-home-connectors]');
	const drawer = root.querySelector<HTMLDialogElement>('[data-detail-drawer]');
	const drawerTitle = drawer?.querySelector<HTMLElement>('[data-detail-drawer-title]');
	const closeDrawerBtn = drawer?.querySelector<HTMLButtonElement>('[data-close-detail-drawer]');
	if (!map || !scene || !connectors) return () => {};

	const controller = new AbortController();
	const { signal } = controller;
	const spatialMq = window.matchMedia(SPATIAL_MQ);
	const reduceMq = window.matchMedia(REDUCE_MQ);

	const nodes = new Map<HomeNodeId, HTMLElement>();
	root.querySelectorAll<HTMLElement>('[data-home-node]').forEach((el) => {
		const id = el.dataset.homeNode;
		if (id) nodes.set(id, el);
	});

	let camera: Point = { x: 0, y: 0 };
	let target: Point = { x: 0, y: 0 };
	let bounds = { minX: 0, maxX: 0, minY: 0, maxY: 0 };
	let raf = 0;
	let focusAfterMove: HTMLElement | null = null;
	let activeNode: HomeNodeId | null = null;
	let hoverNode: HomeNodeId | null = null;
	let spatialSession: { controller: AbortController; resizeObserver: ResizeObserver } | null =
		null;
	let drawerReturnFocus: HTMLElement | null = null;
	let drawerCloseTimer = 0;

	const clamp = (point: Point): Point => ({
		x: Math.min(bounds.maxX, Math.max(bounds.minX, point.x)),
		y: Math.min(bounds.maxY, Math.max(bounds.minY, point.y)),
	});

	const paintCamera = () => {
		scene.style.transform = `translate3d(${camera.x}px, ${camera.y}px, 0)`;
		map.style.setProperty('--canvas-x', `${camera.x}px`);
		map.style.setProperty('--canvas-y', `${camera.y}px`);
	};

	const stopTween = () => {
		if (!raf) return;
		cancelAnimationFrame(raf);
		raf = 0;
	};

	const finishFocus = () => {
		focusAfterMove?.focus({ preventScroll: true });
		focusAfterMove = null;
	};

	const tweenStep = () => {
		const dx = target.x - camera.x;
		const dy = target.y - camera.y;
		if (reduceMq.matches || (Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5)) {
			camera = { ...target };
			paintCamera();
			raf = 0;
			finishFocus();
			return;
		}
		// 缓动系数：越接近目标越慢，避免生硬跳切
		camera = { x: camera.x + dx * 0.16, y: camera.y + dy * 0.16 };
		paintCamera();
		raf = requestAnimationFrame(tweenStep);
	};

	const moveTo = (point: Point, opts: { immediate?: boolean; focus?: HTMLElement | null } = {}) => {
		target = clamp(point);
		focusAfterMove = opts.focus ?? null;
		stopTween();
		if (opts.immediate || reduceMq.matches) {
			camera = { ...target };
			paintCamera();
			finishFocus();
			return;
		}
		raf = requestAnimationFrame(tweenStep);
	};

	const syncChrome = () => {
		root.querySelectorAll<HTMLElement>('[data-home-edge]').forEach((edge) => {
			const highlight =
				activeNode !== null &&
				(edge.dataset.edgeFrom === activeNode || edge.dataset.edgeTo === activeNode);
			edge.classList.toggle('is-active', highlight);
			edge
				.querySelector('[data-edge-motion]')
				?.setAttribute('dur', highlight ? '3s' : '6s');
		});
		root.querySelectorAll<HTMLButtonElement>('[data-home-target]').forEach((btn) => {
			const on = btn.dataset.homeTarget === activeNode;
			btn.toggleAttribute('data-active', on);
			if (on) btn.setAttribute('aria-current', 'location');
			else btn.removeAttribute('aria-current');
		});
	};

	const setActive = (id: HomeNodeId | null) => {
		activeNode = id;
		syncChrome();
	};

	const redrawEdges = () => {
		const sceneBox = scene.getBoundingClientRect();
		root.querySelectorAll<HTMLElement>('[data-home-edge]').forEach((edge) => {
			// 连线重绘会跟着尺寸变化频繁触发，直接查已建好的节点表，不走选择器
			const fromEl = edge.dataset.edgeFrom ? nodes.get(edge.dataset.edgeFrom) : undefined;
			const toEl = edge.dataset.edgeTo ? nodes.get(edge.dataset.edgeTo) : undefined;
			if (!fromEl || !toEl) return;
			const a = fromEl.getBoundingClientRect();
			const b = toEl.getBoundingClientRect();
			const from = {
				x: a.right - sceneBox.left,
				y: a.top - sceneBox.top + a.height / 2,
			};
			const to = {
				x: b.left - sceneBox.left,
				y: b.top - sceneBox.top + b.height / 2,
			};
			const d = buildElbowPath(from, to);
			edge.querySelector('[data-edge-path]')?.setAttribute('d', d);
			edge.querySelector('[data-edge-motion]')?.setAttribute('path', d);
		});
	};

	const layoutScene = () => {
		const sceneBox = scene.getBoundingClientRect();
		const boxes = [...nodes.values()].map((el) => {
			const box = el.getBoundingClientRect();
			return {
				right: box.right - sceneBox.left,
				bottom: box.bottom - sceneBox.top,
			};
		});
		if (!boxes.length) return;

		const padX = Math.max(160, map.clientWidth * 0.42);
		const padY = Math.max(160, map.clientHeight * 0.4);
		const width = Math.ceil(Math.max(...boxes.map((b) => b.right)) + padX);
		const height = Math.ceil(Math.max(...boxes.map((b) => b.bottom)) + padY);
		scene.style.width = `${width}px`;
		scene.style.height = `${height}px`;
		connectors.setAttribute('viewBox', `0 0 ${width} ${height}`);
		bounds = {
			minX: Math.min(0, map.clientWidth - width),
			maxX: 0,
			minY: Math.min(0, map.clientHeight - height),
			maxY: 0,
		};
		camera = clamp(camera);
		target = clamp(target);
		paintCamera();
		redrawEdges();
	};

	const centerOnElement = (el: HTMLElement): Point => {
		const sceneBox = scene.getBoundingClientRect();
		const box = el.getBoundingClientRect();
		const left = box.left - sceneBox.left;
		const top = box.top - sceneBox.top;
		return clamp({
			x: map.clientWidth / 2 - (left + box.width / 2),
			y: map.clientHeight / 2 - (top + box.height / 2),
		});
	};

	/** 起点：人物节点偏左上，而不是死板居中 */
	const originCamera = (): Point => {
		const person = nodes.get('person_lj');
		if (!person) return { x: 0, y: 0 };
		const sceneBox = scene.getBoundingClientRect();
		const box = person.getBoundingClientRect();
		const left = box.left - sceneBox.left;
		const top = box.top - sceneBox.top;
		const offsetX = Math.max(160, map.clientWidth * 0.18);
		const offsetY = Math.max(175, map.clientHeight / 2 - box.height / 2 - 80);
		return clamp({ x: offsetX - left, y: offsetY - top });
	};

	const focusNode = (
		id: HomeNodeId,
		opts: { updateUrl?: boolean; immediate?: boolean; focus?: boolean } = {},
	) => {
		const el = nodes.get(id);
		if (!el) return;
		setActive(id);
		if (opts.updateUrl) setHash(el, 'push');
		if (map.dataset.mode === 'spatial') {
			moveTo(centerOnElement(el), {
				immediate: opts.immediate,
				focus: opts.focus ? el : null,
			});
			return;
		}
		el.scrollIntoView({
			behavior: reduceMq.matches ? 'auto' : 'smooth',
			block: 'start',
		});
		if (opts.focus) el.focus({ preventScroll: true });
	};

	const syncFromLocation = (immediate = false) => {
		const hashNode = readHashNode();
		if (hashNode) {
			focusNode(hashNode, { immediate });
			return;
		}
		setActive(null);
		if (map.dataset.mode === 'spatial') moveTo(originCamera(), { immediate });
	};

	const teardownSpatial = () => {
		stopTween();
		spatialSession?.controller.abort();
		spatialSession?.resizeObserver.disconnect();
		spatialSession = null;
		document.body.classList.remove('has-spatial-home');
		map.dataset.mode = 'linear';
		map.removeAttribute('data-dragging');
		map.style.removeProperty('--canvas-x');
		map.style.removeProperty('--canvas-y');
		scene.style.removeProperty('transform');
		scene.style.removeProperty('width');
		scene.style.removeProperty('height');
		camera = { x: 0, y: 0 };
		target = { x: 0, y: 0 };
	};

	const setupSpatial = () => {
		teardownSpatial();
		map.dataset.mode = 'spatial';
		document.body.classList.add('has-spatial-home');

		const local = new AbortController();
		const localSignal = local.signal;
		const resizeObserver = new ResizeObserver(() => requestAnimationFrame(layoutScene));
		spatialSession = { controller: local, resizeObserver };

		requestAnimationFrame(() => {
			layoutScene();
			syncFromLocation(true);
		});
		resizeObserver.observe(map);
		nodes.forEach((el) => resizeObserver.observe(el));

		let pointerId: number | null = null;
		let start: Point = { x: 0, y: 0 };
		let origin: Point = { x: 0, y: 0 };
		let dragging = false;

		map.addEventListener(
			'pointerdown',
			(event) => {
				if (event.button !== 0 || isInteractiveTarget(event.target)) return;
				pointerId = event.pointerId;
				start = { x: event.clientX, y: event.clientY };
				origin = { ...camera };
				dragging = false;
				map.setPointerCapture(event.pointerId);
				stopTween();
			},
			{ signal: localSignal },
		);

		map.addEventListener(
			'pointermove',
			(event) => {
				if (pointerId !== event.pointerId) return;
				const dx = event.clientX - start.x;
				const dy = event.clientY - start.y;
				if (!dragging && Math.hypot(dx, dy) < 6) return;
				dragging = true;
				map.setAttribute('data-dragging', 'true');
				camera = clamp({ x: origin.x + dx, y: origin.y + dy });
				target = { ...camera };
				paintCamera();
				event.preventDefault();
			},
			{ signal: localSignal },
		);

		const endPointer = (event: PointerEvent) => {
			if (pointerId !== event.pointerId) return;
			if (map.hasPointerCapture(event.pointerId)) map.releasePointerCapture(event.pointerId);
			pointerId = null;
			dragging = false;
			map.removeAttribute('data-dragging');
		};
		map.addEventListener('pointerup', endPointer, { signal: localSignal });
		map.addEventListener('pointercancel', endPointer, { signal: localSignal });

		map.addEventListener(
			'wheel',
			(event) => {
				if (event.ctrlKey || event.metaKey) return;
				const scale =
					event.deltaMode === WheelEvent.DOM_DELTA_LINE
						? 16
						: event.deltaMode === WheelEvent.DOM_DELTA_PAGE
							? map.clientHeight
							: 1;
				const dx = event.deltaX * scale;
				const dy = event.deltaY * scale;
				const preferX = Math.abs(dx) > 0.5;
				target = clamp({
					x: target.x - (preferX ? dx : dy),
					y: target.y - (preferX ? dy : 0),
				});
				event.preventDefault();
				stopTween();
				raf = requestAnimationFrame(tweenStep);
			},
			{ passive: false, signal: localSignal },
		);

		map.addEventListener(
			'keydown',
			(event) => {
				if (event.target !== map) return;
				let next = { ...target };
				switch (event.key) {
					case 'ArrowLeft':
						next.x += 180;
						break;
					case 'ArrowRight':
						next.x -= 180;
						break;
					case 'ArrowUp':
						next.y += 180;
						break;
					case 'ArrowDown':
						next.y -= 180;
						break;
					case 'Home':
						moveTo(originCamera());
						setHash(null, 'push');
						setActive(null);
						event.preventDefault();
						return;
					default:
						return;
				}
				moveTo(next);
				event.preventDefault();
			},
			{ signal: localSignal },
		);
	};

	const openDrawer = (panel: 'wechat', returnFocus: HTMLElement | null = null) => {
		if (!drawer) return;
		drawerReturnFocus = returnFocus;
		drawer.dataset.panel = panel;
		if (drawerTitle) drawerTitle.textContent = '频道详情';
		drawer.querySelectorAll<HTMLElement>('[data-drawer-panel]').forEach((el) => {
			el.hidden = el.dataset.drawerPanel !== panel;
		});
		if (!drawer.open) {
			drawer.showModal();
			requestAnimationFrame(() => closeDrawerBtn?.focus());
		}
	};

	const closeDrawer = () => {
		if (!drawer?.open) return;
		window.clearTimeout(drawerCloseTimer);
		const restore = drawerReturnFocus;
		drawer.close();
		drawerReturnFocus = null;
		restore?.focus({ preventScroll: true });
	};

	root.querySelectorAll<HTMLButtonElement>('[data-home-target]').forEach((btn) => {
		btn.addEventListener(
			'click',
			() => {
				const id = btn.dataset.homeTarget;
				if (isNodeId(id)) focusNode(id, { updateUrl: true, focus: true });
			},
			{ signal },
		);
	});

	root.querySelectorAll<HTMLButtonElement>('[data-open-home-panel]').forEach((btn) => {
		btn.addEventListener(
			'click',
			() => {
				const panel = btn.dataset.openHomePanel;
				if (isPanelId(panel)) openDrawer(panel, btn);
			},
			{ signal },
		);
	});

	closeDrawerBtn?.addEventListener('click', closeDrawer, { signal });
	drawer?.addEventListener(
		'cancel',
		(event) => {
			event.preventDefault();
			closeDrawer();
		},
		{ signal },
	);
	drawer?.addEventListener(
		'click',
		(event) => {
			if (event.target === drawer) closeDrawer();
		},
		{ signal },
	);

	root.querySelector('[data-home-origin]')?.addEventListener(
		'click',
		() => {
			setHash(null, 'push');
			setActive(null);
			if (map.dataset.mode === 'spatial') moveTo(originCamera(), { focus: map });
			else root.scrollIntoView({ behavior: reduceMq.matches ? 'auto' : 'smooth' });
		},
		{ signal },
	);

	map.addEventListener(
		'pointerover',
		(event) => {
			const id =
				event.target instanceof Element
					? event.target.closest<HTMLElement>('[data-home-node]')?.dataset.homeNode
					: null;
			hoverNode = isNodeId(id) ? id : null;
			if (hoverNode) {
				root.querySelectorAll<HTMLElement>('[data-home-edge]').forEach((edge) => {
					const on =
						edge.dataset.edgeFrom === hoverNode || edge.dataset.edgeTo === hoverNode;
					edge.classList.toggle('is-active', on || edge.dataset.edgeFrom === activeNode || edge.dataset.edgeTo === activeNode);
				});
			} else {
				syncChrome();
			}
		},
		{ signal },
	);

	map.addEventListener(
		'focusin',
		(event) => {
			const id =
				event.target instanceof Element
					? event.target.closest<HTMLElement>('[data-home-node]')?.dataset.homeNode
					: null;
			if (isNodeId(id)) setActive(id);
		},
		{ signal },
	);

	const applyMode = () => {
		if (spatialMq.matches) setupSpatial();
		else {
			teardownSpatial();
			requestAnimationFrame(() => syncFromLocation(true));
		}
	};

	spatialMq.addEventListener('change', applyMode, { signal });
	reduceMq.addEventListener(
		'change',
		() => {
			map.toggleAttribute('data-reduced-motion', reduceMq.matches);
			if (reduceMq.matches) moveTo(target, { immediate: true });
		},
		{ signal },
	);
	window.addEventListener('hashchange', () => syncFromLocation(), { signal });
	window.addEventListener('popstate', () => syncFromLocation(), { signal });

	map.toggleAttribute('data-reduced-motion', reduceMq.matches);
	applyMode();

	return () => {
		teardownSpatial();
		window.clearTimeout(drawerCloseTimer);
		closeDrawer();
		controller.abort();
	};
}

declare global {
	interface Window {
		__homeExperienceStarted?: boolean;
		__homeExperienceCleanup?: () => void;
	}
}

export function startHomeExperience() {
	if (window.__homeExperienceStarted) return;
	window.__homeExperienceStarted = true;

	const boot = () => {
		window.__homeExperienceCleanup?.();
		const root = document.querySelector<HTMLElement>('[data-home-experience]');
		window.__homeExperienceCleanup = root ? bootSpatial(root) : undefined;
	};

	document.addEventListener('astro:page-load', boot);
	document.addEventListener('astro:before-swap', () => {
		window.__homeExperienceCleanup?.();
		window.__homeExperienceCleanup = undefined;
	});
	boot();
}

startHomeExperience();
