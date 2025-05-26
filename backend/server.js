// Import Libraries
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import supabase from "./supabaseClient.js";
import axios from "axios";
import { v4 as uuidv4 } from 'uuid'; //
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
    const yesterday = dayjs().subtract(1, 'day').format("YYYY-MM-DD"); // Yesterday's date in API format
    const twoWeeksLater = dayjs().add(14, 'day').format("YYYY-MM-DD"); // Two weeks later
    const response = await axios.get("https://api.football-data.org/v4/competitions/PL/matches", {
      headers: {
        "X-Auth-Token": process.env.FOOTBALL_DATA_API_KEY,
      },
      params: {
        dateFrom: yesterday,
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

    res.json(cleanedMatches);    // ✅ Send clean matches to frontend/postman
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Failed to fetch matches from Football-Data.org" });
  }
});




app.get("/api/fetch-standings", async (req, res) => {
  try {
    const matchId = req.query.matchId;

    if (!matchId) {
      return res.status(400).json({ error: "Missing matchId query parameter." });
    }

    // 1️⃣ Fetch match details
    const matchResponse = await axios.get(`https://api.football-data.org/v4/matches/${matchId}`, {
      headers,
    });
    const clickedMatch = matchResponse.data;

    const homeTeamId = clickedMatch.homeTeam.id;
    const awayTeamId = clickedMatch.awayTeam.id;

    // 2️⃣ Fetch standings
    const standingsResponse = await axios.get("https://api.football-data.org/v4/competitions/PL/standings", {
      headers,
    });
    const standings = standingsResponse.data.standings[0].table;

    // 3️⃣ Find both teams
    const homeTeamStats = standings.find(team => team.team.id === homeTeamId);
    const awayTeamStats = standings.find(team => team.team.id === awayTeamId);

    if (!homeTeamStats || !awayTeamStats) {
      return res.status(404).json({ error: "Could not find team stats in standings." });
    }

    // 4️⃣ Calculate strengths
    const homeStrength = calculateTeamStrength(homeTeamStats);
    const awayStrength = calculateTeamStrength(awayTeamStats);

    // 5️⃣ Calculate betting odds
    const odds = calculateBettingOdds(homeStrength, awayStrength);

    // 6️⃣ Respond
    res.json({
      homeTeam: {
        id: homeTeamStats.team.id,
        name: homeTeamStats.team.name,
        crest: homeTeamStats.team.crest,
        playedGames: homeTeamStats.playedGames,
        points: homeTeamStats.points,
        won: homeTeamStats.won,
        draw: homeTeamStats.draw,
        lost: homeTeamStats.lost,
      },
      awayTeam: {
        id: awayTeamStats.team.id,
        name: awayTeamStats.team.name,
        crest: awayTeamStats.team.crest,
        playedGames: awayTeamStats.playedGames,
        points: awayTeamStats.points,
        won: awayTeamStats.won,
        draw: awayTeamStats.draw,
        lost: awayTeamStats.lost,
      },
      odds: {
        homeWin: odds.homeWinOdds,
        draw: odds.drawOdds,
        awayWin: odds.awayWinOdds,
      }
    });

  } catch (err) {
    console.error("Error fetching standings:", err.message);
    res.status(500).json({ error: "Failed to fetch standings or match details." });
  }
});


function calculateTeamStrength(teamStats) {
  const pointsWeight = 0.5;
  const goalDiffWeight = 0.2;
  const winRateWeight = 0.2;
  const formWeight = 0.1;

  const playedGames = teamStats.playedGames || 1; // avoid division by zero
  const winRate = teamStats.won / playedGames;

  // Calculate recent form points
  const formArray = teamStats.form ? teamStats.form.split(",") : [];
  const formPoints = formArray.reduce((sum, result) => {
    if (result === "W") return sum + 3;
    if (result === "D") return sum + 1;
    return sum;
  }, 0);
  const formScore = formPoints / (formArray.length * 3 || 1); // Normalize to 0-1 scale

  // Weighted strength score
  const strength =
    (teamStats.points * pointsWeight) +
    (teamStats.goalDifference * goalDiffWeight) +
    (winRate * 100 * winRateWeight) +
    (formScore * 100 * formWeight);

  return strength;
}


function calculateBettingOdds(homeStrength, awayStrength, drawFactor = 0.25) {
  const totalStrength = homeStrength + awayStrength;

  // Basic probabilities
  let homeWinProb = homeStrength / totalStrength;
  let awayWinProb = awayStrength / totalStrength;

  // Reduce win probabilities to make space for draw chance
  homeWinProb *= (1 - drawFactor);
  awayWinProb *= (1 - drawFactor);
  const drawProb = drawFactor; // fixed draw probability slice

  // Odds are just the inverse
  const homeWinOdds = (1 / homeWinProb).toFixed(2);
  const drawOdds = (1 / drawProb).toFixed(2);
  const awayWinOdds = (1 / awayWinProb).toFixed(2);

  return {
    homeWinOdds: parseFloat(homeWinOdds),
    drawOdds: parseFloat(drawOdds),
    awayWinOdds: parseFloat(awayWinOdds)
  };
}

app.post("/api/place-bet", async (req, res) => {
  const {
    userId,
    matchId,
    user_selection, // ✅ matches your DB column
    user_team,
    amount,
    odds
  } = req.body;

  // ✅ Validate required fields
  if (!userId || !matchId || !user_selection || !user_team || !amount || !odds) {
    return res.status(400).json({ error: "Missing required bet fields." });
  }

  try {
    // 1️⃣ Fetch user to check balance
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("*")
      .eq("id", userId)
      .single();

    if (userError || !user) {
      return res.status(404).json({ error: "User not found." });
    }

    if (user.balance < amount) {
      return res.status(400).json({ error: "Insufficient balance." });
    }

    // 2️⃣ Insert bet into 'bets' table
    const { error: insertError } = await supabase.from("bets").insert({
      user_id: userId,
      match_id: matchId,
      user_selection, // ✅ this is now correct
      user_team,
      amount,
      odds,
      is_settled: false,
      won_amount: null,
      created_at: new Date().toISOString()
    });

    if (insertError) {
      console.error("❌ Error inserting bet:", insertError.message);
      return res.status(500).json({ error: "Failed to place bet." });
    }

    // 3️⃣ Deduct balance from user
    console.log("Updating balance:", user.balance, "-", amount);
    console.log("User ID for update:", userId);
    const { error: updateError } = await supabase
      .from("users")
      .update({ balance: user.balance - amount })
      .eq("id", userId);

    if (updateError) {
      return res.status(500).json({ error: "Bet placed but failed to update balance." });
    }

    // ✅ Success
    res.status(201).json({
      message: "Bet placed successfully.",
      newBalance: user.balance - amount
    });

  } catch (err) {
    console.error("❌ Server error:", err.message);
    res.status(500).json({ error: "Server error placing bet." });
  }
});



const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
