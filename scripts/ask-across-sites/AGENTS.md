# 多站同问 / Ask Across Sites

Directory id: `ask-across-sites`. Fork of Greasy Fork [537302](https://greasyfork.org/scripts/537302) by `interest2`, baseline `5.2.6`. Public `@name` is `多站同问` with `@name:en Ask Across Sites`. Current version is the `@version` in `script.user.js`.

`TONGYI` in code is `www.qianwen.com` (千问). `QWEN` is `chat.qwen.ai`.

## Ego Tampermonkey

- Extension: `dhdgffkkebhmkfjojejmpbldmpobfkfo`
- Script UUID: `d4da46bf-fba2-4f71-b8fc-1cc535d49edb`
- Editor: `chrome-extension://dhdgffkkebhmkfjojejmpbldmpobfkfo/options.html#nav=d4da46bf-fba2-4f71-b8fc-1cc535d49edb+editor`
- Push: `tools/tm-push.sh --mode=loader|full --script=ask-across-sites`
- Loader URL: `http://127.0.0.1:17373/scripts/ask-across-sites/script.user.js`

Replace this UUID in place with the loader. Do not install a second copy in Ego.

## Matches

`chat.deepseek.com`, `www.kimi.com`, `www.qianwen.com`, `chat.qwen.ai`, `www.doubao.com`, `yuanbao.tencent.com`, `chat.zchat.tech`, `chatgpt.com`, `gemini.google.com`, `aistudio.google.com`, `claude.ai`, `grok.com`, `google.com/search` (AI Mode), `google.com/ai`.

Boot: `ai script, start`, then `ai script, adapter` once a composer is found. No start log on a matching URL means the script did not run (TM disabled, loader/`@require` failed, or server down).

## Tests

Live composer/send selectors are in `lib/site-adapters.mjs` and must also appear in `script.user.js`. Sync helpers under `// <testable-sync-logic>` are what `npm test` executes. When a site layout changes, update those — not this file.

```sh
npm test
tools/probe-adapters.sh
```

The probe must not click send. After inserting probe text, wait until the send control is enabled (it may be absent while the composer is empty). Login is not required for this probe.

## Sync rules

Do not treat “the composer went empty” or a click inside the composer as a send. Broadcast only after the question is in this page’s thread (`isQuestionPosted`), or a real Enter that is not IME composing. `verifySendSuccess` must not keep synthesizing Enter after the user has typed or pasted something else (trusted paste clears `sendLock`).

Submit with each site’s real send path (see comments next to `getDoubaoInput` / `enterKeySend` / `getLexicalPlainText`). A generic Enter or editor `enter()` is not enough when the page uses a send button.

Login is only needed to verify a real send or chat history.

## `script.user.js` sections

Numbered banners `1、` … `13、`. Line numbers drift; grep the banner.

## Fork / Dia / Greasy Fork

Install `script.user.js` only. Never install `loader.user.js` in Dia or on Greasy Fork.

User-facing copy lives in the userscript header (`@description`, `@description:en`) and `greasyfork.md`. Keep the thanks to interest2 and the link to script `537302` there.

Greasy Fork syncs from GitHub via webhook. After header or body changes that should go public: bump `@version`, commit, push `main`. Do not re-host `localhost` `@require` on Greasy Fork.

Header edits (`@match`, `@grant`, `@name`, …) must be copied into `loader.user.js` and pushed with `--mode=loader`. Body edits do not.

## Pitfalls

- Master/slave and `GM_*` value listeners assume one enabled copy per browser. Two copies double-fire questions and TOC.
- After `--mode=full`, local file edits will not hot-reload until `--mode=loader`. The persist-length check is flaky; confirm `@version` in the TM editor.
- Do not load `markmap` unless turning `SHOW_MINDMAP_BTN` on (it is off in the header comments).
- Tampermonkey matches the visible editor by `@name` (`多站同问`). An old tab still titled 多模型同时回答 needs a reload after the loader push.
