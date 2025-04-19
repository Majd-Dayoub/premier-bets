import { useEffect, useState } from "react";
import api from "../services/api";
import MatchCard from "../components/MatchCard";
import NavBar from "../components/NavBar";

function Home() {
  const [matches, setMatches] = useState([]);

  useEffect(() => {
    const fetchMatches = async () => {
      try {
        const res = await api.get("/fetch-matches");
        setMatches(res.data);
      } catch (err) {
        console.error("Failed to load matches", err);
      }
    };

    fetchMatches();
  }, []);

  return (
    <div className="p-4">
      <div className="flex flex-col min-h-screen bg-gray-100">
      <NavBar />

        <div className="flex-grow bg-gray-50 p-4">
          <h1 className="text-2xl font-bold mb-4">Upcoming Matches</h1>

          <ul className="space-y-4">
            {matches.map((match) => (
              <li key={match.id} className="bg-white shadow p-4 rounded">
                <MatchCard match={match} />
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

export default Home;
