import { useState } from "react";
import { useNavigate } from "react-router-dom";
import supabase from "../../supabaseClient";
import logo from "/public/logo.png";

function LandingPage() {
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [showSignup, setShowSignup] = useState(false);
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
    const userId = data?.user?.id;
    if (userId) {
      await supabase.from("users").insert({
        id: userId,
        email: signupEmail,
      });
      alert("Sign-up successful!");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-5 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <img src={logo} alt="Premier League Betting Simulator" className="h-14 w-14 object-contain" />
              <div>
                <h1 className="text-xl font-bold text-gray-900">Premier League Betting</h1>
                <p className="text-xs text-green-600 font-medium">Risk-Free Simulator</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-6xl">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left side - Hero content */}
            <div className="space-y-8">
              <div className="space-y-4">
                <div className="inline-block px-4 py-1 bg-green-100 rounded-full">
                  <span className="text-sm font-semibold text-green-700">100% Risk-Free Practice</span>
                </div>
                <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
                  Master Premier League Betting
                </h1>
                <p className="text-xl text-gray-600 leading-relaxed">
                  Practice your betting strategies with virtual currency. Learn to analyze matches, understand odds, and develop winning strategies without risking real money.
                </p>
              </div>
              
              <div className="space-y-5 pt-2">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">Virtual Currency System</h3>
                    <p className="text-gray-600 mt-1">Start with £10,000 virtual money and build your bankroll through smart betting decisions</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">Real Match Data & Odds</h3>
                    <p className="text-gray-600 mt-1">Practice with actual Premier League fixtures, teams, and realistic betting odds</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">Track Your Performance</h3>
                    <p className="text-gray-600 mt-1">Analyze your betting history, win rates, and ROI to improve your strategies</p>
                  </div>
                </div>
              </div>

              <div className="pt-4">
                <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-xl p-6 border border-green-200">
                  <p className="text-sm text-gray-700 leading-relaxed">
                    <span className="font-bold text-green-700">Educational Tool:</span> This simulator is designed for learning and entertainment. Practice responsible betting strategies in a safe environment before considering real betting platforms.
                  </p>
                </div>
              </div>
            </div>

            {/* Right side - Auth form */}
            <div className="bg-white rounded-2xl shadow-2xl p-10 border border-gray-100">
              {!showSignup ? (
                // Login Form
                <div className="space-y-6">
                  <div className="text-center space-y-2">
                    <h2 className="text-3xl font-bold text-gray-900">Welcome Back</h2>
                    <p className="text-gray-600">Sign in to continue your betting journey</p>
                  </div>

                  <div className="space-y-5">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Email Address
                      </label>
                      <input
                        type="email"
                        placeholder="your.email@example.com"
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100 transition"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Password
                      </label>
                      <input
                        type="password"
                        placeholder="Enter your password"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100 transition"
                      />
                    </div>

                    <button
                      onClick={handleLogin}
                      className="w-full bg-green-600 text-white py-4 px-4 rounded-lg font-bold text-lg hover:bg-green-700 transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
                    >
                      Sign In
                    </button>
                  </div>

                  <div className="text-center pt-6 border-t border-gray-200">
                    <p className="text-gray-600">
                      New to the platform?{" "}
                      <button
                        onClick={() => setShowSignup(true)}
                        className="text-green-600 font-bold cursor-pointer hover:text-green-700 hover:underline transition"
                      >
                        Create your free account
                      </button>
                    </p>
                  </div>
                </div>
              ) : (
                // Signup Form
                <div className="space-y-6">
                  <div className="text-center space-y-2">
                    <h2 className="text-3xl font-bold text-gray-900">Start Your Journey</h2>
                    <p className="text-gray-600">Create your account and get £10,000 virtual currency</p>
                  </div>

                  <div className="space-y-5">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Email Address
                      </label>
                      <input
                        type="email"
                        placeholder="your.email@example.com"
                        value={signupEmail}
                        onChange={(e) => setSignupEmail(e.target.value)}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100 transition"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Password
                      </label>
                      <input
                        type="password"
                        placeholder="Create a strong password"
                        value={signupPassword}
                        onChange={(e) => setSignupPassword(e.target.value)}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100 transition"
                      />
                    </div>

                    <button
                      onClick={handleSignup}
                      className="w-full bg-green-600 text-white py-4 px-4 rounded-lg font-bold text-lg hover:bg-green-700 transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
                    >
                      Create Free Account
                    </button>
                  </div>

                  <div className="text-center pt-6 border-t border-gray-200">
                    <p className="text-gray-600">
                      Already have an account?{" "}
                      <button
                        onClick={() => setShowSignup(false)}
                        className="text-green-600 font-bold cursor-pointer hover:text-green-700 hover:underline transition"
                      >
                        Sign in here
                      </button>
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LandingPage;