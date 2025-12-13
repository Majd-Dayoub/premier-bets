import { useEffect, useMemo, useState } from "react";
import api from "../services/api";
import supabase from "../../supabaseClient";
import MatchCard from "../components/MatchCard";
import MatchModal from "../components/MatchModal";
import DateSlider from "../components/DateSlider";
import dayjs from "dayjs";

function Home() {
  const [matches, setMatches] = useState([]);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [userStats, setUserStats] = useState(null);

  const groupedMatches = useMemo(() => {
    return matches.reduce((acc, match) => {
      const dateKey = dayjs(match.date).format("YYYY-MM-DD");
      if (!acc[dateKey]) acc[dateKey] = [];
      acc[dateKey].push(match);
      return acc;
    }, {});
  }, [matches]);

  const sortedDateKeys = useMemo(() => {
    return Object.keys(groupedMatches).sort((a, b) =>
      dayjs(a).isAfter(dayjs(b)) ? 1 : -1
    );
  }, [groupedMatches]);

  const [selectedDate, setSelectedDate] = useState(null);

  // Pick a good default date once matches load
  useEffect(() => {
    if (!sortedDateKeys.length) return;

    const today = dayjs().format("YYYY-MM-DD");

    // Prefer today if it exists, otherwise nearest future date, otherwise first
    const exactToday = sortedDateKeys.find((d) => d === today);
    const nextUpcoming = sortedDateKeys.find((d) => dayjs(d).isAfter(today));
    const defaultDate = exactToday || nextUpcoming || sortedDateKeys[0];

    setSelectedDate((prev) => prev ?? defaultDate);
  }, [sortedDateKeys]);

  const visibleMatches = selectedDate ? groupedMatches[selectedDate] || [] : [];

  useEffect(() => {
    const fetchMatches = async () => {
      try {
        await api.post("/sync-matches");
        await api.post("/sync-standings");

        const res = await api.get("/fetch-matches");
        setMatches(res.data);
      } catch (err) {
        console.error("Failed to load matches", err);
      }
    };

    const fetchUserStats = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      console.log("session", session);

      if (!session?.user?.id) {
        console.warn("No session yet. User not logged in.");
        return;
      }

      const userId = session.user.id;

      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("id", userId)
        .maybeSingle(); // important

      if (error) {
        console.error("Failed to fetch user stats", error);
        return;
      }

      if (!data) {
        console.warn("No users row found for this user. It must be created.");
        return;
      }

      setUserStats(data);
    };

    fetchMatches();
    fetchUserStats();
  }, []);

  return (
    <div className="p-4">
      <div className="flex flex-col min-h-screen bg-gray-100">
        <div className="flex-grow bg-gray-50 p-4">
          <h2 className="text-2xl font-bold mb-4">Upcoming Matches</h2>

          <DateSlider
            dateKeys={sortedDateKeys}
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
          />

          {selectedDate && (
            <h3 className="text-lg font-bold text-gray-700 mb-3">
              {dayjs(selectedDate).format("MMMM D, YYYY")}
            </h3>
          )}

          <ul className="space-y-4">
            {visibleMatches.map((match) => (
              <li
                key={match.id}
                onClick={() => {
                  if (
                    match.status === "SCHEDULED" ||
                    match.status === "TIMED"
                  ) {
                    setSelectedMatch(match);
                  }
                }}
                className="bg-white shadow p-4 rounded cursor-pointer hover:bg-gray-100"
              >
                <MatchCard match={match} />
              </li>
            ))}
          </ul>

          {selectedDate && visibleMatches.length === 0 && (
            <div className="text-sm text-gray-600 mt-4">
              No matches scheduled for this date.
            </div>
          )}
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
              setSelectedMatch(null);
            }}
          />
        )}
      </div>
    </div>
  );
}

export default Home;
