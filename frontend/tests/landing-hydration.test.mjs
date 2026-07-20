import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const testDirectory = dirname(fileURLToPath(import.meta.url));
const navigationSource = readFileSync(
  join(
    testDirectory,
    "..",
    "src",
    "components",
    "landing",
    "landing-nav.tsx",
  ),
  "utf8",
);

test("theme toggle keeps the same accessible name during hydration", () => {
  assert.match(navigationSource, /aria-label="Toggle color theme"/);
  assert.doesNotMatch(
    navigationSource,
    /aria-label=\{`Switch to \$\{isDark \? "light" : "dark"\} theme`\}/,
  );
});
