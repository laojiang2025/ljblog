/**
 * 开源 Agent Skill 清单：/skills/ 页与首页展示区共用。
 * 目前全部为占位示例，等真实仓库地址（或 GitHub 用户名）替换。
 */
export interface OpenSourceSkill {
	id: string;
	name: string;
	/** 这条 skill 帮 Agent 做什么 */
	summary: string;
	/** 仓库地址；留空则卡片显示「仓库整理中」 */
	repo?: string;
	/** 适用场景标签 */
	tags: string[];
	/** 简短的安装或使用说明，可选 */
	usage?: string;
}

export const SKILLS: readonly OpenSourceSkill[] = [
	{
		id: 'placeholder-skill-1',
		name: 'Skill 占位 · 待替换',
		summary: '把你的开源 skill 仓库地址发给我，这里就换成真实条目：名称、用途、安装方式。',
		tags: ['待补充'],
	},
	{
		id: 'placeholder-skill-2',
		name: 'Skill 占位 · 待替换',
		summary: '也可以直接给 GitHub 用户名，我来筛出适合展示的仓库列表给你确认。',
		tags: ['待补充'],
	},
	{
		id: 'placeholder-skill-3',
		name: 'Skill 占位 · 待替换',
		summary: '数据都在 src/data/skills.ts，之后新增开源 skill 只改这一个文件。',
		tags: ['待补充'],
	},
];
