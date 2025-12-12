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

async function requireAuth(req, res, next) {
  try {
    const auth = req.headers.authorization || "";
    const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;

    if (!token) {
      return res.status(401).json({ error: "Missing Authorization token" });
    }

    // Validate token with Supabase and get the authenticated user
    const { data, error } = await supabase.auth.getUser(token);

    if (error || !data?.user) {
      return res.status(401).json({ error: "Invalid or expired token" });
    }

    req.user = data.user; // <- source of truth
    next();
  } catch (e) {
    return res.status(500).json({ error: "Auth check failed" });
  }
}

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
    const from = dayjs().subtract(1, "day").toISOString();
    const to = dayjs().add(14, "day").toISOString();

    const { data, error } = await supabase
      .from("matches")
      .select(`
        match_id, utc_date,
        home_team_id, home_team_name, home_team_tla, home_team_crest,
        away_team_id, away_team_name, away_team_tla, away_team_crest
      `)
      .gte("utc_date", from)
      .lte("utc_date", to)
      .order("utc_date", { ascending: true });

    if (error) return res.status(500).json({ error: error.message });

    // Return EXACT same shape your frontend expects
    const cleanedMatches = (data || []).map((m) => ({
      id: m.match_id,
      date: m.utc_date,
      homeTeam: {
        id: m.home_team_id,
        name: m.home_team_name,
        tla: m.home_team_tla,
        crest: m.home_team_crest,
      },
      awayTeam: {
        id: m.away_team_id,
        name: m.away_team_name,
        tla: m.away_team_tla,
        crest: m.away_team_crest,
      },
    }));

    return res.json(cleanedMatches);
  } catch (err) {
    console.error(err.message);
    return res.status(500).json({ error: "Failed to fetch matches from DB" });
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

app.post("/api/place-bet", requireAuth, async (req, res) => {
  const userId = req.user.id;
  const { matchId, user_selection, user_team, amount, odds } = req.body;

  if (!matchId || !user_selection || !user_team || amount == null || odds == null) {
    return res.status(400).json({ error: "Missing required bet fields." });
  }
  if (Number(amount) <= 0) {
    return res.status(400).json({ error: "Amount must be greater than 0." });
  }

  try {
    const { data, error } = await supabase.rpc("place_bet_simple", {
      p_user_id: userId,
      p_match_id: matchId,
      p_user_selection: user_selection,
      p_user_team: user_team,
      p_amount: amount,
      p_odds: odds,
    });

    if (error) return res.status(400).json({ error: error.message });

    return res.status(201).json({
      message: "Bet placed successfully.",
      newBalance: data,
    });
  } catch (err) {
    console.error("Server error placing bet:", err.message);
    return res.status(500).json({ error: "Server error placing bet." });
  }
});


app.get("/api/bet-history", requireAuth, async (req, res) => {
  const userId = req.user.id;

  try {
    const { data, error } = await supabase
      .from("bets")
      .select("id, match_id, user_selection, user_team, amount, odds, is_settled, won_amount, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) return res.status(500).json({ error: "Failed to fetch bet history." });

    return res.json({ bets: data });
  } catch (err) {
    console.error("Server error fetching bet history:", err.message);
    return res.status(500).json({ error: "Server error fetching bet history." });
  }
});


const SYNC_COOLDOWN_MINUTES = 360; // 6 hours (set to what you want)

app.post("/api/sync-matches", async (req, res) => {
  try {
    // Check last sync time
    const { data: lastRow, error: lastErr } = await supabase
      .from("matches")
      .select("last_synced_at")
      .order("last_synced_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (lastErr) return res.status(500).json({ error: lastErr.message });

    const now = dayjs();
    const lastSync = lastRow?.last_synced_at ? dayjs(lastRow.last_synced_at) : null;

    if (lastSync && now.diff(lastSync, "minute") < SYNC_COOLDOWN_MINUTES) {
      return res.json({
        message: "Sync skipped (cooldown active)",
        lastSyncedAt: lastRow.last_synced_at,
      });
    }

    const yesterday = dayjs().subtract(1, "day").format("YYYY-MM-DD");
    const twoWeeksLater = dayjs().add(14, "day").format("YYYY-MM-DD");

    const response = await axios.get(
      "https://api.football-data.org/v4/competitions/PL/matches",
      {
        headers: { "X-Auth-Token": process.env.FOOTBALL_DATA_API_KEY },
        params: { dateFrom: yesterday, dateTo: twoWeeksLater },
      }
    );

    const rows = response.data.matches.map((m) => ({
      match_id: m.id,
      utc_date: m.utcDate,
      status: m.status,

      home_team_id: m.homeTeam.id,
      home_team_name: m.homeTeam.name,
      home_team_tla: m.homeTeam.tla,
      home_team_crest: m.homeTeam.crest,

      away_team_id: m.awayTeam.id,
      away_team_name: m.awayTeam.name,
      away_team_tla: m.awayTeam.tla,
      away_team_crest: m.awayTeam.crest,

      home_score: m.score?.fullTime?.home ?? null,
      away_score: m.score?.fullTime?.away ?? null,

      last_synced_at: new Date().toISOString(),
    }));

    const { error: upsertErr } = await supabase
      .from("matches")
      .upsert(rows, { onConflict: "match_id" });

    if (upsertErr) return res.status(500).json({ error: upsertErr.message });

    return res.json({ message: "Matches synced", count: rows.length });
  } catch (err) {
    console.error(err.message);
    return res.status(500).json({ error: "Failed to sync matches" });
  }
});




const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
