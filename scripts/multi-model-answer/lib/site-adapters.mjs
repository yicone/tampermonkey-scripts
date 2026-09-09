/** Selector contracts for adapter probes. Keep these strings in script.user.js. */
export const siteAdapters = {
  doubao: {
    id: "doubao",
    url: "https://www.doubao.com/chat/",
    composer: '.tiptap.ProseMirror[contenteditable="true"]',
    sendWrapper: ".send-btn-wrapper",
  },
  qianwen: {
    id: "qianwen",
    url: "https://www.qianwen.com/",
    composer: '[contenteditable="true"][role="textbox"]',
  },
};
