import { useEffect, useMemo, useState } from "react";
import api from "../services/api";
import supabase from "../../supabaseClient";
import MatchModal from "../components/MatchModal";
import BetHistoryMatchCard from "../components/BetHistoryMatchCard";

function mapDbMatchToMatchCardShape(dbMatch) {
  if (!dbMatch) return null;

  return {
    id: dbMatch.match_id,
    date: dbMatch.utc_date,
    status: dbMatch.status,
    homeTeam: {
      name: dbMatch.home_team_name,
      crest: dbMatch.home_team_crest,
    },
    awayTeam: {
      name: dbMatch.away_team_name,
      crest: dbMatch.away_team_crest,
    },
    score: {
      home: dbMatch.home_score,
      away: dbMatch.away_score,
    },
  };
}

function BetHistory() {
  const [bets, setBets] = useState([]);
  const [activeTab, setActiveTab] = useState("open"); // "open" | "settled"
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      try {
        setLoading(true);

        // Wait for an authenticated session before calling protected APIs
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session?.access_token) {
          // User not logged in or session not ready yet
          if (isMounted) setBets([]);
          return;
        }

        // Now token will exist and interceptor will attach Authorization
        const r = await api.post("/settle-finished", {});
        console.log("Settled finished matches:", r.data);
        const res = await api.get("/fetch-bets");

        if (isMounted) setBets(res.data?.bets || []);
      } catch (err) {
        console.error("Failed to load bets", {
          message: err.message,
          status: err.response?.status,
          data: err.response?.data,
        });
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    // Run once (in case session already exists)
    load();

    // Also run when auth becomes available (fixes “page loads before session ready”)
    const { data: sub } = supabase.auth.onAuthStateChange(() => {
      load();
    });

    return () => {
      isMounted = false;
      sub?.subscription?.unsubscribe();
    };
  }, []);

  const openBets = useMemo(() => bets.filter((b) => !b.is_settled), [bets]);
  const settledBets = useMemo(() => bets.filter((b) => b.is_settled), [bets]);

  const visibleBets = activeTab === "open" ? openBets : settledBets;

  return (
    <div className="p-4">
      <div className="flex flex-col min-h-screen bg-gray-100">
        <div className="bg-white p-4 shadow rounded mb-4">
          <h1 className="text-xl font-bold">Bet History</h1>

          <div className="mt-4 flex gap-2">
            <button
              onClick={() => setActiveTab("open")}
              className={`px-4 py-2 cursor-pointer rounded ${
                activeTab === "open"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 text-gray-800"
              }`}
            >
              Open ({openBets.length})
            </button>

            <button
              onClick={() => setActiveTab("settled")}
              className={`px-4 py-2 cursor-pointer rounded ${
                activeTab === "settled"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 text-gray-800"
              }`}
            >
              Settled ({settledBets.length})
            </button>
          </div>
        </div>

        <div className="flex-grow bg-gray-50 p-4">
          {loading ? (
            <div className="text-center text-gray-600">Loading bets...</div>
          ) : visibleBets.length === 0 ? (
            <div className="text-center text-gray-600">
              {activeTab === "open"
                ? "No open bets yet."
                : "No settled bets yet."}
            </div>
          ) : (
            <ul className="space-y-4">
              {visibleBets.map((bet) => {
                const matchForCard = mapDbMatchToMatchCardShape(bet.match);

                return (
                  <li key={bet.id}>
                    <BetHistoryMatchCard
                      bet={bet}
                      match={matchForCard}
                      onClick={() => {
                        // optional:
                        // if (matchForCard) setSelectedMatch(matchForCard);
                      }}
                    />
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {selectedMatch && (
          <MatchModal
            match={selectedMatch}
            onClose={() => setSelectedMatch(null)}
            onBetPlaced={() => {}}
          />
        )}
      </div>
    </div>
  );
}

export default BetHistory;
