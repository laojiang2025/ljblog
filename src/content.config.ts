import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const blog = defineCollection({
	loader: glob({ base: './src/content/blog', pattern: '**/*.{md,mdx}' }),
	schema: z.object({
		title: z.string(),
		description: z.string(),
		pubDate: z.coerce.date(),
		updatedDate: z.coerce.date().optional(),
		tags: z.array(z.string()).default([]),
		/** public/download 下的文件名，可选 */
		download: z.string().optional(),
		draft: z.boolean().default(false),
	}),
});

export const DIRECTIONS = ['测试理论', '自动化', '性能', '安全', '工程效能'] as const;
export const DIFFICULTIES = ['初级', '中级', '高级'] as const;

const interview = defineCollection({
	loader: glob({ base: './src/content/interview', pattern: '**/*.{md,mdx}' }),
	schema: z.object({
		/** 题干，列表页直接展示，正文写参考答案 */
		question: z.string(),
		direction: z.enum(DIRECTIONS),
		difficulty: z.enum(DIFFICULTIES),
		tags: z.array(z.string()).default([]),
		updatedDate: z.coerce.date().optional(),
		draft: z.boolean().default(false),
	}),
});

export const collections = { blog, interview };
