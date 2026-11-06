# vBook CLI

Use only `.agents/skills/vbook-extensions/scripts/vbook.js` for device connection,
testing, and installation. Run from the repository root:

```text
node .agents/skills/vbook-extensions/scripts/vbook.js connect
node .agents/skills/vbook-extensions/scripts/vbook.js test <ext-dir> <script.js> [args...]
node .agents/skills/vbook-extensions/scripts/vbook.js testall [ext...] [--query kw] [--timeout ms] [--json file]
node .agents/skills/vbook-extensions/scripts/vbook.js install <ext-dir> [--no-icon]
```

Building the zip is OFFLINE and does not need the phone — use the repo one-door CLI
(`scripts/cli.js`), which calls `tools/cli/build.js` (pure-Node zip, lib-inline into a
temp dir):

```text
node scripts/cli.js build <ext-dir> [out.zip]   # one extension
node scripts/cli.js build                       # every extension under extensions/
node scripts/cli.js validate                    # static checks (run before build)
node scripts/cli.js build-catalog [--check]     # regenerate the root registry
```

`scripts/vbook.js build <ext-dir>` still exists but builds through the developer server
on the phone — prefer `scripts/cli.js build` (offline, same zip layout).

The CLI reads `plugin.json` and `src/*.js` from disk, so save edits first. A temporary
probe belongs in the extension's `src/` only for the test and must be removed afterward.

## Server resolution

Resolution order:

1. `--server <url>`
2. `VBOOK_SERVER`
3. `scripts/servers.json` (`{"servers":[...]}`), first responding server

Do not guess hosts. Missing config means copy `servers.example.json` and fill the device
URL. If no configured server responds, tell the user to enable vBook debug/dev mode and
verify its IP/port. Every command calls `/connect` first and prints the device; verify it
before a mutating build/install.

## Test arguments and results

Arguments after the script name become string `vararg` values. Common signatures:

- detail/page/toc/chap: URL
- search: query, page
- track: data
- tts: text, voice ID
- translate: text, from, to, source, model, style
- chatStream: messages JSON, model

`test` prints the exact input, logs, output, and response code. Script success is output
`code:0`, not HTTP 200, and still requires the verify checklist.

`testall` is triage: it probes search (or home/first script), retries one timeout, and
classifies WORK, MOVED, AUTH/MSG, EMPTY, CRASH, UNREACHABLE, or configuration errors.
These statuses are not permission to delete. Re-probe transient failures and directly
confirm a dead source before proposing removal.

If a batch ends with consecutive UNREACHABLE results, allow the device server to recover,
then rerun only those extensions and merge the results.

Icons are optional. The CLI includes `icon.png` when present; `--no-icon` omits it.
