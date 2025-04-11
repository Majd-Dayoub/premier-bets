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
- Football Data: [API-Football] and https://www.kaggle.com/datasets/sajkazmi/premier-league-matches?select=matches.csv 
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



## Current Notes

Just finished:
- Finished creatingmatch_history table in supabase

Next to do:
1. Set Up Backend First (Node + Express + Supabase connection)
2. Set Up Frontend Project (React + Tailwind)
3. Build Real /predict Backend Logic (connect to Supabase match_history)
4. Connect Frontend to Backend (Call /predict endpoint)