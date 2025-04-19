import React from "react";
import logo from "/public/logo.png"; // Adjust the path as necessary

function NavBar() {
  return (
    <nav className="bg-white shadow-md px-4 py-3 flex justify-between items-center">
      {/* App name or logo (left side) */}
      <img src={logo} alt="Logo" className="h-30 w-50 mr-2" />

      {/* User balance (right side) */}
      <div className="text-sm font-semibold text-gray-700">
        Balance: <span className="text-green-600">$5000</span>
      </div>
    </nav>
  );
}

export default NavBar;
