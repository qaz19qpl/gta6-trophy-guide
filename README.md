# Vice City Trophy Guide

[![make.fun · gta6-trophy-guide-01](https://make.fun/badge/gta6-trophy-guide-01.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![rank](https://make.fun/badge/gta6-trophy-guide-01/qaz19qpl/gta6-trophy-guide/rank.svg)](https://make.fun/bounty/gta6-trophy-guide-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![reward](https://make.fun/badge/gta6-trophy-guide-01/qaz19qpl/gta6-trophy-guide/reward.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)

**Vice City Trophy Guide** — an offline guide and tracker for all 55 Grand Theft Auto VI trophies on PlayStation 5.

Every trophy shows its official name, description and grade as PlayStation publishes them, plus a guide written for this entry, in its own words, with its sources named beside it. The guide is a tracker too: tick trophies off as you earn them and your progress is saved in the browser, with export and import of your progress as a file. Filters cover story, missable, collectibles, activities and online (the official list holds no online trophies), and a spoiler-free mode hides the names and descriptions of story trophies you have not earned yet. A four-stage roadmap leads to the platinum, and the list's one potentially missable trophy — Positive Mental Attitude, whose first meditation spot disappears after Chapter 1 — is flagged throughout.

- **Run it:** `node serve.ts`, then open http://localhost:8080. Static files under `app/` only — no build step, no network requests at run time.
- **Data:** `app/data/trophies.json` holds the 55 official trophies with each guide and its sources.
- **Hand in:** `MAKEFUN_OUTPUT_DIR=out node main.ts` copies `app/` and `screenshots/` to the output directory and writes `dossier.json`.

The game had not launched when this guide was written. Steps that go beyond the official trophy descriptions are labelled as predictions, and every guide names where its facts come from. An unofficial fan guide — not affiliated with or endorsed by Rockstar Games or Take-Two Interactive, and using no official artwork, logos or screenshots.
