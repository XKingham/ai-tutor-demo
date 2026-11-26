import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import { assessment, concepts, lessons } from "../site/assets/fixtures.js";
import { makeDemo, mastery, pathway, pickQuestion, submit } from "../site/assets/learner-state.js";
import { examReplay, replay } from "../site/assets/replays.js";
import { examDate, examDemo, examPlan, examStrategy, issueExam, setExamGoal,
  submitExam, teacherExamAction, viewExamTeaching } from "../site/assets/learner-state.js";

test("sample questions refer to original public fixtures", () => {
  for (const question of assessment) {
    assert.ok(lessons[concepts[question.topic].lesson]?.quote);
    assert.ok(question.choices[question.key]);
    assert.ok(question.explanation);
  }
});

test("static page identifies the demo and forbids submissions", async () => {
  const page = await readFile(new URL("../site/index.html", import.meta.url), "utf8");
  assert.match(page, /浏览器计算/);
  assert.match(page, /本地真实模型脱敏回放/);
  assert.match(page, /connect-src 'none'/);
  assert.match(page, /form-action 'none'/);
  assert.doesNotMatch(page, /<form\b/i);
  const teacher = await readFile(new URL("../site/teacher/index.html", import.meta.url), "utf8");
  assert.match(page, /data-portal="student"/);
  assert.match(teacher, /data-portal="teacher"/);
  assert.doesNotMatch(teacher, /<form\b/i);
  assert.match(teacher, /connect-src 'none'/);
  assert.equal(Object.hasOwn(replay, "model"), false);
  assert.equal(Object.hasOwn(examReplay, "model"), false);
});

test("three profiles produce different day allocations and consume their own evidence", () => {
  const roster = makeDemo();
  const plans = Object.values(roster).map((learner) => JSON.stringify(pathway(learner)));
  assert.equal(new Set(plans).size, 3);
  const before = pathway(roster.A)[0];
  roster.A.profile.goal = "traversal";
  const question = pickQuestion(roster.A, "diagnosis");
  assert.notEqual(before.topic, question.topic);
  const result = submit(roster.A, question, (question.key + 1) % question.choices.length, "diagnosis");
  assert.equal(result.mastery.status, "review");
  assert.equal(result.after.topic, "traversal");
  assert.equal(mastery(roster.B, "traversal").status, "unknown");
  submit(roster.A, question, question.key, "practice");
  assert.deepEqual(mastery(roster.A, "traversal"), { status: "verify", score: .5, count: 1 });
  assert.notEqual(pickQuestion(roster.A, "practice").id, question.id);
  assert.equal(mastery(makeDemo().A, "traversal").count, 0);
});

test("verified real model replies cover distinct teaching strategies", () => {
  assert.match(replay.question, /BFS/);
  assert.equal(replay.engine, "DeepTutor AgentLoop");
  assert.deepEqual(Object.keys(replay.personas), ["A", "B", "C"]);
  assert.match(replay.personas.A.answer, /排队|楼层|一栋楼/);
  assert.match(replay.personas.B.answer, /BFS.*(?:最少|最短)/s);
  assert.match(replay.personas.B.verified_example, /DFS.*不保证最少边数/);
  assert.match(replay.personas.C.answer, /Dijkstra|权值/);
  assert.match(replay.personas.B.verified_example, /A→C→T.*走 2 条边，T 在第 2 层/);
  assert.match(replay.personas.B.verified_example, /A→B→D→T.*走 3 条边/);
  assert.doesNotMatch(replay.personas.B.answer, /A→C→T|第三层/);
  assert.equal(new Set(Object.values(replay.personas).map((row) => row.answer)).size, 3);
});

test("ExamPilot respects the date and time budget and resets both isolated learners", () => {
  const { A, B } = examDemo("2026-01-01");
  assert.notDeepEqual(examPlan(A), examPlan(B));
  assert(setExamGoal(A, examDate(A.today, 0), 8));
  assert(examPlan(A).every((task) => task.day === 1));
  assert(examPlan(A).reduce((sum, task) => sum + task.minutes, 0) <= 8);
  assert.equal(B.version, 1);
  assert.equal(examDemo("2026-01-01").A.budget, 12);
});

test("same diagnosis leads to separate probes, strategy switch and teacher verification", () => {
  const { A, B } = examDemo("2026-01-01");
  assert.equal(issueExam(A, "diagnostic").question.stem, issueExam(B, "diagnostic").question.stem);
  submitExam(A, 0);
  submitExam(B, 1);
  assert.equal(A.error.status, "candidate");
  assert.notEqual(issueExam(A, "probe").question.stem, issueExam(B, "probe").question.stem);
  submitExam(A, 0);
  submitExam(B, 1);
  assert.equal(A.error.status, "confirmed");
  assert.equal(B.error.status, "confirmed");
  assert.equal(examStrategy(A).id, "contrast");
  assert.equal(examStrategy(B).id, "animation");
  viewExamTeaching(A);
  const first = issueExam(A, "transfer").question.stem;
  assert(submitExam(A, 0).independent);
  assert.equal(examStrategy(A).id, "animation");
  assert(teacherExamAction(A, "accepted"));
  assert(teacherExamAction(A, "completed"));
  assert.equal(issueExam(A, "transfer"), null);
  viewExamTeaching(A);
  assert.notEqual(issueExam(A, "transfer").question.stem, first);
  submitExam(A, 0);
  assert.equal(A.intervention, "verified");
  assert.equal(B.intervention, "suggested");
  assert(teacherExamAction(B, "rejected"));
  viewExamTeaching(B);
  issueExam(B, "transfer");
  viewExamTeaching(B);
  assert.equal(submitExam(B, 1).independent, false);
});


test("exam model excerpts cover both personas and the changed strategy", () => {
  assert.equal(examReplay.engine, "DeepTutor AgentLoop");
  assert.deepEqual(Object.keys(examReplay.personas).sort(), ["A", "A-followup", "B"]);
  assert.deepEqual(Object.values(examReplay.personas).map((sample) => sample.strategy_id), ["contrast", "animation", "animation"]);
  for (const sample of Object.values(examReplay.personas)) {
    assert.match(sample.answer, /BFS/);
    assert.equal(sample.source, "存储与遍历");
    assert.equal(sample.receipt, undefined);
  }
  assert.match(examReplay.personas.A.verified_example, /第 0 层.*第 2 层/);
});
