# Tampermonkey scripts

Local `scripts/<id>/script.user.js` is the source of truth. Tampermonkey and Dia are runtimes. Do not edit large scripts in the Tampermonkey editor.

This repo will hold scripts for different jobs. Keep site adapters, login needs, and probe details in `scripts/<id>/AGENTS.md`, not here.

Do not use superpowers spec / plan / reviewer loops for ordinary script work. This repo is small: edit the file, verify in Ego Lite, install the complete file in Dia when ready.

## Layout

- `scripts/<id>/script.user.js` — full userscript (also the Dia install file)
- `scripts/<id>/loader.user.js` — Ego-only stub: full metadata header + `@require` local server. No app logic.
- `scripts/<id>/AGENTS.md` — UUID, `@match`, boot log, pitfalls, tests for that script
- `scripts/<id>/lib/` — optional helpers for that script
- `tools/serve.mjs` — static server
- `tools/tm-push.sh` — write a file into Ego Tampermonkey
- `tools/probe-adapters.sh` — Ego canary for a script that documents one; see that script's AGENTS.md
- `tests/` — Node tests when a script extracts logic for them

## Ego debug loop

1. From the repo root, start the server with host Node (never inside `ego-browser nodejs`):

   `node tools/serve.mjs`

   Listens on `http://127.0.0.1:17373`. If that port already serves this repo, the command exits 0. If something else owns the port, it exits 1 — do not pick another port.

2. First time, and after any `@match` / `@grant` / header change: regenerate `loader.user.js` from the full `script.user.js` header (keep every directive, set `@version` to `<version>-dev`, strip `@downloadURL` / `@updateURL`, add `@require http://127.0.0.1:17373/scripts/<id>/script.user.js`), then:

   `tools/tm-push.sh --mode=loader --script=<id>`

   Body-only edits do not need a loader push.

3. Edit `script.user.js`. Reload the target page in Ego Lite (one TaskSpace per goal, reuse pages). Check behavior and console, not a screenshot alone. Use the boot log named in `scripts/<id>/AGENTS.md`.

4. If the page still runs old code: confirm the server is up, then `tools/tm-push.sh --mode=full --script=<id>`, reload, verify. Then `--mode=loader` again unless you explicitly stay on that frozen full copy.

   `--mode=full` often fails its persist-length check (~1k chars). The Tampermonkey editor can still hold the new `@version` and body. Confirm the version string in the editor before treating the push as a no-op.

5. Login only when the check you are running needs a session. If it does, `handOff` in ego-browser. Adapter/composer probes usually do not.

## Tests

First time: `npm install`. Then run what that script's AGENTS.md lists (`npm test`, and a probe if it has one).

- `npm test` does not open a browser.
- A probe checks page contracts (composer, send control). It must not send a real message unless that script's AGENTS.md says to.
- Do not build a full live-site send matrix by default.

## Dia publish

Ego Lite is not the daily browser. Dia is. Never install `loader.user.js` in Dia. Do not drive Dia; give the user the path to `scripts/<id>/script.user.js`.

1. Verify the change on the affected sites in Ego (tests/probe if the script has them, then a real send only if that is what you changed).
2. Bump `@version`. For this repo's Greasy Fork listing, push `main`; the GitHub webhook updates the live script. Dia still installs `scripts/<id>/script.user.js` by hand. Do not put `@downloadURL` / `@updateURL` pointing at the *upstream* Greasy Fork script, or auto-update will overwrite the fork with interest2's original.
3. Tell the user the path. They install or overwrite it in Dia's Tampermonkey.

## Forbidden

- Two enabled scripts with the same `@match` in one browser
- Installing the localhost loader in Dia
- Using Tampermonkey's editor as the primary editor
- Starting `serve.mjs` inside ego-browser
- Treating `tm-push --mode=full` length mismatch as proof the save was dropped without reading the editor `@version`
