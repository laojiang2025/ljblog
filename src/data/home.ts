export interface RecommendedTool {
	name: string;
	category: string;
	summary: string;
	href: string;
}

/** 首页展示的外部工具入口：少而精，避免首页变成无差别网址导航。 */
export const RECOMMENDED_TOOLS: readonly RecommendedTool[] = [
	{
		name: 'Playwright',
		category: '自动化测试',
		summary: '现代 Web 端到端测试框架，适合把关键链路沉淀成可靠回归。',
		href: 'https://playwright.dev/',
	},
	{
		name: 'Postman',
		category: '接口调试',
		summary: '从接口调试、集合运行到团队协作，日常 API 测试的常用入口。',
		href: 'https://www.postman.com/',
	},
	{
		name: 'Apifox',
		category: '接口协作',
		summary: '把 API 设计、Mock、调试和文档放进一条工作流。',
		href: 'https://apifox.com/',
	},
	{
		name: 'Obsidian',
		category: '知识管理',
		summary: '本地 Markdown 知识库，适合积累测试笔记和可复用工作流。',
		href: 'https://obsidian.md/',
	},
];
