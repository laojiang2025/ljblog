# LJ Lab

Astro 个人站：工作台门户 + Markdown 资料库。

## 开发

```bash
npm install
npm run dev
```

## 结构

- `src/pages/index.astro`：工作台门户（快捷跳转 / 分区宫格 / 信息流三栏）
- `src/data/workstation.ts`：栏目、分区与卡片的唯一数据源，新增工具只改这里
- `src/components/workstation/`：工作台组件；`src/scripts/workstation.ts`：锚点高亮与命令复制
- `src/pages/tools/`：测试工具箱；纯逻辑在 `src/lib/tools/`（无 DOM 依赖，`npm run check:tools` 可直接跑断言），行为脚本在 `src/scripts/tools/`
- `src/content/interview/`：面试题；一题一个 Markdown，frontmatter 写方向与难度，正文写参考答案，列表页自动收录并生成筛选项
- `src/data/tools.ts`：工具清单与上线状态，新增工具先改这里
- `src/pages/about/`：关于页（个人名片 / 关注渠道 / 分区概览 / 最新笔记）
- `src/components/SiteFooter.astro` + `ChannelList.astro`：全站页脚与关注渠道，任何页面滑到底都能找到
- `src/content/blog/`：资料正文（Content Collections）
- `download-vault/`：历史下载资产存档（文章已禁止下载，此目录不进构建产物）
- `src/consts.ts`：品牌 / 关注渠道

## 构建

```bash
npm run build
npm run preview
```
