import { useEffect, useMemo, useState } from "react";
import api from "../services/api";
import MatchCard from "../components/MatchCard";
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
      // optional: id/tla not in your select, so omit
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
    const fetchBets = async () => {
      try {
        setLoading(true);
        await api.post("/settle-finished", {});
        const res = await api.get("/fetch-bets");
        setBets(res.data?.bets || []);
      } catch (err) {
        console.error("Failed to load bets", {
          message: err.message,
          status: err.response?.status,
          data: err.response?.data,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchBets();
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
                        // optional: show modal with match info
                        // if (matchForCard) setSelectedMatch(matchForCard);
                      }}
                    />
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Optional: reuse your MatchModal for extra info */}
        {selectedMatch && (
          <MatchModal
            match={selectedMatch}
            onClose={() => setSelectedMatch(null)}
            // Bet placement not needed on history page, but the component may require it.
            // If it does, pass a no-op:
            onBetPlaced={() => {}}
          />
        )}
      </div>
    </div>
  );
}

export default BetHistory;
