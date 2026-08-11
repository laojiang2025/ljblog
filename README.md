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
- `src/pages/about/`：关于页（个人名片 / 关注渠道 / 分区概览 / 最新笔记）
- `src/components/SiteFooter.astro` + `ChannelList.astro`：全站页脚与关注渠道，任何页面滑到底都能找到
- `src/content/blog/`：资料正文（Content Collections）
- `public/download/`：可下载笔记
- `src/consts.ts`：品牌 / 关注渠道

节点图已下线，`SpatialHome.astro`、`spatial-home.ts/css` 与 `consts.ts` 的 `HOME_NODES` 暂留但已无引用，待确认后清理。

## 构建

```bash
npm run build
npm run preview
```
