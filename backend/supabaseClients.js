// supabaseClients.js
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Force-load backend/.env no matter what your working directory is
dotenv.config({ path: path.join(__dirname, ".env") });

console.log("ENV CHECK:", {
  SUPABASE_API_URL: process.env.SUPABASE_API_URL,
  hasAnon: !!process.env.SUPABASE_API_Publishable_KEY,
  hasService: !!process.env.SUPABASE_API_Secret_KEY,
});

export const supabasePublic = createClient(
  process.env.SUPABASE_API_URL,
  process.env.SUPABASE_API_Publishable_KEY,
  { auth: { persistSession: false } }
);

export const supabaseAdmin = createClient(
  process.env.SUPABASE_API_URL,
  process.env.SUPABASE_API_Secret_KEY,
  { auth: { persistSession: false } }
);

export function supabaseForUser(accessToken) {
  return createClient(
    process.env.SUPABASE_API_URL,
    process.env.SUPABASE_API_Publishable_KEY,
    {
      auth: { persistSession: false },
      global: { headers: { Authorization: `Bearer ${accessToken}` } },
    }
  );
}
