import React from "react";
import dayjs from "dayjs";

function isBettable(match) {
  return match.status === "SCHEDULED" || match.status === "TIMED";
}

function statusLabel(status) {
  if (status === "FINISHED") return "Finished";
  return status || "";
}

function MatchCard({ match, showStatus = false }) {
  const bettable = isBettable(match);

  return (
    <div
      className={`
        bg-white shadow-md rounded-xl px-4 py-5 transition
        ${bettable ? "hover:bg-green-300" : "opacity-60"}
      `}
    >
      <div className="flex justify-between items-center text-center">
        {/* Home Team */}
        <div className="flex flex-col items-center w-1/3">
          {match.homeTeam.crest && (
            <img
              src={match.homeTeam.crest}
              alt={match.homeTeam.name}
              className="w-12 h-12 object-contain mb-2"
            />
          )}
          <span className="font-medium text-sm text-gray-800">
            {match.homeTeam.name}
          </span>
        </div>

        {/* Match Info */}
        <div className="flex flex-col items-center w-1/3">
          <span className="text-gray-500 font-semibold text-xs mb-1">VS</span>

          {/* Date always visible */}
          <span className="text-[12px] text-gray-400">
            {dayjs(match.date).format("MMM D, h:mm A")}
          </span>

          {/* Status shown under date when not bettable */}
          {!bettable && (
            <span className="mt-1 text-[11px] font-semibold uppercase text-gray-500">
              {statusLabel(match.status)}
            </span>
          )}
        </div>

        {/* Away Team */}
        <div className="flex flex-col items-center w-1/3">
          {match.awayTeam.crest && (
            <img
              src={match.awayTeam.crest}
              alt={match.awayTeam.name}
              className="w-12 h-12 object-contain mb-2"
            />
          )}
          <span className="font-medium text-sm text-gray-800">
            {match.awayTeam.name}
          </span>
        </div>
      </div>
    </div>
  );
}

export default MatchCard;
