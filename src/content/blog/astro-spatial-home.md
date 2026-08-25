---
title: 用 Astro 搭一座可拖拽的个人首页
description: 从 Spatial Map 思路出发，用 Astro Content Collections 落地资料库与节点图首页。
pubDate: 2026-08-10
tags: [Astro, Spatial, 博客]
---

个人站不一定要「顶栏 + 文章列表」。更有记忆点的做法，是把首页做成一张**可探索的节点图**：人物、最近更新、资料库、频道彼此连线，桌面端拖拽浏览，移动端自动退化成纵向阅读。

## 为什么选 Astro

- 内容以 Markdown 为主，默认零 JS，SEO 友好。
- 交互只在 SpatialHome 等局部脚本增强，避免整页 SPA 水合成本。
- Content Collections 给 frontmatter 类型与校验，发布更稳。

## 最小闭环

1. `src/content/blog/` 写笔记
2. frontmatter 里挂上 `download` 指向 `public/download/`
3. 首页自动取最新 3 篇，资料库页可搜索

拖拽、滚轮、方向键与 `#latest` 这类 hash 定位，都由 `src/scripts/spatial-home.ts` 负责。
