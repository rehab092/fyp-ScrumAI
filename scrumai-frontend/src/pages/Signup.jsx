import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "../contexts/AuthContext";
import Navbar from "../components/Navbar";
// import { API_ENDPOINTS, apiRequest } from "../config/api"; // TODO: Uncomment when backend is ready

export default function Signup() {
  const navigate = useNavigate();
  const { signup, getRedirectPath } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "teamMember", // Default role for signup
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (!formData.name.trim() || !formData.email.trim() || !formData.password.trim()) {
        throw new Error("All fields are required");
      }

      if (formData.password !== formData.confirmPassword) {
        throw new Error("Passwords do not match");
      }

      if (formData.password.length < 6) {
        throw new Error("Password must be at least 6 characters");
      }

      // TODO: Uncomment this when backend is ready
      // API call to backend for user registration
      // const response = await apiRequest(API_ENDPOINTS.auth.signup, {
      //   method: 'POST',
      //   body: JSON.stringify({
      //     name: formData.name,
      //     email: formData.email,
      //     password: formData.password,
      //     role: formData.role,
      //   }),
      // });
      // 
      // const { user, token } = response;
      // localStorage.setItem('authToken', token);
      // const redirectPath = getRedirectPath(user.role);
      // navigate(redirectPath);

      // TEMPORARY: Mock signup - Remove when backend is ready
      const user = await signup(formData.name, formData.email, formData.password, formData.role);
      const redirectPath = getRedirectPath(user.role);
      navigate(redirectPath);
    } catch (err) {
      setError(err.message || "Signup failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gradient-to-br from-background via-surface to-surfaceDark flex pt-20">
        {/* Left Side - ScrumAI Info */}
        <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-secondary/5 to-primary/5 p-12 flex-col justify-center">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-lg"
          >
            <div className="mb-8">
              <h1 className="text-4xl font-bold text-secondary mb-4">
                Join <span className="text-primary">ScrumAI</span>
              </h1>
              <p className="text-xl text-textSecondary leading-relaxed">
                Start your agile transformation journey with intelligent project management.
              </p>
            </div>

            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-secondary/10 rounded-xl flex items-center justify-center">
                  <span className="text-2xl">🚀</span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-textPrimary mb-2">Boost Productivity</h3>
                  <p className="text-textSecondary">Increase team velocity by 40% with AI-optimized sprint planning and task allocation.</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                  <span className="text-2xl">🎯</span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-textPrimary mb-2">Smart Insights</h3>
                  <p className="text-textSecondary">Get predictive analytics and early warnings to keep your projects on track.</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center">
                  <span className="text-2xl">👥</span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-textPrimary mb-2">Team Collaboration</h3>
                  <p className="text-textSecondary">Seamless collaboration tools designed for modern agile teams.</p>
                </div>
              </div>
            </div>

            <div className="mt-8 p-6 bg-background/50 border border-border/50 rounded-2xl">
              <h4 className="text-lg font-semibold text-textPrimary mb-3">Why Choose ScrumAI?</h4>
              <ul className="space-y-2 text-textSecondary">
                <li className="flex items-center gap-2">
                  <span className="text-success">✓</span>
                  <span>14-day free trial</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-success">✓</span>
                  <span>No credit card required</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-success">✓</span>
                  <span>24/7 customer support</span>
                </li>
              </ul>
            </div>
          </motion.div>
        </div>

        {/* Right Side - Signup Form */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="w-full max-w-md"
          >
            <div className="bg-background/90 backdrop-blur-md border border-border rounded-3xl p-8 shadow-soft">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-textPrimary mb-2">Create Account</h2>
                <p className="text-textSecondary">
                  Start your agile transformation journey
                </p>
              </div>

              <form className="space-y-5" onSubmit={handleSubmit}>
                {error && (
                  <div className="bg-error/10 border border-error/20 rounded-xl p-4">
                    <p className="text-error text-sm">{error}</p>
                  </div>
                )}

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-textPrimary mb-2">
                      Full name
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-4 py-3 border border-border rounded-xl focus:ring-2 focus:ring-primary/30 focus:border-primary bg-background text-textPrimary transition-all"
                      placeholder="Enter your full name"
                    />
                  </div>

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
                      placeholder="Create a password"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-textPrimary mb-2">
                      Confirm password
                    </label>
                    <input
                      type="password"
                      required
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                      className="w-full px-4 py-3 border border-border rounded-xl focus:ring-2 focus:ring-primary/30 focus:border-primary bg-background text-textPrimary transition-all"
                      placeholder="Confirm your password"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-textPrimary mb-2">
                      Role
                    </label>
                    <select
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                      className="w-full px-4 py-3 border border-border rounded-xl focus:ring-2 focus:ring-primary/30 focus:border-primary bg-background text-textPrimary transition-all"
                    >
                      <option value="teamMember">Team Member</option>
                      <option value="productOwner">Product Owner</option>
                      <option value="scrumMaster">Scrum Master</option>
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className={`w-full py-3 px-4 rounded-xl font-semibold transition-all ${
                    loading
                      ? "bg-textMuted text-background cursor-not-allowed"
                      : "bg-primary text-background hover:bg-primaryDark shadow-soft hover:shadow-lg transform hover:-translate-y-0.5"
                  }`}
                >
                  {loading ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                      Creating account...
                    </div>
                  ) : (
                    "Create account"
                  )}
                </button>

                <div className="text-center">
                  <p className="text-textSecondary text-sm">
                    Already have an account?{" "}
                    <button
                      type="button"
                      onClick={() => navigate('/login')}
                      className="text-primary hover:text-primaryDark font-medium transition-colors"
                    >
                      Sign in
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
