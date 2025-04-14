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

   npm init -y
   npm install express cors dotenv @supabase/supabase-js



## Current Notes

Finished:
1. Created match_history table in supabase
2. Installed Dependancies
3. Setup .env file with URL, Key, and Port
4. Created supabaseClient.js to connect supabase to server.js
5. Created server.js and started a simple express.js server
6. Added Football API and used Axios to test get request



Next to do:
1. Set Up Backend First (Node + Express + Supabase connection)
2. Set Up Frontend Project (React + Tailwind)
3. Build Real /predict Backend Logic (connect to Supabase match_history)
4. Connect Frontend to Backend (Call /predict endpoint)





// Get fixture from one fixture {id}
// In this request events, lineups, statistics fixture and players fixture are returned in the response
get("https://v3.football.api-sports.io/fixtures?id=215662");

// Get fixture from severals fixtures {ids}
// In this request events, lineups, statistics fixture and players fixture are returned in the response
get("https://v3.football.api-sports.io/fixtures?ids=215662-215663-215664-215665-215666-215667");

// Get all available fixtures in play
// In this request events are returned in the response
get("https://v3.football.api-sports.io/fixtures?live=all");

// Get all available fixtures in play filter by several {league}
// In this request events are returned in the response
get("https://v3.football.api-sports.io/fixtures?live=39-61-48");

// Get all available fixtures from one {league} & {season}
get("https://v3.football.api-sports.io/fixtures?league=39&season=2019");

// Get all available fixtures from one {date}
get("https://v3.football.api-sports.io/fixtures?date=2019-10-22");

// Get next X available fixtures
get("https://v3.football.api-sports.io/fixtures?next=15");

// Get last X available fixtures
get("https://v3.football.api-sports.io/fixtures?last=15");

// It’s possible to make requests by mixing the available parameters
get("https://v3.football.api-sports.io/fixtures?date=2020-01-30&league=61&season=2019");
get("https://v3.football.api-sports.io/fixtures?league=61&next=10");
get("https://v3.football.api-sports.io/fixtures?venue=358&next=10");
get("https://v3.football.api-sports.io/fixtures?league=61&last=10&status=ft");
get("https://v3.football.api-sports.io/fixtures?team=85&last=10&timezone=Europe/london");
get("https://v3.football.api-sports.io/fixtures?team=85&season=2019&from=2019-07-01&to=2020-10-31");
get("https://v3.football.api-sports.io/fixtures?league=61&season=2019&from=2019-07-01&to=2020-10-31&timezone=Europe/london");
get("https://v3.football.api-sports.io/fixtures?league=61&season=2019&round=Regular Season - 1");



