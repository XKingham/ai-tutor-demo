import { assessment, concepts, lessons, profiles } from "./fixtures.js";
import { actions, makeDemo, mastery, pathway, pickQuestion, statusLabels, submit,
  examDemo, examPlan, examStrategy, examStrategies, issueExam, setExamGoal, submitExam, teacherExamAction,
  canStartExamTransfer, viewExamTeaching } from "./learner-state.js";
import { replay, examReplay } from "./replays.js";

const learnerTabs = [
  ["exam", "考试闭环"], ["today", "今日任务"], ["diagnosis", "初始诊断"], ["plan", "学习路径"], ["tutor", "AI 教学"],
  ["practice", "智能练习"], ["knowledge", "课程知识库"], ["probability", "概率推断"], ["memory", "学习记忆"], ["report", "学情报告"],
];
const teacherTabs = [["teacher-exam", "考试干预"], ["teacher-report", "班级诊断"], ["teacher-home", "课程资料"]];
const learnerGroups = [["课程学习", ["today", "knowledge", "tutor", "probability"]],
  ["练习与评估", ["exam", "diagnosis", "practice", "plan"]], ["学习档案", ["memory", "report"]]];
const teacherGroups = [["教学跟进", ["teacher-exam", "teacher-report"]], ["课程管理", ["teacher-home"]]];
const view = document.querySelector("#view");
const teacherPortal = document.body.dataset.portal === "teacher";
const studentUrl = new URL("../", import.meta.url);
const teacherUrl = new URL("teacher/", studentUrl);
const graphArt = new URL("./graph-study.webp", import.meta.url).href;
const sessionKey = "zhiyan-demo-portals-v1";
const announcement = document.querySelector("#announcement");
let roster = makeDemo();
let exams = examDemo();
let examHistory = [];
let examSelections = {};
let latestExamResults = {};
let alias = "A";
let current = "today";
let activity = null;
let graphMode = "bfs";
let graphStep = 0;
let tutorOpen = false;
let readingFilter = "";
let defectRate = 5;

