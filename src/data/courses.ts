import raw from './courses.json';

/** live 已上线可报名；prep 筹备中，卡片只展示不可点 */
export type CourseStatus = 'live' | 'prep';

export interface Course {
	id: string;
	name: string;
	/** 一句话卖点 */
	tagline: string;
	/** 课程内容说明，一两句 */
	description: string;
	/** 分类名，课程中心顶部筛选按数据自动生成 */
	category: string;
	/** 封面图路径（public/ 下，如 /covers/ai-camp.png）；留空显示渐变占位 */
	cover?: string;
	status: CourseStatus;
	/** 报名 / 学习链接；prep 可留空 */
	href?: string;
	/** 展示价格，如 ￥199 / 免费；留空不显示 */
	price?: string;
	tags: string[];
}

/**
 * AI 测试课程清单：/courses/ 页使用。
 * 数据存放在 courses.json，可在本地写作台（/admin/）的「课程」页签维护。
 */
export const COURSES = raw as readonly Course[];
