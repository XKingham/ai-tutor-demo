import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import { assessment, concepts, lessons } from "../site/assets/fixtures.js";
import { makeDemo, mastery, pathway, pickQuestion, submit } from "../site/assets/learner-state.js";
import { replay } from "../site/assets/replays.js";

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
  assert.deepEqual(Object.keys(replay.personas), ["A", "B", "C"]);
  assert.match(replay.personas.A.answer, /排队|楼层|一栋楼/);
  assert.match(replay.personas.B.answer, /DFS/);
  assert.match(replay.personas.C.answer, /Dijkstra|权值/);
  assert.doesNotMatch(replay.personas.B.answer, /A→C→T 是第三层/);
  assert.equal(new Set(Object.values(replay.personas).map((row) => row.answer)).size, 3);
});
