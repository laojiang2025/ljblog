import type { IconName } from './icons';

/** ready 的工具已内联进本站可直接用，pending 的仍在从本地 testtool 迁移 */
export type ToolStatus = 'ready' | 'pending';

export interface ToolMeta {
	id: string;
	name: string;
	summary: string;
	icon: IconName;
	status: ToolStatus;
	/** 仅 ready 的工具有独立路由 */
	href?: string;
}

export const TOOLS: readonly ToolMeta[] = [
	{
		id: 'json',
		name: 'JSON 格式化',
		summary: '校验、美化、压缩 JSON，错误直接定位到行列。',
		icon: 'braces',
		status: 'ready',
		href: '/tools/json/',
	},
	{
		id: 'timestamp',
		name: '时间戳转换',
		summary: '秒与毫秒时间戳、日期字符串双向转换，含常用相对时间。',
		icon: 'clock',
		status: 'ready',
		href: '/tools/timestamp/',
	},
	{
		id: 'url',
		name: 'URL 解析',
		summary: '拆解协议、主机、路径与查询参数，支持编解码。',
		icon: 'link',
		status: 'ready',
		href: '/tools/url/',
	},
	{
		id: 'person',
		name: '人员数据生成',
		summary: '批量生成姓名、身份证、手机号、银行卡等测试数据。',
		icon: 'resume',
		status: 'pending',
	},
	{
		id: 'text',
		name: '文本处理',
		summary: '大小写、去重、排序、统计与常见清洗操作。',
		icon: 'book',
		status: 'pending',
	},
	{
		id: 'diff',
		name: '文本差异对比',
		summary: '逐行比对两段文本，标出新增、删除与修改。',
		icon: 'diff',
		status: 'pending',
	},
];

export const READY_TOOLS = TOOLS.filter(
	(tool): tool is ToolMeta & { href: string } => tool.status === 'ready' && Boolean(tool.href),
);
