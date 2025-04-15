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
- Database: [PostgreSQL] + [Supabase]
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




Next to do:
2. Set Up Frontend Project (React + Tailwind)
3. Build Real /predict Backend Logic (connect to Supabase match_history)
4. Connect Frontend to Backend (Call /predict endpoint)






