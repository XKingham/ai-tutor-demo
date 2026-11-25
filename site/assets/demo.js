import { exercises, lessons, prompts, roster } from "./fixtures.js";

const lines = {
  home: '<path d="m3 10 9-7 9 7v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z"/><path d="M9 21v-7h6v7"/>',
  book: '<path d="M12 6v15M3 4h6a3 3 0 0 1 3 3 3 3 0 0 1 3-3h6v15h-6a3 3 0 0 0-3 2 3 3 0 0 0-3-2H3Z"/>',
  chat: '<path d="M21 11.5a8.5 8.5 0 0 1-8.5 8.5H4l2-4a8.5 8.5 0 1 1 15-4.5Z"/><path d="M9 12h.01M12.5 12h.01M16 12h.01"/>',
  task: '<rect x="5" y="5" width="14" height="16" rx="2"/><path d="M9 5V3h6v2m-5 9 1.5 1.5L15 12"/>',
  route: '<circle cx="6" cy="6" r="2"/><circle cx="18" cy="18" r="2"/><path d="M8 6h8a3 3 0 0 1 0 6H8a3 3 0 0 0 0 6h8"/>',
  chart: '<path d="M4 4v16h16M8 16v-4m5 4V8m5 8v-7"/>',
  users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2m20 0v-2a4 4 0 0 0-3-3.9"/><circle cx="9" cy="7" r="4"/><path d="M16 3.2a4 4 0 0 1 0 7.6"/>',
  arrow: '<path d="M5 12h14m-6-6 6 6-6 6"/>',
  check: '<path d="m5 12 4 4L19 6"/>',
  layers: '<path d="m12 3 9 5-9 5-9-5 9-5Zm-9 9 9 5 9-5M3 16l9 5 9-5"/>',
  calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18m-13 5h.01m4 0h.01m4 0h.01"/>',
};

function icon(name, size = 20) {
  return '<svg xmlns="http://www.w3.org/2000/svg" width="' + size + '" height="' + size +
    '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
    lines[name] + "</svg>";
}

const student = [
  ["student-home", "我的课程", "home"], ["knowledge", "课程知识库", "book"],
  ["ask", "AI 答疑", "chat"], ["practice", "智能练习", "task"],
  ["plan", "学习规划", "route"], ["student-report", "学情报告", "chart"],
];
const teacher = [
  ["teacher-home", "课程管理", "layers"], ["teacher-access", "学员与授权", "users"],
  ["teacher-report", "学情报告", "chart"],
];
const routes = [...student, ...teacher].map((entry) => entry[0]);
const state = {
  openedLesson: 0, prompt: 0, showAnswer: false, question: 0, selected: null, result: null,
  completed: new Set([0, 1]), practiceAnswers: new Map(),
  published: new Set([0, 1, 2]), access: new Set([0, 1]),
};

const view = document.querySelector("#view");
const workspace = document.querySelector("#workspace");
const announcement = document.querySelector("#announcement");
let current = "student-home";

function badge(copy) { return '<span class="sample-tag">' + copy + '</span>'; }
function button(label, route, variant = "primary") {
  return '<a class="button ' + variant + '" href="#' + route + '">' + label + icon("arrow", 17) + '</a>';
}
function action(label, name, id, variant = "secondary", attributes = "") {
  return '<button class="button ' + variant + '" type="button" data-action="' + name + '" data-id="' + id + '" ' + attributes + '>' + label + '</button>';
}
function pageHeading(label, title, copy) {
  return '<div class="page-heading"><span class="kicker">' + label + '</span><h1>' + title + '</h1><p>' + copy + '</p></div>';
}
function tileIcon(name) { return '<span class="tile-icon">' + icon(name, 21) + '</span>'; }
function progress(value, label) {
  return '<progress max="100" value="' + value + '" aria-label="' + label + '"></progress>';
}
function metric(value, label, detail) {
  return '<article class="card metric"><span>' + label + '</span><strong>' + value + '</strong><small>' + detail + '</small></article>';
}
function lessonRow(lesson, index) {
  const active = index === state.openedLesson;
  return '<button type="button" class="list-row" data-action="lesson" data-id="' + index + '" aria-pressed="' + active + '">' +
    tileIcon("book") + '<span><strong>' + lesson.title + '</strong><small>' + lesson.location + ' · ' + lesson.type + '</small></span>' +
    icon("arrow", 17) + '</button>';
}

