import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import { exercises, lessons, prompts, roster } from "../site/assets/fixtures.js";

test("sample questions refer to original public fixtures", () => {
  assert.ok(lessons.length > 0);
  for (const question of prompts) {
    assert.ok(lessons[question.lesson]?.quote);
    assert.ok(question.answer.length > 0);
  }
  for (const exercise of exercises) {
    assert.ok(exercise.options[exercise.correct]);
    assert.ok(exercise.explanation);
  }
  assert.ok(roster.every((user) => user.label.startsWith("示例学员")));
});

test("static page identifies the demo and forbids submissions", async () => {
  const page = await readFile(new URL("../site/index.html", import.meta.url), "utf8");
  assert.match(page, /演示示例/);
  assert.match(page, /AI 答复为固定示例/);
  assert.match(page, /connect-src 'none'/);
  assert.match(page, /form-action 'none'/);
  assert.doesNotMatch(page, /<form\b/i);
});
