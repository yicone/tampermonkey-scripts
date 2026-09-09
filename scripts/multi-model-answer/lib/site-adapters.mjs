/** Current Doubao/Qianwen page contracts for probes. Update here and in script.user.js when a site restyles. */
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
  aimode: {
    id: "aimode",
    url: "https://www.google.com/search?udm=50",
    composer: 'textarea.ITIRGe',
  },
};
