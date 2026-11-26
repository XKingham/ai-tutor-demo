import { assessment, concepts, profiles } from "./fixtures.js";

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
