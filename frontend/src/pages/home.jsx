import { useEffect, useState } from "react";
import api from "../services/api";
import supabase from "../../supabaseClient";
import MatchCard from "../components/MatchCard";
import NavBar from "../components/NavBar";
import MatchModal from "../components/MatchModal";
import dayjs from "dayjs";

function Home() {
  const [matches, setMatches] = useState([]);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [userStats, setUserStats] = useState(null);

  useEffect(() => {
    const fetchMatches = async () => {
      try {
        const res = await api.get("/fetch-matches");
        setMatches(res.data);
      } catch (err) {
        console.error("Failed to load matches", err);
      }
    };

    const fetchUserStats = async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData.session?.user?.id;
      if (!userId) return;

      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("id", userId)
        .single();

      if (error) console.error("Failed to fetch user stats", error);
      else setUserStats(data);
    };

    fetchMatches();
    fetchUserStats();
  }, []);

  return (
    <div className="p-4">
      <div className="flex flex-col min-h-screen bg-gray-100">
        <div className="flex items-center justify-between bg-white p-4 shadow rounded mb-4">
          <h1 className="text-xl font-bold">Premier League Bets</h1>
          {userStats && (
            <div className="flex items-center space-x-4">
              <div>
                <p className="text-sm font-medium">
                  Balance: ${userStats.balance?.toFixed(2)}
                </p>
                <p className="text-sm text-gray-600">
                  Profit: ${userStats.profit?.toFixed(2)}
                </p>
              </div>
              <div className="relative">
                <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center text-white font-bold">
                  {userStats.username?.[0]?.toUpperCase() || "U"}
                </div>
                <button className="absolute top-10 right-0 text-xs text-blue-600 underline">
                  Logout
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="flex-grow bg-gray-50 p-4">
          <h2 className="text-2xl font-bold mb-4">Upcoming Matches</h2>

          <ul className="space-y-4">
            {matches.map((match) => (
              <li
                key={match.id}
                onClick={() => setSelectedMatch(match)}
                className="bg-white shadow p-4 rounded cursor-pointer hover:bg-gray-100"
              >
                <MatchCard match={match} />
              </li>
            ))}
          </ul>
        </div>

        {selectedMatch && (
          <MatchModal
            match={selectedMatch}
            onClose={() => setSelectedMatch(null)}
            onBetPlaced={(newBalance) => {
              setUserStats((prev) => ({
                ...prev,
                balance: newBalance,
              }));
              setSelectedMatch(null); // ✅ close modal
            }}
          />
        )}
      </div>
    </div>
  );
}

export default Home;
