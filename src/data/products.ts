import type { IconName } from './icons';

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
 * 「测试工具箱」是站内真实产品；其余为占位条目，等真实产品信息替换。
 */
export const PRODUCTS: readonly Product[] = [
	{
		id: 'toolbox',
		name: '测试工具箱',
		tagline: '打开即用的纯前端测试小工具集',
		description:
			'JSON 格式化、时间戳转换、URL 解析、测试数据生成、文本处理与差异对比，全部本地运行，输入不离开浏览器。',
		status: 'online',
		href: '/tools/',
		icon: 'flask',
		tags: ['在线工具', '测试效率'],
	},
	{
		id: 'placeholder-product-1',
		name: '产品占位 · 待替换',
		tagline: '把你的第一个产品信息发给我，这张卡片就换成它',
		description: '需要：产品名称、一句话定位、访问链接。有截图或主色调更好。',
		status: 'building',
		icon: 'cpu',
		tags: ['待补充'],
	},
	{
		id: 'placeholder-product-2',
		name: '产品占位 · 待替换',
		tagline: '第二个产品的位置，也可以删掉只留一个',
		description: '产品数量不限，数据都在 src/data/products.ts，增删只改这一个文件。',
		status: 'building',
		icon: 'terminal',
		tags: ['待补充'],
	},
];

export const ONLINE_PRODUCTS = PRODUCTS.filter((product) => product.status === 'online');
