import { useEffect, useState } from "react";
import api from "../services/api";

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
      <h1 className="text-2xl font-bold mb-4">Upcoming Matches</h1>
      <ul className="space-y-4">
        {matches.map(match => (
          <li key={match.id} className="bg-white shadow p-4 rounded">
            <div className="flex justify-between items-center">
              <span>{match.homeTeam.name}</span>
              <span className="text-gray-500">vs<span>{match.date}</span></span>
              <span>{match.awayTeam.name}</span>
              
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default Home;
