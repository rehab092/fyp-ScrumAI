import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "../contexts/AuthContext";
import Navbar from "../components/Navbar";
// import { API_ENDPOINTS, apiRequest } from "../config/api"; // TODO: Uncomment when backend is ready

export default function Login() {
  const navigate = useNavigate();
  const { login, getRedirectPath } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (!formData.email.trim() || !formData.password.trim()) {
        throw new Error("Email and password are required");
      }

      // TODO: Uncomment this when backend is ready
      // API call to backend for authentication
      // const response = await apiRequest(API_ENDPOINTS.auth.login, {
      //   method: 'POST',
      //   body: JSON.stringify({
      //     email: formData.email,
      //     password: formData.password,
      //   }),
      // });
      // 
      // const { user, token } = response;
      // localStorage.setItem('authToken', token);
      // const redirectPath = getRedirectPath(user.role);
      // navigate(redirectPath);

      // TEMPORARY: Mock authentication - Remove when backend is ready
      let role = "teamMember"; // Default role
      if (formData.email === "scrum@scrumai.com") {
        role = "scrumMaster";
      } else if (formData.email === "owner@scrumai.com") {
        role = "productOwner";
      }

      const user = await login(formData.email, formData.password, role);
      const redirectPath = getRedirectPath(user.role);
      navigate(redirectPath);
    } catch (err) {
      setError(err.message || "Login failed. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gradient-to-br from-background via-surface to-surfaceDark flex pt-20">
        {/* Left Side - ScrumAI Info */}
        <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary/5 to-secondary/5 p-12 flex-col justify-center">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-lg"
          >
            <div className="mb-8">
              <h1 className="text-4xl font-bold text-primary mb-4">
                Welcome to <span className="text-secondary">ScrumAI</span>
              </h1>
              <p className="text-xl text-textSecondary leading-relaxed">
                Transform your agile workflow with intelligent automation and AI-powered insights.
              </p>
            </div>

            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                  <span className="text-2xl">🤖</span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-textPrimary mb-2">AI-Powered Planning</h3>
                  <p className="text-textSecondary">Smart sprint planning with intelligent task allocation and dependency management.</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-secondary/10 rounded-xl flex items-center justify-center">
                  <span className="text-2xl">📊</span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-textPrimary mb-2">Real-time Analytics</h3>
                  <p className="text-textSecondary">Monitor team performance, velocity, and project health with comprehensive dashboards.</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center">
                  <span className="text-2xl">⚡</span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-textPrimary mb-2">Predictive Insights</h3>
                  <p className="text-textSecondary">Get early warnings about potential delays and receive actionable recommendations.</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Right Side - Login Form */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="w-full max-w-md"
          >
            <div className="bg-white/95 backdrop-blur-md border border-border rounded-3xl p-8 shadow-xl">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-textPrimary mb-2">Welcome Back</h2>
                <p className="text-textSecondary">
                  Sign in to your ScrumAI workspace
                </p>
              </div>

              <form className="space-y-6" onSubmit={handleSubmit}>
                {error && (
                  <div className="bg-error/10 border border-error/20 rounded-xl p-4">
                    <p className="text-error text-sm">{error}</p>
                  </div>
                )}

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-textPrimary mb-2">
                      Email address
                    </label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-4 py-3 border border-border rounded-xl focus:ring-2 focus:ring-primary/30 focus:border-primary bg-background text-textPrimary transition-all"
                      placeholder="Enter your email"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-textPrimary mb-2">
                      Password
                    </label>
                    <input
                      type="password"
                      required
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="w-full px-4 py-3 border border-border rounded-xl focus:ring-2 focus:ring-primary/30 focus:border-primary bg-background text-textPrimary transition-all"
                      placeholder="Enter your password"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className={`w-full py-3 px-4 rounded-xl font-semibold transition-all ${
                    loading
                      ? "bg-textMuted text-background cursor-not-allowed"
                      : "bg-primary text-white hover:bg-primaryDark shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                  }`}
                >
                  {loading ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                      Signing in...
                    </div>
                  ) : (
                    "Login"
                  )}
                </button>

                <div className="text-center">
                  <p className="text-textSecondary text-sm">
                    Don't have an account?{" "}
                    <button
                      type="button"
                      onClick={() => navigate('/signup')}
                      className="text-primary hover:text-primaryDark font-medium transition-colors"
                    >
                      Sign up
                    </button>
                  </p>
                </div>
              </form>
            </div>
          </motion.div>
        </div>
      </div>
    </>
  );
}
