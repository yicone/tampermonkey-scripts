# Tampermonkey scripts

Local `scripts/<id>/script.user.js` is the source of truth. Tampermonkey and Dia are runtimes. Do not edit large scripts in the Tampermonkey editor.

Do not use superpowers spec / plan / reviewer loops for ordinary script work. This repo is small: edit the file, verify in Ego Lite, install the complete file in Dia when ready.

## Layout

- `scripts/<id>/script.user.js` — full userscript (also the Dia install file)
- `scripts/<id>/loader.user.js` — Ego-only stub: full metadata header + `@require` local server. No app logic.
- `scripts/<id>/AGENTS.md` — UUID, `@match`, adapter pitfalls, section map
- `scripts/<id>/lib/` — selector contracts shared with tests/probes; strings must still appear in `script.user.js`
- `tools/serve.mjs` — static server
- `tools/tm-push.sh` — write a file into Ego Tampermonkey
- `tools/probe-adapters.sh` — Ego canary: composer + send button only, never click send
- `tests/` — Node tests for sync rules extracted from `// <testable-sync-logic>`

## Ego debug loop

1. From the repo root, start the server with host Node (never inside `ego-browser nodejs`):

   `node tools/serve.mjs`

   Listens on `http://127.0.0.1:17373`. If that port already serves this repo, the command exits 0. If something else owns the port, it exits 1 — do not pick another port.

2. First time, and after any `@match` / `@grant` / header change: regenerate `loader.user.js` from the full `script.user.js` header (keep every directive, set `@version` to `<version>-dev`, strip `@downloadURL` / `@updateURL`, add `@require http://127.0.0.1:17373/scripts/<id>/script.user.js`), then:

   `tools/tm-push.sh --mode=loader --script=<id>`

   Body-only edits do not need a loader push.

3. Edit `script.user.js`. Reload the target page in Ego Lite (one TaskSpace per goal, reuse pages). Check behavior and console, not a screenshot alone. Boot log `ai script, start`; after the composer appears, `ai script, adapter`.

4. If the page still runs old code: confirm the server is up, then `tools/tm-push.sh --mode=full --script=<id>`, reload, verify. Then `--mode=loader` again unless you explicitly stay on that frozen full copy.

   `--mode=full` often fails its persist-length check (~1k chars). The Tampermonkey editor can still hold the new `@version` and body. Confirm the version string in the editor before treating the push as a no-op.

5. Need login? `handOff` in ego-browser. Missing chat history after a send is not an adapter bug until login is confirmed. Ego Doubao is often logged out: clicking send can bounce to `?from_logout=1`. Composer + send-button probes can still pass.

## Tests

First time: `npm install`. Then:

```sh
npm test
tools/probe-adapters.sh
```

- `npm test` does not open a browser. It loads helpers between `// <testable-sync-logic>` markers and checks that probe selectors still exist in `script.user.js`.
- The probe only covers Doubao and Qianwen. It may insert then clear probe text. It must not click send. Doubao's send button appears only after the composer has content — wait for it.
- Do not add a 12-site send-a-real-message matrix. Other sites stay manual until they become daily drivers.

## Dia publish

Ego Lite is not the daily browser. Dia is. Never install `loader.user.js` in Dia. Do not drive Dia; give the user the path to `scripts/<id>/script.user.js`.

1. Verify the change on the affected sites in Ego (`npm test`, probe if adapters moved, then a real send only on the sites you touched).
2. Bump `@version` with a fork suffix (`5.2.6-local.1`). Strip `@downloadURL` and `@updateURL` so Greasy Fork cannot overwrite the fork.
3. Tell the user the path. They install or overwrite it in Dia's Tampermonkey.

## Forbidden

- Two enabled scripts with the same `@match` in one browser
- Installing the localhost loader in Dia
- Using Tampermonkey's editor as the primary editor
- Starting `serve.mjs` inside ego-browser
- Treating `tm-push --mode=full` length mismatch as proof the save was dropped without reading the editor `@version`
