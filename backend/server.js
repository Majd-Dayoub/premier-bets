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

// Constants and Variables
const STANDINGS_SYNC_COOLDOWN_MINUTES = 0; // 3 hours (tweak)
const COMPETITION_CODE = "PL";
const SYNC_COOLDOWN_MINUTES = 360; // 6 hours (set to what you want)
const MATCHES_LIMIT = 45;

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
    const to = dayjs().add(MATCHES_LIMIT, "day").toISOString();

    const { data, error } = await supabase
      .from("matches")
      .select(`
        match_id,
        utc_date,
        status,
        home_score,
        away_score,
        home_team_id,
        home_team_name,
        home_team_tla,
        home_team_crest,
        away_team_id,
        away_team_name,
        away_team_tla,
        away_team_crest
      `)
      .gte("utc_date", from)
      .lte("utc_date", to)
      .order("utc_date", { ascending: true });

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    // Return same shape frontend already uses + new fields
    const cleanedMatches = (data || []).map((m) => ({
      id: m.match_id,
      date: m.utc_date,
      status: m.status, // ✅ added
      score: {
        home: m.home_score, // ✅ added
        away: m.away_score, // ✅ added
      },
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
    const matchId = Number(req.query.matchId);
    if (!matchId) {
      return res.status(400).json({ error: "Missing matchId query parameter." });
    }

    // 1) Get match from DB (no external match call)
    const { data: matchRow, error: matchErr } = await supabase
      .from("matches")
      .select("match_id, home_team_id, away_team_id")
      .eq("match_id", matchId)
      .maybeSingle();

    if (matchErr) return res.status(500).json({ error: matchErr.message });
    if (!matchRow) return res.status(404).json({ error: "Match not found in DB." });

    const homeTeamId = matchRow.home_team_id;
    const awayTeamId = matchRow.away_team_id;

    // 2) Find latest standings snapshot time from meta
    const { data: meta, error: metaErr } = await supabase
      .from("standings_meta")
      .select("last_synced_at, season_year")
      .eq("competition_code", COMPETITION_CODE)
      .maybeSingle();

    if (metaErr) return res.status(500).json({ error: metaErr.message });

    if (!meta?.last_synced_at) {
      return res.status(503).json({
        error: "Standings not synced yet. Call /api/sync-standings first.",
      });
    }

    // 3) Pull both teams from the latest snapshot
    const { data: teams, error: standErr } = await supabase
      .from("standings_pl")
      .select(`
        team_id, team_name, crest,
        played_games, points, won, draw, lost, goal_difference, form
      `)
      .eq("competition_code", COMPETITION_CODE)
      .eq("season_year", meta.season_year)
      .eq("fetched_at", meta.last_synced_at)
      .in("team_id", [homeTeamId, awayTeamId]);

    if (standErr) return res.status(500).json({ error: standErr.message });

    const homeTeamStats = (teams || []).find(t => t.team_id === homeTeamId);
    const awayTeamStats = (teams || []).find(t => t.team_id === awayTeamId);

    if (!homeTeamStats || !awayTeamStats) {
      return res.status(404).json({
        error: "Could not find team stats in cached standings snapshot.",
      });
    }

    // 4) Calculate strengths + odds (your existing logic)
    const homeStrength = calculateTeamStrength({
      playedGames: homeTeamStats.played_games,
      points: homeTeamStats.points,
      won: homeTeamStats.won,
      draw: homeTeamStats.draw,
      lost: homeTeamStats.lost,
      goalDifference: homeTeamStats.goal_difference,
      form: homeTeamStats.form,
    });

    const awayStrength = calculateTeamStrength({
      playedGames: awayTeamStats.played_games,
      points: awayTeamStats.points,
      won: awayTeamStats.won,
      draw: awayTeamStats.draw,
      lost: awayTeamStats.lost,
      goalDifference: awayTeamStats.goal_difference,
      form: awayTeamStats.form,
    });

    const odds = calculateBettingOdds(homeStrength, awayStrength);

    // 5) Return same response shape your frontend expects
    return res.json({
      homeTeam: {
        id: homeTeamStats.team_id,
        name: homeTeamStats.team_name,
        crest: homeTeamStats.crest,
        playedGames: homeTeamStats.played_games,
        points: homeTeamStats.points,
        won: homeTeamStats.won,
        draw: homeTeamStats.draw,
        lost: homeTeamStats.lost,
      },
      awayTeam: {
        id: awayTeamStats.team_id,
        name: awayTeamStats.team_name,
        crest: awayTeamStats.crest,
        playedGames: awayTeamStats.played_games,
        points: awayTeamStats.points,
        won: awayTeamStats.won,
        draw: awayTeamStats.draw,
        lost: awayTeamStats.lost,
      },
      odds: {
        homeWin: odds.homeWinOdds,
        draw: odds.drawOdds,
        awayWin: odds.awayWinOdds,
      },
      cache: {
        competition: COMPETITION_CODE,
        seasonYear: meta.season_year,
        snapshotAt: meta.last_synced_at,
      },
    });
  } catch (err) {
    console.error("Error fetching standings:", err.message);
    return res.status(500).json({ error: "Failed to fetch cached standings." });
  }
});




