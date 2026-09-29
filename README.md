# TRACE//5

> **Break it. Understand it. Fix it.**

A browser-based **cybersecurity CTF training platform** built with Next.js. TRACE//5 puts you inside
five simulated security assessments against applications owned by the fictional company
**Northstar Systems**, and walks you through the full workflow of a real investigation:

```
Dashboard -> Lab briefing -> Target environment -> Recon -> Challenges -> Flag submission
          -> Write-up -> Remediation -> Next lab
```

**5 labs · 29 challenges · 5,000 XP · 13 concept cards · local progress persistence**

---

## Quick start

### All five challenges with Docker (no Node.js needed)

```bash
docker compose up -d --build
```

This starts six containers from the one image:

| Address | Container | Challenge |
|---|---|---|
| http://localhost:3000 | `trace5-hub` | the full platform, all 5 labs |
| http://localhost:3001 | `trace5-lab-01` | authentication flaws |
| http://localhost:3002 | `trace5-lab-02` | IDOR / BOLA |
| http://localhost:3003 | `trace5-lab-03` | XSS |
| http://localhost:3004 | `trace5-lab-04` | path traversal |
| http://localhost:3005 | `trace5-lab-05` | API security |

Each lab container redirects its root to its own lab, so opening
`http://localhost:3003` takes you straight into lab 03. Every other route
(`/labs`, `/dashboard`, `/concepts`, `/leaderboard`, `/certificate`) works from
any container.

```bash
docker compose ps           # status of all six containers
docker compose logs -f lab-01
docker compose down         # stop everything
```

### Single container

```bash
docker compose up -d hub
```

Or without compose:

```bash
docker build -t trace5 .
docker run --rm -p 3000:3000 trace5
```

To pin a single container to one lab, pass the variable yourself:

```bash
docker run --rm -e TRACE5_LAB=lab-04 -p 3000:3000 trace5
```

### With Node.js

Requires Node.js 18.17+ (developed and verified on Node 24).

```bash
cd trace5
npm install
npm run dev
```

Open http://localhost:3000.

### Deploy to Vercel (60 seconds, no account sharing needed)

The fastest route — open a new PowerShell window and run:

```bash
npx vercel@latest --prod
```

The CLI will print a login link in your browser. Approve it there. When prompted for a project name
press Enter, then confirm the deploy. Vercel prints a public URL at the end — that is your link.

> **Never paste your GitHub password, personal access token, or Vercel token into a chat window
> or into this project.** The Vercel CLI's browser login means no secret ever passes through the
> project files, your shell history, or an AI assistant. If a deployment needs a token, create one
> at vercel.com/account/tokens with the minimum scope (`vercel:deploy`) and revoke it afterwards.

Alternatively, push to GitHub yourself and import the repo at vercel.com/new — Vercel builds and
deploys automatically, and you get a link immediately. See "Deployment to Vercel" below.



---

## Labs

| # | Lab | Codename | Concepts | Difficulty | Challenges | XP |
|---|-----|----------|----------|------------|-----------|-----|
| 01 | The Locked Door | LOGIN | Authentication, SQL injection, input handling, password storage | ★★☆☆☆ | 5 | 1000 |
| 02 | Not Your Account | IDENTITY | Broken access control, IDOR/BOLA, authN vs authZ, object identifiers | ★★★☆☆ | 5 | 1000 |
| 03 | Echo Chamber | REFLECTION | Reflected & stored XSS, HTML encoding, JS context, CSP | ★★★☆☆ | 6 | 1000 |
| 04 | The Lost Directory | FILES | Path traversal, file disclosure, normalization, containment | ★★★★☆ | 5 | 1000 |
| 05 | Northstar Breach | API | Excessive data exposure, mass assignment, rate limiting, vulnerability chaining | ★★★★★ | 7 | 1000 |

**Lab 01 — The Locked Door.** Northstar's employee portal was migrated in a hurry. The dev team claims
authentication works normally. You inspect the request, probe the inputs, read the schema, and identify
that the credential lookup is built by string concatenation.

**Lab 02 — Not Your Account.** Northstar claims customers can only see their own invoices. You are
signed in as `alex`. Increment the invoice identifier and find out whether the API checks permission or
only identity.

**Lab 03 — Echo Chamber.** A search term is reflected into the results banner. You determine whether it
is displayed as text or parsed as markup, then examine a stored review that reaches every visitor.

