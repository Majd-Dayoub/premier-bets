// Import Libraries
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import supabase from "./supabaseClient.js";
import axios from "axios";
import dayjs from "dayjs";

// Configure dotenv
dotenv.config();
//Initalize Express app
const app = express();
// Apply Middleware
app.use(cors());
app.use(express.json());

//Routes

// Home route
app.get("/", (req, res) => {
  res.send("Backend is working!");
});

// ✅ Football-Data.org uses 'X-Auth-Token' as the header key
const headers = {
  "X-Auth-Token": process.env.FOOTBALL_DATA_API_KEY, // Your Football-Data.org API key
};

// Fetch Fixtures 
app.get("/api/fetch-matches", async (req, res) => {
  try {
    const today = dayjs().format("YYYY-MM-DD"); // Today's date in API format
    const twoWeeksLater = dayjs().add(14, 'day').format("YYYY-MM-DD"); // Two weeks later
    const response = await axios.get("https://api.football-data.org/v4/competitions/PL/matches", {
      headers: {
        "X-Auth-Token": process.env.FOOTBALL_DATA_API_KEY,
      },
      params: {
        status: "SCHEDULED",
        dateFrom: today,
        dateTo: twoWeeksLater,
      }
    });

    // ✅ Clean up the matches before sending to frontend
    const cleanedMatches = response.data.matches.map(match => ({
      id: match.id,
      date: match.utcDate,
      homeTeam: {
        id: match.homeTeam.id,
        name: match.homeTeam.name,
        tla: match.homeTeam.tla,
        crest: match.homeTeam.crest,
      },
      awayTeam: {
        id: match.awayTeam.id,
        name: match.awayTeam.name,
        tla: match.awayTeam.tla,
        crest: match.awayTeam.crest,
      },
    }));


    console.log(cleanedMatches); // ✅ See the cleaned matches

    res.json(cleanedMatches);    // ✅ Send clean matches to frontend/postman
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Failed to fetch matches from Football-Data.org" });
  }
});


app.get("/api/fetch-headtohead", async (req, res) => {
  try {
    const matchId = req.query.matchId;

    if (!matchId) {
      return res.status(400).json({ error: "Missing matchId query parameter." });
    }

    // 1️⃣ First, fetch the details of the match the user clicked
    const matchResponse = await axios.get(`https://api.football-data.org/v4/matches/${matchId}`, {
      headers,
    });

    const clickedMatch = matchResponse.data;

    const originalHomeTeamId = clickedMatch.homeTeam.id;
    const originalAwayTeamId = clickedMatch.awayTeam.id;

    // 2️⃣ Now fetch the full head-to-head history
    const headToHeadResponse = await axios.get(`https://api.football-data.org/v4/matches/${matchId}/head2head`, {
      headers,
      params: {
        limit: 50,
      }
    });

    const data = headToHeadResponse.data;
    const matches = data.matches;

    // ✅ Correctly calculate aggregates with passed team IDs
    const aggregates = calculateAggregates(matches, originalHomeTeamId, originalAwayTeamId);

    // ✅ Clean matches
    const cleanedMatches = matches.map(match => ({
      id: match.id,
      date: match.utcDate,
      homeTeam: {
        id: match.homeTeam.id,
        name: match.homeTeam.name,
        crest: match.homeTeam.crest,
      },
      awayTeam: {
        id: match.awayTeam.id,
        name: match.awayTeam.name,
        crest: match.awayTeam.crest,
      },
      fullTimeScore: {
        home: match.score.fullTime.home,
        away: match.score.fullTime.away,
      },
      winner: match.score.winner,
    }));

    res.json({
      aggregates,
      matches: cleanedMatches,
    });

  } catch (err) {
    console.error("Error fetching head-to-head:", err.message);
    res.status(500).json({ error: "Failed to fetch head-to-head from Football-Data.org" });
  }
});


function calculateAggregates(matches, originalHomeTeamId, originalAwayTeamId) {
  let homeTeamWins = 0;
  let awayTeamWins = 0;
  let draws = 0;
  let totalGoals = 0;

  for (const match of matches) {
    const winner = match.score?.winner;
    const matchHomeTeamId = match.homeTeam?.id;
    const matchAwayTeamId = match.awayTeam?.id;
    const homeGoals = match.score?.fullTime?.home || 0;
    const awayGoals = match.score?.fullTime?.away || 0;

    totalGoals += homeGoals + awayGoals;

    if (winner === "DRAW") {
      draws++;
    } else if (winner === "HOME_TEAM") {
      // ✅ Home team won → who was home?
      if (matchHomeTeamId === originalHomeTeamId) {
        homeTeamWins++;
      } else if (matchHomeTeamId === originalAwayTeamId) {
        awayTeamWins++;
      }
    } else if (winner === "AWAY_TEAM") {
      // ✅ Away team won → who was away?
      if (matchAwayTeamId === originalHomeTeamId) {
        homeTeamWins++;
      } else if (matchAwayTeamId === originalAwayTeamId) {
        awayTeamWins++;
      }
    }
  }

  return {
    numberOfMatches: matches.length,
    totalGoals,
    homeTeamWins,
    awayTeamWins,
    draws,
  };
}


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
