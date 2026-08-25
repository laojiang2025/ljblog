# Spatial Home 速记

- 桌面端：`(min-width: 64rem) and (pointer: fine)` 才启用画布
- 相机用 `translate3d`，边界按节点包围盒 + padding 计算
- Hash `#latest` / `#archive` / `#channels` / `#lj` 对应节点定位
- 连线为 SVG 正交折线，路径在 layout 后重算

本地启动：

```bash
npm run dev
```
