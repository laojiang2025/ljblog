// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
	site: 'https://example.com',
	trailingSlash: 'always',
	devToolbar: {
		enabled: false,
	},
	// 节点图下线后，旧地址（含已打开的标签页与外部链接）转到接管其内容的关于页
	redirects: {
		'/spatial/': '/about/',
	},
	vite: {
		// Tailwind v4 走 Vite 插件而非 Astro integration，官方推荐姿势
		plugins: [tailwindcss()],
	},
});
