import { assessment, concepts, lessons, profiles } from "./fixtures.js";
import { actions, makeDemo, mastery, pathway, pickQuestion, statusLabels, submit,
  examDemo, examPlan, examStrategy, examStrategies, issueExam, setExamGoal, submitExam, teacherExamAction,
  canStartExamTransfer, viewExamTeaching } from "./learner-state.js";
import { replay, examReplay } from "./replays.js";

const learnerTabs = [
  ["exam", "考试闭环"], ["today", "今日任务"], ["diagnosis", "初始诊断"], ["plan", "学习路径"], ["tutor", "AI 教学"],
  ["practice", "智能练习"], ["knowledge", "课程知识库"], ["memory", "学习记忆"], ["report", "学情报告"],
];
const teacherTabs = [["teacher-exam", "考试干预"], ["teacher-report", "班级诊断"], ["teacher-home", "课程资料"]];
const view = document.querySelector("#view");
const announcement = document.querySelector("#announcement");
let roster = makeDemo();
let exams = examDemo();
let examSelections = {};
let latestExamResults = {};
let alias = "A";
let current = "today";
let activity = null;
let graphMode = "bfs";
let graphStep = 0;
let tutorOpen = false;

const escape = (value) => String(value).replace(/[&<>"']/g, (char) =>
  ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[char]);
const badge = (text, status = "") => '<span class="topic-state ' + status + '">' + escape(text) + '</span>';
const link = (route, text, variant = "secondary") =>
  '<a class="button ' + variant + '" href="#' + route + '">' + escape(text) + ' <span aria-hidden="true">→</span></a>';
const control = (action, label, id = "", extra = "", variant = "secondary") =>
  '<button type="button" class="button ' + variant + '" data-action="' + action + '" data-id="' + id + '" ' + extra + '>' + escape(label) + '</button>';

function header(title, copy, mode = "学生工作台") {
  return '<div class="page-heading"><span class="kicker">' + mode + '</span><h1>' + title + '</h1><p>' + copy + '</p></div>';
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
  return '<section class="course-hero personal-hero"><div class="hero-content"><span class="hero-label">考研 408 · 数据结构</span>' +
    '<h1>今日个性化任务</h1><p>' + profile.name + ' · ' + profile.stage + ' · ' + profile.preference +
    '</p><div class="actions">' + link(learner.history.length ? "practice" : "diagnosis",
      learner.history.length ? "开始针对性练习" : "开始初始诊断", "hero-primary") +
    link("tutor", "对比教学回放", "hero-light") + '</div></div>' +
    '<div class="hero-summary"><strong>' + profile.minutes + '</strong><span>分钟 / 天</span><p>' + concepts[profile.goal].title +
    '</p></div></section>' +
    '<div class="split section"><section class="card padded"><div class="section-head"><h2>学习目标</h2>' +
    badge("虚拟档案") + '</div><div class="goal-fields"><label>攻克的知识点<select id="goal">' +
    Object.entries(concepts).map(([id, item]) => '<option value="' + id + '"' + (id === profile.goal ? " selected" : "") +
      '>' + item.title + '</option>').join("") + '</select></label><label>每天可用时间<select id="minutes">' +
    [10, 12, 15, 20, 25, 30, 40, 60].map((time) => '<option' + (time === profile.minutes ? " selected" : "") +
      '>' + time + '</option>').join("") + '</select></label></div><p class="muted">目标和时间变更后，路径会即时重算。</p></section>' +
    '<section class="card padded"><div class="section-head"><h2>今天学什么</h2>' + link("plan", "完整路径") +
    '</div>' + taskList(tasks) + '</section></div><section class="card padded section"><h2>知识点状态</h2>' + masteryGrid(learner) + '</section>';
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
  return header("AI 教学", "三个档案使用同一个问题。可切换学员，对比本地真实模型的脱敏教学回放。") +
    '<div class="split"><section class="card padded"><div class="section-head"><h2>本地答疑回放</h2>' +
    badge("真实模型回放", "ready") + '</div><p class="muted">' + escape(replay.model) + ' · DeepTutor 1.7.4 · 原生 Chat Agent</p>' +
    '<p class="question">' + escape(replay.question) + '</p><p class="replay-strategy">' + escape(receipt.strategy) +
    '</p>' + (tutorOpen ? (receipt.verified_example ? '<div class="memory-insight"><strong>课程核算例图</strong><p>' +
      escape(receipt.verified_example) + '</p></div>' : '') +
      '<div class="answer" tabindex="-1">' + escape(receipt.answer) + '</div><details class="source"><summary>核对公开示例材料</summary><blockquote>' +
      lessons[concepts.traversal.lesson].quote + '</blockquote>' + (alias === "C" ? '<blockquote>' +
      lessons[concepts.shortest.lesson].quote + '</blockquote>' : '') + '<p>回放所用课程章节：' + escape(receipt.section) +
      '</p></details><p class="muted">展示经内容复核的脱敏片段。</p>' : control("replay", "播放本地答复", "", "", "primary")) + '</section>' +
    '<section class="card padded"><h2>当前学员的下一步</h2><p class="muted">本浏览器中刚提交的作答只更新演示任务。回放保存的是本机验证时的结果。</p>' +
    (review ? '<p>' + review.reason + '</p>' : '<p>打开题库建立新的测评证据。</p>') +
    link("practice", "进入针对性练习", "primary") + link("knowledge", "用 Little Tutor 导读") + '</section></div>';
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
  return header("课程知识库", "三位虚拟学员使用同一套公开示例讲义。") +
    '<div class="split"><section class="card padded"><h2>交互式阅读</h2><div class="link-stack">' +
    Object.entries(concepts).map(([id, item]) => control("reading", item.title, id,
      'aria-pressed="' + (id === learner.reading) + '"')).join("") +
    '</div><h3>' + material.title + '</h3><p>' + material.summary + '</p><blockquote>' + material.quote +
    '</blockquote></section><section class="card padded"><h2>Little Tutor 分步导读</h2>' +
    badge("教材内置提示") + '<p>先读教材，再用一题检验理解。</p>' +
    '<details class="source"><summary>显示本节引导题</summary><p>' +
    assessment.find((item) => item.topic === learner.reading && item.diagnostic).stem + '</p><p>' + concept.remediation +
    '</p></details><div class="actions">' + link("tutor", "查看真实教学回放") + '</div></section></div>' + visualization();
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
  return header("班级诊断", "以下数据由虚拟学员在本浏览器中的作答更新。", "教师管理端") +
    '<section class="card padded"><div class="section-head"><h2>知识点掌握热力图</h2>' + badge("浏览器计算") +
    '</div><div class="wide-table"><table><thead><tr><th>学员</th>' + Object.values(concepts).map((item) =>
      '<th scope="col">' + item.title + '</th>').join("") + '</tr></thead><tbody>' +
    summary.map(([, learner]) => '<tr><th scope="row">' + learner.profile.name + '</th>' + Object.keys(concepts).map((topic) => {
      const row = mastery(learner, topic);
      return '<td>' + badge(statusLabels[row.status], row.status) + '</td>';
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
    link("today", "返回学员工作台") + '</div></section></div>';
}

const examActions = { diagnostic: "开始同一诊断题", probe: "打开区分题", transfer: "开始独立变式" };
const examStates = { candidate: "待区分", confirmed: "已确认", rejected: "已排除", unknown: "待复核",
  suggested: "待教师审核", accepted: "已接受", completed: "已补救，待独立验证", verified: "已获得后续独立证据" };

const interventionLabels = { ...examStates, rejected: "已驳回" };

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
  return '<section class="exam-header"><div><p class="kicker">考研 408 · 数据结构</p>' +
    '<h1>ExamPilot 考试工作台</h1>' + link("teacher-exam", "查看教师干预", "secondary") +
    '</div><dl class="exam-metrics"><div><dt>距离考试</dt><dd>' + days +
    '<small> 天</small></dd></div><div><dt>每日预算</dt><dd>' + state.budget +
    '<small> 分钟</small></dd></div></dl></section>' +
    '<ol class="exam-steps" aria-label="教学进度">' + steps.map((step, index) =>
      index === activeStep ? '<li aria-current="step">' + control("exam-jump", step, index, 'aria-label="跳到当前步骤 ' + step + '"') + '</li>'
        : '<li>' + step + '</li>').join("") + '</ol>' +
    '<div class="split section exam-grid"><section class="card padded"><div class="section-head"><h2>考试目标</h2></div>' +
    '<div class="goal-fields"><label>考试日期<input type="date" id="exam-date" min="' +
    escape(state.today) + '" value="' + escape(state.date) + '"></label><label>每天可用分钟<select id="exam-budget">' +
    [8, 12, 18, 25, 35, 45, 60].map((minutes) => '<option' + (minutes === state.budget ? " selected" : "") +
      '>' + minutes + '</option>').join("") + '</select></label></div><p class="muted exam-note">调整后自动重排任务。此处采用虚拟考纲权重。</p></section>' +
    '<section class="card padded exam-plan"><div class="section-head"><h2>学习任务</h2>' +
    '<span class="muted">版本 ' + state.version + '</span></div><ol class="adaptive-list">' + plan.map((item) =>
      '<li><span class="day">第 ' + item.day + ' 天<br>' + item.minutes + ' 分钟</span><div><strong>' +
      item.action + ' · ' + item.label + '</strong><p>' + escape(item.reason) + '</p><small>估计优先级 ' + item.priority +
      '</small></div></li>').join("") + '</ol></section></div>' +
    '<div class="split section exam-grid"><section class="card padded exam-assessment"><h2>ErrorMind 错因与验证</h2><div class="actions">' +
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
    (sample ? '<p class="muted">展示 ' + escape(sample.strategy) + ' 的本地审校片段 · ' + escape(examReplay.model) + ' · 讲义：' + escape(sample.source) + '</p>' +
      (sample.verified_example ? '<p class="memory-insight">' + escape(sample.verified_example) + '</p>' : '') +
      '<div class="answer" tabindex="-1">' + escape(sample.answer) + '</div>' : '') +
    '</section></div>' + (shown?.id === "animation" ? visualization() : "");
}

function examTeacher() {
  const learners = Object.values(exams);
  const count = (statuses) => learners.filter(({ intervention }) => statuses.includes(intervention)).length;
  const metrics = [["待处理", count(["suggested", "accepted"])], ["待独立验证", count(["completed"])], ["已有独立证据", count(["verified"])]];
  return header("Teacher Copilot 干预队列", "根据虚拟学员的作答，记录补救并查看后续独立证据。", "教师管理端") +
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
    '</div><div class="actions">' + link("exam", "返回考试工作台", "primary") + '</div>';
}

const views = {
  exam: examWorkbench, "teacher-exam": examTeacher,
  today, diagnosis: (learner) => practice(learner, "diagnosis"), plan, tutor, practice: (learner) => practice(learner, "practice"),
  knowledge, memory, report, "teacher-report": teacherReport, "teacher-home": teacherHome,
};

function render() {
  if ((current === "exam" || current === "teacher-exam") && !exams[alias]) alias = "A";
  const isTeacher = current.startsWith("teacher");
  const links = isTeacher ? teacherTabs : learnerTabs;
  document.querySelector("#sidebar-label").textContent = isTeacher ? "教师工作台" : "学生工作台";
  document.querySelector("#sidebar-links").innerHTML = links.map(([id, label]) =>
    '<a href="#' + id + '" ' + (id === current ? 'aria-current="page"' : "") + '>' + label + '</a>').join("");
  for (const element of document.querySelectorAll("#role-switch a")) {
    if (element.hash.startsWith("#teacher") === isTeacher) element.setAttribute("aria-current", "true");
    else element.removeAttribute("aria-current");
  }
  view.innerHTML = personaBar() + views[current](roster[alias]);
  document.title = view.querySelector("h1").textContent + " · 智研学堂技术演示";
}

function route() {
  const previous = current;
  const hash = location.hash.slice(1);
  if (hash === "workspace" && view.childElementCount) return;
  const oldLinks = { "student-home": "today", ask: "tutor", "student-report": "report", "teacher-access": "teacher-home" };
  current = Object.hasOwn(views, hash) ? hash : Object.hasOwn(oldLinks, hash) ? oldLinks[hash] : "exam";
  if (previous !== current) activity = null;
  render();
  window.scrollTo(0, 0);
}

view.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-action]");
  if (!button) return;
  const { action, id } = button.dataset;
  const learner = roster[alias];
  let message = "";
  if (action === "learner") {
    alias = id;
    activity = null;
    message = "已切换到" + profiles[alias].name;
  } else if (action === "reset") {
    roster = makeDemo();
    alias = "A";
    activity = null;
    graphMode = "bfs";
    graphStep = 0;
    tutorOpen = false;
    exams = examDemo();
    examSelections = {};
    latestExamResults = {};
    message = "全部演示状态已重置";
  } else if (action === "exam-jump") {
    const targets = ["diagnostic", "probe", "teach", "transfer"];
    const target = button.dataset.id === "2" ? view.querySelector('[data-action="exam-teach"]') :
      view.querySelector('[data-action="exam-start"][data-id="' + targets[Number(id)] + '"]');
    const focus = view.querySelector(".exam-question button") || (target?.disabled ? view.querySelector(".exam-assessment .result") : target);
    focus?.focus();
    return;
  } else if (action === "exam-start") {
    if (!issueExam(exams[alias], id)) message = "暂无可用题，或有一题尚未提交。";
    else delete examSelections[alias];
  } else if (action === "exam-choice") {
    examSelections[alias] = Number(id);
  } else if (action === "exam-submit") {
    latestExamResults[alias] = submitExam(exams[alias], examSelections[alias]);
    delete examSelections[alias];
    message = "已更新个人证据和考试任务";
  } else if (action === "exam-teach") {
    const selection = viewExamTeaching(exams[alias]);
    graphMode = exams[alias].error?.id === "edge-cost" ? "weighted" : "bfs";
    graphStep = 0;
    message = selection.replay ? "已播放审校片段" : "已记录规则补习";
  } else if (action.startsWith("exam-teacher-")) {
    const next = { accept: "accepted", reject: "rejected", complete: "completed" }[action.split("-").at(-1)];
    teacherExamAction(exams[id], next);
    message = "教学操作已保存";
  } else if (action === "choice") {
    activity.choice = Number(id);
  } else if (action === "answer") {
    activity.result = submit(learner, activity.question, activity.choice, current);
    message = "已更新知识点掌握证据和学习路径";
  } else if (action === "continue") {
    activity = null;
  } else if (action === "replay") {
    tutorOpen = true;
    message = "本地真实模型回放已展开";
  } else if (action === "reading") {
    learner.reading = id;
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

view.addEventListener("change", (event) => {
  const { id, value } = event.target;
  if (id === "exam-date" || id === "exam-budget") {
    const state = exams[alias];
    const changed = setExamGoal(state, id === "exam-date" ? value : state.date, id === "exam-budget" ? Number(value) : state.budget);
    render();
    document.getElementById(id)?.focus({ preventScroll: true });
    announcement.textContent = changed ? "考试目标生效，任务已重排" : "请选择有效日期和每日时间";
    return;
  }
  const profile = roster[alias].profile;
  if (id !== "goal" && id !== "minutes") return;
  profile[id] = id === "minutes" ? Number(value) : value;
  activity = null;
  render();
  document.getElementById(id).focus({ preventScroll: true });
  announcement.textContent = "学习目标和任务安排已更新";
});

window.addEventListener("hashchange", route);
route();
