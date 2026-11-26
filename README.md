# 智研学堂 · 公开技术演示

学生学习站提供数据结构案例和「概率推断」互动教材。ExamPilot 用同一考纲为两名虚拟学员计算任务，可比较错因、补救、独立复验和教师干预。概率案例通过计数说明缺陷率和误报如何影响结论。

教师管理站使用独立页面，只提供教师侧视图。请在同一浏览器标签页从学生站打开教师站，演示状态会随标签页保留，可用学生站的「重置全部演示」清除。答复标明为已审校的本地教学回放。公开站不调用后台，也不收集个人信息。

- [学生学习站](https://xkingham.github.io/ai-tutor-demo/)
- [教师管理站](https://xkingham.github.io/ai-tutor-demo/teacher/)

## 本地构建

```bash
node --test
node scripts/build.mjs
```

产物为 `dist/`，可部署在静态站点子路径。本仓库使用独立 HTML、CSS 和 JavaScript，发布工作流只上传构建后的静态资源。