const escape = (value) => String(value).replace(/[&<>"']/g, (char) =>
  ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[char]);
const badge = (text, status = "") => '<span class="topic-state ' + status + '">' + escape(text) + '</span>';
const link = (route, text, variant = "secondary") => {
  const separate = route.startsWith("teacher") !== teacherPortal;
  const target = separate ? (teacherPortal ? studentUrl : teacherUrl).href : "";
  return '<a class="button ' + variant + '" href="' + target + '#' + route + '">' +
    escape(text) + ' <span aria-hidden="true">→</span></a>';
};
const control = (action, label, id = "", extra = "", variant = "secondary") =>
  '<button type="button" class="button ' + variant + '" data-action="' + action + '" data-id="' + id + '" ' + extra + '>' + escape(label) + '</button>';

function header(title, copy, mode = "学生工作台") {
  return '<div class="page-heading">' + (["学生工作台", "教师管理端"].includes(mode) ? "" :
    '<span class="kicker">' + mode + '</span>') + '<h1>' + title + '</h1><p>' + copy + '</p></div>';
}

function courseArt() {
  return '<figure class="trajectory-art course-ink-art"><img src="' + graphArt + '" width="1200" height="800" ' +
    'fetchpriority="high" alt=""><figcaption>课程专题 · 图的遍历与最短路径</figcaption></figure>';
}

function personaBar() {
  const cohort = current === "exam" || current === "teacher-exam" ? Object.entries(profiles).slice(0, 2) : Object.entries(profiles);
  return '<div class="persona-bar" aria-label="虚拟学员">' + cohort.map(([id, profile]) =>
    control("learner", profile.name + " · " + profile.stage, id, 'aria-pressed="' + (id === alias) + '"')).join("") +
    control("reset", "重置全部演示") + '</div>';
}

function taskList(tasks) {
  return tasks.length ? '<ol class="adaptive-list">' + tasks.map((task) =>
    '<li><span class="day">第 ' + task.day + ' 天 · ' + task.minutes + ' 分钟</span><div><strong>' +
    actions[task.status] + ' · ' + concepts[task.topic].title + '</strong><p>' + escape(task.reason) + '</p></div></li>').join("") +
    '</ol>' : '<p class="muted">所有知识点均已达到当前测评标准。</p>';
}

function masteryGrid(learner) {
  return '<div class="topic-grid">' + Object.entries(concepts).map(([topic, concept]) => {
    const state = mastery(learner, topic);
    return '<div><strong>' + concept.title + '</strong>' + badge(statusLabels[state.status], state.status) +
      '<small>' + state.count + ' 道独立题</small></div>';
  }).join("") + '</div>';
}

function today(learner) {
  const profile = learner.profile;
  const tasks = pathway(learner).filter((item) => item.day === 1);
  const next = tasks[0];
  const topics = Object.keys(concepts);
  const checked = topics.filter((topic) => mastery(learner, topic).count > 0).length;
  return header("考研 408 · 数据结构", profile.name + " · " + profile.stage + " · " + profile.preference) +
    '<section class="study-cover"><div class="study-cover-content"><h2>今日个性化任务</h2>' +
    (next ? '<h3>' + concepts[next.topic].title + '</h3><p class="task-duration">' + actions[next.status] + ' · ' + next.minutes +
      ' 分钟</p><p>' + escape(next.reason) + '</p>' : '<p>今天无待安排的知识点任务。</p>') +
    '<div class="actions">' + link(learner.history.length ? "practice" : "diagnosis",
      learner.history.length ? "开始针对性练习" : "开始初始诊断", "primary") + link("plan", "完整路径") +
    '</div>' + (tasks.length > 1 ? '<details><summary>其余今日任务（' + (tasks.length - 1) + '）</summary>' +
      taskList(tasks.slice(1)) + '</details>' : '') + '</div>' + courseArt() + '</section>' +
    '<div class="workspace-overview"><div class="today-work"><section class="goal-panel"><h2>学习目标</h2>' +
    '<div class="goal-fields"><label>攻克的知识点<select id="goal">' +
    Object.entries(concepts).map(([id, item]) => '<option value="' + id + '"' + (id === profile.goal ? " selected" : "") +
      '>' + item.title + '</option>').join("") + '</select></label><label>每天可用时间<select id="minutes">' +
    [10, 12, 15, 20, 25, 30, 40, 60].map((time) => '<option' + (time === profile.minutes ? " selected" : "") +
      '>' + time + '</option>').join("") + '</select></label></div><p class="muted">目标和时间变更后，路径会即时重算。</p></section>' +
    '<section class="continue-study"><h2>继续学习</h2><div>' + link("knowledge", "沉浸阅读") +
    link("tutor", "对比教学回放") + link("memory", "查看学习记忆") + '</div></section></div>' +
    '<section class="demo-evidence"><h2>知识点证据</h2><p><strong>' + checked + '</strong> / ' +
    topics.length + ' 个知识点有作答证据</p><progress aria-label="知识点测评覆盖" value="' + checked + '" max="' +
    topics.length + '"></progress>' + masteryGrid(learner) + '</section></div>';
}

function plan(learner) {
  return header("Mastery Path · 学习路径", "依据虚拟学员的目标、时间、知识点依赖和作答证据，在浏览器中重新计算。") +
    '<div class="split"><section class="card padded"><h2>下一步安排</h2>' + taskList(pathway(learner)) + '</section>' +
    '<section class="card padded"><h2>当前掌握证据</h2>' + masteryGrid(learner) + '<div class="actions">' +
    link("practice", "继续练习", "primary") + link("today", "调整学习目标") + '</div></section></div>';
}

function tutor(learner) {
  const receipt = replay.personas[alias];
  const review = pathway(learner).find((row) => row.status === "review");
  return header("AI 教学", "三个档案使用同一个问题。切换学员可对比本地答疑回放。") +
    '<div class="demo-tutor-grid"><section class="card padded"><div class="section-head"><h2>本地答疑回放</h2>' +
    badge("本地教学回放", "ready") + '</div>' +
    '<p class="question">' + escape(replay.question) + '</p><p class="replay-strategy">' + escape(receipt.strategy) +
    '</p>' + (tutorOpen ? (receipt.verified_example ? '<div class="memory-insight"><strong>课程核算例图</strong><p>' +
      escape(receipt.verified_example) + '</p></div>' : '') +
      '<div class="answer" tabindex="-1">' + escape(receipt.answer) + '</div><p class="muted">展示经内容复核的脱敏片段。</p>' :
      control("replay", "播放本地答复", "", "", "primary")) + '</section>' +
    '<aside class="demo-tutor-side" aria-label="答疑资料与后续任务"><section class="card padded"><h2>可核查的教材来源</h2>' +
    '<p class="muted">' + escape(receipt.section) + '</p><details class="source"><summary>核对公开示例材料</summary><blockquote>' +
    lessons[concepts.traversal.lesson].quote + '</blockquote>' + (alias === "C" ? '<blockquote>' +
    lessons[concepts.shortest.lesson].quote + '</blockquote>' : '') + '</details></section>' +
    '<section class="card padded"><h2>当前学员的下一步</h2><p class="muted">浏览器按刚提交的作答更新演示任务。</p>' +
    (review ? '<p>' + review.reason + '</p>' : '<p>打开题库建立新的测评证据。</p>') +
    '<div class="actions">' + link("practice", "进入针对性练习", "primary") + link("knowledge", "用 Little Tutor 导读") + '</div></section></aside></div>';
}

function practice(learner, kind) {
  const diagnostic = kind === "diagnosis";
  if (!activity) activity = { question: pickQuestion(learner, kind), choice: null, result: null };
  const { question, choice, result } = activity;
  const title = diagnostic ? "初始诊断" : "Question Bank · 针对性练习";
  const copy = diagnostic ? "根据未测评知识点选题。作答会建立学习证据。" :
    "根据薄弱程度、是否做过和学员阶段调整选题。";
  if (!question) return header(title, copy) + '<section class="card padded"><h2>' +
    (diagnostic ? "当前知识点已完成初始诊断" : "当前测评已达标") +
    '</h2><div class="actions">' + link("plan", "查看学习路径") + link("practice", "继续针对性练习", "primary") + '</div></section>';
  const concept = concepts[question.topic];
  return header(title, copy) + '<div class="split"><section class="card padded exercise-card"><div class="section-head"><h2>' +
    concept.title + '</h2>' + badge("难度 " + question.difficulty + " / 3") + '</div><p class="question">' + question.stem +
    '</p><div class="choices" aria-label="选择答案">' + question.choices.map((text, index) =>
      '<button type="button" class="choice" data-action="choice" data-id="' + index + '" aria-pressed="' + (choice === index) +
      '" ' + (result ? "disabled" : "") + '><span>' + "ABC"[index] + '</span>' + escape(text) + '</button>').join("") + '</div>' +
    (result ? '<div class="result ' + (result.correct ? "correct" : "incorrect") + '"><strong>' +
      (result.correct ? "回答正确" : "本题答错") + '</strong><p>' + question.explanation + '</p><p>知识点更新为 ' +
      statusLabels[result.mastery.status] + '（' + result.mastery.count + ' 道独立题）。</p></div><div class="actions">' +
      control("continue", diagnostic ? "下一道诊断题" : "选择下一道题", "", "", "primary") +
      link("tutor", "继续 AI 教学") + '</div>' : control("answer", "提交答案", "", choice === null ? "disabled" : "", "primary")) +
    '<details class="source"><summary>教材依据</summary><blockquote>' + lessons[concept.lesson].quote + '</blockquote></details></section>' +
    '<section class="card padded"><h2>作答后的下一步</h2>' + (result ? '<p class="muted">作答前 · ' +
      (result.before ? actions[result.before.status] + ' / ' + concepts[result.before.topic].title : "无待办任务") + '</p>' +
      taskList(result.after ? [result.after] : []) + '<div class="actions">' + link("plan", "查看更新后的路径") +
      link("teacher-report", "查看教师端变化") + '</div>' : '<p class="muted">此处会显示作答证据造成的任务变化。</p>' +
      masteryGrid(learner)) + '</section></div>';
}

function memory(learner) {
  const weak = Object.keys(concepts).filter((topic) => mastery(learner, topic).status === "review");
  return header("AI 教师对我的了解", "档案和错题仅保留在本次浏览器演示中，每个虚拟学员有独立记录。") +
    '<div class="split"><section class="card padded"><h2>已确认的学习档案</h2><p>' + learner.profile.stage +
    ' · ' + learner.profile.preference + ' · 每天 ' + learner.profile.minutes + ' 分钟</p><p>目标：' +
    concepts[learner.profile.goal].title + '</p>' + badge("L3 · 档案示例") + masteryGrid(learner) +
    '</section><section class="card padded"><h2>错题与学习经历</h2>' +
    (weak.length ? '<div class="memory-insight">' + badge("L2 · 关联薄弱点", "review") + '<ul>' + weak.map((topic) =>
      '<li>' + concepts[topic].title + ' · ' + concepts[topic].remediation + '</li>').join("") + '</ul></div>' : '') +
    (learner.history.length ? '<ol class="adaptive-list">' + [...learner.history].reverse().map((item) =>
      '<li><div><strong>' + concepts[item.topic].title + ' · ' + (item.correct ? "通过" : "需补习") + '</strong><p>' +
      item.explanation + '</p>' + badge(item.kind === "diagnosis" ? "L1 · 初始诊断" : "L1 · 练习证据") +
      '</div></li>').join("") + '</ol>' : '<p class="muted">提交诊断或练习后生成记忆证据。</p>') +
    '</section></div>';
}

function report(learner) {
  const correct = learner.history.filter((item) => item.correct).length;
  return header("学情报告", "报告依据当前虚拟学员的实际页面操作计算。") +
    '<section class="card padded"><h2>我的知识点诊断</h2><p>' + learner.history.length + ' 次作答 · ' + correct +
    ' 次正确 · ' + Object.keys(learner.evidence).length + ' 道独立题</p>' + masteryGrid(learner) +
    '<div class="actions">' + link("memory", "查看证据来源") + link("teacher-report", "查看教师端诊断") + '</div></section>';
}

const vertices = { A: [34, 84], B: [155, 32], C: [155, 137], D: [284, 84] };
const edges = [["A", "B", 1], ["A", "C", 5], ["B", "D", 2], ["C", "D", 1]];
const modes = { tree: "二叉树先序", bfs: "BFS", dfs: "DFS", weighted: "Dijkstra" };

function visualization() {
  const tree = graphMode === "tree";
  const weighted = graphMode === "weighted";
  const activeEdges = edges.filter(([from]) => !tree || from !== "C");
  const queue = [["A", 0]];
  const seen = [];
  const frames = [];
  while (queue.length) {
    if (weighted) queue.sort((a, b) => a[1] - b[1]);
    const [node, distance] = queue.shift();
    if (seen.includes(node)) continue;
    seen.push(node);
    const frontier = activeEdges.filter(([from, to]) => from === node && !seen.includes(to) &&
      (graphMode !== "bfs" || !queue.some(([pending]) => pending === to)))
      .map(([, to, cost]) => [to, distance + (weighted ? cost : 1)]);
    if (graphMode === "dfs" || tree) queue.unshift(...frontier);
    else queue.push(...frontier);
    frames.push({ node, distance, pending: queue.map(([to]) => to) });
  }
  const currentFrame = frames[graphStep - 1];
  const visited = seen.slice(0, graphStep);
  return '<section class="card padded section visual-card"><div class="section-head"><h2>逐步算法图解</h2>' +
    badge("浏览器计算") + '</div><div class="actions">' + Object.entries(modes).map(([id, label]) =>
      control("mode", label, id, 'aria-pressed="' + (id === graphMode) + '"')).join("") +
    '</div><div class="graph-layout"><svg viewBox="0 0 320 170" class="study-graph" role="img" aria-label="' +
    modes[graphMode] + '示例图">' + activeEdges.map(([a, b, w]) => {
      const [x, y] = vertices[a], [x2, y2] = vertices[b];
      return '<line x1="' + x + '" y1="' + y + '" x2="' + x2 + '" y2="' + y2 + '"/>' +
        (weighted ? '<text x="' + (x + x2) / 2 + '" y="' + ((y + y2) / 2 - 8) + '">' + w + '</text>' : "");
    }).join("") + Object.entries(vertices).map(([id, [x, y]]) =>
      '<g class="' + (visited.includes(id) ? "visited" : "") + '"><circle cx="' + x + '" cy="' + y +
      '" r="19"/><text x="' + x + '" y="' + (y + 5) + '" text-anchor="middle">' + id + '</text></g>').join("") +
    '</svg><div class="graph-explain"><strong>' + (currentFrame ? "访问 " + currentFrame.node : "从 A 开始") + '</strong>' +
    '<p>' + (currentFrame ? "路径代价 " + currentFrame.distance + ' · ' + visited.join(" → ") : "推进一步，观察访问顺序。") +
    '</p>' + (currentFrame?.pending.length ? '<p>待处理 ' + currentFrame.pending.join("、") + '</p>' : '') +
    '<div class="actions">' + control("graph-next", "推进一步", "", graphStep === frames.length ? "disabled" : "", "primary") +
    control("graph-reset", "重置图解") + '</div></div></div></section>';
}

function knowledge(learner) {
  const concept = concepts[learner.reading];
  const material = lessons[concept.lesson];
  const chapters = Object.entries(concepts);
  const search = readingFilter.trim().toLowerCase();
  const matches = (title) => title.toLowerCase().includes(search);
  return header("课程知识库", "三位虚拟学员使用同一套公开示例讲义。") +
    '<div class="demo-tutor-grid"><div><section class="card padded demo-chapters"><div class="section-head">' +
    '<h2>教材目录</h2><label>搜索教材<input id="reading-filter" type="search" value="' + escape(readingFilter) + '" /></label></div>' +
    '<div class="link-stack">' + chapters.map(([id, item]) => control("reading", item.title, id,
      'aria-pressed="' + (id === learner.reading) + '"' + (matches(item.title) ? "" : " hidden"))).join("") +
    '</div><p id="reading-empty" class="muted"' + (chapters.some(([, item]) => matches(item.title)) ? " hidden" : "") +
    '>没有符合条件的章节。</p></section><article class="card padded demo-document" aria-label="教材正文"><p class="kicker">' +
    material.location + ' · 公开示例讲义</p><h2>' + material.title + '</h2><p>' + material.summary + '</p><blockquote>' + material.quote +
    '</blockquote></article></div><aside class="card padded demo-companion" aria-label="阅读伴学"><h2>Little Tutor 分步导读</h2>' +
    badge("教材内置提示") + '<p>先读教材，再用一题检验理解。</p>' +
    '<details class="source"><summary>显示本节引导题</summary><p>' +
    assessment.find((item) => item.topic === learner.reading && item.diagnostic).stem + '</p><p>' + concept.remediation +
    '</p></details><div class="actions">' + link("tutor", "查看真实教学回放") + '</div></aside></div>' + visualization();
}

function teacherHome() {
  return header("课程资料", "本次技术演示使用三组公开原创材料，供虚拟学员在浏览器中阅读。", "教师管理端") +
    '<section class="card padded"><h2>考研 408 · 数据结构</h2><ol class="adaptive-list">' +
    Object.values(concepts).map((item) => '<li><div><strong>' + item.title + '</strong><p>' + lessons[item.lesson].summary +
      '</p></div></li>').join("") + '</ol><div class="actions">' + link("teacher-report", "查看班级诊断", "primary") +
    link("knowledge", "打开课程知识库") + '</div></section>';
}

function teacherReport() {
  const summary = Object.entries(roster);
  const errors = assessment.map((question) => ({
    question, count: summary.filter(([, learner]) => learner.evidence[question.id]?.correct === false).length,
  })).filter((row) => row.count).sort((a, b) => b.count - a.count);
  const assessed = summary.filter(([, learner]) => learner.history.length).length;
  const followup = summary.filter(([, learner]) => Object.keys(concepts).some((id) => mastery(learner, id).status === "review")).length;
  return header("班级诊断", "以下数据由虚拟学员在本浏览器中的作答更新。", "教师管理端") +
    '<section class="card padded diagnosis-matrix"><h2>知识点掌握热力图</h2>' +
    '<dl class="diagnosis-summary"><div><dt>虚拟学员</dt><dd>' + summary.length + '</dd></div><div><dt>有测评证据</dt><dd>' +
    assessed + '</dd></div><div><dt>存在待补习知识点</dt><dd>' + followup + '</dd></div></dl>' +
    '<div class="wide-table" role="region" tabindex="0" aria-label="知识点掌握表"><table><thead><tr><th>学员</th>' + Object.values(concepts).map((item) =>
      '<th scope="col">' + item.title + '</th>').join("") + '</tr></thead><tbody>' +
    summary.map(([, learner]) => '<tr><th scope="row">' + learner.profile.name + '</th>' + Object.keys(concepts).map((topic) => {
      const row = mastery(learner, topic);
      return '<td>' + badge(statusLabels[row.status] + (row.count ? ' · ' + row.count + ' 题' : ''), row.status) + '</td>';
    }).join("") + '</tr>').join("") + '</tbody></table></div></section><div class="split section">' +
    '<section class="card padded"><h2>教学调整与干预</h2><ol class="adaptive-list">' +
    summary.map(([, learner]) => {
      const task = pathway(learner)[0];
      const followup = learner.history.filter((row) => !row.correct && mastery(learner, row.topic).status === "review").length >= 2;
      return '<li><div><strong>' + learner.profile.name + '</strong> ' + (followup ? badge("建议跟进", "review") : "") +
        (task ? '<p>' + actions[task.status] + ' · ' + concepts[task.topic].title + '</p><p>' + task.reason + '</p>' :
          '<p>当前测评已达标。</p>') + '</div></li>';
    }).join("") + '</ol></section><section class="card padded"><h2>共性错题</h2>' +
    (errors.length ? '<ol class="adaptive-list">' + errors.map(({ question, count }) =>
      '<li><div><strong>' + question.stem + '</strong><p>' + count + ' 人仍有最近一次错误记录</p></div></li>').join("") +
      '</ol>' : '<p class="muted">等待虚拟学员提交作答。</p>') + '<div class="actions">' +
    '<a class="button secondary" href="' + studentUrl.href + '#today">打开学生学习站</a>'  + '</div></section></div>';
}

const examActions = { diagnostic: "开始同一诊断题", probe: "打开区分题", transfer: "开始独立变式" };
const examStates = { candidate: "待区分", confirmed: "已确认", rejected: "已排除", unknown: "待复核",
  suggested: "待教师审核", accepted: "已接受", completed: "已补救，待独立验证", verified: "已获得后续独立证据" };

const interventionLabels = { ...examStates, rejected: "已驳回" };

function trajectoryComparison() {
  const learners = Object.values(exams);
  const rows = [
    ["已确认的错因", (learner) => learner.error?.status === "confirmed"
      ? learner.error.label : !learner.diagnostic ? "待诊断"
        : learner.diagnostic.correct ? "诊断通过" : "待区分题确认"],
    ["教学轨迹", (learner) => learner.exposures.map(({ id }) => examStrategies[id]).join(" → ") || "待开始"],
    ["独立复验", (learner) => learner.history.filter((event) => event.independent)
      .map(({ correct }) => correct ? "已通过" : "未通过").join(" → ") || "待作答"],
  ];
  return '<section class="trajectory-notebook" aria-labelledby="trace-heading"><div class="trajectory-heading">' +
    '<h2 id="trace-heading" tabindex="-1">两位学员的学习记录</h2>' +
    '<a class="button secondary" href="' + teacherUrl.href + '">打开教师管理站</a></div>' +
    '<table><thead><tr><th scope="col">学习证据</th>' +
    learners.map((learner) => '<th scope="col">学员 ' + learner.name + '</th>').join("") +
    '</tr></thead><tbody>' + rows.map(([label, value]) => '<tr><th scope="row">' + label + '</th>' +
    learners.map((learner) => '<td>' + escape(value(learner)) + '</td>').join("") + '</tr>').join("") + '</tbody></table></section>';
}

function examWorkbench() {
  const state = exams[alias];
  const days = Math.round((Date.parse(state.date) - Date.parse(state.today)) / 86400000);
  const strategy = examStrategy(state);
  const shown = state.exposures.at(-1);
  const sample = shown && examReplay?.personas[shown.replay];
  const question = state.ticket?.question;
  const chosen = examSelections[alias];
  const result = latestExamResults[alias];
  const plan = examPlan(state);
  const pendingProbe = state.error?.status === "candidate";
  const availableTransfer = canStartExamTransfer(state);
  const independent = state.history.filter((item) => item.independent);
  const passed = independent.filter((item) => item.correct).length;
  const steps = ["诊断", "区分错因", "专属教学", "独立复验"];
  const activeStep = state.ticket ? { diagnostic: 0, probe: 1, transfer: 3 }[state.ticket.kind]
    : !state.diagnostic ? 0 : pendingProbe ? 1 : availableTransfer || passed ? 3 : 2;
  const planPanels =
    '<section class="card padded exam-config"><div class="section-head"><h2>考试目标</h2></div>' +
    '<div class="goal-fields"><label>考试日期<input type="date" id="exam-date" min="' +
    escape(state.today) + '" value="' + escape(state.date) + '"></label><label>每天可用分钟<select id="exam-budget">' +
    [8, 12, 18, 25, 35, 45, 60].map((minutes) => '<option' + (minutes === state.budget ? " selected" : "") +
      '>' + minutes + '</option>').join("") + '</select></label></div><p class="muted exam-note">调整后自动重排任务。此处采用虚拟考纲权重。</p></section>' +
    '<section class="card padded exam-plan"><div class="section-head"><h2>学习任务</h2>' +
    '<span class="muted">版本 ' + state.version + '</span></div><ol class="adaptive-list">' + plan.map((item) =>
      '<li><span class="day">第 ' + item.day + ' 天<br>' + item.minutes + ' 分钟</span><div><strong>' +
      item.action + ' · ' + item.label + '</strong><p>' + escape(item.reason) + '</p><small>估计优先级 ' + item.priority +
      '</small></div></li>').join("") + '</ol></section>';
  return '<section class="exam-header"><div class="exam-intro"><p class="kicker">智研学堂 <span></span> 考研 408 教学案例</p>' +
    '<h1>同一道题，<span>两条学习轨迹</span></h1><p class="exam-lead">两位学员答同一道图遍历题。跟着他们的作答，看错因如何改变下一步教学。</p>' +
    '<div class="actions">' + control("exam-jump", "进入当前步骤", activeStep, "", "highlight") +
    control("exam-compare", "比较两名学员", "", "", "secondary") + '</div></div>' +
    courseArt() + '</section>' +
    '<section class="case-session" aria-label="图的遍历案例"><div><p class="kicker">ExamPilot · 图的遍历</p>' +
    personaBar() + '</div><dl class="exam-metrics"><div><dt>距考试</dt><dd>' + days +
    '<small> 天</small></dd></div><div><dt>每日预算</dt><dd>' + state.budget +
    '<small> 分钟</small></dd></div></dl></section>' +
    '<ol class="exam-steps" aria-label="教学进度">' + steps.map((step, index) =>
      index === activeStep ? '<li aria-current="step">' + control("exam-jump", step, index, 'aria-label="跳到当前步骤 ' + step + '"') + '</li>'
        : '<li>' + step + '</li>').join("") + '</ol>' +
    '<div class="exam-layout"><div class="exam-column"><section class="card padded exam-assessment"><h2>ErrorMind 错因与验证</h2><div class="actions">' +
    control("exam-start", examActions.diagnostic, "diagnostic", state.diagnostic || question ? "disabled" : "", activeStep === 0 ? "primary" : "secondary") +
    control("exam-start", examActions.probe, "probe", !pendingProbe || question ? "disabled" : "", activeStep === 1 ? "primary" : "secondary") +
    control("exam-start", examActions.transfer, "transfer", !availableTransfer || question ? "disabled" : "", activeStep === 3 ? "primary" : "secondary") + '</div>' +
    (question ? '<div class="exam-question"><p class="question">' + escape(question.stem) + '</p><div class="choices">' +
      question.options.map((option, index) => control("exam-choice", option, index, 'aria-pressed="' + (chosen === index) + '"')).join("") +
      '</div>' + control("exam-submit", "提交本题", "", chosen === undefined ? "disabled" : "", "primary") + '</div>' : '') +
    (result ? '<div class="result ' + (result.correct && !result.assisted ? "correct" : "incorrect") + '" tabindex="-1"><strong>' +
      (result.assisted ? "含求助，未计入" : result.correct ? "本题通过" : "本题未通过") + '</strong><p>' +
      escape(result.explanation) + '</p></div>' : '') +
    (state.error ? '<p><strong>' + state.error.label + '</strong> ' + badge(examStates[state.error.status]) +
      (state.error.resolved ? ' · 已获独立复验证据' : '') + '</p>' : '') +
    '<h3>Learning Evaluator 独立证据</h3><p>' + independent.length +
    ' 道未见变式 · ' + passed + ' 道通过</p>' +
    '<p class="muted">本次浏览器演示的延时保持测评尚未到期。</p></section>' +
    '<section class="card padded exam-teaching"><h2>Adaptive Teaching 专属教学</h2><p class="exam-strategy">' +
    examStrategies[strategy.id] + '</p><p>' + escape(strategy.reason) + '</p>' +
    '<p class="muted">' + (strategy.replay ? "本地真实模型回放" : "课程规则演示") + '</p>' +
    control("exam-teach", strategy.replay ? "播放当前策略回放" : "记录规则补习", "", !state.diagnostic ? "disabled" : "", activeStep === 2 ? "primary" : "secondary") +
    (sample ? '<p class="muted">展示 ' + escape(sample.strategy) + ' 的本地审校片段 · 讲义：' + escape(sample.source) + '</p>' +
      (sample.verified_example ? '<p class="memory-insight">' + escape(sample.verified_example) + '</p>' : '') +
      '<div class="answer" tabindex="-1">' + escape(sample.answer) + '</div>' : '') +
    '</section>' + (shown?.id === "animation" ? visualization() : "") +
    '</div><aside class="exam-column" aria-label="考试计划">' + planPanels + '</aside></div>' +
    trajectoryComparison();
}

function examTeacher() {
  const learners = Object.values(exams);
  const count = (statuses) => learners.filter(({ intervention }) => statuses.includes(intervention)).length;
  const metrics = [["待处理", count(["suggested", "accepted"])], ["待独立验证", count(["completed"])], ["已有独立证据", count(["verified"])]];
  return '<div class="teacher-intro">' +
    header("Teacher Copilot 干预队列", "根据虚拟学员的作答，记录补救并查看后续独立证据。", "教师管理端") + '</div>' +
    '<dl class="exam-metrics teacher-metrics">' + metrics.map(([label, value]) =>
      '<div><dt>' + label + '</dt><dd>' + value + '</dd></div>').join("") + '</dl>' +
    '<div class="split teacher-queue">' + learners.map((state) => '<section class="card padded"><div class="section-head"><h2>虚拟学员 ' +
      state.name + '</h2>' + (state.intervention ? badge(interventionLabels[state.intervention]) : '') + '</div>' +
      (state.error ? '<p>' + state.error.label + ' · ' + examStates[state.error.status] + '</p>' : '<p class="muted">暂无错因证据。</p>') +
      (state.intervention === "suggested" ? '<div class="actions">' +
        control("exam-teacher-accept", "接受干预", state.name, "", "primary") + control("exam-teacher-reject", "驳回建议", state.name) + '</div>' : '') +
      (state.intervention === "accepted" ? control("exam-teacher-complete", "记录补救完成", state.name, "", "primary") : '') +
      '<ol class="adaptive-list">' + state.actions.map((item) => '<li>' + interventionLabels[item.status] +
        (item.evidence ? ' · 独立证据 #' + item.evidence : '') + '</li>').join("") + '</ol></section>').join("") +
    '</div><div class="actions"><a class="button primary" href="' + studentUrl.href + '">返回学生学习站</a>' +
    link("teacher-report", "查看知识点热力图") + link("teacher-home", "查看课程资料") + '</div>';
}

function probability() {
  const defects = 1000 * defectRate / 100;
  const trueAlerts = defects * .8;
  const falseAlerts = (1000 - defects) * .1;
  const alerts = trueAlerts + falseAlerts;
  const percent = (trueAlerts / alerts * 100).toFixed(1);
  return header("亮灯以后，缺陷有多可能？", "用一千件零件读懂条件概率、全概率和贝叶斯复核。", "概率推断 · 原创教材示例") +
    '<div class="split"><section class="card padded"><h2>先数清楚亮灯的零件</h2>' +
    '<p>有缺陷的零件有 80% 会亮灯，无缺陷的零件也有 10% 会误亮灯。</p>' +
    '<div class="goal-fields"><label>实际缺陷率<select id="defect-rate">' +
    [1, 5, 10, 20].map((rate) => '<option value="' + rate + '"' + (rate === defectRate ? ' selected' : '') + '>' +
      rate + '%</option>').join("") + '</select></label></div></section>' +
    '<section class="card padded"><h2>亮灯后的概率</h2><dl class="exam-metrics">' +
    '<div><dt>实际缺陷且亮灯</dt><dd>' + trueAlerts + '</dd></div><div><dt>误亮灯</dt><dd>' + falseAlerts + '</dd></div>' +
    '</dl><p class="probability-answer"><strong>' + percent + '%</strong> 的亮灯零件实际有缺陷</p>' +
    '<p>' + trueAlerts + ' ÷ ' + alerts + '。分母包含真实告警和误报。</p></section></div>';
}

const views = {
  exam: examWorkbench, "teacher-exam": examTeacher,
  today, diagnosis: (learner) => practice(learner, "diagnosis"), plan, tutor, practice: (learner) => practice(learner, "practice"),
  knowledge, probability, memory, report, "teacher-report": teacherReport, "teacher-home": teacherHome,
};

function applyEvent(entry) {
  if (!Array.isArray(entry)) return null;
  const [action, who, value, detail] = entry;
  if (!Object.hasOwn(roster, who)) return null;
  const profile = roster[who].profile;
  if (action === "legacy-answer" && Number.isInteger(detail?.choice) && ["diagnosis", "practice"].includes(detail?.kind)) {
    const question = assessment.find((item) => item.id === value);
    if (question && detail.choice >= 0 && detail.choice < question.choices.length) {
      return submit(roster[who], question, detail.choice, detail.kind);
    }
  }
  if (action === "legacy-goal" && Object.hasOwn(concepts, value)) {
    profile.goal = value;
    return true;
  }
  if (action === "legacy-minutes" && Number.isInteger(value) && value >= 5 && value <= 120) {
    profile.minutes = value;
    return true;
  }
  if (!Object.hasOwn(exams, who)) return null;
  const learner = exams[who];
  if (action === "goal" && typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isInteger(detail)) {
    return setExamGoal(learner, value, detail);
  }
  if (action === "start" && ["diagnostic", "probe", "transfer"].includes(value)) return issueExam(learner, value);
  if (action === "answer" && Number.isInteger(value) && value >= 0) {
    const result = submitExam(learner, value);
    if (result) latestExamResults[who] = result;
    return result;
  }
  if (action === "teach" && learner.diagnostic) return viewExamTeaching(learner);
  if (action === "teacher" && ["accepted", "rejected", "completed"].includes(value)) return teacherExamAction(learner, value);
  return null;
}

function restoreDemo() {
  try {
    const saved = JSON.parse(sessionStorage.getItem(sessionKey));
    if (!saved || !Array.isArray(saved.events)) return;
    if (Object.hasOwn(profiles, saved.alias)) alias = saved.alias;
    for (const entry of saved.events) {
      if (applyEvent(entry)) examHistory.push(entry);
    }
  } catch {
    // The teaching demo is still usable when tab storage is unavailable.
  }
}

function rememberDemo() {
  try {
    sessionStorage.setItem(sessionKey, JSON.stringify({ alias, events: examHistory }));
  } catch {
    // The current page keeps its working state in memory.
  }
}

function changeExam(...entry) {
  const result = applyEvent(entry);
  if (result) {
    examHistory.push(entry);
    rememberDemo();
  }
  return result;
}

function render() {
  if ((current === "exam" || teacherPortal) && !exams[alias]) alias = "A";
  const links = teacherPortal ? teacherTabs : learnerTabs;
  document.querySelector("#sidebar-label").textContent = teacherPortal ? "教师工作台" : "学生工作台";
  const edition = current === "exam";
  const item = ([id, label]) => '<a href="#' + id + '" ' + (id === current ? 'aria-current="page"' : "") + '>' + label + '</a>';
  document.querySelector("#sidebar-links").innerHTML = edition ? links.map(item).join("") :
    (teacherPortal ? teacherGroups : learnerGroups).map(([label, ids]) =>
      '<div class="demo-nav-group"><p>' + label + '</p>' + ids.map((id) => item(links.find(([key]) => key === id))).join("") + '</div>').join("");
  document.querySelector(".app-frame").classList.toggle("case-edition", edition);
  view.innerHTML = (edition || teacherPortal ? "" : personaBar()) + views[current](roster[alias]);
  document.title = view.querySelector("h1").textContent + " · 智研学堂";
}

function route() {
  const previous = current;
  const hash = location.hash.slice(1);
  if (hash === "workspace" && view.childElementCount) return;
  const oldLinks = { "student-home": "today", ask: "tutor", "student-report": "report", "teacher-access": "teacher-home" };
  const target = Object.hasOwn(oldLinks, hash) ? oldLinks[hash] : hash;
  if (!teacherPortal && teacherTabs.some(([id]) => id === target)) {
    location.replace(new URL("#" + target, teacherUrl));
    return;
  }
  const tabs = teacherPortal ? teacherTabs : learnerTabs;
  current = tabs.some(([id]) => id === target) ? target : tabs[0][0];
  if (previous !== current) activity = null;
  render();
  window.scrollTo(0, 0);
}

view.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-action]");
  if (!button) return;
  const { action, id } = button.dataset;
  let message = "";
  if (action === "learner") {
    alias = id;
    activity = null;
    rememberDemo();
    message = "已切换到" + profiles[alias].name;
  } else if (action === "reset") {
    roster = makeDemo();
    alias = "A";
    activity = null;
    graphMode = "bfs";
    graphStep = 0;
    tutorOpen = false;
    readingFilter = "";
    exams = examDemo();
    examHistory = [];
    examSelections = {};
    latestExamResults = {};
    rememberDemo();
    message = "全部演示状态已重置";
  } else if (action === "exam-compare") {
    view.querySelector("#trace-heading").focus();
    return;
  } else if (action === "exam-jump") {
    const targets = ["diagnostic", "probe", "teach", "transfer"];
    const target = button.dataset.id === "2" ? view.querySelector('[data-action="exam-teach"]') :
      view.querySelector('[data-action="exam-start"][data-id="' + targets[Number(id)] + '"]');
    const focus = view.querySelector(".exam-question button") || (target?.disabled ? view.querySelector(".exam-assessment .result") : target);
    focus?.focus();
    return;
  } else if (action === "exam-start") {
    if (!changeExam("start", alias, id)) message = "暂无可用题，或有一题尚未提交。";
    else delete examSelections[alias];
  } else if (action === "exam-choice") {
    examSelections[alias] = Number(id);
  } else if (action === "exam-submit") {
    changeExam("answer", alias, examSelections[alias]);
    delete examSelections[alias];
    message = "已更新个人证据和考试任务";
  } else if (action === "exam-teach") {
    const selection = changeExam("teach", alias);
    graphMode = exams[alias].error?.id === "edge-cost" ? "weighted" : "bfs";
    graphStep = 0;
    message = selection?.replay ? "已播放审校片段" : "已记录规则补习";
  } else if (action.startsWith("exam-teacher-")) {
    const next = { accept: "accepted", reject: "rejected", complete: "completed" }[action.split("-").at(-1)];
    changeExam("teacher", id, next);
    message = "教学操作已保存";
  } else if (action === "choice") {
    activity.choice = Number(id);
  } else if (action === "answer") {
    activity.result = changeExam("legacy-answer", alias, activity.question.id, { choice: activity.choice, kind: current });
    message = "已更新知识点掌握证据和学习路径";
  } else if (action === "continue") {
    activity = null;
  } else if (action === "replay") {
    tutorOpen = true;
    message = "本地真实模型回放已展开";
  } else if (action === "reading") {
    roster[alias].reading = id;
  } else if (action === "mode") {
    graphMode = id;
    graphStep = 0;
  } else if (action === "graph-next") {
    graphStep += 1;
  } else if (action === "graph-reset") {
    graphStep = 0;
  }
  render();
  const buttons = [...view.querySelectorAll("button[data-action]")];
  const restored = buttons.find((item) => item.dataset.action === action && item.dataset.id === id && !item.disabled);
  const response = { "exam-start": ".exam-question button", "exam-submit": ".exam-assessment .result",
    "exam-teach": ".exam-teaching .answer" }[action];
  const next = response && view.querySelector(response);
  const fallback = view.querySelector('.result + .actions button, .choice:not([disabled]), h1');
  const focus = next || restored || fallback;
  if (focus?.matches("h1")) focus.tabIndex = -1;
  focus?.focus({ preventScroll: focus !== next });
  announcement.textContent = message;
});

