import React, { useMemo } from "react";
import dayjs from "dayjs";

function prettySelection(sel) {
  if (sel === "HOME") return "Home";
  if (sel === "AWAY") return "Away";
  if (sel === "DRAW") return "Draw";
  return sel || "—";
}

function getWinner(home, away) {
  if (home == null || away == null) return null;
  if (home > away) return "HOME";
  if (home < away) return "AWAY";
  return "DRAW";
}

function ResultChip({ bet }) {
  if (!bet.is_settled) {
    return (
      <span className="text-xs px-2 py-1 rounded-full border bg-yellow-50 text-yellow-800 border-yellow-200">
        OPEN
      </span>
    );
  }

  const r = (bet.result || "SETTLED").trim().toUpperCase();

  let cls = "bg-gray-50 text-gray-700 border-gray-200";
  if (r === "WON") cls = "bg-green-50 text-green-800 border-green-200";
  if (r === "LOST") cls = "bg-red-50 text-red-800 border-red-200";
  if (r === "VOID") cls = "bg-gray-50 text-gray-700 border-gray-200";

  return (
    <span className={`text-xs px-2 py-1 rounded-full border ${cls}`}>{r}</span>
  );
}

function BetHistoryMatchCard({ bet, match, onClick }) {
  const result = (bet.result || "").trim().toUpperCase();
  const stake = Number(bet.amount || 0);
  const odds = Number(bet.odds || 0);
  const potential = stake * odds;
  const payout = Number(bet.won_amount || 0);

  const homeScore = match?.score?.home ?? null;
  const awayScore = match?.score?.away ?? null;

  const hasScore = homeScore !== null && awayScore !== null;
  const winner = useMemo(
    () => getWinner(homeScore, awayScore),
    [homeScore, awayScore]
  );

  const picked = bet.user_selection; // HOME/DRAW/AWAY
  const pickedLabel = prettySelection(picked);

  const pickedTeamLabel = useMemo(() => {
    if (picked === "DRAW") return "Draw";
    return bet.user_team || "—";
  }, [picked, bet.user_team]);

  const isPickedWinner = useMemo(() => {
    if (!bet.is_settled) return false;
    return result === "WON";
  }, [bet.is_settled, result]);

  const settledAt = bet.settled_at ? dayjs(bet.settled_at) : null;

  // Winner highlight
  const homeWinner = winner === "HOME";
  const awayWinner = winner === "AWAY";
  const drawWinner = winner === "DRAW";
  console.log("DEBUG:", {
    is_settled: bet.is_settled,
    rawResult: bet.result,
    normalizedResult: result,
  });

  return (
    <div
      onClick={onClick}
      className="bg-white shadow rounded-xl px-4 py-4 hover:bg-gray-50 transition cursor-pointer"
    >
      {/* Top row: Date + status/result */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="mt-1 flex items-center gap-2">
            <ResultChip bet={bet} />
            {bet.is_settled && settledAt ? (
              <span className="text-xs text-gray-400">
                Settled {settledAt.format("MMM D, h:mm A")}
              </span>
            ) : null}
          </div>
        </div>

        {/* Payout box */}
        <div className="text-right">
          <div className="text-xs text-gray-500">
            {bet.is_settled ? "Payout" : "Potential"}
          </div>
          <div
            className={`text-2xl font-extrabold leading-none ${
              bet.is_settled
                ? result === "WON"
                  ? "text-green-700"
                  : result === "VOID"
                  ? "text-gray-700"
                  : "text-red-700"
                : "text-gray-900"
            }`}
          >
            ${bet.is_settled ? payout.toFixed(2) : potential.toFixed(2)}
          </div>
          {bet.is_settled ? (
            <div className="text-xs text-gray-500 mt-1">
              Stake ${stake.toFixed(2)} · Odds {odds.toFixed(2)}
            </div>
          ) : (
            <div className="text-xs text-gray-500 mt-1">
              Stake ${stake.toFixed(2)} · Odds {odds.toFixed(2)}
            </div>
          )}
        </div>
      </div>

      {/* Teams + score */}
      <div className="mt-4 flex items-center justify-between gap-3">
        {/* Home */}
        <div
          className={`flex items-center gap-3 w-5/12 min-w-0 rounded-lg p-2 ${
            hasScore && homeWinner ? "bg-green-50" : ""
          }`}
        >
          {match?.homeTeam?.crest ? (
            <img
              src={match.homeTeam.crest}
              alt={match.homeTeam.name}
              className="w-10 h-10 object-contain"
            />
          ) : null}
          <div className="min-w-0">
            <div
              className={`text-sm font-semibold truncate ${
                hasScore && homeWinner ? "text-green-800" : "text-gray-800"
              }`}
            >
              {match?.homeTeam?.name || "Home"}
            </div>
            {hasScore && homeWinner ? (
              <div className="text-xs text-green-700 font-medium">Winner</div>
            ) : (
              <div className="text-xs text-gray-500">Home</div>
            )}
          </div>
        </div>

        {/* Center score */}
        <div className="w-2/12 text-center">
          {hasScore ? (
            <div className="inline-flex flex-col items-center">
              <div className="text-xl font-extrabold text-gray-900">
                {homeScore} <span className="text-gray-400">-</span> {awayScore}
              </div>
              {drawWinner ? (
                <span className="mt-1 text-xs px-2 py-0.5 rounded-full border bg-gray-50 text-gray-700 border-gray-200">
                  DRAW
                </span>
              ) : null}
            </div>
          ) : (
            <div className="text-xs px-2 py-1 rounded-full border bg-blue-50 text-blue-800 border-blue-200">
              {match?.status || "—"}
            </div>
          )}
        </div>

        {/* Away */}
        <div
          className={`flex items-center justify-end gap-3 w-5/12 min-w-0 rounded-lg p-2 ${
            hasScore && awayWinner ? "bg-green-50" : ""
          }`}
        >
          <div className="min-w-0 text-right">
            <div
              className={`text-sm font-semibold truncate ${
                hasScore && awayWinner ? "text-green-800" : "text-gray-800"
              }`}
            >
              {match?.awayTeam?.name || "Away"}
            </div>
            {hasScore && awayWinner ? (
              <div className="text-xs text-green-700 font-medium">Winner</div>
            ) : (
              <div className="text-xs text-gray-500">Away</div>
            )}
          </div>
          {match?.awayTeam?.crest ? (
            <img
              src={match.awayTeam.crest}
              alt={match.awayTeam.name}
              className="w-10 h-10 object-contain"
            />
          ) : null}
        </div>
      </div>

      {/* Bet summary */}
      <div className="mt-4 flex items-center justify-between gap-3">
        <div className="text-sm text-gray-700">
          <span className="text-gray-500">You picked:</span>{" "}
          <span className="font-semibold text-gray-900">{pickedLabel}</span>{" "}
          <span className="text-gray-400">({pickedTeamLabel})</span>
        </div>

        {bet.is_settled ? (
          <div className="flex items-center gap-2">
            {result === "WON" ? (
              <span className="text-xs px-2 py-1 rounded-full bg-green-600 text-white font-semibold">
                WIN
              </span>
            ) : result === "VOID" ? (
              <span className="text-xs px-2 py-1 rounded-full bg-gray-700 text-white font-semibold">
                VOID
              </span>
            ) : (
              <span className="text-xs px-2 py-1 rounded-full bg-red-600 text-white font-semibold">
                LOSS
              </span>
            )}
          </div>
        ) : (
          <div className="text-xs text-gray-500">
            Potential shown at top right
          </div>
        )}
      </div>
    </div>
  );
}

export default BetHistoryMatchCard;
