/**
 * 工作台图标库：统一 24x24 viewBox 的描边型内联 SVG 片段。
 *
 * 之所以自持一份而不引图标包：站点目前零运行时依赖，为十来个图标引入
 * 图标库并不划算；集中在此处也保证了描边风格与 SiteHeader 既有图标一致。
 * 值全部是本仓库内的静态常量，故渲染侧用 set:html 注入不涉及外部输入。
 */
export const ICONS = {
	grid: '<rect x="3" y="3" width="7.5" height="7.5" rx="1.6"/><rect x="13.5" y="3" width="7.5" height="7.5" rx="1.6"/><rect x="3" y="13.5" width="7.5" height="7.5" rx="1.6"/><rect x="13.5" y="13.5" width="7.5" height="7.5" rx="1.6"/>',
	flask: '<path d="M9.5 3h5"/><path d="M10.5 3v6.2L5.6 17.8A2 2 0 0 0 7.3 21h9.4a2 2 0 0 0 1.7-3.2L13.5 9.2V3"/><path d="M8 15.5h8"/>',
	checklist:
		'<rect x="4" y="3" width="16" height="18" rx="2.2"/><path d="M8.5 8.5h7"/><path d="M8.5 12.5h7"/><path d="M8.5 16.5h4"/>',
	briefcase:
		'<rect x="3" y="7.5" width="18" height="12.5" rx="2.2"/><path d="M8.5 7.5v-2a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v2"/><path d="M3 13h18"/>',
	play: '<circle cx="12" cy="12" r="9"/><path d="M10.2 8.4 16 12l-5.8 3.6Z"/>',
	resume: '<rect x="3" y="4" width="18" height="16" rx="2.2"/><circle cx="9" cy="10" r="2.2"/><path d="M5.8 16.6c.7-1.9 1.9-2.8 3.2-2.8s2.5.9 3.2 2.8"/><path d="M15 9.5h3.5"/><path d="M15 13h3.5"/>',
	book: '<path d="M5 4.5A2 2 0 0 1 7 2.5h12v19H7a2 2 0 0 0-2 2Z"/><path d="M5 17.5h14"/>',
	compass: '<circle cx="12" cy="12" r="9"/><path d="m15.6 8.4-2.1 5.1-5.1 2.1 2.1-5.1Z"/>',
	database:
		'<ellipse cx="12" cy="6" rx="7.5" ry="3"/><path d="M4.5 6v12c0 1.7 3.4 3 7.5 3s7.5-1.3 7.5-3V6"/><path d="M4.5 12c0 1.7 3.4 3 7.5 3s7.5-1.3 7.5-3"/>',
	terminal: '<rect x="3" y="4" width="18" height="16" rx="2.2"/><path d="m7.5 9.5 3 2.5-3 2.5"/><path d="M13 15h4"/>',
	cpu: '<rect x="6.5" y="6.5" width="11" height="11" rx="2"/><path d="M10 2.5v4M14 2.5v4M10 17.5v4M14 17.5v4M2.5 10h4M2.5 14h4M17.5 10h4M17.5 14h4"/>',
	clock: '<circle cx="12" cy="12" r="9"/><path d="M12 6.8V12l3.4 2"/>',
	braces: '<path d="M8.5 3.5c-2 0-2.5 1-2.5 2.5v3c0 1.5-.8 2.5-2 3 1.2.5 2 1.5 2 3v3c0 1.5.5 2.5 2.5 2.5"/><path d="M15.5 3.5c2 0 2.5 1 2.5 2.5v3c0 1.5.8 2.5 2 3-1.2.5-2 1.5-2 3v3c0 1.5-.5 2.5-2.5 2.5"/>',
	bug: '<rect x="8" y="7" width="8" height="12" rx="4"/><path d="M8 11H4.5M8 15H4.5M16 11h3.5M16 15h3.5"/><path d="m9.5 7-1.5-2.5M14.5 7 16 4.5"/>',
	nodes: '<circle cx="5.5" cy="6.5" r="2.5"/><circle cx="18.5" cy="9.5" r="2.5"/><circle cx="10.5" cy="18" r="2.5"/><path d="m7.9 7.2 8.2 1.9"/><path d="m17 11.7-4.8 4.5"/>',
	rss: '<path d="M5 19.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z"/><path d="M4.5 10.5A9 9 0 0 1 13.5 19.5"/><path d="M4.5 4.5A15 15 0 0 1 19.5 19.5"/>',
	external:
		'<path d="M14 3.5h6.5V10"/><path d="M20.5 3.5 11 13"/><path d="M18 14.5V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4.5"/>',
	copy: '<rect x="9" y="9" width="11.5" height="11.5" rx="2"/><path d="M5.5 15.5H4.5a1 1 0 0 1-1-1V4.5a1 1 0 0 1 1-1H14a1 1 0 0 1 1 1v1"/>',
	arrowUp: '<path d="M12 19.5V5"/><path d="m6 11 6-6 6 6"/>',
	mail: '<rect x="3" y="5" width="18" height="14" rx="2.2"/><path d="m3.8 6.5 8.2 6 8.2-6"/>',
} as const;

export type IconName = keyof typeof ICONS;
