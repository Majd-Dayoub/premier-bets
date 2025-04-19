import React from "react";
import dayjs from "dayjs";

function MatchCard({ match }) {
  return (
    <div className="bg-white shadow-md rounded-xl px-4 py-5 transition-shadow hover:cursor-pointer hover:bg-green-300 min-h-[140px] w-[350px]">
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
          <span className="text-[12px] text-gray-400">
            {dayjs(match.date).format("MMM D, h:mm A")}
          </span>
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
