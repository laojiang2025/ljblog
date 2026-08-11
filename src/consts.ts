/** 站点级可配置信息——换品牌只改这里 */
export const SITE = {
	title: 'LJ Lab',
	label: '效率笔记',
	description: '记录 AI、工具链与个人知识工作流的实践笔记，附可下载素材。',
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