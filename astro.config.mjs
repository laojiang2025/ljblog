// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import { access, readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

/**
 * 本地写作台（/admin/）的文件读写端点。
 * 只以 Vite dev 中间件的形式存在：`astro dev` 时可用，
 * 构建产物完全不包含，线上不存在任何写入口。
 */
function adminWriter() {
	/** @param {import('node:http').ServerResponse} res @param {number} status @param {unknown} payload */
	const json = (res, status, payload) => {
		res.statusCode = status;
		res.setHeader('Content-Type', 'application/json; charset=utf-8');
		res.end(JSON.stringify(payload));
	};

	return {
		name: 'ljblog-admin-writer',
		/** @param {import('vite').ViteDevServer} server */
		configureServer(server) {
			const blogDir = path.resolve(server.config.root, 'src/content/blog');
			const safeSlug = /^[a-z0-9][a-z0-9-]{0,79}$/;

			// 列出已有文章（slug + 标题），供写作台展示与编辑入口
			server.middlewares.use('/__admin/posts', async (req, res) => {
				if (req.method !== 'GET') return json(res, 405, { ok: false, error: '仅支持 GET' });
				try {
					const files = (await readdir(blogDir)).filter((f) => /\.mdx?$/.test(f));
					const posts = await Promise.all(
						files.map(async (file) => {
							const raw = await readFile(path.join(blogDir, file), 'utf8');
							const title = raw.match(/^title:\s*['"]?(.+?)['"]?\s*$/m)?.[1] ?? file;
							return { slug: file.replace(/\.mdx?$/, ''), file, title };
						}),
					);
					json(res, 200, { ok: true, posts });
				} catch (e) {
					json(res, 500, { ok: false, error: String((e && e.message) || e) });
				}
			});

			// 读取单篇原文，供编辑回填
			server.middlewares.use('/__admin/post', async (req, res) => {
				if (req.method !== 'GET') return json(res, 405, { ok: false, error: '仅支持 GET' });
				const slug = new URL(req.url ?? '', 'http://localhost').searchParams.get('slug') ?? '';
				if (!safeSlug.test(slug)) return json(res, 400, { ok: false, error: 'slug 不合法' });
				try {
					const raw = await readFile(path.join(blogDir, `${slug}.md`), 'utf8');
					json(res, 200, { ok: true, raw });
				} catch {
					json(res, 404, { ok: false, error: `找不到 ${slug}.md` });
				}
			});

			// 保存文章：JSON 入参，写入 src/content/blog/<slug>.md
			server.middlewares.use('/__admin/save', (req, res) => {
				if (req.method !== 'POST') return json(res, 405, { ok: false, error: '仅支持 POST' });
				let body = '';
				req.on('data', (chunk) => (body += chunk));
				req.on('end', async () => {
					try {
						const data = JSON.parse(body || '{}');
						const slug = String(data.slug ?? '').trim().toLowerCase();
						if (!safeSlug.test(slug))
							throw new Error('slug 只能用小写字母、数字和中划线，且以字母或数字开头');
						const title = String(data.title ?? '').trim();
						const description = String(data.description ?? '').trim();
						if (!title) throw new Error('标题必填');
						if (!description) throw new Error('摘要必填（列表页和 SEO 都用它）');
						const pubDate = String(data.pubDate ?? '').trim();
						if (!/^\d{4}-\d{2}-\d{2}$/.test(pubDate)) throw new Error('日期格式应为 YYYY-MM-DD');
						const tags = Array.isArray(data.tags)
							? data.tags.map((t) => String(t).trim()).filter(Boolean)
							: [];
						const content = String(data.content ?? '').replace(/\r\n/g, '\n');

						const file = path.join(blogDir, `${slug}.md`);
						if (!data.overwrite) {
							let exists = false;
							try {
								await access(file);
								exists = true;
							} catch {}
							if (exists) throw new Error(`${slug}.md 已存在。要更新它请勾选「覆盖已有文章」`);
						}

						const yq = (/** @type {string} */ s) => `'${s.replace(/'/g, "''")}'`;
						const frontmatter = [
							'---',
							`title: ${yq(title)}`,
							`description: ${yq(description)}`,
							`pubDate: ${yq(pubDate)}`,
							`tags: [${tags.map(yq).join(', ')}]`,
							...(data.draft ? ['draft: true'] : []),
							'---',
							'',
						].join('\n');
						await writeFile(file, frontmatter + content.trim() + '\n', 'utf8');
						json(res, 200, { ok: true, file: `src/content/blog/${slug}.md`, url: `/blog/${slug}/` });
					} catch (e) {
						json(res, 400, { ok: false, error: String((e && e.message) || e) });
					}
				});
			});
		},
	};
}

// https://astro.build/config
export default defineConfig({
	site: 'https://example.com',
	trailingSlash: 'always',
	devToolbar: {
		enabled: false,
	},
	// 节点图下线后，旧地址（含已打开的标签页与外部链接）转到接管其内容的关于页
	// 面试题库栏目暂时下线，旧地址转到文章列表
	redirects: {
		'/spatial/': '/about/',
		'/interview/': '/blog/',
	},
	vite: {
		// Tailwind v4 走 Vite 插件而非 Astro integration，官方推荐姿势
		plugins: [tailwindcss(), adminWriter()],
	},
});
