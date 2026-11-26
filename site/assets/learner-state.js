import { assessment, concepts, profiles, examDiagnostic, examErrors, examSyllabus, examTransfers } from "./fixtures.js";

export const statusLabels = { unknown: "待测评", review: "需补习", verify: "待验证", ready: "当前达标" };
export const actions = { unknown: "初始诊断", review: "针对性补习", verify: "独立题验证", ready: "完成当前测评" };
const topicIds = Object.keys(concepts);
const levels = { "零基础": 1, "强化": 2, "冲刺": 3 };

export function makeDemo() {
  return Object.fromEntries(Object.entries(profiles).map(([id, profile]) => [
    id, { profile: { ...profile }, evidence: {}, history: [], reading: "traversal" },
  ]));
}

export function mastery(learner, topic) {
  const attempts = Object.values(learner.evidence).filter((item) => item.topic === topic)
    .sort((a, b) => a.sequence - b.sequence);
  const count = attempts.length;
  if (!count) return { count, status: "unknown", score: null };
  const recent = attempts.slice(-5);
  const weights = [.5, .7, .85, .95, 1].slice(-recent.length);
  const raw = recent.reduce((sum, item, index) => sum + (item.correct ? weights[index] : 0), 0) /
    weights.reduce((sum, weight) => sum + weight, 0);
  const score = Math.min(count === 1 ? .5 : count === 2 ? .8 : 1, raw);
  return { count, score, status: !attempts.at(-1).correct ? "review" : score >= .85 ? "ready" : "verify" };
}

export function pathway(learner) {
  const ranked = [...topicIds].sort((a, b) => {
    const order = { review: 0, verify: 1, unknown: 2, ready: 3 };
    return order[mastery(learner, a).status] - order[mastery(learner, b).status] ||
      Number(b === learner.profile.goal) - Number(a === learner.profile.goal);
  });
  const ordered = new Set();
  for (const topic of ranked) {
    const first = concepts[topic].prerequisite;
    if (first && mastery(learner, topic).status === "unknown" && mastery(learner, first).status === "unknown") ordered.add(first);
    ordered.add(topic);
  }
  const tasks = [];
  let day = 1;
  let remaining = learner.profile.minutes;
  for (const topic of ordered) {
    const evidence = mastery(learner, topic);
    if (evidence.status === "ready") continue;
    const minutes = Math.min(learner.profile.minutes, concepts[topic].time);
    if (minutes > remaining) {
      day += 1;
      remaining = learner.profile.minutes;
    }
    remaining -= minutes;
    const reason = {
      unknown: "当前没有独立作答证据，先诊断。",
      review: concepts[topic].remediation,
      verify: "使用未做过的题确认理解。",
    }[evidence.status];
    tasks.push({ topic, day, minutes, reason, ...evidence });
  }
  return tasks;
}

export function pickQuestion(learner, kind) {
  const next = pathway(learner);
  if (kind === "diagnosis") {
    const pending = next.find((item) => item.status === "unknown");
    return pending ? assessment.find((item) => item.diagnostic && item.topic === pending.topic) : null;
  }
  if (!next.length) return null;
  const difficulty = levels[learner.profile.stage];
  const candidates = assessment.filter((item) => item.topic === next[0].topic);
  return candidates.sort((a, b) => Number(!!learner.evidence[a.id]) - Number(!!learner.evidence[b.id]) ||
    Math.abs(a.difficulty - difficulty) - Math.abs(b.difficulty - difficulty) ||
    (learner.evidence[a.id]?.sequence || 0) - (learner.evidence[b.id]?.sequence || 0))[0];
}

export function submit(learner, question, choice, kind) {
  if (choice < 0 || choice >= question.choices.length) return null;
  const before = pathway(learner)[0];
  const correct = choice === question.key;
  const data = { ...question, choice, correct, kind, sequence: learner.history.length + 1 };
  learner.evidence[question.id] = data;
  const after = pathway(learner)[0];
  const result = { ...data, before, after, mastery: mastery(learner, question.topic) };
  learner.history.push(result);
  return result;
}

export const examStrategies = {
  contrast: "反例辨析", animation: "交互动画", prerequisite: "前置知识回退", steps: "小步引导", transfer: "迁移训练",
};

const timeDay = 86400000;
export function examDate(initialDay, offset) {
  return new Date(Date.parse(initialDay) + offset * timeDay).toISOString().slice(0, 10);
}

export function examDemo(today = new Date().toISOString().slice(0, 10)) {
  return Object.fromEntries([["A", 2, 12], ["B", 9, 35]].map(([name, days, budget]) => [name, {
    name, today, date: examDate(today, days), budget, version: 1, diagnostic: null, error: null, ticket: null,
    history: [], exposures: [], seen: [], intervention: null, actions: [],
  }]));
}

export function setExamGoal(state, date, budget) {
  if (!Number.isFinite(Date.parse(date)) || date < state.today || budget < 5 || budget > 120) return false;
  state.date = date;
  state.budget = budget;
  state.version += 1;
  return true;
}

