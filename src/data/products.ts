import type { IconName } from './icons';
import raw from './products.json';

/** online 已可访问；building 开发中，卡片不可点击只展示 */
export type ProductStatus = 'online' | 'building';

export interface Product {
	id: string;
	name: string;
	/** 一句话定位，卡片主文案 */
	tagline: string;
	/** 补充说明，一两句讲清楚它解决什么问题 */
	description: string;
	status: ProductStatus;
	/** 直达链接；building 状态可留空 */
	href?: string;
	/** 站外链接新开标签页 */
	external?: boolean;
	icon: IconName;
	tags: string[];
}

/**
 * 产品清单：首页与 /products/ 页共用。
 * 数据存放在 products.json，可在本地写作台（/admin/）的「产品」页签维护。
 */
export const PRODUCTS = raw as readonly Product[];

export const ONLINE_PRODUCTS = PRODUCTS.filter((product) => product.status === 'online');