view.addEventListener("input", (event) => {
  if (event.target.id !== "reading-filter") return;
  readingFilter = event.target.value;
  const search = readingFilter.trim().toLowerCase();
  const items = [...view.querySelectorAll('button[data-action="reading"]')];
  for (const button of items) button.hidden = !button.textContent.toLowerCase().includes(search);
  view.querySelector("#reading-empty").hidden = items.some((button) => !button.hidden);
});

view.addEventListener("change", (event) => {
  const { id, value } = event.target;
  if (id === "defect-rate") {
    defectRate = Number(value);
    render();
    document.getElementById(id)?.focus({ preventScroll: true });
    announcement.textContent = "亮灯后的概率已重算";
    return;
  }
  if (id === "exam-date" || id === "exam-budget") {
    const state = exams[alias];
    const changed = changeExam("goal", alias, id === "exam-date" ? value : state.date,
      id === "exam-budget" ? Number(value) : state.budget);
    render();
    document.getElementById(id)?.focus({ preventScroll: true });
    announcement.textContent = changed ? "考试目标生效，任务已重排" : "请选择有效日期和每日时间";
    return;
  }
  if (id !== "goal" && id !== "minutes") return;
  changeExam("legacy-" + id, alias, id === "minutes" ? Number(value) : value);
  activity = null;
  render();
  document.getElementById(id).focus({ preventScroll: true });
  announcement.textContent = "学习目标和任务安排已更新";
});

window.addEventListener("hashchange", route);
window.addEventListener("pageshow", (event) => {
  if (!event.persisted) return;
  roster = makeDemo();
  exams = examDemo();
  examHistory = [];
  latestExamResults = {};
  examSelections = {};
  restoreDemo();
  render();
});
restoreDemo();
route();
