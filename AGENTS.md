# Tampermonkey scripts

Local `scripts/<id>/script.user.js` is the source of truth. Tampermonkey is a runtime. Do not edit large scripts in the Tampermonkey editor.

This repo will hold scripts for different jobs. Keep site adapters, login needs, and probe details in `scripts/<id>/AGENTS.md`, not here.

Do not use superpowers spec / plan / reviewer loops for ordinary script work. This repo is small: edit the file, verify in Ego Lite, push `main` so Greasy Fork updates.

## Layout

- `scripts/<id>/script.user.js` — full userscript; Greasy Fork syncs this file
- `scripts/<id>/loader.user.js` — Ego-only stub: full metadata header + `@require` local server. No app logic.
- `scripts/<id>/greasyfork.md` — optional additional info synced to the GF listing
- `scripts/<id>/AGENTS.md` — UUID, `@match`, boot log, pitfalls, tests, GF id for that script
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

## Publish (GitHub → Greasy Fork)

Ego Lite is the debug browser. Public installs come from Greasy Fork, not from a file in this repo. Never put `loader.user.js` on Greasy Fork. Do not operate the user's non-Ego browsers to install or update scripts.

1. Verify on the affected sites in Ego (tests/probe if the script has them, then a real send only if that is what you changed).
2. Bump `@version` in `script.user.js`. Keep `@downloadURL` / `@updateURL` on **this** script's Greasy Fork listing (id in that script's `AGENTS.md`). Never point them at an upstream listing, or Tampermonkey will auto-update into the original.
3. Header edits (`@name`, `@match`, `@grant`, `@description`, update URLs): copy the full header into `loader.user.js`, set `@version` to `<version>-dev`, strip GF `@downloadURL` / `@updateURL`, add `@require http://127.0.0.1:17373/scripts/<id>/script.user.js`.
4. Commit and push `main`. The GitHub `push` webhook updates Greasy Fork from the raw `script.user.js` URL.
5. Tell the user the listing is updated. Do not re-install from disk.

A script that has no Greasy Fork listing yet: import the GitHub raw `script.user.js` URL on Greasy Fork, then add a GitHub webhook as on https://greasyfork.org/zh-CN/users/webhook-info. Additional info can sync from `scripts/<id>/greasyfork.md`. First-time human install is the GF install link; later releases follow the webhook path above.

## Forbidden

- Two enabled scripts with the same `@match` in one browser
- Installing the localhost loader outside Ego Lite
- Using a local `script.user.js` as the public install when that script already has a Greasy Fork listing
- Using Tampermonkey's editor as the primary editor
- Starting `serve.mjs` inside ego-browser
- Treating `tm-push --mode=full` length mismatch as proof the save was dropped without reading the editor `@version`
