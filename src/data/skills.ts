import raw from './skills.json';

/**
 * 开源 Agent Skill 清单：/skills/ 页与首页展示区共用。
 * 数据存放在 skills.json，可在本地写作台（/admin/）的「Skills」页签维护。
 */
export interface OpenSourceSkill {
	id: string;
	name: string;
	/** 这条 skill 帮 Agent 做什么 */
	summary: string;
	/** 仓库地址；留空则卡片显示「仓库整理中」 */
	repo?: string;
	/** 简短的安装或使用说明，可选 */
	usage?: string;
	/** 适用场景标签 */
	tags: string[];
}

export const SKILLS = raw as readonly OpenSourceSkill[];
