import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { JSDOM } from "jsdom";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
export const USERSCRIPT_PATH = path.join(ROOT, "scripts/multi-model-answer/script.user.js");

export function extractTestableBlock(source) {
  const startMark = "// <testable-sync-logic>";
  const endMark = "// </testable-sync-logic>";
  const start = source.indexOf(startMark);
  const end = source.indexOf(endMark);
  if (start < 0 || end < 0 || end <= start) {
    throw new Error("script.user.js is missing <testable-sync-logic> markers");
  }
  return source.slice(start + startMark.length, end);
}

export function loadUserscriptLogic() {
  const source = fs.readFileSync(USERSCRIPT_PATH, "utf8");
  const block = extractTestableBlock(source);
  const dom = new JSDOM("<!doctype html><html><body></body></html>");
  const factory = new Function(
    "document",
    "NodeFilter",
    `${block}\nreturn { sameQuestionText, hasModifierKey, isEnterSend, getLexicalPlainText };`,
  );
  return factory(dom.window.document, dom.window.NodeFilter);
}

export function createComposerDom(html) {
  const dom = new JSDOM(`<!doctype html><html><body>${html}</body></html>`);
  return { document: dom.window.document, body: dom.window.document.body };
}