function studentHome() {
  const next = lessons.findIndex((_, index) => !state.completed.has(index));
  const completed = state.completed.size;
  const features = [
    ["knowledge", "课程知识库", "浏览教学讲义和可核查的教材片段。", "book"],
    ["ask", "AI 答疑", "查看示例回答与原文依据。", "chat"],
    ["practice", "智能练习", "提交示例题，查看判分与解析。", "task"],
    ["plan", "学习规划", "按复习顺序标记单元进度。", "route"],
  ];
  return '<section class="course-hero"><div class="hero-content"><span class="hero-label">' + icon("book", 17) +
    ' 考研 408 · 示例课程</span><h1>数据结构</h1><p>从线性表到树与图。围绕同一门课，读教材、做题并查看复习进度。</p><div class="actions">' +
    button("查看课程知识库", "knowledge", "hero-primary") + button("体验答疑", "ask", "hero-light") + '</div></div>' +
    '<div class="hero-art" aria-hidden="true"><div class="hero-ring"></div><div class="book-shadow"></div><div class="book-cover">' +
    '<span class="book-mark">' + icon("book", 34) + '</span><i></i><i></i><i></i></div><div class="float-check">' + icon("check", 20) +
    '</div></div></section><section class="section"><div class="section-head"><h2>课程功能</h2></div>' +
    '<div class="feature-grid">' + features.map(([route, title, copy, image]) =>
      '<a class="card feature" href="#' + route + '">' + tileIcon(image) + '<strong>' + title + '</strong><p>' + copy + '</p><span class="feature-arrow">' +
      icon("arrow", 17) + '</span></a>').join("") + '</div></section>' +
    '<section class="section dashboard-grid"><article class="card padded"><div class="section-head"><h2>接下来学什么</h2>' +
    '<a class="text-link" href="#plan">查看规划 ' + icon("arrow", 16) + '</a></div>' +
    (next < 0 ? '<p>已完成全部示例单元。</p>' :
      '<div class="inline-row">' + tileIcon("calendar") + '<div><strong>' + lessons[next].title + '</strong><p>' +
      lessons[next].summary + '</p></div></div>') + '</article><article class="card padded"><div class="section-head"><h2>我的复习进度</h2>' +
    '<a class="text-link" href="#student-report">学情报告 ' + icon("arrow", 16) + '</a></div><div class="progress-row"><strong>' +
    completed + ' <span>/ ' + lessons.length + ' 个单元</span></strong><span>' + Math.round(100 * completed / lessons.length) +
    '%</span></div>' + progress(100 * completed / lessons.length, "复习完成度") + '</article></section>';
}

function knowledge() {
  const material = lessons[state.openedLesson];
  return pageHeading("学生学习端", "课程知识库", "选择讲义，查看本次技术演示使用的教材片段。") +
    '<div class="split"><section class="card padded"><div class="section-head"><h2>数据结构讲义</h2>' + badge("4 份示例") +
    '</div><div class="list">' + lessons.map(lessonRow).join("") + '</div></section><article class="card padded">' +
    tileIcon("book") + '<h2 class="section-title">' + material.title + '</h2><p class="muted">' + material.location +
    ' · ' + material.type + '</p><p>' + material.summary + '</p><blockquote>' + material.quote + '</blockquote>' +
    button("查看答疑示例", "ask", "secondary") + '</article></div>';
}

function ask() {
  const question = prompts[state.prompt];
  const material = lessons[question.lesson];
  return pageHeading("学生学习端", "AI 答疑", "选择预置问题，查看固定答复和对应教材示例。") +
    '<div class="split"><section class="card padded"><div class="section-head"><h2>示例问题</h2></div><div class="list">' +
    prompts.map((item, index) => '<button type="button" class="list-row" data-action="prompt" data-id="' + index + '" aria-pressed="' +
      (index === state.prompt) + '">' + tileIcon("chat") + '<strong>' + item.question + '</strong>' + icon("arrow", 16) + '</button>').join("") +
    '</div><div class="actions">' + action("显示示例答复", "show-answer", 0, "primary", state.showAnswer ? "disabled" : "") +
    '</div></section><article class="card padded answer-card"><div class="section-head"><h2>答疑预览</h2>' + badge("预置答复") +
    '</div><p class="question">' + question.question + '</p>' + (state.showAnswer ? '<p class="answer">' + question.answer +
    '</p><details class="source"><summary>' + icon("book", 17) + ' [1] ' + material.title + ' · ' + material.location +
    '</summary><blockquote>' + material.quote + '</blockquote></details>' : '<p class="muted">选择“显示示例答复”后查看引用原文。</p>') + '</article></div>';
}

