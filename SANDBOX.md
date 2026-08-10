# Working in this Sandbox

Welcome to the sandbox! This is a virtual environment where you will work on your assessment.
You are likely in a warm-up stage, where the timer is paused and the task is hidden.
Use this time to read the guidelines and get used to the environment.

When you're ready, click **Start now** in the top bar. Or just wait, and it
starts automatically when the warm-up time runs out. Your coding timer only
begins then.

When the assessment starts, this workspace is reset. Only `SANDBOX.md` is kept;
put any warm-up notes or setup instructions you want to carry forward there.

## Viewing your task

Once the assessment starts, the starter code and `README.md` will be available in the editor.
Read them first to understand the task.

## Guideline on using AI assistants

**You are only allowed to use AI tools that you are given. Do not use any external AI tools.**

**Claude Code** is signed in and ready to go in the editor. You can also run
`claude` or `codex` in the terminal.

During the **written debrief** you should not use any AI tools.

## Using the Terminal

Open it with **`Ctrl`+`` ` ``**. `git`, `node`, `pnpm`, `python3`, `ripgrep`,
and `jq` are ready to go, and you can run the **`claude`** and **`codex`** CLIs
right from here.

## Previewing your app

Start your dev server in the terminal as usual, then open the **Preview** button
to see it running in your browser. It picks up the server you started in the
sandbox.

## Saving & submitting

Your work is collected automatically when you finish, so there is nothing to push or
upload. **Only saved files are collected, so save as you go (`Ctrl`+`S`).** To
submit before time runs out, use the **Finish** control on the assessment page.

## If the editor hiccups

Reload the browser tab. The session reconnects in a couple of seconds and your
work is intact.

---

# Warm-up environment check (verified 2026-08-10)

Everything below was actually run and confirmed working, so no time needs to be
spent re-checking it once the timer starts.

## Available

| Tool | Version |
|---|---|
| node | v20.20.2 |
| npm | 10.8.2 |
| pnpm | 10.34.5 |
| python3 | 3.10.12 |
| git | 2.34.1 |
| ripgrep | 13.0.0 |
| jq | 1.6 |
| psql | 17.10 |
| redis-cli | 6.0.16 |

Machine: 48 CPUs, 377 GB RAM, 9 GB free on `/`.

## NOT available

`docker`, `go`, `cargo`, `yarn`. Don't plan a solution that needs them —
use `pnpm`/`npm` and the already-running Postgres/Redis instead.

## Services (both confirmed up)

- Postgres: `postgres://postgres@localhost:5432/pensive` — trust auth, no
  password. Existing DBs: `pensive`, `postgres`. Note `pensive` is owned by
  `postgres` while `postgres`/templates are owned by `candidate`.
- Redis: `redis-cli -h 127.0.0.1` → `PONG` (port 6379).

## Network / installs

npm registry (`https://registry.npmjs.org/`) is reachable; a real
`pnpm add` resolved, downloaded, and loaded a package successfully.
The pnpm store starts empty, so the **first install of the assessment's
dependencies will do a cold download** — kick off `pnpm install` as the very
first action after reading the README, then read the code while it runs.

## Preview

Confirmed: a server listening on `localhost:5173` responds 200. Plain
`localhost` binding is fine — the proxy reaches it from inside the sandbox.

- Preview button targets **5173** by default; other ports via its dropdown.
- **Port 3000 is reserved by the sandbox** — if the starter's dev server
  defaults to 3000, move it (e.g. `vite --port 5173`, or `PORT=5173`).
- `localhost` URLs do not work in the browser directly; only via Preview.
  From the terminal, `curl http://localhost:<port>` works for self-checks.

## Reminder

Only **saved** files are collected — `Ctrl`+`S` as you go.
