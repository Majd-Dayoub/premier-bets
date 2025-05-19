import { useState } from "react";
import { useNavigate } from "react-router-dom";
import supabase from "../../supabaseClient";

function LandingPage() {
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");

  const navigate = useNavigate();

  const handleLogin = async () => {
    const { error, data } = await supabase.auth.signInWithPassword({
      email: loginEmail,
      password: loginPassword,
    });

    if (error) {
      alert("Login failed: " + error.message);
    } else {
      localStorage.setItem("userId", data.user.id);
      navigate("/home");
    }
  };

  const handleSignup = async () => {
    const { data, error } = await supabase.auth.signUp({
      email: signupEmail,
      password: signupPassword,
    });

    if (error) {
      alert("Sign up failed: " + error.message);
      return;
    }

    // ✅ Create matching profile in users table
    const userId = data?.user?.id;
    if (userId) {
      await supabase.from("users").insert({
        id: userId,
        username: signupEmail, // optional
      });
      alert("Sign-up successful!");
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Login */}
      <div className="flex-1 flex flex-col justify-center items-center p-8 bg-white">
        <h2 className="text-2xl font-bold mb-4">Log In</h2>
        <input
          type="email"
          placeholder="Email"
          value={loginEmail}
          onChange={(e) => setLoginEmail(e.target.value)}
          className="border p-2 rounded w-full max-w-sm mb-3"
        />
        <input
          type="password"
          placeholder="Password"
          value={loginPassword}
          onChange={(e) => setLoginPassword(e.target.value)}
          className="border p-2 rounded w-full max-w-sm mb-4"
        />
        <button
          onClick={handleLogin}
          className="bg-blue-600 text-white px-4 py-2 rounded w-full max-w-sm hover:bg-blue-700"
        >
          Log In
        </button>
      </div>

      {/* Sign Up */}
      <div className="flex-1 flex flex-col justify-center items-center p-8 bg-gray-200">
        <h2 className="text-2xl font-bold mb-4">Create Account</h2>
        <input
          type="email"
          placeholder="Email"
          value={signupEmail}
          onChange={(e) => setSignupEmail(e.target.value)}
          className="border p-2 rounded w-full max-w-sm mb-3"
        />
        <input
          type="password"
          placeholder="Password"
          value={signupPassword}
          onChange={(e) => setSignupPassword(e.target.value)}
          className="border p-2 rounded w-full max-w-sm mb-4"
        />
        <button
          onClick={handleSignup}
          className="bg-green-600 text-white px-4 py-2 rounded w-full max-w-sm hover:bg-green-700"
        >
          Sign Up
        </button>
      </div>
    </div>
  );
}

export default LandingPage;
