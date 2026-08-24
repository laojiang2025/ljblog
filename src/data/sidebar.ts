import type { IconName } from './icons';
import raw from './sidebar.json';

/**
 * 悬浮侧栏条目：
 * - link  跳转链接（站内或站外）
 * - panel 点击弹出小面板（文字说明 + 可选图片，适合公众号二维码）
 * - top   回到页面顶部
 */
export interface SidebarItem {
	id: string;
	label: string;
	icon: IconName;
	type: 'link' | 'panel' | 'top';
	href?: string;
	panelTitle?: string;
	panelText?: string;
	/** public/ 下的图片路径，如 /qr-wechat.png */
	panelImage?: string;
}

/** 数据存放在 sidebar.json，可在本地写作台（/admin/）的「侧边栏」页签维护 */
export const SIDEBAR_ITEMS = raw as readonly SidebarItem[];
