import { useEffect, useMemo, useState } from "react";
import api from "../services/api";
import MatchCard from "../components/MatchCard";
import MatchModal from "../components/MatchModal";

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
              className={`px-4 py-2 rounded ${
                activeTab === "open"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 text-gray-800"
              }`}
            >
              Open ({openBets.length})
            </button>

            <button
              onClick={() => setActiveTab("settled")}
              className={`px-4 py-2 rounded ${
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
                  <li
                    key={bet.id}
                    /*onClick={() =>
                      matchForCard && setSelectedMatch(matchForCard)
                    }*/
                    className="bg-white shadow p-4 rounded cursor-pointer hover:bg-gray-100"
                  >
                    {/* Match header (using your existing component) */}
                    {matchForCard ? (
                      <MatchCard match={matchForCard} />
                    ) : (
                      <div className="text-sm text-gray-600">
                        Match data not available (match_id: {bet.match_id})
                      </div>
                    )}

                    {/* Bet details */}
                    <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                      <div>
                        <div className="text-gray-500">Selection</div>
                        <div className="font-medium">{bet.user_selection}</div>
                      </div>

                      <div>
                        <div className="text-gray-500">Stake</div>
                        <div className="font-medium">
                          ${Number(bet.amount).toFixed(2)}
                        </div>
                      </div>

                      <div>
                        <div className="text-gray-500">Odds</div>
                        <div className="font-medium">
                          {Number(bet.odds).toFixed(2)}
                        </div>
                      </div>

                      <div>
                        <div className="text-gray-500">
                          {bet.is_settled ? "Payout" : "Potential"}
                        </div>
                        <div className="font-medium">
                          {bet.is_settled
                            ? `$${Number(bet.won_amount || 0).toFixed(2)}`
                            : `$${(
                                Number(bet.amount) * Number(bet.odds)
                              ).toFixed(2)}`}
                        </div>
                      </div>
                    </div>

                    {/* Status line */}
                    <div className="mt-2 text-sm">
                      {bet.is_settled ? (
                        <span className="text-green-700 font-medium">
                          Settled
                        </span>
                      ) : (
                        <span className="text-yellow-700 font-medium">
                          Open
                        </span>
                      )}
                    </div>
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
