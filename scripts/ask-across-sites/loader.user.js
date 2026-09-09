// ==UserScript==
// @name         多站同问
// @name:en      Ask Across Sites
// @namespace    https://github.com/yicone/tampermonkey-scripts
// @version      1.0.0-dev
// @description  在多家对话 AI 官网同步提交同一句提问，并提供提问与回答的目录导航。感谢 interest2 的上游脚本「多模型同时回答 & 目录导航」：https://greasyfork.org/scripts/537302
// @description:en Submit the same prompt across conversational AI sites, with a table of contents for questions and answers. Thanks to interest2's upstream script: https://greasyfork.org/scripts/537302
// @author       yicone
// @homepageURL  https://github.com/yicone/tampermonkey-scripts
// @supportURL   https://github.com/yicone/tampermonkey-scripts/issues
// @match        https://chat.deepseek.com/*
// @match        https://www.kimi.com/*
// @match        https://www.qianwen.com/*
// @match        https://chat.qwen.ai/*
// @match        https://www.doubao.com/*
// @match        https://yuanbao.tencent.com/*
// @match        https://chat.zchat.tech/*
// @match        https://chatgpt.com/*
// @match        https://gemini.google.com/*
// @match        https://aistudio.google.com/*
// @match        https://claude.ai/*
// @match        https://grok.com/*
// @match        https://www.google.com/*
// @match        https://google.com/*
// @noframes
// @grant        GM_addStyle
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_deleteValue
// @grant        GM_addValueChangeListener
// @license      MIT
// @require      http://127.0.0.1:17373/scripts/ask-across-sites/script.user.js
// ==/UserScript==
