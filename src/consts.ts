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

/**
 * 桌面端画布节点默认坐标（相对 scene）。
 *
 * 布局有意做成"人物在左、五个分区纵向排右侧"的树形：连线走的是
 * 水平→垂直→水平的正交折线，同列排布能保证线不穿过任何节点。
 * 分区节点与工作台共用 WORKSTATION_SECTIONS 的内容，此处只管坐标。
 */
export const HOME_NODES = {
	person_lj: { id: 'lj', x: 200, y: 620, width: 430 },
	tools: { id: 'tools', x: 880, y: 60, width: 400 },
	interview: { id: 'interview', x: 880, y: 420, width: 400 },
	career: { id: 'career', x: 880, y: 720, width: 400 },
	learning: { id: 'learning', x: 880, y: 1080, width: 400 },
	notes: { id: 'notes', x: 880, y: 1480, width: 430 },
} as const satisfies Record<string, { id: string; x: number; y: number; width: number }>;

export type HomeNodeId = keyof typeof HOME_NODES;

/** 分区节点全部由人物节点辐射而出，语义上就是"我 → 我的几摊事" */
export const HOME_EDGES = [
	{ id: 'lj-tools', from: 'person_lj', to: 'tools' },
	{ id: 'lj-interview', from: 'person_lj', to: 'interview' },
	{ id: 'lj-career', from: 'person_lj', to: 'career' },
	{ id: 'lj-learning', from: 'person_lj', to: 'learning' },
	{ id: 'lj-notes', from: 'person_lj', to: 'notes' },
] as const satisfies ReadonlyArray<{
	id: string;
	from: HomeNodeId;
	to: HomeNodeId;
}>;
