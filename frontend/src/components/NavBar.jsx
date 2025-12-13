import { Link, useNavigate } from "react-router-dom";
import supabase from "../../supabaseClient";
import logo from "/public/logo.png";

function NavBar({ userStats }) {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  return (
    <nav className="bg-white shadow-md px-4 py-3 flex justify-between items-center">
      <div className="flex items-center gap-6">
        <img src={logo} alt="Logo" className="h-10 w-auto" />

        <Link to="/home" className="text-gray-700 font-medium hover:text-blue-600">
          Home
        </Link>

        <Link to="/history" className="text-gray-700 font-medium hover:text-blue-600">
          Bet History
        </Link>
      </div>

      <div className="flex items-center gap-4">
        <div className="text-sm font-semibold text-gray-700">
          Balance:{" "}
          <span className="text-green-600">
            ${Number(userStats?.balance ?? 0).toFixed(2)}
          </span>
        </div>

        <button onClick={handleLogout} className="text-sm text-red-600 hover:underline">
          Logout
        </button>
      </div>
    </nav>
  );
}

export default NavBar;
