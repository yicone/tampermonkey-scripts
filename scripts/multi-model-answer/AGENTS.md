# 多模型同时回答 & 目录导航

Fork of Greasy Fork [537302](https://greasyfork.org/scripts/537302) by `interest2`. Baseline `5.2.6`. Directory id: `multi-model-answer`.

## Ego Tampermonkey

- Extension: `dhdgffkkebhmkfjojejmpbldmpobfkfo`
- Script UUID: `d4da46bf-fba2-4f71-b8fc-1cc535d49edb`
- Editor: `chrome-extension://dhdgffkkebhmkfjojejmpbldmpobfkfo/options.html#nav=d4da46bf-fba2-4f71-b8fc-1cc535d49edb+editor`
- Push: `tools/tm-push.sh --mode=loader|full --script=multi-model-answer`
- Loader URL: `http://127.0.0.1:17373/scripts/multi-model-answer/script.user.js`

Replace this UUID in place with the loader. Do not install a second copy in Ego.

## Matches

`chat.deepseek.com`, `www.kimi.com`, `www.qianwen.com`, `chat.qwen.ai`, `www.doubao.com`, `yuanbao.tencent.com`, `chat.zchat.tech`, `chatgpt.com`, `gemini.google.com`, `aistudio.google.com`, `claude.ai`, `grok.com`.

Boot log: `ai script, start`. After the composer appears: `ai script, adapter`. No start log on a matching URL means the script did not run (TM disabled, loader/`@require` failed, or server down).

Selectors for Doubao/Qianwen probes live in `lib/site-adapters.mjs`. Keep the same strings in `script.user.js`. Sync helpers under `// <testable-sync-logic>` are loaded by `npm test`.

```sh
npm test
tools/probe-adapters.sh
```

Ego Lite may have no login cookies. Hand off for login before treating a missing panel as a regression.

## `script.user.js` sections

Line numbers drift; trust the banners.

| # | Banner | Approx. lines |
|---|--------|----------------|
| 1 | 适配各站点相关代码 | 44–270 |
| 2 | 一些函数和变量 | 271–417 |
| 3 | 主从节点逻辑 | 418–491 |
| 4 | 从节点异步轮询检查 | 492–649 |
| 5 | 图片同步功能 | 650–752 |
| 6 | 监听新的提问 | 753–1199 |
| 7 | trusted HTML & 首次使用指引 | 1200–1297 |
| 8 | 输入框的显示/隐藏切换 | 1298–1617 |
| 9 | 目录导航功能 | 1618–3760 |
| 10 | 多选面板 | 3761–4814 |
| 11 | 一些工具函数 | 4815–5310 |
| 12 | 设置弹窗功能 | 5311–5771 |
| 13 | 书签功能 | 5772–end |

## Fork / Dia

Install `script.user.js` only. Use `@version` like `5.2.6-local.1`. Strip `@downloadURL` and `@updateURL` before the user installs in Dia, or Greasy Fork will overwrite the fork.

Header edits (`@match`, `@grant`, …) must be copied into `loader.user.js` and pushed with `--mode=loader`. Body edits do not.

## Pitfalls

- Master/slave and `GM_*` value listeners assume one enabled copy per browser. Two copies double-fire questions and TOC.
- After `--mode=full`, local file edits will not hot-reload until `--mode=loader`.
- Do not load `markmap` unless turning `SHOW_MINDMAP_BTN` on (it is off in the header comments).
