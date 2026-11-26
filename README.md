# 智研学堂 · 公开技术演示

打开 ExamPilot，切换两位匿名学员。修改考试日期和每日时间后，浏览器基于同一套虚拟考纲重算任务。给同一道诊断题选不同错误答案，可进入不同区分题。教学后提交未见变式，观察下一步策略和教师干预状态如何变化。旧版学习工作台仍可从学生导航访问。

作答、任务和教师状态由浏览器实时计算。演示数据保存在页面内存，刷新或重置即可清除。教学回放为本地 DeepTutor v1.7.4 原生 Chat Agent 使用 Qwen3-4B-Instruct-2507 生成的审校片段。页面明确标识回放及规则补习。

访问 [GitHub Pages 演示](https://xkingham.github.io/ai-tutor-demo/)。

## 本地构建

```bash
node --test
node scripts/build.mjs
```

产物为 `dist/`，可部署在静态站点子路径。本仓库使用独立 HTML、CSS 和 JavaScript，发布工作流只上传构建后的静态资源。
