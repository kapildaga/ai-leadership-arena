# AI Leadership Arena

A gamified practice gym for senior AI leaders. It covers the organisational skills that technical depth alone doesn't give you: strategy, investment discipline, responsible AI, enterprise architecture, influence, execution, people leadership, and stakeholder politics.

## Run it
Double-click `index.html`. It opens in your browser. There's nothing to install and no server.

## How it works
| Component | File | What it does |
|---|---|---|
| Sessions & profiles | `js/storage.js` | Several profiles on one device, each with an optional PIN (SHA-256 hashed). Progress autosaves after every action. A PIN-protected profile locks after 30 idle minutes. Export/import as JSON. Everything goes through a `StorageAdapter`, so a server backend can replace localStorage later. |
| Content | `js/content.js` | 8 tracks × 4 tiers (48 scenarios) and 40 executive expressions. |
| Adaptive engine | `js/engine.js` | Elo-style mastery (0–100) per track. 2 results of 70+ in a row promote you a tier; 2 results under 40 step you back one. Spaced review of weak items after 2, 5 and 10 attempts. Daily Drill built from your weakest areas plus one stretch item. XP, titles, streaks and badges. |
| Evaluator | `js/evaluator.js` | Offline rubric for written answers, scored on outcome framing, clear recommendation, trade-offs, stakeholder awareness and executive economy. It also detects hedging, jargon and expression use. |
| AI coach (optional) | `js/ai-coach.js` | With your own API key (Settings), written answers also get an AI critique, a rewrite and a personalised curveball. Choose **OpenAI** (the default, with model `gpt-4o-mini`) or **Anthropic**, and enter any model ID from that provider. It tries structured JSON output first and retries with a plain request if the model doesn't support it. If the call still fails, the built-in rubric is used. |
| UI | `index.html`, `css/styles.css`, `js/app.js` | Profiles, calibration, dashboard, tracks, scenario player, library, progress, cohort leaderboard, settings. |

### Difficulty tiers
1. **Foundation**: pick the strongest response.
2. **Applied**: choose the best *and* the worst action.
3. **Complex**: 3-decision simulation that moves stakeholder meters (trust, value, risk control, momentum).
4. **Boardroom**: a written response, then a curveball from a sceptical stakeholder.

## Cohort use
Progress lives in each person's browser. To build a cohort leaderboard, each member uses **Cohort → Export my profile** and sends the file to the cohort lead, who uses **Import a teammate**. **Settings → Restore** moves a profile to a new device.

## Adding content
Add scenarios to a track's `scenarios` array in `js/content.js` using the `mcq`, `bw`, `branch` or `free` helpers. Ids must be unique. Existing profiles pick up new content automatically.
