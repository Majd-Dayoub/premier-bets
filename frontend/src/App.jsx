import { useEffect, useState } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import supabase from "../supabaseClient";
import LandingPage from "./pages/LandingPage";
import Home from "./pages/home";
function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // to avoid flashing LandingPage

  useEffect(() => {
    const restoreSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setUser(session?.user || null);
      setLoading(false);
    };

    restoreSession();

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user || null);
      }
    );

    return () => listener.subscription.unsubscribe();
  }, []);

  if (loading)
    return <div className="text-center mt-20 text-gray-600">Loading...</div>;

  return (
    <Router>
      <Routes>
        <Route
          path="/"
          element={user ? <Navigate to="/home" /> : <LandingPage />}
        />
        <Route path="/home" element={user ? <Home /> : <Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;
