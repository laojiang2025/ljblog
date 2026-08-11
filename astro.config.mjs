// @ts-check
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
	site: 'https://example.com',
	trailingSlash: 'always',
	// 节点图下线后，旧地址（含已打开的标签页与外部链接）转到接管其内容的关于页
	redirects: {
		'/spatial/': '/about/',
	},
});