**Lab 04 — The Lost Directory.** A download handler takes a `file` parameter. You determine whether
`../` sequences let a user read files outside the document root, and derive the invariant a correct
implementation must enforce.

**Lab 05 — Northstar Breach.** Five moderate findings on the customer API. None looks critical alone.
You establish what each one enables, decide how they chain, and write the incident report that will
drive remediation.

---

## Educational goals

By the end of the range you should be able to:

1. **Explain** why concatenating user input into a query is a vulnerability, and what parameterization changes.
2. **Distinguish** authentication from authorization, and recognise object-level authorization failures.
3. **Identify** XSS in reflected and stored form, and name the correct output context for a given sink.
4. **Predict** how a path resolves, and state a containment invariant you can actually test.
5. **Evaluate** API findings for excessive data exposure and mass assignment, and recommend allowlists.
6. **Reason about** rate limiting honestly — what it does, and what it does not, fix.
7. **Write** an incident report that names mechanisms rather than symptoms.
8. **Explain** vulnerability chaining: why moderate findings combined are worse than their sum.

## Features

- **5 progressive labs**, beginner → intermediate, each with a realistic engagement scenario
- **29 challenges** across multiple-choice, multi-answer, flag, evidence-gated and free-text report types
- **Simulated targets**: a login portal, an invoice API, a feedback search page, a document browser, a customer API
- **Simulated HTTP request inspector** in every lab so you can read real request/response shapes
- **Simulated terminal** (whitelist parser — never a shell) available in every lab
- **Centralized, data-driven validation** — one generic engine reads challenge definitions
- **Flags stored as digests**, so no plaintext answer ships for an unsolved challenge
- **Evidence gating** — you must perform the investigation step before a flag is accepted
- **Progressive hints** (3 per challenge) with explicit XP costs, confirmed in a dialog
- **Locked write-ups** with tabs: Overview / Concept / Solution / Why It Works / Remediation / Real World
- **Reveal walkthrough** for −50 XP when genuinely stuck
- **Learning panel** on every challenge: what, why, danger, discovery, prevention, testing
- **XP economy**: 1,000 XP per lab, 5,000 XP total, with deductions for hints and walkthroughs
- **localStorage progress** that survives refresh, per-browser
- **13 concept cards** that unlock as you solve the related challenge
- **Local simulated leaderboard**, clearly labelled as fictional
- **Print-friendly completion certificate**
- **Responsive**: three-panel workspace on desktop, stacked tab layout on mobile

---

## Architecture

```
src/
├─ app/                     # Next.js App Router routes
│  ├─ page.tsx              # Landing page
│  ├─ dashboard/            # Progress dashboard
│  ├─ labs/                 # Lab index, briefing, and /run workspace
│  ├─ concepts/             # Concept card library
│  ├─ leaderboard/          # Local simulated leaderboard
│  ├─ certificate/          # Print-friendly certificate
│  └─ not-found.tsx
├─ components/              # UI primitives + CTF engine components
│  ├─ ui/                   # shadcn-style primitives (Radix + Tailwind)
│  ├─ challenge-panel.tsx   # Submission, hints, verdict, learning panel
│  ├─ lab-runner.tsx        # 3-panel workspace (desktop) / tabs (mobile)
│  ├─ sim-lab0*.tsx         # One simulator per lab
│  ├─ sim-terminal.tsx      # Simulated shell UI
│  └─ writeup-tabs.tsx      # Locked / unlocked write-up
└─ lib/
   ├─ types.ts              # Challenge / Lab / Progress models
   ├─ labs.ts, lab-0*.ts    # Data-driven challenge definitions
   ├─ ctf-engine.ts         # Centralized validator
   ├─ flag-digest.ts        # Flag digesting + verification
   ├─ progress-store.ts     # localStorage persistence + XP accounting
   ├─ concepts.ts           # Concept cards + fictional leaderboard
   └─ sim/                  # Simulation engines (no I/O, no execution)
```

**Data-driven by design.** Every challenge — title, difficulty, type, hints, learning panel, code
comparison, options, XP, and flag digest — lives in `src/lib/data/lab-0*.ts`. The engine in
`ctf-engine.ts` is generic: it reads a `Challenge` and returns a verdict. Adding a lab means adding
data, not writing new UI.

