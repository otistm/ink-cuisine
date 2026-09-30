# Ink Cuisine: notes for Claude Code

Ink Cuisine is a minimal mobile restaurant management game drawn like a paper-and-ink cartoon. You open a restaurant, pick its name, cuisine and vibe, hire a head chef and a team, plan the menu with the chef, and run eight Friday night services against six rival restaurants, chasing stars in the Quill Guide (the game's Michelin guide). It's a sister game to Ink Gardens (`../ink-gardens`), Ink Burger, Ink Nine and Ink Crossing, and shares their way of working. It's hosted on Vercel from this repo (expected at https://ink-cuisine.vercel.app; update the `og:` and canonical links in both HTML files if the address changes).

## Who you're working with
Otis is the designer. He doesn't read code. He judges changes by playing them on his phone.
- Explain every change in plain language: what the player will see and feel, not how the code works.
- After pushing a branch, give Otis the Vercel preview link so he can play it before it goes live.
- Keep replies short. Ask one question at a time when a design decision is his to make.

## How the project is built
- **No build step, no frameworks, no npm packages in the game.** Plain HTML, CSS and JavaScript files served as-is by Vercel. The only outside code is Supabase's client, loaded from a CDN the first time a note is sent, plus Google Fonts.
- `index.html`: the front page (three cloches that lift in turn to show a dish, and a Play button). It borrows `play/js/data.js` and `play/js/draw.js` to draw them.
- `play/index.html`: the game page. It loads `styles.css` and then the scripts in `play/js/` **in the order listed there**.
- The scripts are classic scripts that share one global scope (`"use strict"` at the top of each). Order matters: a file can only use things defined in files above it *while it is loading*. Calls that happen later (on tap, per frame) can use anything.
- `manifest.webmanifest`, `sw.js`, `icons/`, `og-image.png`: home-screen install and share previews. The service worker is network-first. When you add, rename or remove a game file, update the `CORE` list in `sw.js` and bump `CACHE`.
- `supabase/`: SQL files Otis runs by hand in the Supabase SQL Editor, numbered in order.
- `tools/` and `package.json`: not part of the game (Playwright test tooling and art).
  - `tools/gallery.html`: every dish, face, table, glyph and the cloche on one page. Open http://localhost:8000/tools/gallery.html after changing a drawing.
  - `node tools/make-art.mjs` redraws `icons/` and `og-image.png` from the game's own cloche.
  - `node tools/shot.mjs /play/ screenshots/x.png` screenshots a page at phone size.

| File | What's in it |
|---|---|
| config.js | `VERSION`, Supabase URL and publishable key |
| data.js | The season (`WEEKS`, `START`, `SERVICE`), `MENU_SLOTS`, `CUISINES` (their dishes by course and their twists), `VIBES`, `CHEFS`, `SOUS`, `FOH`, `LINE_COOK`, `UPGRADES`, `RIVALS`, the Quill Guide (`INSPECT_WINDOWS`, `STAR_AT`, `RIVAL_STAR_AT`), `NEWS`, name ideas, guest names, `REVIEWS` |
| core.js | Small helpers, saved progress (`BEST`, `loadRun`, `saveRun`), game state `S`, `snapshot`/`restore`, who's working (`chef()`, `crew()`, `wages()`, `ideasFor`), dishes (`makeDish`, `fairPrice`, `valueOf`, `quality`, `cookTime`) |
| online.js | Supabase connection, the feedback screen, quiet crash notes |
| audio.js | Procedural sound effects |
| draw.js | Ink SVG: faces (`faceSVG`, hair, toques, moods), dishes (`DISH`, `dishSVG`), the table glyphs (`GLYPH`), tables for each vibe (`tableSVG`), stars, the cloche |
| service.js | Friday night: planning the night's guests (`planNight`), each party's evening (seat, order, serve, bill, walk out), how a guest rates the meal and how the inspector scores it (`verdict`), the kitchen, the door, the room, the pass, taps, the top bar, floating text, toasts |
| menu.js | The menu board (prices, rework) and the workshop with the chef (`pitch`, push, something else, accept) |
| tutorial.js | The soft opening: `TUT` steps, the chef's bubble (`bubble`, the reading ring and x), `coach(event)`, `tutParty`, `startTutorial`, `finishTutorial` |
| screens.js | The season's flow (`newSeason`, `startService`, `endService`), week 1's hints, rivals and the city table, every screen (title, setup steps, the soft opening offer, week intro, last orders, the books, the office, hire and fit out, the city table, the Quill Guide, broke, pause), the main loop, `start()` |

## How it plays
- **Setup** (six steps): name, cuisine, vibe, head chef, the team (sous chef and front of house), then the menu with the head chef. Changing the cuisine clears the menu.
- **The menu**: six dishes (two starters, three mains, a dessert). Each dish has taste and wow (out of 10), minutes to cook and a food cost, worked out when the chef first cooks it: the chef's skill and favourite cuisine add taste, their flair adds wow. The first pitch for a slot is free; "Something else" and "Push it further" each cost an idea. A push adds one twist from the cuisine's list; it lands with a chance of 25% + 7% per point of flair, otherwise the dish loses taste. Chefs get `ideasFor` ideas a week (2 + flair/2), plus 6 extra while setting up.
- **Prices**: every dish starts at its fair price (`fairPrice`, which depends on the vibe). Guests order less of anything above fair, and knock stars off for it.
- **Friday night service** (`SERVICE` seconds of doors open, 6pm to 10pm; the night ends when the last party leaves). The number of parties grows with buzz, the week, the vibe and the week's news. One tap does the obvious thing: tap a guest at the door (or a free table) to seat them; tap a table that raises a hand to take the order; tap a table (or its plates on the pass) when the food's up; tap a table that wants the bill; tap a dirty table to clear it.
- Each party reads the menu, then waits to order, waits for food, eats and waits for the bill, with a patience bar at each waiting step. Run out at the door, ordering or waiting for food and they walk out to a rival. Run out at the bill and they pay with no tip and a worse review. Front of house takes orders and brings bills on its own after a delay (faster with more pace). A porter clears tables. Plates on the pass go cold after 10 seconds (20 with heat lamps).
- The kitchen has one station per cook (head chef, sous chef, and the line cook if hired). Each cook takes the next dish in the queue; their pace sets the speed and their skill nudges the taste.
- **Reviews**: each party gives 0.5 to 5 stars from food (against the vibe's `bar`), service (waits and cold plates), the room (decor, charm, sommelier, garden) and value. Reviews move buzz; a food blogger's counts three times. Walkouts cost buzz and give a rival a little.
- **The Quill Guide**: an inspector eats here once in each of the three `INSPECT_WINDOWS`. They (and sometimes a food blogger) dine alone and show a notebook badge. They score out of 100: food 50, service 30, room 20. Their standard is the same whatever the vibe. The office reports a rumour afterwards. After the last week, the average score (plus a small bonus for being 1st or top 3 in town) sets your stars (`STAR_AT`). Rivals get stars from their buzz.
- **The books** after each service: takings, ingredients (paid as dishes are cooked), wages, rent. Below zero, the bank closes you and the week can be retried from its start.
- **The office**: rework the menu with the chef's new ideas, hire and fit out (`UPGRADES`), and the city table.
- Week 1 shows a one-line hint above the pass until the player has seated, taken an order, served, taken a bill and cleared once.

## The soft opening (tutorial)
- A friends-and-family night before week 1, with the player's head chef as coach. A new player (no `BEST.tutDone`) is offered it after planning the menu (Open the doors), with Skip to week 1. Everyone can replay it from the quiet Play the soft opening button on week 1's intro. Finishing or skipping sets `BEST.tutDone`.
- It uses the normal service with no arrivals except scripted parties (`tutParty`). `S.tut` switches off the pressure: no patience loss, no walkouts, the front of house never takes orders or bills on its own, plates never go cold, eating is quick, and the inspector-looking guest isn't scored. The season is saved before it starts and restored exactly afterwards, so nothing carries over.
- The game reports moments with `coach(event)`: `seat`, `order`, `cooked` (a party's whole order is on the pass), `serve`, `bill`, `clear`, plus `tick` a few times a second.
- Each step in `TUT` has `when` (the event that shows it), `until` (the event that moves on, or `next`/`finish` for explanations closed with the x), `target` (what gets the dashed ring; a selector or a function returning one), `pos` (`top` or `bottom`), `show` (set-up as it appears) and `ready` (true once the step is done anyway, so doing things out of order never leaves it stuck).
- The bubble is Ink Gardens' (and Ink Crossing's): a reading ring fills for 2.6 to 7 seconds, then turns into an x. It lets taps through; only its buttons are tappable. Don't add Next or Got it buttons. Pausing hides it; resuming brings the same tip back without re-running its `show`.
- If you rename an element a step targets, or change when one of those events fires, update `TUT` and run `npm run tutorial`.

## Every change
1. Work on a new branch, never directly on `main`.
2. Bump `VERSION` in `play/js/config.js` (patch for fixes, minor for features) and add a line to `CHANGELOG.md` in plain language.
3. Test:
   - `npm run check`: all scripts parse.
   - `npm run season`: a bot sets up a random restaurant and plays whole seasons at phone size with the clock run fast, and fails on any error. `npm run season -- 5 human 1.1` plays at a person's pace (one tap every 1.1 s); use it after any balance change. At 0.8 s the bot usually finishes with one or two stars; three stars should be rare and earned.
   - `npm run tutorial`: a bot sets up a restaurant as a new player and plays the soft opening start to finish, and fails if it gets stuck or anything carries over. `npm run tutorial -- shots` saves a screenshot of every tip in `screenshots/`.
   - Then run `python3 -m http.server` in the repo folder and open http://localhost:8000/play/ at a phone size (390 × 844). Online features only work over https, so locally feedback may say it isn't connected. That's expected.
4. Push the branch and share the Vercel preview link with Otis. Merge to `main` only when he's happy.

## Protect players' saved progress
Progress is kept in the browser's localStorage. An update must never wipe or break it.
- `inkcuisine`: `best` (`stars`, `week`, `rank`, `name`), `muted` and `tutDone` (finished or skipped the soft opening).
- `inkcuisine-run`: the season in progress, saved at the start of each week (`v`, `week`, `name`, `cuisine`, `vibe`, `chef`, `sous`, `foh`, `menu`, `till`, `buzz`, `rivals`, `up`, `insp`, `scores`, `earned`, `news`, `ideas`). "Carry on" restarts that week.
- Never rename or remove a saved field. Add new fields with defaults in `restore()`. If a field's meaning changes, bump `v` and convert old runs in `loadRun()`.
- Never reorder `CUISINES`, `VIBES`, `CHEFS`, `SOUS`, `FOH` or `RIVALS`, or the dishes and twists inside a cuisine: saved runs refer to them by position. Add new ones at the end. Menu dishes keep their own stats, so changing a dish's numbers only affects newly pitched dishes. Never rename an `UPGRADES` key (`k`).

## Supabase
- It's the same Supabase project as Ink Nine, Ink Burger and Ink Gardens, with its own table `cuisine_feedback` (`supabase/01-cuisine-feedback.sql`): tester notes with the version and a snapshot of the game (week, restaurant, cuisine, vibe, team, menu, bank, buzz, upgrades, parties in the room, inspection scores, screen size), readable only in the Supabase dashboard.
- "Send feedback" is on the title, pause, broke and Quill Guide screens. It opens over the current screen, and Back restores that screen exactly.
- Unexpected errors are sent quietly as kind "Crash" (at most three per visit, never from localhost).
- `config.js` holds only the public publishable key. **Never add a Supabase secret or service key anywhere.**
- Players are anonymous Supabase users. Row-level security lets each player insert only their own notes.
- Any schema change needs a new numbered file in `supabase/` and a clear note to Otis to run it before merging.

## Look and feel (keep it consistent)
- Paper and ink only: white and black, with grey only for secondary text. Shading is hatching, dots and stripes, never color. Dark mode swaps paper and ink.
- Fonts: Fraunces for display and Figtree for the UI (400 to 800), the same pair as the other ink games. Titles, headings, dish names and the chef's voice are Fraunces italic; numbers (bank, prices, counts, stats) are upright Fraunces 900 with even-width digits.
- Faces draw in a 40 × 50 box (`faceSVG`), dishes in 40 × 40 on a plate (`DISH`), tables side on in 120 × 72 with guests peeking over (`tableSVG`). A new dish icon needs a `DISH` entry; a new vibe needs a branch in `tableSVG`.
- Motion follows Disney's principles: squash and stretch, anticipation, follow-through, slow in and out. Tables that need you bob; the chef nods while pitching; the cloche lifts with a squash first.
- Mobile first, portrait, one thumb. Respect safe areas and `prefers-reduced-motion`.
- Writing: sentence case, short and plain, no jargon, numbers as digits.

## Smoke test before sharing a preview
- The front page shows three cloches lifting in turn, and a Play button that opens the game.
- The title shows the version and "Send feedback". A fresh player sees Open a restaurant; after starting a season, a refresh shows Carry on.
- Soft opening: after planning the menu, a new player is offered it. The chef's tips appear one at a time with a filling ring that turns into an x, and the thing they're talking about gets a dashed ring. Play it through to week 1 and check the bank is unchanged. Pause, restart it and quit from the middle: the tip goes away.
- Setup: roll a name, pick each cuisine, vibe, chef and team member (the chosen card gets a thick outline). Plan the menu: each empty slot opens the workshop; Something else and Push it further use ideas, and a flop reads as a flop. Open the doors is disabled until all six dishes are planned. Prices go up and down and the value word changes.
- Week 1: the intro shows the news, buzz, rank and the how-to. Seat a party, take their order, watch the kitchen cook it, serve it from the pass (bell), let them eat, take the bill (money and stars float up), clear the table. The hint line walks through each step.
- Let a party wait at the door: they get cross, then walk out "Off to" a rival. Leave plates on the pass: "Cold!".
- Last orders, the books, the office: hire someone and buy a table; the next service has more tables and another station. Rework a dish with the chef.
- Play (or skip with a bot) to the end: the Quill Guide reveals your stars one by one, beside the rivals'.
- Pause, send feedback, Back returns to the pause screen.
- Check it in dark mode too. No errors in the browser console.
