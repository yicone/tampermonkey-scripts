# 多模型同时回答 & 目录导航

Fork of Greasy Fork [537302](https://greasyfork.org/scripts/537302) by `interest2`. Baseline `5.2.6`. Directory id: `multi-model-answer`. Current fork version is the `@version` in `script.user.js`.

`TONGYI` in code is `www.qianwen.com` (千问). `QWEN` is `chat.qwen.ai`.

## Ego Tampermonkey

- Extension: `dhdgffkkebhmkfjojejmpbldmpobfkfo`
- Script UUID: `d4da46bf-fba2-4f71-b8fc-1cc535d49edb`
- Editor: `chrome-extension://dhdgffkkebhmkfjojejmpbldmpobfkfo/options.html#nav=d4da46bf-fba2-4f71-b8fc-1cc535d49edb+editor`
- Push: `tools/tm-push.sh --mode=loader|full --script=multi-model-answer`
- Loader URL: `http://127.0.0.1:17373/scripts/multi-model-answer/script.user.js`

Replace this UUID in place with the loader. Do not install a second copy in Ego.

## Matches

`chat.deepseek.com`, `www.kimi.com`, `www.qianwen.com`, `chat.qwen.ai`, `www.doubao.com`, `yuanbao.tencent.com`, `chat.zchat.tech`, `chatgpt.com`, `gemini.google.com`, `aistudio.google.com`, `claude.ai`, `grok.com`.

Boot: `ai script, start`, then `ai script, adapter` once a composer is found. No start log on a matching URL means the script did not run (TM disabled, loader/`@require` failed, or server down).

## Tests

Selectors for the Doubao/Qianwen probe live in `lib/site-adapters.mjs`. Keep those strings in `script.user.js`. Sync helpers under `// <testable-sync-logic>` are what `npm test` executes.

```sh
npm test
tools/probe-adapters.sh
```

The probe must not click send. After a Doubao insert, wait for `.send-btn-wrapper button` — it is missing while the composer is empty.

## Adapters (read before changing send/sync)

**豆包** is Tiptap/ProseMirror, not a `<textarea>`. Composer: `.tiptap.ProseMirror[contenteditable="true"]`. `tiptap.commands.enter()` only inserts a newline. Submit by clicking `.send-btn-wrapper button` after the button is enabled. Chrome ignores `new ClipboardEvent({ clipboardData })`; hang clipboard data on the event with `defineProperty`.

**千问** composer: `[contenteditable="true"][role="textbox"]`. Empty `textContent` is often the overlay `向千问提问`. Read with `getLexicalPlainText` (skip `contenteditable="false"` / Slate placeholders). Question list: `.question-text-card` — the old `[class^="bubble-"]` matches nothing.

Do not treat “input became empty” or a click inside the composer as a send. Broadcast only after `isQuestionPosted`, or a real Enter that is not IME (`isComposing` / `keyCode === 229`). `verifySendSuccess` used to retry Enter every 1s and would fire a later user paste; abort that lock on a trusted paste.

Ego may have no login cookies. Hand off before treating a missing conversation as a regression. Logged-out Doubao can navigate to `?from_logout=1` after a programmatic send click.

## `script.user.js` sections

Line numbers drift; trust the banners.

| # | Banner | Approx. lines |
|---|--------|----------------|
| 1 | 适配各站点相关代码 | 42–298 |
| 2 | 一些函数和变量 | 299–445 |
| 3 | 主从节点逻辑 | 446–519 |
| 4 | 从节点异步轮询检查 | 520–762 |
| 5 | 图片同步功能 | 763–869 |
| 6 | 监听新的提问 | 870–1372 |
| 7 | trusted HTML & 首次使用指引 | 1373–1470 |
| 8 | 输入框的显示/隐藏切换 | 1471–1790 |
| 9 | 目录导航功能 | 1791–3933 |
| 10 | 多选面板 | 3934–4987 |
| 11 | 一些工具函数 | 4988–5483 |
| 12 | 设置弹窗功能 | 5484–5944 |
| 13 | 书签功能 | 5945–end |

## Fork / Dia

Install `script.user.js` only. Use `@version` like `5.2.6-local.1`. Strip `@downloadURL` and `@updateURL` before the user installs in Dia, or Greasy Fork will overwrite the fork.

Header edits (`@match`, `@grant`, …) must be copied into `loader.user.js` and pushed with `--mode=loader`. Body edits do not.

## Pitfalls

- Master/slave and `GM_*` value listeners assume one enabled copy per browser. Two copies double-fire questions and TOC.
- After `--mode=full`, local file edits will not hot-reload until `--mode=loader`. The persist-length check is flaky; confirm `@version` in the TM editor.
- Do not load `markmap` unless turning `SHOW_MINDMAP_BTN` on (it is off in the header comments).