**Scores.** 29 challenges distribute 1,000 XP per lab (5,000 total). Hints cost 10/20/30 XP (25/40/60 on expert-tier challenges), walkthroughs
cost 50 XP, and XP never drops below zero.

- **Accessible**: semantic HTML, focus rings, ARIA live regions, no colour-only status indicators

---

## Security of the platform

This project is designed to be deployed publicly, so the simulations are deliberately inert.

**Never used anywhere in this codebase:**

- `eval()` or the `Function` constructor
- `child_process`, `exec`, `spawn`, or any shell invocation
- `dangerouslySetInnerHTML` or unescaped HTML rendering of learner input
- SQL construction from user input, or any database connection
- `fs` or real file reads; path resolution against the real filesystem
- `process.env` access in client code, or any exposure of Vercel secrets

**How each vulnerability is simulated instead:**

| Would-be vulnerability | Simulation approach |
|---|---|
| SQL injection | Literal substring match against a fixed list of training signatures (`' OR '1'='1`, etc.). A canned response is returned. No query is ever built. |
| IDOR / BOLA | A static array of fictional invoice/order records. The simulator reports whether the record owner matches the session user. |
| Reflected / stored XSS | String analysis classifying the payload (plain / markup / attribute / script) and showing what a browser *would* do. React escapes all rendering; no script is ever executed. |
| Path traversal | A static `SimFile[]` table with a purely lexical path resolver. Nothing touches the real filesystem. |
| Command injection / terminal | A `switch` over a fixed command table returning canned output. Unknown input produces a static error. |
| Excessive data exposure / mass assignment | Predefined JSON payloads compared in the UI. Nothing is bound or persisted. |

**Flags are stored as digests.** `scripts/flags.json` is the authoring source; `npm run gen:digests`
generates `src/lib/data/flag-digests.json` (a salted, non-cryptographic 64-bit digest per challenge).
The browser compares the digest of your submission against the stored digest, so the correct answer for
an unsolved challenge is not present as readable text in the shipped bundle. This is a deterrent
against casual inspection, **not** a security boundary — anyone determined can read client-side
JavaScript. That trade-off is deliberate, and is why the footer, the lab briefings and this README all
state plainly that the CTF is educational and client-side.


---

## Installation

### Docker

```bash
docker compose up -d --build
```

Open http://localhost:3000. The image is built in three stages and the runtime
stage runs as a non-root user with no source, dev dependencies or flag authoring
file inside it. No environment variables, database or external services are
needed.

To build and run without compose:

```bash
docker build -t trace5 .
docker run --rm -p 3000:3000 trace5
```

### Node.js

Requires Node.js 18.17+ (developed and verified on Node 24).

```bash
cd trace5
npm install
npm run dev
```

Open http://localhost:3000.

## Scripts

```bash
npm run dev          # development server
npm run build        # production build
npm start            # serve the production build
npm run lint         # ESLint (next/core-web-vitals + next/typescript)
npm run typecheck    # tsc --noEmit
npm run test         # self-test suite (no browser required)
npm run verify       # lint + typecheck + test + build
npm run gen:digests  # regenerate flag digests (needs the authoring file, see below)
```

### The flag authoring file

`scripts/flags.json` is the human-readable list of all 28 answers used to
generate the shipped digests. It is **gitignored** and excluded from the Docker
build context, so the answers are not published with the code. Only the digests in
`src/lib/data/flag-digests.json` ship with the app.

It was committed in earlier revisions of this repository, so the answers remain
visible in that history. These are training answers for a deliberately vulnerable
practice environment, so nothing sensitive is exposed; the file is now kept out
of the working tree to avoid re-publishing it.

If you clone the repo and want to run `npm run gen:digests` or the flag-related
assertions in `npm run test`, create the file yourself in the format:

```json
{ "L1C1": "FLAG{YOUR_ANSWER}", "L1C2": "FLAG{YOUR_ANSWER}" }
```

The self-test detects its absence and skips the authoring-only checks, so a
fresh clone runs the full suite successfully without it.

---

## Deployment to Vercel

The project is Vercel-ready with no configuration. It is a standard Next.js 15 App Router app using
static generation for all routes, and needs no environment variables, database, Docker, background
workers or filesystem persistence.

### Option A — GitHub + Vercel dashboard (recommended)

