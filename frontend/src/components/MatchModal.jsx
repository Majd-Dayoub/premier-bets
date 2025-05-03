import React from "react";
import dayjs from "dayjs";

function MatchModal({ match, onClose }) {
  if (!match) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-center items-center bg-black/30 backdrop-blur-sm">
      {/* Modal container */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-[90%] max-w-md p-6">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-4 text-gray-500 hover:text-red-500 hover:cursor-pointer text-xl font-bold "
        >
          ×
        </button>

        {/* Match Content */}
        <div className="flex justify-between items-center text-center">
          {/* Home Team */}
          <div className="flex flex-col items-center w-1/3">
            <img
              src={match.homeTeam.crest}
              alt={match.homeTeam.name}
              className="w-14 h-14 object-contain mb-2"
            />
            <span className="font-semibold text-sm text-gray-800">{match.homeTeam.name}</span>
          </div>

          {/* VS and Time */}
          <div className="flex flex-col items-center w-1/3">
            <span className="text-gray-500 font-semibold">VS</span>
            <span className="text-xs text-gray-400 mt-2">
              {dayjs(match.date).format("MMM D, h:mm A")}
            </span>
          </div>

          {/* Away Team */}
          <div className="flex flex-col items-center w-1/3">
            <img
              src={match.awayTeam.crest}
              alt={match.awayTeam.name}
              className="w-14 h-14 object-contain mb-2"
            />
            <span className="font-semibold text-sm text-gray-800">{match.awayTeam.name}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MatchModal;
