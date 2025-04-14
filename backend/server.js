// Import Libraries
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import supabase from "./supabaseClient.js";
import axios from "axios";

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

app.get("/api/status", async (req, res) => {
  try {
    const response = await axios.get("https://v3.football.api-sports.io/status", {
      headers: {
        "x-apisports-key": process.env.FOOTBALL_API_KEY,
      },
    });

    console.log(response.data); // ✅ Log the full API response

    res.json(response.data);    // ✅ Send it back to frontend/postman
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Failed to fetch status from API-Football" });
  }
});



//api/predict
app.get("/api/predict/", async (req, res) => {
  const matchLimit = req.query.limit;
  req.body = { "home_team": "Arsenal", "away_team": "Manchester City" }
  const { home_team, away_team } = req.body;
  const { data, error } = await supabase
    .from("match_history")
    .select("*")
    .limit(4000);
  let slicedData = data.slice(0, matchLimit);
  console.log(req.body)
  console.log(home_team);
  res.json(slicedData);
});

app.post("/api/predict", async (req, res) => {
  const { home_team, away_team } = req.body;
  console.log(req.body)

  if (!home_team || !away_team) {
    return res.status(400).json({ error: "home_team and away_team are required" });
  }

  try {
    // Step 1: Fetch head-to-head matches from Supabase
    const { data: matches, error } = await supabase
      .from("match_history")
      .select("*")
      .or(
        `and(home_team.eq.${home_team},away_team.eq.${away_team}),and(home_team.eq.${away_team},away_team.eq.${home_team})`
      );

    if (error) {
      console.error(error.message);
      return res.status(500).json({ error: "Error fetching matches" });
    }

    console.log("Fetched Matches:", matches); // ✅ Just console.log for now

    // No calculation yet. Just return a dummy success for now
    res.json({ message: "Matches fetched successfully (check server console)" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});


// Test Supabase connection on startup
async function testSupabaseConnection() {
  try {
    const { data, error } = await supabase
      .from("match_history")
      .select("*")
      .limit(1);

    if (error) {
      console.error("❌ Supabase connection failed:", error.message);
    } else if (data.length === 0) {
      console.warn("⚠️ Connected to Supabase, but match_history table is empty.");
    } else {
      console.log("✅ Supabase connection successful!");
      console.log("Sample row:", data[0]);
    }
  } catch (err) {
    console.error("❌ Error testing Supabase connection:", err);
  }
}

testSupabaseConnection();


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