function practice() {
  const exercise = exercises[state.question];
  return pageHeading("学生学习端", "智能练习", "使用预置题目体验作答、判分和解析。") +
    '<section class="card padded exercise-card"><div class="section-head"><h2>' + exercise.title + '</h2>' +
    badge("示例题 " + (state.question + 1) + " / " + exercises.length) + '</div><p>' + exercise.text + '</p><div class="choices" aria-label="选择答案">' +
    exercise.options.map((option, index) => '<button type="button" class="choice" data-action="choose" data-id="' + index + '" aria-pressed="' +
      (index === state.selected) + '" ' + (state.result !== null ? "disabled" : "") + '><span>' + "ABCD"[index] + '</span>' + option + '</button>').join("") +
    '</div>' + (state.result === null ? action("提交示例答案", "submit", 0, "primary", state.selected === null ? "disabled" : "") :
      '<div class="result ' + (state.result ? "correct" : "incorrect") + '"><strong>' + (state.result ? "回答正确" : "本题答错") +
      '</strong><p>' + exercise.explanation + '</p></div><div class="actions">' + action("切换示例题", "next-question", 0, "primary") +
      action("重做本题", "retry-question", 0) + '</div>') + '</section>';
}

function plan() {
  return pageHeading("学生学习端", "学习规划", "按单元安排复习，标记后同步到本次演示的学情报告。") +
    '<section class="card padded"><div class="section-head"><h2>单元安排</h2>' + badge(state.completed.size + " / " + lessons.length + " 已完成") +
    '</div><ol class="schedule">' + lessons.map((lesson, index) => {
      const done = state.completed.has(index);
      return '<li><span class="day">第 ' + (index + 1) + ' 天</span><div><strong>' + lesson.title + '</strong><p>' + lesson.summary +
        '</p></div><span class="schedule-action">' + action(done ? icon("check", 16) + " 已完成" : "标记完成", "complete", index,
          done ? "complete" : "secondary", 'aria-pressed="' + done + '"') + '</span></li>';
    }).join("") + '</ol></section>';
}

function studentReport() {
  const n = state.practiceAnswers.size;
  const correct = [...state.practiceAnswers.values()].filter(Boolean).length;
  const percent = Math.round(100 * state.completed.size / lessons.length);
  return pageHeading("学生学习端", "学情报告", "报告依据本次演示中的练习与规划操作更新。") +
    '<div class="metric-grid">' + metric(percent + "%", "复习完成度", state.completed.size + " / " + lessons.length + " 个单元") +
    metric(n, "已作答题数", "当前演示选题") + metric(n ? Math.round(100 * correct / n) + "%" : "—", "练习正确率", "按每题最近一次作答") +
    '</div><section class="card padded section"><div class="section-head"><h2>分单元进度</h2>' + badge("演示示例") +
    '</div><div class="report-list">' + lessons.map((lesson, index) =>
      '<div><span>' + lesson.title + '</span>' + progress(state.completed.has(index) ? 100 : 0, lesson.title) +
      '<strong>' + (state.completed.has(index) ? "已完成" : "待复习") + '</strong></div>').join("") + '</div></section>';
}

function teacherHome() {
  return pageHeading("教师管理端", "课程管理", "查看示例课程、资料列表与发布状态。") +
    '<article class="card teacher-course padded"><div class="inline-row">' + tileIcon("layers") +
    '<div><strong>考研 408 · 数据结构</strong><p>408 示例班 · 4 份示例资料</p></div></div>' + button("查看学员授权", "teacher-access", "secondary") +
    '</article><section class="card padded section"><div class="section-head"><h2>课程资料</h2>' + badge("示例资料") +
    '</div><div class="teacher-list">' + lessons.map((lesson, index) => {
      const live = state.published.has(index);
      return '<div class="teacher-row"><div class="inline-row">' + tileIcon("book") + '<div><strong>' + lesson.title + '</strong><p>' +
        lesson.location + ' · ' + lesson.type + '</p></div></div><span class="row-status ' + (live ? "live" : "") + '">' +
        (live ? "示例已发布" : "示例待发布") + '</span>' + action(live ? "模拟撤回" : "模拟发布", "publish", index) + '</div>';
    }).join("") + '</div></section>';
}

function teacherAccess() {
  return pageHeading("教师管理端", "学员与授权", "试用示例课程授权和撤权操作。") +
    '<section class="card padded"><div class="section-head"><h2>408 示例班</h2>' + badge("虚构学员") +
    '</div><div class="teacher-list">' + roster.map((user, index) => {
      const active = state.access.has(index);
      return '<div class="teacher-row"><div class="inline-row">' + tileIcon("users") + '<div><strong>' + user.label + '</strong><p>' +
        user.group + '</p></div></div><span class="row-status ' + (active ? "live" : "") + '">' + (active ? "示例已授权" : "示例未授权") +
        '</span>' + action(active ? "模拟撤权" : "模拟授权", "access", index) + '</div>';
    }).join("") + '</div></section>';
}

