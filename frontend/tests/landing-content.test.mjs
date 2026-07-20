import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const testDirectory = dirname(fileURLToPath(import.meta.url));
const frontendRoot = join(testDirectory, "..");
const pageSource = readFileSync(
  join(frontendRoot, "src", "app", "page.tsx"),
  "utf8",
);

test("explains decision value without duplicating the documentation", () => {
  assert.match(pageSource, /What you leave with/i);
  assert.match(pageSource, /Live team response/i);
  assert.match(pageSource, /Risk timeline/i);
  assert.match(pageSource, /Decision brief/i);
  assert.match(pageSource, /href="\/docs#reports"/);
});

test("sets a clear use boundary and routes deeper setup detail to docs", () => {
  assert.match(
    pageSource,
    /employee surveillance,\s+diagnosis, or prediction/i,
  );
  assert.match(pageSource, /href="\/docs#quick-start"/);
});
