/**
 * 工作台的唯一数据源：栏目导航、分区宫格、卡片与本机服务清单全部由此派生。
 *
 * 设计约束（新增工具时请遵守）：
 * 1. 侧边快捷栏、锚点导航、本机服务速查表都是从 WORKSTATION_SECTIONS 自动派生，
 *    新增一个工具只需要在对应分区加一张卡片，不要去改组件里的任何硬编码列表。
 * 2. 站点是公网部署，跑在本机的应用不能渲染成 localhost 链接（异地访客点到就是死链），
 *    因此用 access 区分可达性，local 卡片只展示地址与启动命令供复制。
 */
import type { IconName } from './icons';

/**
 * 卡片可达性：
 * - site：本站页面，任何访客可直接打开
 * - local：跑在本机的独立应用，仅提供地址与启动方式
 * - planned：已规划但尚未落地，置灰不可点
 */
export type CardAccess = 'site' | 'local' | 'planned';

/** 本机应用的接入信息；url 仅在端口确定时给出 */
export interface LocalEntry {
	url?: string;
	command: string;
}

/** 分区主题色，用于图标方块与悬停描边，让宫格一眼可分辨 */
export type SectionAccent = 'blue' | 'violet' | 'amber' | 'green' | 'cyan';

export interface WorkstationCard {
	id: string;
	name: string;
	summary: string;
	icon: IconName;
	access: CardAccess;
	/** access 为 site 时的站内路径 */
	href?: string;
	/** access 为 local 时的启动信息 */
	local?: LocalEntry;
	tags?: readonly string[];
	/** access 为 planned 时说明落地节奏，避免卡片变成没有下文的占位符 */
	note?: string;
	/** 标为常用后会出现在左侧直达栏，控制在 6 项以内才有筛选意义 */
	featured?: boolean;
	/** 左侧直达栏用的短名，栏宽有限，长名字在那里会被截断 */
	short?: string;
}

export interface WorkstationSection {
	/** 同时作为页面锚点 id 与顶部栏目的跳转目标 */
	id: string;
	title: string;
	description: string;
	icon: IconName;
	accent: SectionAccent;
	cards: readonly WorkstationCard[];
}

export const WORKSTATION_SECTIONS: readonly WorkstationSection[] = [
	{
		id: 'tools',
		title: '测试工具箱',
		description: '纯前端、开箱即用的日常测试辅助工具，无需后端。',
		icon: 'flask',
		accent: 'blue',
		cards: [
			{
				id: 'devtools',
				name: '测试工具集',
				summary: 'JSON 格式化、时间戳转换、URL 解析已可用，人员数据生成等三件正在迁移。',
				icon: 'flask',
				access: 'site',
				href: '/tools/',
				tags: ['零依赖', '本地运行'],
				featured: true,
				short: '工具箱',
				note: '源自本地 testtool，逻辑全部在浏览器执行，输入不出本机',
			},
			{
				id: 'case-viz',
				name: '测试用例可视化',
				summary: '员工信息、手机号、邮箱等业务流程的用例图与覆盖分析页面。',
				icon: 'bug',
				access: 'planned',
				tags: ['用例设计', '流程图'],
				note: '源自本地 portal 目录的一批静态页，二期挑选后迁入',
			},
			{
				id: 'mock',
				name: 'Mock 与接口契约',
				summary: '按测试数据契约生成 Mock 响应，配合联调与异常流验证。',
				icon: 'braces',
				access: 'planned',
				tags: ['Mock', 'API'],
				note: '沿用仓库内既有的 mock 技能约定，三期落地',
			},
		],
	},
	{
		id: 'interview',
		title: '面试题库',
		description: '按方向与难度沉淀的题目，支持刷题与随机抽题。',
		icon: 'checklist',
		accent: 'violet',
		cards: [
			{
				id: 'interview-bank',
				name: '题库总览',
				summary: '测试理论、自动化、性能、安全与项目复盘题目，按标签与难度检索。',
				icon: 'checklist',
				access: 'planned',
				tags: ['分类', '标签', '检索'],
				note: '二期用内容集合建模，Markdown 写题、构建期生成检索索引',
			},
			{
				id: 'daily-question',
				name: '每日一题',
				summary: '每天一道高频题，先自答再对照参考答案。',
				icon: 'clock',
				access: 'planned',
				tags: ['刷题'],
				note: '依赖题库总览，同期落地',
			},
		],
	},
	{
		id: 'career',
		title: '求职工作台',
		description: '岗位聚合、投递跟踪与简历材料。',
		icon: 'briefcase',
		accent: 'amber',
		cards: [
			{
				id: 'job-search',
				name: 'JobSearch 岗位聚合',
				short: 'JobSearch',
				summary: '岗位抓取、筛选与投递跟踪，React 前端 + Python 后端，数据留在本机。',
				icon: 'briefcase',
				access: 'local',
				featured: true,
				tags: ['React', 'FastAPI', 'SQLite'],
				local: {
					url: 'http://localhost:5173',
					command: 'E:\\job-search\\start-dev.bat',
				},
			},
			{
				id: 'job-api',
				name: 'JobSearch 接口文档',
				summary: '后端 OpenAPI 文档，调试岗位抓取与数据接口时用。',
				icon: 'terminal',
				access: 'local',
				tags: ['OpenAPI'],
				local: {
					url: 'http://localhost:8080/api/docs',
					command: '随 start-dev.bat 一并启动',
				},
			},
			{
				id: 'resume',
				name: '在线简历',
				summary: '可在线浏览、可直接打印导出 PDF 的简历页。',
				icon: 'resume',
				access: 'planned',
				tags: ['公开页', '可打印'],
				note: '二期落地，公网可见，联系方式做脱敏处理',
			},
		],
	},
	{
		id: 'learning',
		title: '学习与效率',
		description: '视频学习、语音转写与个人效率工具，均在本机运行。',
		icon: 'play',
		accent: 'green',
		cards: [
			{
				id: 'videoplayer',
				name: '视频学习工具',
				short: '视频学习',
				summary: '本地视频库播放、字幕转写与 AI 摘要，配合资料库做体系化学习。',
				icon: 'play',
				access: 'local',
				featured: true,
				tags: ['FunASR', 'ffmpeg', 'AI 摘要'],
				local: {
					url: 'http://localhost:8100',
					command: 'E:\\shipinxuexi\\videoplayer\\start.bat',
				},
			},
			{
				id: 'stt',
				name: '语音转写',
				summary: '音视频转文字，产出可检索的文稿与字幕。',
				icon: 'cpu',
				access: 'local',
				featured: true,
				tags: ['STT', '字幕'],
				local: {
					command: 'E:\\shipinxuexi\\stt\\run.bat',
				},
			},
			{
				id: 'datatools',
				name: '数据处理工具',
				summary: '批量数据清洗与转换的小工具集。',
				icon: 'database',
				access: 'local',
				tags: ['Python', 'Flask'],
				local: {
					command: 'python E:\\datatools\\main.py',
				},
			},
			{
				id: 'ljtodo',
				name: 'LJ Todo',
				summary: '个人任务清单桌面端。',
				icon: 'checklist',
				access: 'local',
				featured: true,
				tags: ['Python', '桌面端'],
				local: {
					command: 'python E:\\ljtodo\\main.py',
				},
			},
		],
	},
	{
		id: 'notes',
		title: '资料与笔记',
		description: 'AI、工具链与工作流的实践沉淀，公网可读。',
		icon: 'book',
		accent: 'cyan',
		cards: [
			{
				id: 'blog',
				name: '资料库',
				summary: 'Markdown 长文与可下载素材，按标签归档。',
				icon: 'book',
				access: 'site',
				href: '/blog/',
				featured: true,
				tags: ['长文', '素材'],
			},
			{
				id: 'about',
				name: '关于我',
				summary: '个人介绍、关注渠道与在做的事。',
				icon: 'resume',
				access: 'site',
				href: '/about/',
				tags: ['关注渠道'],
			},
			{
				id: 'rss',
				name: 'RSS 订阅',
				summary: '订阅更新，不错过新笔记。',
				icon: 'rss',
				access: 'site',
				href: '/rss.xml',
				tags: ['订阅'],
			},
		],
	},
];

