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
			const dataDir = path.resolve(server.config.root, 'src/data');
			const safeSlug = /^[a-z0-9][a-z0-9-]{0,79}$/;

			const ICON_NAMES = [
				'grid', 'flask', 'checklist', 'briefcase', 'play', 'resume', 'book', 'compass',
				'database', 'terminal', 'cpu', 'clock', 'braces', 'bug', 'rss', 'external',
				'copy', 'arrowUp', 'mail', 'link', 'diff',
			];
			const str = (/** @type {unknown} */ v) => String(v ?? '').trim();
			const strList = (/** @type {unknown} */ v) =>
				Array.isArray(v) ? v.map((t) => String(t).trim()).filter(Boolean) : [];

			/** 每种数据的校验 + 规范化；抛错即整体拒绝保存 */
			const DATA_KINDS = {
				products: (/** @type {any} */ item, /** @type {number} */ i) => {
					const name = str(item.name);
					const tagline = str(item.tagline);
					if (!name || !tagline) throw new Error(`第 ${i + 1} 个产品缺少名称或一句话定位`);
					const status = item.status === 'online' ? 'online' : 'building';
					const href = str(item.href);
					if (status === 'online' && !href) throw new Error(`产品「${name}」是在线状态，必须填链接`);
					return {
						id: str(item.id) || `product-${Date.now()}-${i}`,
						name,
						tagline,
						description: str(item.description),
						status,
						href,
						external: Boolean(item.external) || /^https?:\/\//.test(href),
						icon: ICON_NAMES.includes(item.icon) ? item.icon : 'cpu',
						tags: strList(item.tags),
					};
				},
				skills: (/** @type {any} */ item, /** @type {number} */ i) => {
					const name = str(item.name);
					const summary = str(item.summary);
					if (!name || !summary) throw new Error(`第 ${i + 1} 条 skill 缺少名称或用途说明`);
					const repo = str(item.repo);
					if (repo && !/^https?:\/\//.test(repo)) throw new Error(`skill「${name}」的仓库地址应以 http(s):// 开头`);
					return {
						id: str(item.id) || `skill-${Date.now()}-${i}`,
						name,
						summary,
						repo,
						usage: str(item.usage),
						tags: strList(item.tags),
					};
				},
			};

			// 读取产品 / Skills 数据，供写作台管理页签
			server.middlewares.use('/__admin/data', (req, res) => {
				const url = new URL(req.url ?? '', 'http://localhost');
				const kind = url.searchParams.get('kind') ?? '';
				if (!(kind in DATA_KINDS)) return json(res, 400, { ok: false, error: 'kind 应为 products 或 skills' });
				const file = path.join(dataDir, `${kind}.json`);

				if (req.method === 'GET') {
					readFile(file, 'utf8')
						.then((raw) => json(res, 200, { ok: true, items: JSON.parse(raw) }))
						.catch((e) => json(res, 500, { ok: false, error: String((e && e.message) || e) }));
					return;
				}
				if (req.method !== 'POST') return json(res, 405, { ok: false, error: '仅支持 GET / POST' });

				let body = '';
				req.on('data', (chunk) => (body += chunk));
				req.on('end', async () => {
					try {
						const data = JSON.parse(body || '{}');
						if (!Array.isArray(data.items)) throw new Error('items 应为数组');
						const normalize = DATA_KINDS[/** @type {keyof typeof DATA_KINDS} */ (kind)];
						const items = data.items.map(normalize);
						await writeFile(file, JSON.stringify(items, null, '\t') + '\n', 'utf8');
						json(res, 200, { ok: true, count: items.length, file: `src/data/${kind}.json` });
					} catch (e) {
						json(res, 400, { ok: false, error: String((e && e.message) || e) });
					}
				});
			});

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

/**
 * 写作台路由只在 `astro dev` 时注入。
 * 构建（上云部署）产物里不存在 /admin/ 这个路径——访问它就是 404，
 * 配合 adminWriter 的 dev-only 中间件，线上没有后台的任何痕迹。
 */
function adminDesk() {
	return {
		name: 'ljblog-admin-desk',
		hooks: {
			/** @param {{ command: string, injectRoute: (r: { pattern: string, entrypoint: string }) => void }} ctx */
			'astro:config:setup': ({ command, injectRoute }) => {
				if (command !== 'dev') return;
				injectRoute({ pattern: '/admin', entrypoint: './src/admin/desk.astro' });
			},
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
	integrations: [adminDesk()],
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
