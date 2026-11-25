# 智研学堂 · 公开技术演示

面向机构教学场景的静态交互演示，展示学生、教师、知识库、答疑、练习、路径和学情报告。素材为原创虚构示例，答疑为预置文本。界面状态保留在当前页面内存中，刷新可复位。

访问 [GitHub Pages 演示](https://xkingham.github.io/ai-tutor-demo/)。

## 本地构建

```bash
node scripts/build.mjs
```

产物为 `dist/`，可部署到任意静态站点子路径。资源和页面内导航使用相对路径。本仓库使用独立 HTML、CSS 和 JavaScript，发布工作流只上传构建后的静态资源。
