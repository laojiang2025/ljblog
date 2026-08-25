import type { IconName } from './icons';
import raw from './tools.json';

/** ready 的工具可直接使用；pending 的仍在开发或迁移，列表降级展示 */
export type ToolStatus = 'ready' | 'pending';

export interface ToolMeta {
	id: string;
	name: string;
	summary: string;
	icon: IconName;
	status: ToolStatus;
	/** 站内路由（/tools/xxx/）或站外地址；pending 可留空 */
	href?: string;
}

/**
 * 在线工具清单：工具页与首页共用。
 * 数据存放在 tools.json，可在本地写作台（/admin/）的「工具」页签维护。
 * 注意：站内工具的页面路由在 src/pages/tools/ 下，这里只管列表展示。
 */
export const TOOLS = raw as readonly ToolMeta[];

export const READY_TOOLS = TOOLS.filter(
	(tool): tool is ToolMeta & { href: string } => tool.status === 'ready' && Boolean(tool.href),
);