function getSeasonStartYear() {
  // Simple EPL season heuristic: Aug-May
  const now = dayjs();
  const month = now.month() + 1; // 1-12
  return month >= 7 ? now.year() : now.year() - 1;
}

app.post("/api/sync-standings", async (req, res) => {
  try {
    const seasonYear = getSeasonStartYear();

    // check meta
    const { data: meta, error: metaErr } = await supabase
      .from("standings_meta")
      .select("last_synced_at, season_year")
      .eq("competition_code", COMPETITION_CODE)
      .maybeSingle();

    if (metaErr) return res.status(500).json({ error: metaErr.message });

    const now = dayjs();
    const lastSync = meta?.last_synced_at ? dayjs(meta.last_synced_at) : null;

    if (
      lastSync &&
      meta?.season_year === seasonYear &&
      now.diff(lastSync, "minute") < STANDINGS_SYNC_COOLDOWN_MINUTES
    ) {
      return res.json({
        message: "Standings sync skipped (cooldown active)",
        lastSyncedAt: meta.last_synced_at,
        seasonYear,
      });
    }

    // 1 external call total
    const standingsResponse = await axios.get(
      `https://api.football-data.org/v4/competitions/${COMPETITION_CODE}/standings`,
      { headers }
    );

    const table = standingsResponse.data?.standings?.[0]?.table || [];
    const fetchedAt = new Date().toISOString();

    const rows = table.map((t) => ({
      competition_code: COMPETITION_CODE,
      season_year: seasonYear,
      fetched_at: fetchedAt,

      team_id: t.team?.id ?? null,
      team_name: t.team?.name ?? null,
      crest: t.team?.crest ?? null,

      position: t.position ?? null,
      played_games: t.playedGames ?? null,
      won: t.won ?? null,
      draw: t.draw ?? null,
      lost: t.lost ?? null,
      points: t.points ?? null,
      goals_for: t.goalsFor ?? null,
      goals_against: t.goalsAgainst ?? null,
      goal_difference: t.goalDifference ?? null,
      form: t.form ?? null,
    })).filter(r => r.team_id != null);

    // Insert as a new snapshot (don’t overwrite old snapshots)
    const { error: insErr } = await supabase
      .from("standings_pl")
      .insert(rows);

    if (insErr) return res.status(500).json({ error: insErr.message });

    // Update meta pointer
    const { error: upMetaErr } = await supabase
      .from("standings_meta")
      .upsert({
        competition_code: COMPETITION_CODE,
        season_year: seasonYear,
        last_synced_at: fetchedAt,
      });

    if (upMetaErr) return res.status(500).json({ error: upMetaErr.message });

    return res.json({
      message: "Standings synced",
      seasonYear,
      fetchedAt,
      count: rows.length,
    });
  } catch (err) {
    console.error(err.message);
    return res.status(500).json({ error: "Failed to sync standings" });
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

  if (!matchId || !user_selection || amount == null || odds == null) {
    return res.status(400).json({ error: "Missing required bet fields." });
  }

  if (!["HOME", "DRAW", "AWAY"].includes(user_selection)) {
    return res.status(400).json({ error: "Invalid user_selection. Use HOME, DRAW, or AWAY." });
  }

  if (user_selection !== "DRAW" && !user_team) {
    return res.status(400).json({ error: "Missing user_team for HOME/AWAY bets." });
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
    const twoWeeksLater = dayjs().add(30, "day").format("YYYY-MM-DD");

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


app.get("/api/fetch-bets", requireAuth, async (req, res) => {
  const userId = req.user.id;

  const { data: bets, error: betErr } = await supabase
    .from("bets")
    .select("id, match_id, user_selection, user_team, amount, odds, is_settled, won_amount, result, settled_at, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (betErr) return res.status(500).json({ error: betErr.message });

  const matchIds = [...new Set((bets || []).map(b => Number(b.match_id)).filter(Boolean))];

  let matchesById = {};
  if (matchIds.length > 0) {
    const { data: matches, error: matchErr } = await supabase
      .from("matches")
      .select("match_id, utc_date, status, home_team_name, home_team_crest, away_team_name, away_team_crest, home_score, away_score")
      .in("match_id", matchIds);

    if (matchErr) return res.status(500).json({ error: matchErr.message });

    matchesById = Object.fromEntries((matches || []).map(m => [m.match_id, m]));
  }

  const enriched = (bets || []).map(b => ({
    ...b,
    match: matchesById[Number(b.match_id)] || null,
  }));

  return res.json({ bets: enriched });
});




app.post("/api/settle-match", async (req, res) => {
  try {
    const { matchId } = req.body;
    if (!matchId) return res.status(400).json({ error: "Missing matchId" });

    const { data, error } = await supabase.rpc("settle_bets_for_match", {
      p_match_id: Number(matchId),
    });

    if (error) return res.status(400).json({ error: error.message });

    return res.json({ message: "Settlement complete", settledCount: data });
  } catch (err) {
    console.error(err.message);
    return res.status(500).json({ error: "Failed to settle match" });
  }
});

// Used in bet history before fetching bets
app.post("/api/settle-finished", async (req, res) => {
  try {
    // Optional override from client, otherwise default window = yesterday -> now
    const { from, to } = req.body || {};

    const fromIso = from
      ? dayjs(from).toISOString()
      : dayjs().subtract(1, "day").toISOString();

    const toIso = to ? dayjs(to).toISOString() : dayjs().toISOString();

    // 1) Find FINISHED matches in window
    const { data: finishedMatches, error: matchErr } = await supabase
      .from("matches")
      .select("match_id, utc_date")
      .eq("status", "FINISHED")
      .gte("utc_date", fromIso)
      .lte("utc_date", toIso);

    if (matchErr) {
      return res.status(500).json({ error: matchErr.message });
    }

    const matchIds = (finishedMatches || []).map((m) => String(m.match_id));

    if (matchIds.length === 0) {
      return res.json({
        message: "No finished matches in time window",
        from: fromIso,
        to: toIso,
        matchesConsidered: 0,
        matchesWithOpenBets: 0,
        totalSettled: 0,
      });
    }

    // 2) Only settle matches that actually have open bets
    const { data: openBetRows, error: betErr } = await supabase
      .from("bets")
      .select("match_id")
      .in("match_id", matchIds)
      .eq("is_settled", false);

    if (betErr) {
      return res.status(500).json({ error: betErr.message });
    }

    const matchesWithOpenBets = [
      ...new Set((openBetRows || []).map((b) => String(b.match_id))),
    ];

    let totalSettled = 0;
    const perMatch = [];

    for (const mid of matchesWithOpenBets) {
      const { data: settledCount, error: settleErr } = await supabase.rpc(
        "settle_bets_for_match",
        { p_match_id: Number(mid) }
      );

      if (settleErr) {
        perMatch.push({ matchId: mid, settledCount: 0, error: settleErr.message });
        continue;
      }

      const countNum = Number(settledCount || 0);
      totalSettled += countNum;
      perMatch.push({ matchId: mid, settledCount: countNum });
    }

    return res.json({
      message: "Settlement run complete",
      from: fromIso,
      to: toIso,
      matchesConsidered: matchIds.length,
      matchesWithOpenBets: matchesWithOpenBets.length,
      totalSettled,
      perMatch,
    });
  } catch (err) {
    console.error(err.message);
    return res.status(500).json({ error: "Failed to settle finished matches" });
  }
});




const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
