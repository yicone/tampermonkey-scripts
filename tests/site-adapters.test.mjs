import assert from "node:assert/strict";
import fs from "node:fs";
import { describe, it } from "node:test";
import { siteAdapters } from "../scripts/multi-model-answer/lib/site-adapters.mjs";
import { USERSCRIPT_PATH } from "./helpers/load-userscript-logic.mjs";

describe("site adapter selectors stay in the userscript", () => {
  const source = fs.readFileSync(USERSCRIPT_PATH, "utf8");

  for (const adapter of Object.values(siteAdapters)) {
    it(`embeds ${adapter.id} selectors`, () => {
      assert.match(source, new RegExp(escapeRegExp(adapter.composer)));
      if (adapter.sendWrapper) {
        assert.match(source, new RegExp(escapeRegExp(adapter.sendWrapper)));
      }
    });
  }
});

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