function teacherReport() {
  const enabled = roster.filter((_, index) => state.access.has(index));
  const mean = enabled.length ? Math.round(enabled.reduce((sum, user) => sum + user.progress, 0) / enabled.length) : null;
  return pageHeading("教师管理端", "班级学情报告", "按当前示例授权名单汇总预置学习数据。") +
    '<div class="metric-grid">' + metric(enabled.length, "参与学员", "当前示例授权") +
    metric(enabled.reduce((sum, user) => sum + user.attempts, 0), "累计练习", "虚构练习次数") +
    metric(mean === null ? "—" : mean + "%", "平均复习进度", "当前示例授权") + '</div>' +
    '<section class="card padded section"><div class="section-head"><h2>学员进度</h2>' + badge("虚构学情") +
    '</div>' + (enabled.length ? '<div class="report-list">' + enabled.map((user) =>
      '<div><span>' + user.label + ' <small>' + user.attempts + ' 次练习</small></span>' +
      progress(user.progress, user.label) + '<strong>' + user.progress + '%</strong></div>').join("") + '</div>' :
      '<p class="muted">当前演示中没有已授权的示例学员。</p>') + '</section>';
}

const views = {
  "student-home": studentHome, knowledge, ask, practice, plan, "student-report": studentReport,
  "teacher-home": teacherHome, "teacher-access": teacherAccess, "teacher-report": teacherReport,
};

function render() {
  const teacherMode = teacher.some(([route]) => route === current);
  const nav = teacherMode ? teacher : student;
  document.querySelector("#sidebar-label").textContent = teacherMode ? "教师工作台" : "学生工作台";
  document.querySelector("#sidebar-links").innerHTML = nav.map(([route, label, image]) =>
    '<a href="#' + route + '" ' + (route === current ? 'aria-current="page"' : "") + '>' + icon(image, 19) +
    '<span>' + label + '</span></a>').join("");
  for (const link of document.querySelectorAll("#role-switch a")) {
    const active = (link.hash === "#teacher-home") === teacherMode;
    if (active) link.setAttribute("aria-current", "true"); else link.removeAttribute("aria-current");
  }
  view.innerHTML = views[current]();
  const title = view.querySelector("h1")?.textContent;
  document.title = (title ? title + " · " : "") + "智研学堂技术演示";
}

function route() {
  const hash = location.hash.slice(1);
  if (hash === "workspace" && view.childElementCount) return;
  current = routes.includes(hash) ? hash : "student-home";
  announcement.textContent = "";
  render();
  window.scrollTo(0, 0);
}

function toggle(set, index) {
  if (set.has(index)) set.delete(index); else set.add(index);
}
const actions = {
  lesson(index) { state.openedLesson = index; },
  prompt(index) { state.prompt = index; state.showAnswer = false; },
  "show-answer"() { state.showAnswer = true; return "固定示例答复已显示。"; },
  choose(index) { state.selected = index; },
  submit() {
    if (state.selected === null) return;
    state.result = state.selected === exercises[state.question].correct;
    state.practiceAnswers.set(state.question, state.result);
    return state.result ? "回答正确。" : "本题答错，已显示解析。";
  },
  "next-question"() {
    state.question = (state.question + 1) % exercises.length;
    state.selected = state.result = null;
  },
  "retry-question"() { state.selected = state.result = null; },
  complete(index) { toggle(state.completed, index); return "示例复习进度已更新。"; },
  publish(index) { toggle(state.published, index); return "示例发布状态已更新。"; },
  access(index) { toggle(state.access, index); return "示例课程权限已更新。"; },
};

workspace.addEventListener("click", (event) => {
  const control = event.target.closest("button[data-action]");
  if (!control) return;
  const { action: name, id } = control.dataset;
  const handler = actions[name];
  if (typeof handler !== "function") return;
  const message = handler(Number(id));
  render();
  const updated = Array.from(view.querySelectorAll("button[data-action]")).find((node) =>
    node.dataset.action === name && node.dataset.id === id && !node.disabled);
  (updated || view.querySelector(".source summary, .result + .actions button, .choice") || workspace).focus({ preventScroll: true });
  announcement.textContent = message || "";
});

window.addEventListener("hashchange", route);
route();
