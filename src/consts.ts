/** 站点级可配置信息——换品牌只改这里 */
export const SITE = {
	title: 'LJ Lab',
	label: '文章 · 工具 · 交流',
	description: '记录测试开发、AI 工具与工程效率，也做一些可以直接使用的小工具。',
	author: 'LJ',
	url: 'https://example.com',
	locale: 'zh-CN',
	tags: [
		'AI',
		'Astro',
		'Obsidian',
		'Agent Skill',
		'MCP',
		'效率工具',
		'Prompt',
	],
	channels: [
		{ id: 'github', label: 'GitHub', href: 'https://github.com' },
		{ id: 'bilibili', label: '哔哩哔哩', href: 'https://www.bilibili.com' },
		{ id: 'x', label: 'Twitter (X)', href: 'https://x.com' },
		{ id: 'wechat', label: '微信公众号', panel: 'wechat' as const },
	] as const,
};

export interface NavItem {
	id: string;
	label: string;
	href: string;
}

/** 顶部与页脚共用的主导航；只放对外可访问的公开页面 */
export const PRIMARY_NAV: readonly NavItem[] = [
	{ id: 'home', label: '首页', href: '/' },
	{ id: 'products', label: '产品', href: '/products/' },
	{ id: 'tools', label: '在线工具', href: '/tools/' },
	{ id: 'courses', label: 'AI 课程', href: '/courses/' },
	{ id: 'skills', label: 'Skills', href: '/skills/' },
	{ id: 'blog', label: '文章', href: '/blog/' },
	{ id: 'about', label: '关于', href: '/about/' },
];

/**
 * 站点统计 / 埋点配置。
 * baiduId：百度统计的站点代码（hm.js?后面那串），留空则不加载统计脚本，
 * 点击埋点会降级为本地调试模式（console + window.__analyticsQueue）。
 */
export const ANALYTICS = {
	baiduId: '',
	/** true 时在控制台打印每条埋点，便于本地验证 */
	debug: import.meta.env.DEV,
};