export interface NavItem {
	id: string;
	label: string;
	href: string;
}

/** 顶部栏目导航；尚未拆出独立路由的分区先指向首页锚点，落地后改这里的 href 即可 */
export const PRIMARY_NAV: readonly NavItem[] = [
	{ id: 'home', label: '工作台', href: '/' },
	{ id: 'tools', label: '测试工具', href: '/tools/' },
	{ id: 'interview', label: '面试题', href: '/#interview' },
	{ id: 'career', label: '求职', href: '/#career' },
	{ id: 'learning', label: '学习', href: '/#learning' },
	{ id: 'notes', label: '资料库', href: '/blog/' },
	{ id: 'about', label: '关于', href: '/about/' },
];

/**
 * 左侧直达栏：跨分区挑出的高频条目。
 *
 * 顶部导航负责分区级切换，这里只放具体条目，两者维度不重叠——早先两处都渲染
 * 分区列表，等于把同一份东西横竖各摆一遍，纯属冗余。
 * 站内条目直接跳目标页，本机应用跳到宫格里对应卡片的位置。
 */
export const FEATURED_LINKS = WORKSTATION_SECTIONS.flatMap((section) =>
	section.cards
		.filter((card) => card.featured)
		.map((card) => ({
			id: card.id,
			label: card.short ?? card.name,
			icon: card.icon,
			accent: section.accent,
			access: card.access,
			href: card.access === 'site' && card.href ? card.href : `#card-${card.id}`,
		})),
);

/** 本机服务速查：把散落各分区的 local 卡片汇总成一张表 */
export const LOCAL_SERVICES = WORKSTATION_SECTIONS.flatMap((section) =>
	section.cards.flatMap((card) =>
		card.access === 'local' && card.local
			? [{ id: card.id, name: card.name, url: card.local.url, command: card.local.command }]
			: [],
	),
);

/** 工作台概览指标，同样从分区派生，避免手写数字与实际脱节 */
export const WORKSTATION_STATS = {
	sections: WORKSTATION_SECTIONS.length,
	total: WORKSTATION_SECTIONS.reduce((sum, section) => sum + section.cards.length, 0),
	live: WORKSTATION_SECTIONS.reduce(
		(sum, section) => sum + section.cards.filter((card) => card.access !== 'planned').length,
		0,
	),
};

/** 卡片状态在界面上的统一文案 */
export const ACCESS_META: Record<CardAccess, { label: string; hint: string }> = {
	site: { label: '可直接访问', hint: '本站页面' },
	local: { label: '本机运行', hint: '需在本机启动后访问，异地不可达' },
	planned: { label: '规划中', hint: '尚未上线' },
};