export function examStrategy(state) {
  const last = state.history.filter((row) => row.kind === "transfer" && row.independent).at(-1);
  if (last?.correct === false) {
    return { id: last.strategy === "animation" ? "prerequisite" : "animation", replay: last.strategy === "animation" ? null : "A-followup",
      reason: "上一次独立变式未通过，改用新的教学方式。" };
  }
  if (state.error?.status === "confirmed" && !state.error.resolved) {
    return { id: state.error.strategy, replay: state.error.strategy === "contrast" ? "A" : "B",
      reason: state.error.remedy };
  }
  return { id: last?.correct ? "transfer" : "steps", replay: null, reason: "需要更多独立学习证据。" };
}

export function examPlan(state) {
  const horizon = Math.min(30, Math.floor((Date.parse(state.date) - Date.parse(state.today)) / timeDay) + 1);
  if (horizon < 1) return [];
  const last = state.history.filter((row) => row.kind === "transfer" && row.independent).at(-1);
  const alreadyTaught = state.exposures.at(-1)?.sequence > (last?.sequence || 0);
  const work = !state.diagnostic ? ["初始诊断", "暂缺正式测评，先确定起点。", 3] :
    state.error?.status === "candidate" ? ["错因验证", "使用不同题区分两类错误。", 7] :
    last?.correct ? ["巩固练习", "本次独立变式已通过，延时保持待到期。", 2] :
    alreadyTaught ? ["独立迁移", "开始未展示的变式题。", 5] :
    ["针对性补救", examStrategy(state).reason, 6];
  const rows = Object.entries(examSyllabus).map(([topic, item]) => {
    const minutes = Math.min(item.minutes, state.budget);
    const [action, reason, gain] = topic === "traversal" ? work : ["诊断或复习", "依据共同考纲安排。", 2];
    return { ...item, topic, minutes, action, reason,
      priority: Math.round(item.weight * gain * (1 + 7 / horizon) / minutes) };
  }).sort((a, b) => b.priority - a.priority);
  const remaining = Array(horizon).fill(state.budget);
  const byTopic = new Map(rows.map((row) => [row.topic, row]));
  const placed = new Map();
  function place(row) {
    if (placed.has(row.topic)) return placed.get(row.topic).day;
    const parent = row.prerequisite && row.action !== "错因验证" && row.action !== "针对性补救" &&
      row.action !== "独立迁移" ? place(byTopic.get(row.prerequisite)) : 0;
    if (parent === undefined) return undefined;
    const day = remaining.findIndex((left, idx) => idx + 1 >= parent && left >= row.minutes) + 1;
    if (!day) return undefined;
    remaining[day - 1] -= row.minutes;
    placed.set(row.topic, { ...row, day });
    return day;
  }
  for (const row of rows) place(row);
  return [...placed.values()].sort((a, b) => a.day - b.day);
}

export function canStartExamTransfer(state) {
  const latestTransfer = state.history.filter((row) => row.kind === "transfer").at(-1);
  return state.seen.length < examTransfers.length &&
    (state.exposures.at(-1)?.sequence || 0) > (latestTransfer?.sequence || 0);
}

export function issueExam(state, kind) {
  if (state.ticket) return state.ticket.kind === kind ? state.ticket : null;
  const index = examTransfers.findIndex((_, idx) => !state.seen.includes(idx));
  const exposure = state.exposures.at(-1);
  let question;
  if (kind === "diagnostic" && !state.diagnostic) question = examDiagnostic;
  if (kind === "probe" && state.error?.status === "candidate") question = state.error.probe;
  if (kind === "transfer" && canStartExamTransfer(state)) {
    question = examTransfers[index];
    state.seen.push(index);
  }
  if (!question) return null;
  state.ticket = { kind, question, exposure, watermark: state.exposures.length,
    intervention: state.intervention === "completed" };
  return state.ticket;
}

export function submitExam(state, choice) {
  const ticket = state.ticket;
  if (!ticket?.question.options[choice]) return null;
  state.ticket = null;
  state.version += 1;
  const { kind, question, exposure, watermark, intervention } = ticket;
  const correct = choice === question.answer;
  const assisted = kind === "transfer" && state.exposures.length !== watermark;
  const row = { kind, correct, independent: kind === "transfer" && !assisted, assisted,
    sequence: state.version, strategy: exposure?.id, explanation: assisted ? "本题打开后曾查看教学，未计入独立证据。" : question.explanation };
  state.history.push(row);
  if (kind === "diagnostic") {
    state.diagnostic = row;
    if (!correct && examErrors[choice]) state.error = { ...examErrors[choice], status: "candidate" };
  }
  if (kind === "probe") {
    state.error.status = choice === question.confirms ? "confirmed" : correct ? "rejected" : "unknown";
    if (state.error.status === "confirmed") state.intervention = "suggested";
  }
  if (row.independent && correct) {
    if (state.error) state.error.resolved = true;
    if (intervention) {
      state.intervention = "verified";
      state.actions.push({ status: "verified", evidence: row.sequence });
    }
  }
  return row;
}

export function viewExamTeaching(state) {
  const selection = examStrategy(state);
  state.version += 1;
  const exposure = { ...selection, sequence: state.version };
  state.exposures.push(exposure);
  return exposure;
}

export function teacherExamAction(state, next) {
  const allowed = { suggested: ["accepted", "rejected"], accepted: ["completed"] };
  if (!allowed[state.intervention]?.includes(next)) return false;
  state.intervention = next;
  state.actions.push({ status: next, evidence: null });
  state.version += 1;
  return true;
}
