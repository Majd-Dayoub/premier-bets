import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Settings as SettingsIcon, LogOut } from "lucide-react";
import supabase from "../../supabaseClient";

function Settings() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100 cursor-pointer"
      >
        <SettingsIcon size={18} />
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-44 rounded-md border bg-white shadow-lg">
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-gray-100 cursor-pointer"
          >
            <LogOut size={16} />
            Logout
          </button>
        </div>
      )}
    </div>
  );
}

export default Settings;
