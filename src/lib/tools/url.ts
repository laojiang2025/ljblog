/** URL 工具的纯逻辑，不触碰 DOM */

export interface UrlParam {
	key: string;
	value: string;
}

export interface UrlBreakdown {
	href: string;
	protocol: string;
	username: string;
	password: string;
	hostname: string;
	port: string;
	pathname: string;
	search: string;
	hash: string;
	origin: string;
	params: UrlParam[];
}

export type UrlResult = { ok: true; value: UrlBreakdown } | { ok: false; error: string };

export function parseUrl(input: string): UrlResult {
	const text = input.trim();
	if (!text) return { ok: false, error: '请输入 URL' };

	// 允许省略协议，按浏览器地址栏的习惯补上 https
	const candidate = /^[a-zA-Z][a-zA-Z\d+\-.]*:/.test(text) ? text : `https://${text}`;

	let url: URL;
	try {
		url = new URL(candidate);
	} catch {
		return { ok: false, error: '无法解析，请检查 URL 是否完整' };
	}

	const params: UrlParam[] = [];
	url.searchParams.forEach((value, key) => params.push({ key, value }));

	return {
		ok: true,
		value: {
			href: url.href,
			protocol: url.protocol.replace(':', ''),
			username: url.username,
			password: url.password ? '••••••' : '',
			hostname: url.hostname,
			port: url.port,
			pathname: url.pathname,
			search: url.search,
			hash: url.hash,
			origin: url.origin,
			params,
		},
	};
}

export function encode(text: string): string {
	return encodeURIComponent(text);
}

export function decode(text: string): { ok: true; value: string } | { ok: false; error: string } {
	try {
		return { ok: true, value: decodeURIComponent(text) };
	} catch {
		return { ok: false, error: '存在无效的百分号转义序列' };
	}
}