1. Push the project to a GitHub repository.
2. In Vercel choose **Add New → Project** and import the repository.
3. Vercel detects Next.js automatically. Keep the defaults:
   - **Framework preset:** Next.js
   - **Build command:** `npm run build`
   - **Install command:** `npm install`
   - **Output directory:** *(leave blank — Next.js handles this)*
4. Click **Deploy**. No environment variables are required.

Every push to a branch produces a preview deployment; merges to `main` update production.

### Option B — Vercel CLI

```bash
npm i -g vercel
vercel                # first run: log in and link a new project
vercel --prod         # deploy to production
```

### Option C — Vercel CLI without a global install

```bash
npx vercel --prod
```

Vercel prints a public URL when the deployment finishes. The training experience runs entirely
client-side, so there is nothing else to configure.

---

## Publishing with a Cloudflare Tunnel

`scripts/cloudflare-tunnels.ps1` publishes the running containers over the
internet through Cloudflare quick tunnels, so no router configuration, port
forwarding or public IP is needed.

```powershell
# containers must be running first
docker compose up -d

# start a tunnel per container
.\scripts\cloudflare-tunnels.ps1

# read the URLs back later
.\scripts\cloudflare-tunnels.ps1 -Action Status

# stop every tunnel
.\scripts\cloudflare-tunnels.ps1 -Action Stop
```

Each container gets its own hostname, so a single challenge can be shared on its
own link while the hub exposes the whole platform. The lab containers redirect
their root to their own lab. URLs are written to `.tunnels/urls.txt`.

The script passes `--protocol http2` explicitly. Some networks block outbound
QUIC (UDP 7844), and without that flag cloudflared allocates a hostname and then
retries QUIC forever, so every request returns **HTTP 530** even though the tunnel
"looks" like it started. If you see 530, that is the cause.

These are account-less quick tunnels: the hostname is random and changes on every
restart, and anyone who has the link can reach the app. For a stable hostname, or
to put the app behind Cloudflare Access, create a named tunnel instead and point
it at the same local ports.

---

## Flag submission and feedback

**`/submit` — CTFd-style flag console.** Paste any captured flag and it is matched
against every challenge you have not solved yet, so you do not have to know which
challenge it belongs to. A correct flag is accepted, the challenge is marked
solved, and the same XP is awarded as inside the lab — including any hint and
walkthrough deductions. A rejected flag reports only that nothing matched; it
never discloses which challenge the submission was tested against, and never
reveals any part of the correct answer.

The page also lists every challenge with its solve state, difficulty, attempt
count and a search box, with solved/unsolved filters. Attempt counts live in a
separate `localStorage` key so they can be tallied before a challenge is solved.

**Verdict audio.** A correct flag plays a short rising two-tone chime; a wrong one
plays a descending buzz. Both are synthesised at runtime with the Web Audio API,
so there is no audio asset to download and nothing extra in the bundle. Browsers
block audio until the page has been interacted with, which is why playback is
triggered from the submit handler. Every audio code path is wrapped so a failure
can never break a submission.

---

## Testing checklist

| Area | Covered |
|---|---|
| Dashboard | XP, stats, per-lab progress, concept unlocks, resume flow |
| All 5 labs | Briefing, target simulator, challenges, evidence, write-up |
| All 29 challenges | Correct answers, incorrect answers, evidence gating |
| Hints | 3 per challenge, sequential unlock, XP deduction, confirmation dialog |
| XP | Awards, deductions, zero floor, walkthrough cost |
| Flags | Digest verification, case-insensitivity, incorrect-flag feedback |
| Progress | localStorage persistence across refresh, evidence retention |
| Leaderboard | Local score updates, fictional entries, reset flow |
| Certificate | Locked state, unlock on full completion, print styles |
| Responsive | 3-column desktop layout, tabbed mobile layout |
| Build | `npm run lint`, `npm run typecheck`, `npm run build` all pass |

---

## Acknowledgements

Northstar Systems, its applications, and every user, invoice, order, file and API response in this
platform are fictional. Any resemblance to real products is incidental. The vulnerability classes
taught here are documented in the OWASP Top 10 and are discussed openly in security education.

**Educational use only.**

**No authentication, no database, no environment variables.** Progress lives in `localStorage` under
`trace5.progress.v1`.

