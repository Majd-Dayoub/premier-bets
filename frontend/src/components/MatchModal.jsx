import React, { useEffect, useState } from "react";
import dayjs from "dayjs";
import api from "../services/api";
import supabase from "../../supabaseClient.js";

function MatchModal({ match, onClose, onBetPlaced }) {
  const [extraData, setExtraData] = useState(null);
  const [selectedBet, setSelectedBet] = useState(null);
  const [betAmount, setBetAmount] = useState("");
  const [isPlacingBet, setIsPlacingBet] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const res = await api.get("/fetch-standings", {
          params: { matchId: match.id },
        });
        setExtraData(res.data);
      } catch (err) {
        console.error("Failed to fetch match details", err);
      }
    };

    fetchDetails();
  }, [match]);

  if (!match) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-xl p-6 md:p-8">
        <button
          onClick={onClose}
          className="absolute top-4 right-5 text-gray-400 hover:text-red-500 text-2xl hover:cursor-pointer"
        >
          &times;
        </button>

        {/* Teams and Match Info */}
        <div className="flex items-center justify-between text-center mb-6">
          <div className="flex flex-col items-center w-1/3">
            <img
              src={match.homeTeam.crest}
              alt={match.homeTeam.name}
              className="w-16 h-16 mb-2"
            />
            <span className="text-sm font-semibold text-gray-800 text-center">
              {match.homeTeam.name}
            </span>
          </div>

          <div className="w-1/3 text-center">
            <div className="text-xs text-gray-500 font-medium">VS</div>
            <div className="text-xs mt-2 text-gray-600">
              {dayjs(match.date).format("MMM D, h:mm A")}
            </div>
          </div>

          <div className="flex flex-col items-center w-1/3">
            <img
              src={match.awayTeam.crest}
              alt={match.awayTeam.name}
              className="w-16 h-16 mb-2"
            />
            <span className="text-sm font-semibold text-gray-800 text-center">
              {match.awayTeam.name}
            </span>
          </div>
        </div>

        {/* Match Insights */}
        <div className="bg-gray-50 rounded-xl border p-5">
          <h3 className="text-lg font-bold text-gray-800 mb-3">
            Match Insights
          </h3>

          {!extraData ? (
            <div className="text-sm text-gray-500">Loading stats...</div>
          ) : (
            <div className="space-y-4">
              <div className="text-sm flex flex-col gap-2 text-gray-700">
                <div className="flex justify-between">
                  <div>
                    <span className="font-semibold">
                      {extraData.homeTeam.name}
                    </span>
                    : {extraData.homeTeam.won}W / {extraData.homeTeam.draw}D /{" "}
                    {extraData.homeTeam.lost}L –{" "}
                    <span className="font-medium">
                      {extraData.homeTeam.points} pts
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="font-semibold">
                      {extraData.awayTeam.name}
                    </span>
                    : {extraData.awayTeam.won}W / {extraData.awayTeam.draw}D /{" "}
                    {extraData.awayTeam.lost}L –{" "}
                    <span className="font-medium">
                      {extraData.awayTeam.points} pts
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <div className="font-semibold text-sm text-gray-800 mb-1">
                  Select Your Bet
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => setSelectedBet("homeWin")}
                    className={`py-2 rounded-lg text-sm font-medium transition hover:cursor-pointer ${
                      selectedBet === "homeWin"
                        ? "bg-blue-600 text-white"
                        : "bg-white border border-gray-300 text-gray-800 hover:bg-gray-100 "
                    }`}
                  >
                    Home <br /> {extraData.odds.homeWin}
                  </button>
                  <button
                    onClick={() => setSelectedBet("draw")}
                    className={`py-2 rounded-lg text-sm font-medium transition hover:cursor-pointer ${
                      selectedBet === "draw"
                        ? "bg-blue-600 text-white"
                        : "bg-white border border-gray-300 text-gray-800 hover:bg-gray-100"
                    }`}
                  >
                    Draw <br /> {extraData.odds.draw}
                  </button>
                  <button
                    onClick={() => setSelectedBet("awayWin")}
                    className={`py-2 rounded-lg text-sm font-medium transition hover:cursor-pointer ${
                      selectedBet === "awayWin"
                        ? "bg-blue-600 text-white"
                        : "bg-white border border-gray-300 text-gray-800 hover:bg-gray-100"
                    }`}
                  >
                    Away <br /> {extraData.odds.awayWin}
                  </button>
                </div>
              </div>
              {selectedBet && (
                <div className="mt-4 space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Enter Bet Amount
                  </label>
                  <input
                    type="number"
                    value={betAmount}
                    onChange={(e) => setBetAmount(e.target.value)}
                    placeholder="e.g. 100"
                    className="w-full p-2 border rounded"
                    min={1}
                  />

                  {/* Calculate winnings */}
                  {betAmount > 0 && (
                    <div className="text-sm text-green-700 font-medium">
                      Total Winnings: $
                      {(
                        betAmount *
                        (selectedBet === "homeWin"
                          ? extraData.odds.homeWin
                          : selectedBet === "awayWin"
                          ? extraData.odds.awayWin
                          : extraData.odds.draw)
                      ).toFixed(2)}
                    </div>
                  )}

                  <button
                    className="w-full mt-3 bg-green-600 text-white py-2 rounded hover:bg-green-700 hover:cursor-pointer"
                    onClick={async () => {
                      if (!betAmount || betAmount <= 0) {
                        return alert("Enter a valid bet amount.");
                      }

                      const { data: sessionData } =
                        await supabase.auth.getSession();
                      const userId = sessionData.session?.user?.id;

                      if (!userId) {
                        return alert("You must be logged in to place a bet.");
                      }

                      const body = {
                        userId,
                        matchId: match.id,
                        user_selection: selectedBet,
                        user_team:
                          selectedBet === "homeWin"
                            ? match.homeTeam.name
                            : selectedBet === "awayWin"
                            ? match.awayTeam.name
                            : "Draw",
                        amount: parseFloat(betAmount),
                        odds:
                          selectedBet === "homeWin"
                            ? extraData.odds.homeWin
                            : selectedBet === "awayWin"
                            ? extraData.odds.awayWin
                            : extraData.odds.draw,
                      };

                      try {
                        setIsPlacingBet(true);
                        const res = await api.post("/place-bet", body);
                        const newBalance = res.data.newBalance;
                        if (onBetPlaced) {
                          onBetPlaced(newBalance); // Pass it to parent
                        }
                        setMessage(res.data.message || "Bet placed!");
                        console.log("✅ Bet placed:", res.data);
                      } catch (err) {
                        console.error("❌ Failed to place bet", err);
                        alert(
                          err.response?.data?.error || "Failed to place bet."
                        );
                      } finally {
                        setIsPlacingBet(false);
                      }
                    }}
                  >
                    Place Bet
                  </button>
                  {message && (
                    <div className="text-center text-sm text-green-700 font-medium mt-2">
                      {message}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Debug button (optional: hide in prod) */}
        <div className="mt-4 text-center">
          <button
            onClick={() => console.log("Match + Odds:", { match, extraData })}
            className="text-xs text-blue-600 hover:underline"
          >
            Log Match Data
          </button>
        </div>
      </div>
    </div>
  );
}

export default MatchModal;
