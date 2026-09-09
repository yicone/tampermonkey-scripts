import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createComposerDom, loadUserscriptLogic } from "./helpers/load-userscript-logic.mjs";

const { sameQuestionText, isEnterSend, getLexicalPlainText } = loadUserscriptLogic();

describe("sameQuestionText", () => {
  it("treats trimmed copies as the same question", () => {
    assert.equal(sameQuestionText("qw1", "qw1"), true);
    assert.equal(sameQuestionText(" qw1 ", "qw1"), true);
  });

  it("ignores whitespace inserted by editors", () => {
    assert.equal(sameQuestionText("paste-no-send-915-from-doubao", "paste-no-send-915-from-dou bao"), true);
  });

  it("rejects a different question", () => {
    assert.equal(sameQuestionText("qw1", "qw2"), false);
    assert.equal(sameQuestionText("qw1", ""), false);
  });
});

describe("isEnterSend", () => {
  const enter = (extra = {}) => ({
    key: "Enter",
    keyCode: 13,
    isComposing: false,
    shiftKey: false,
    ctrlKey: false,
    altKey: false,
    metaKey: false,
    ...extra,
  });

  it("sends on a plain Enter", () => {
    assert.equal(isEnterSend(enter(), false), true);
  });

  it("does not send on Shift+Enter or IME composing", () => {
    assert.equal(isEnterSend(enter({ shiftKey: true }), false), false);
    assert.equal(isEnterSend(enter({ isComposing: true }), false), false);
    assert.equal(isEnterSend(enter({ keyCode: 229 }), false), false);
  });

  it("requires a modifier when the site says so", () => {
    assert.equal(isEnterSend(enter(), true), false);
    assert.equal(isEnterSend(enter({ metaKey: true }), true), true);
    assert.equal(isEnterSend(enter({ ctrlKey: true }), true), true);
  });
});

describe("getLexicalPlainText", () => {
  it("returns empty for a missing node", () => {
    assert.equal(getLexicalPlainText(null), "");
  });

  it("ignores a contenteditable=false placeholder overlay", () => {
    const { body } = createComposerDom(`
      <div contenteditable="true" role="textbox">
        <span contenteditable="false">向千问提问</span>
        <p><br></p>
      </div>
    `);
    const editor = body.querySelector('[contenteditable="true"]');
    assert.equal(getLexicalPlainText(editor), "");
  });

  it("reads typed text beside a placeholder overlay", () => {
    const { body } = createComposerDom(`
      <div contenteditable="true" role="textbox">
        <span contenteditable="false">向千问提问</span>
        <p>qw1</p>
      </div>
    `);
    const editor = body.querySelector('[contenteditable="true"]');
    assert.equal(getLexicalPlainText(editor), "qw1");
  });

  it("treats data-placeholder text as empty", () => {
    const { body } = createComposerDom(`
      <div contenteditable="true" data-placeholder="发消息...">发消息...</div>
    `);
    const editor = body.querySelector('[contenteditable="true"]');
    assert.equal(getLexicalPlainText(editor), "");
  });

  it("strips zero-width and BOM characters", () => {
    const { body } = createComposerDom(`
      <div contenteditable="true"><p>\uFEFFhello\u200B</p></div>
    `);
    const editor = body.querySelector('[contenteditable="true"]');
    assert.equal(getLexicalPlainText(editor), "hello");
  });
});
