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

  const groupedMatches = matches.reduce((acc, match) => {
    const dateKey = dayjs(match.date).format("YYYY-MM-DD"); // group key
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(match);
    return acc;
  }, {});

  const sortedDateKeys = Object.keys(groupedMatches).sort((a, b) =>
    dayjs(a).isAfter(dayjs(b)) ? 1 : -1
  );
  useEffect(() => {
    const fetchMatches = async () => {
      try {
        // 1) triggers sync, but will usually SKIP due to cooldown
        await api.post("/sync-matches");

        // 2) always reads from your DB-backed /fetch-matches
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
        <div className="flex-grow bg-gray-50 p-4">
          <h2 className="text-2xl font-bold mb-4">Upcoming Matches</h2>

          <div className="space-y-8">
            {sortedDateKeys.map((dateKey) => (
              <div key={dateKey}>
                <h3 className="text-lg font-bold text-gray-700 mb-3">
                  {dayjs(dateKey).format("MMMM D, YYYY")}
                </h3>

                <ul className="space-y-4">
                  {groupedMatches[dateKey].map((match) => (
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
            ))}
          </div>
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
