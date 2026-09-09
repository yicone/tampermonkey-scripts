import path from "node:path";
import { pathToFileURL } from "node:url";

const root = process.env.PROBE_ROOT;
if (!root) {
  throw new Error("PROBE_ROOT is required");
}

const { siteAdapters } = await import(
  pathToFileURL(path.join(root, "scripts/multi-model-answer/lib/site-adapters.mjs")).href
);

function fail(results, id, message, extra = {}) {
  results.push({ id, ok: false, message, ...extra });
}

function pass(results, id, extra = {}) {
  results.push({ id, ok: true, ...extra });
}

async function probeDoubao(page, adapter, results) {
  await page.goto(adapter.url, { waitUntil: "domcontentloaded", timeout: 30000 });
  await page.waitForSelector(adapter.composer, { timeout: 15000, state: "visible" });

  const before = await page.evaluate((sel) => {
    const editor = [...document.querySelectorAll(sel)].find((el) => el.offsetHeight > 0)
      || document.querySelector(sel);
    return {
      hasEditor: !!editor,
      text: editor ? (editor.innerText || "").trim() : "",
      sendWrapper: !!document.querySelector(".send-btn-wrapper"),
    };
  }, adapter.composer);

  if (!before.hasEditor) {
    fail(results, "doubao.composer", "composer not found", before);
    return;
  }

  const afterInsert = await page.evaluate((sel) => {
    const editor = [...document.querySelectorAll(sel)].find((el) => el.offsetHeight > 0)
      || document.querySelector(sel);
    if (editor.editor && editor.editor.commands) {
      editor.editor.commands.focus();
      editor.editor.commands.clearContent();
      editor.editor.commands.insertContent("probe-do-not-send");
    } else {
      editor.focus();
      editor.textContent = "probe-do-not-send";
    }
    return { text: (editor.innerText || "").trim() };
  }, adapter.composer);

  if (!afterInsert.text.includes("probe-do-not-send")) {
    fail(results, "doubao.insert", "could not insert probe text", afterInsert);
    return;
  }

  try {
    await page.waitForFunction(() => {
      const btn = document.querySelector(".send-btn-wrapper button");
      return !!(btn && !btn.disabled && btn.getAttribute("aria-disabled") !== "true");
    }, undefined, { timeout: 5000 });
    pass(results, "doubao.sendButton", { sendReady: true });
  } catch (error) {
    const snapshot = await page.evaluate(() => {
      const btn = document.querySelector(".send-btn-wrapper button");
      return {
        sendWrapper: !!document.querySelector(".send-btn-wrapper"),
        disabled: btn && btn.disabled,
        aria: btn && btn.getAttribute("aria-disabled"),
      };
    });
    fail(results, "doubao.sendButton", "send button not ready after insert", snapshot);
  }

  await page.evaluate((sel) => {
    const editor = [...document.querySelectorAll(sel)].find((el) => el.offsetHeight > 0)
      || document.querySelector(sel);
    if (editor.editor && editor.editor.commands && typeof editor.editor.commands.clearContent === "function") {
      editor.editor.commands.clearContent();
    } else {
      editor.textContent = "";
    }
  }, adapter.composer);

  const cleared = await page.evaluate((sel) => {
    const editor = document.querySelector(sel);
    return (editor && editor.innerText || "").trim();
  }, adapter.composer);
  if (cleared.includes("probe-do-not-send")) {
    fail(results, "doubao.clear", "probe text still in composer; did not click send", { cleared });
  } else {
    pass(results, "doubao.composer", { cleared: true, didNotSend: true });
  }
}

async function probeQianwen(page, adapter, results) {
  await page.goto(adapter.url, { waitUntil: "domcontentloaded", timeout: 30000 });
  await page.waitForSelector(adapter.composer, { timeout: 15000, state: "visible" });

  const state = await page.evaluate((sel) => {
    const editor = document.querySelector(sel);
    if (!editor) return { hasEditor: false };
    const placeholder = (
      editor.getAttribute("data-placeholder") ||
      editor.getAttribute("placeholder") ||
      ""
    ).trim();
    const walker = document.createTreeWalker(editor, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        const parent = node.parentElement;
        if (!parent) return NodeFilter.FILTER_REJECT;
        if (parent.closest('[contenteditable="false"]')) return NodeFilter.FILTER_REJECT;
        if (parent.closest('[data-slate-placeholder="true"]')) return NodeFilter.FILTER_REJECT;
        if (parent.hasAttribute("data-slate-zero-width")) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      },
    });
    let text = "";
    let node;
    while ((node = walker.nextNode())) text += node.nodeValue || "";
    text = text.replace(/[\uFEFF\u200B]/g, "").trim();
    if (placeholder && text === placeholder) text = "";
    return {
      hasEditor: true,
      rawText: (editor.textContent || "").trim(),
      plainText: text,
    };
  }, adapter.composer);

  if (!state.hasEditor) {
    fail(results, "qianwen.composer", "composer not found", state);
    return;
  }
  if (state.plainText !== "") {
    fail(results, "qianwen.placeholder", "empty composer should read as empty", state);
    return;
  }
  pass(results, "qianwen.composer", { rawText: state.rawText, plainText: "" });
}

async function probeAimode(page, adapter, results) {
  await page.goto(adapter.url, { waitUntil: "domcontentloaded", timeout: 30000 });
  await page.waitForSelector(adapter.composer, { timeout: 15000, state: "visible" });

  const state = await page.evaluate((sel) => {
    const ta = document.querySelector(sel);
    return {
      hasTextarea: !!ta,
      tag: ta ? ta.tagName : null,
      val: ta ? ta.value : "",
    };
  }, adapter.composer);

  if (!state.hasTextarea || state.tag !== "TEXTAREA") {
    fail(results, "aimode.composer", "composer textarea not found", state);
    return;
  }
  pass(results, "aimode.composer", { visible: true });
}

const task = await taskSpace("probe doubao qianwen aimode adapters");
const results = [];
try {
  const doubao = task.page("p1");
  await probeDoubao(doubao, siteAdapters.doubao, results);

  const qianwen = await task.newPage();
  await probeQianwen(qianwen, siteAdapters.qianwen, results);

  const aimode = await task.newPage();
  await probeAimode(aimode, siteAdapters.aimode, results);
} finally {
  const failed = results.filter((item) => !item.ok);
  console.log(JSON.stringify({ spaceId: task.spaceId, results, failed: failed.length }, null, 2));
  await task.finish({ keep: [] });
  if (failed.length > 0) {
    process.exitCode = 1;
  }
}
