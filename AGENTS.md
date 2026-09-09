# Tampermonkey scripts

Local `scripts/<id>/script.user.js` is the source of truth. Tampermonkey and Dia are runtimes. Do not edit large scripts in the Tampermonkey editor.

Do not use superpowers spec / plan / reviewer loops for ordinary script work. This repo is small: edit the file, verify in Ego Lite, install the complete file in Dia when ready.

## Layout

- `scripts/<id>/script.user.js` — full userscript (also the Dia install file)
- `scripts/<id>/loader.user.js` — Ego-only stub: full metadata header + `@require` local server. No app logic.
- `scripts/<id>/AGENTS.md` — UUID, `@match`, section map, script-specific pitfalls
- `tools/serve.mjs` — static server
- `tools/tm-push.sh` — write a file into Ego Tampermonkey

## Ego debug loop

1. From the repo root, start the server with host Node (never inside `ego-browser nodejs`):

   `node tools/serve.mjs`

   Listens on `http://127.0.0.1:17373`. If that port already serves this repo, the command exits 0. If something else owns the port, it exits 1 — do not pick another port.

2. First time, and after any `@match` / `@grant` / header change: regenerate `loader.user.js` from the full `script.user.js` header (keep every directive, set `@version` to `<version>-dev`, strip `@downloadURL` / `@updateURL`, add `@require http://127.0.0.1:17373/scripts/<id>/script.user.js`), then:

   `tools/tm-push.sh --mode=loader --script=<id>`

   Body-only edits do not need a loader push.

3. Edit `script.user.js`. Reload the target page in Ego Lite (one TaskSpace per goal, reuse pages). Check behavior and console, not a screenshot alone.

4. If the page still runs old code: confirm the server is up, then `tools/tm-push.sh --mode=full --script=<id>`, reload, verify. Then `--mode=loader` again unless you explicitly stay on that frozen full copy.

5. Need login? `handOff` in ego-browser. Missing UI is not a code bug until `@match`, TM enabled, login, and the script boot log have been checked.

## Dia publish

Ego Lite is not the daily browser. Dia is. Never install `loader.user.js` in Dia.

1. Verify the change on the affected sites in Ego.
2. Bump `@version` with a fork suffix (`5.2.6-local.1`). Strip `@downloadURL` and `@updateURL` so Greasy Fork cannot overwrite the fork.
3. Tell the user the path to `scripts/<id>/script.user.js`. They install or overwrite it in Dia's Tampermonkey. Do not drive Dia.

## Forbidden

- Two enabled scripts with the same `@match` in one browser
- Installing the localhost loader in Dia
- Using Tampermonkey's editor as the primary editor
- Starting `serve.mjs` inside ego-browser
