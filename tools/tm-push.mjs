const SCRIPTS = {
  "ask-across-sites": {
    uuid: "d4da46bf-fba2-4f71-b8fc-1cc535d49edb",
    name: "多站同问",
    nameAliases: ["多站同问", "Ask Across Sites", "多模型同时回答 & 目录导航"],
    dir: "scripts/ask-across-sites",
  },
};

const EXTENSION_ID = "dhdgffkkebhmkfjojejmpbldmpobfkfo";

const fs = await import("node:fs/promises");
const path = await import("node:path");

const root = process.env.TM_PUSH_ROOT || process.cwd();
const mode = process.env.TM_PUSH_MODE || "loader";
const scriptId = process.env.TM_PUSH_SCRIPT || "ask-across-sites";
const meta = SCRIPTS[scriptId];

if (!meta) {
  throw new Error(`unknown script id: ${scriptId}`);
}
if (mode !== "loader" && mode !== "full") {
  throw new Error(`TM_PUSH_MODE must be loader or full, got ${mode}`);
}

const fileName = mode === "loader" ? "loader.user.js" : "script.user.js";
const filePath = path.join(root, meta.dir, fileName);
const source = await fs.readFile(filePath, "utf8");
const editorUrl = `chrome-extension://${EXTENSION_ID}/options.html#nav=${meta.uuid}+editor`;

const task = await taskSpace(`tm-push ${scriptId} ${mode}`);
const page = task.page("p1");
await page.goto(editorUrl);
await page.waitForLoadState();
await page.waitForFunction(
  (names) =>
    [...document.querySelectorAll(".CodeMirror")].some((el) => {
      const visible = el.offsetWidth > 0 && el.offsetHeight > 0;
      const value = el.CodeMirror && el.CodeMirror.getValue();
      return visible && value && value.includes("@name") && names.some((n) => value.includes(n));
    }),
  meta.nameAliases,
  { timeout: 15_000 },
);

const result = await page.evaluate(
  ({ source, names }) => {
    const cms = [...document.querySelectorAll(".CodeMirror")]
      .map((el, index) => {
        const cm = el.CodeMirror;
        const value = cm ? cm.getValue() : "";
        const visible = el.offsetWidth > 0 && el.offsetHeight > 0;
        return { index, visible, value, nameLine: value.split("\n").find((l) => l.includes("@name")) || "" };
      })
      .filter((item) => item.visible && item.value.startsWith("// ==UserScript=="));

    const match =
      cms.find((item) => names.some((n) => item.nameLine.includes(n))) ||
      cms.find((item) => !item.nameLine.includes("New Userscript"));
    if (!match) {
      return {
        ok: false,
        error: "no visible CodeMirror with matching @name",
        candidates: cms.map((item) => ({ index: item.index, nameLine: item.nameLine.slice(0, 80) })),
      };
    }

    const el = document.querySelectorAll(".CodeMirror")[match.index];
    el.CodeMirror.setValue(source);
    const readBack = el.CodeMirror.getValue();
    if (readBack !== source) {
      return { ok: false, error: "read-back mismatch", expected: source.length, actual: readBack.length };
    }
    return { ok: true, index: match.index, length: source.length };
  },
  { source, names: meta.nameAliases },
);

if (!result.ok) {
  console.log(JSON.stringify({ taskSpaceId: task.spaceId, ...result }, null, 2));
  throw new Error(result.error);
}

const saved = await page.evaluate((uuid) => {
  const token = btoa(uuid).replace(/=+$/, "");
  const save = [...document.querySelectorAll('button[title="Save"]')].find((el) => el.id.includes(token));
  if (save) {
    save.click();
    return { clicked: true, via: save.id };
  }
  const tab = [...document.querySelectorAll("*")].find((n) => (n.textContent || "").trim() === "");
  if (tab) {
    tab.click();
    return { clicked: true, via: "check-glyph" };
  }
  return { clicked: false };
}, meta.uuid);

if (!saved.clicked) {
  const visible = [...(await page.evaluate(() =>
    [...document.querySelectorAll(".CodeMirror")].map((el, i) => ({
      i,
      visible: el.offsetWidth > 0,
    })),
  ))].find((item) => item.visible);
  if (visible) {
    await page.evaluate((index) => {
      document.querySelectorAll(".CodeMirror")[index].CodeMirror.focus();
    }, visible.i);
  }
  await page.keyboard.press("ControlOrMeta+s");
  saved.clicked = true;
  saved.via = (saved.via ? saved.via + "+" : "") + "ControlOrMeta+s";
}

await page.waitForTimeout(800);
await page.reload();
await page.waitForLoadState();
await page.waitForFunction(
  (names) =>
    [...document.querySelectorAll(".CodeMirror")].some((el) => {
      const visible = el.offsetWidth > 0 && el.offsetHeight > 0;
      const value = el.CodeMirror && el.CodeMirror.getValue();
      return visible && value && value.includes("@name") && names.some((n) => value.includes(n));
    }),
  meta.nameAliases,
  { timeout: 15_000 },
);

const verify = await page.evaluate((expectedLength) => {
  const visible = [...document.querySelectorAll(".CodeMirror")].find(
    (el) => el.offsetWidth > 0 && el.offsetHeight > 0,
  );
  const value = visible && visible.CodeMirror ? visible.CodeMirror.getValue() : "";
  return {
    length: value.length,
    persisted: value.length === expectedLength,
    first: value.split("\n").slice(0, 8),
    hasRequire: value.includes("@require") && value.includes("127.0.0.1:17373"),
  };
}, source.length);

if (!verify.persisted) {
  console.log(JSON.stringify({ taskSpaceId: task.spaceId, saved, result, verify }, null, 2));
  throw new Error("save did not persist across reload");
}

console.log(
  JSON.stringify(
    {
      taskSpaceId: task.spaceId,
      mode,
      scriptId,
      filePath,
      bytes: source.length,
      editor: result,
      saved,
      verify,
    },
    null,
    2,
  ),
);

await task.finish({ keep: [] });
