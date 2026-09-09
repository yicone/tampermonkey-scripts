import assert from "node:assert/strict";
import fs from "node:fs";
import { describe, it } from "node:test";
import { siteAdapters } from "../scripts/ask-across-sites/lib/site-adapters.mjs";
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

describe("bundled site icons cover every panel model", () => {
  const source = fs.readFileSync(USERSCRIPT_PATH, "utf8");
  const sites = [...source.matchAll(/\{ site: (\w+), word:/g)].map((m) => m[1]);

  it("finds the panel wordConfig sites", () => {
    assert.ok(sites.length >= 10, `expected panel sites, got ${sites.join(",")}`);
  });

  for (const site of sites) {
    it(`embeds a data-URI icon for ${site}`, () => {
      assert.match(source, new RegExp(`\\[${site}\\]: "data:image/svg\\+xml,`));
    });
  }
});

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
