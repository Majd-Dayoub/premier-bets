// Import Libraries
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import supabase from "./supabaseClient.js";

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

//api/predict
app.post("/api/predict", async (req, res) => {
  
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
