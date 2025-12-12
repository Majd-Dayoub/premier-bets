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

✅ 1. Implement Basic User Creation & Login UI
So far you’re hardcoding users or not creating them at all on the frontend.

Goals:

Create a landing page with a username input to “sign up” or “log in” a user.

Save their userId in localStorage or sessionStorage.

Update the frontend to use this ID when placing a bet.

Why now?

Enables personalized betting

Unlocks the rest of the features (bet history, balance, etc.)

✅ 2. Add Balance + Bet Status UI
Let users see their balance and get feedback after placing a bet.

UI Enhancements:

Display user balance in navbar or top right

After betting, show a toast/snackbar:
✅ “Bet placed! New balance: $4,500”

API Integration:

Use /api/get-user?userId=... to fetch balance

Update balance after placing a bet using /api/place-bet

✅ 3. Create “My Bets” Page
Show users a list of all bets they’ve placed.

New API Endpoint:

js
Copy
Edit
// GET /api/my-bets?userId=abc-123
const { data, error } = await supabase
.from("bets")
.select("\*")
.eq("user_id", userId)
.order("created_at", { ascending: false });
Frontend Goals:

Create /my-bets route

Show list: Match, Date, Team Picked, Odds, Amount, Status (Pending/Won/Lost)
