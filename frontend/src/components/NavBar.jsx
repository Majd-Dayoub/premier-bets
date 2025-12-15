import { Link } from "react-router-dom";
import Settings from "../components/Settings";
import logo from "/public/logo.png";

function NavBar({ userStats }) {
  return (
    <nav className="bg-white shadow-md px-4 py-3 flex justify-between items-center">
      <div className="flex items-center gap-6">
        <img src={logo} alt="Logo" className="h-15 w-15" />

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

        <Settings />
      </div>
    </nav>
  );
}

export default NavBar;
