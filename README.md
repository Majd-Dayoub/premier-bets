# Premier Bets 🎯⚽

A Premier League match predictor and fake betting simulator.

This app allows users to:

- Predict outcomes between two Premier League teams (Win/Draw/Loss probabilities).
- Simulate sports betting with fake currency based on match predictions.
- Track betting balances and compete on a public leaderboard.

Built with React, Node.js, PostgreSQL, and real football data.

---

## 🚀 Tech Stack

- Frontend: [React] + [Vite] + [Tailwind CSS]
- Backend: [Node.js]+ [Express]
- Database: [Supabase]
- Football API: [Football-data.org]
- Version Control: [Github]

---

## 📚 Features

- ⚽ Premier League match prediction engine
- 💰 Fake betting system with starting balance
- 📈 Live updating betting balance
- 🏆 Leaderboard showing top bettors
- 📜 Bet history (future upgrade)
- 🎉 Bonus mini-games (future upgrade)

---

## 🛠️ Setup Instructions

1. Clone the repository

   ```bash
   git clone https://github.com/your-username/premier-bets.git\

   npm init -y
   npm install express cors dotenv @supabase/supabase-js
   ```

## Current Notes

Finished:

1. Created match_history table in supabase
2. Installed Dependancies
3. Setup .env file with URL, Key, and Port
4. Created supabaseClient.js to connect supabase to server.js
5. Created server.js and started a simple express.js server
6. Added Football API and used Axios to make requests
7. Calculated Betting Odds based on standings data for both teams
8. Created users and bets tables
9. Finished create-user, get-user, and place-bet
10. Setup vite and tailwind css
11. Created logo with canva
12. connected backend and frontend
13. Create homepage which shows upcoming matches for 2 weeks
14. Added UI for betting modal and connected backend APIs to show betting odds
15. Created User Authentication System

Next to do:

You’re not “designing it wrong”, but you are currently mixing three concerns in one place, and that’s why it feels confusing:

1. user-facing reads/writes (bets, history, matches list)
2. system jobs (sync matches, sync standings, settle bets)
3. “business logic” (odds calculation, settlement rules)

When those aren’t separated, everything feels rudimentary and fragile even if it “works”.

Here are your next **5 big steps**, in the order I’d do them, with very specific targets.

---

## 1) Lock down multi-user security properly (this is currently the biggest risk)

Your Supabase tables showing **UNRESTRICTED** is a red flag: if RLS is off (or policies are too open), anyone can read/write everyone’s bets or balances.

What to do:

- **Enable RLS** on: `bets`, `users`, and any table that has user-specific rows.
- Add policies like:

  - `bets`: user can `SELECT/INSERT` only where `user_id = auth.uid()`
  - `users`: user can `SELECT/UPDATE` only their own row

- Decide what is “public data”:

  - `matches`, `standings_pl`, `standings_meta` can be readable by everyone (that’s fine)
  - but **sync endpoints** must not be public

Also remove `localStorage.setItem("userId", ...)` as a “source of truth”. The token already identifies the user. LocalStorage IDs are easy to spoof and become confusing.

Outcome: you can safely support multiple users without accidental data leaks.

---

## 2) Separate “system jobs” from “user APIs” (stop syncing on page load)

Right now Home does:

- `POST /sync-matches`
- `POST /sync-standings`
- then `GET /fetch-matches`

That’s convenient for development, but it’s not the right shape for a real app. With multiple users, you’ll spam your sync endpoints constantly.

What to do instead:

- Make sync jobs run on a schedule:

  - Vercel Cron, Render Cron, GitHub Actions cron, or Supabase scheduled functions (any one is fine)

- Change the frontend to only call:

  - `GET /matches?from=...&to=...`
  - `GET /standings?matchId=...`

And protect “system job” routes:

- `POST /admin/sync-matches`
- `POST /admin/sync-standings`
- `POST /admin/settle-finished`
  Only callable by you (service role key, or an admin JWT check).

Outcome: your app behaves correctly under load and doesn’t depend on someone visiting `/home` to keep data fresh.

---

## 3) Refactor `server.js` into a conventional backend structure (so you can reason about it)

Your instincts are right: the logic is currently “all in one file”, so it’s hard to understand.

Target structure:

- `src/app.js` (express setup, middleware)
- `src/routes/` (only route definitions)
- `src/controllers/` (request parsing, response shape)
- `src/services/`

  - `matchesService.js` (DB reads/writes)
  - `standingsService.js`
  - `betsService.js`
  - `footballDataClient.js` (axios wrapper)

- `src/middleware/requireAuth.js`
- `src/lib/supabaseServerClient.js`

Then add two basics you’re missing:

- request validation (zod or joi) so you stop manually checking fields everywhere
- consistent error handling middleware so you stop repeating try/catch patterns

Also: you import `uuidv4` but don’t use it. Clean those up as you refactor.

Outcome: the API stops feeling like magic and becomes “boringly understandable”.

---

## 4) Make your betting model harder to exploit (fairness + correctness)

Right now the client sends `odds` into `/place-bet`. Even if this is “just a simulator”, you’re training yourself into a bad habit: clients can lie.

Fix the trust boundary:

- Client sends only: `matchId`, `selection`, `amount`
- Server:

  - loads the match teams
  - loads cached standings snapshot
  - computes odds server-side
  - stores the odds used at bet time

Also add “betting rules”:

- reject bets if match status is not `SCHEDULED` (or if kickoff is within X minutes)
- enforce minimum/maximum bet amount
- enforce sufficient balance (ideally inside the DB RPC so it’s atomic)

Outcome: the logic is consistent and multiplayer-safe.

---

## 5) Tighten the data layer and API contracts (so your frontend becomes simpler)

Two high-impact improvements:

### A) Fix sync metadata design

In `sync-matches`, you store `last_synced_at` on every match row, then query “latest last_synced_at” by sorting the matches table. That’s a smell.

Instead:

- create a `sync_meta` table with one row per job:

  - `job_name: 'matches_pl'`
  - `last_synced_at`
  - `last_result`, `last_count`, `last_error`
    Then sync logic reads/writes that single row.

### B) Clean API naming and shapes

Pick one convention and stick to it:

- `GET /matches`
- `GET /matches/:id`
- `GET /matches/:id/odds` (or `GET /odds?matchId=...`)
- `POST /bets`
- `GET /bets`
- `POST /admin/sync/matches`
  Avoid “fetch-” prefix. It’s not wrong, it just becomes messy fast.

Outcome: fewer mapping helper functions like `mapDbMatchToMatchCardShape`, and easier long-term scaling.

---

### If you only do one thing this week

Do Step 1 (RLS + policies) and Step 2 (stop syncing on page load). Those two changes are the difference between “works for me” and “safe for real users”.

If you want, paste your Supabase table schemas (columns + types) and whether RLS is enabled on each table, and I’ll give you the exact policies you should create for `users`, `bets`, and any “admin-only” operations.
