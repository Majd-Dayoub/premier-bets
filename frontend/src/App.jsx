import { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import supabase from "../supabaseClient";
import LandingPage from "./pages/LandingPage";
import Home from "./pages/home";
import BetHistory from "./pages/BetHistory";
import NavBar from "./components/NavBar";

function App() {
  const [user, setUser] = useState(null);
  const [userStats, setUserStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const restoreSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user || null);
      setLoading(false);
    };

    restoreSession();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const loadStats = async () => {
      if (!user?.id) {
        setUserStats(null);
        return;
      }

      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("id", user.id)
        .single();

      if (!error) setUserStats(data);
    };

    loadStats();
  }, [user]);

  if (loading) return <div className="text-center mt-20 text-gray-600">Loading...</div>;

  return (
    <Router>
      {/* Show NavBar only when logged in */}
      {user && <NavBar userStats={userStats} />}

      <Routes>
        <Route path="/" element={user ? <Navigate to="/home" /> : <LandingPage />} />
        <Route path="/home" element={user ? <Home /> : <Navigate to="/" />} />
        <Route path="/history" element={user ? <BetHistory /> : <Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;
