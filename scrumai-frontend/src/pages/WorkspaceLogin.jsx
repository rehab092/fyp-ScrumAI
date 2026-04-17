import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { LOGIN_ENDPOINTS } from "../config/api";
import Navbar from "../components/Navbar";

export default function WorkspaceLogin() {
  const navigate = useNavigate();
  
  // Login type: 'admin' or 'user'
  const [loginType, setLoginType] = useState("user");
  
  // Form data
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    
    try {
      // Choose endpoint based on login type
      // Admin: /auth/login/
      // User (SM/PO/Dev): /auth/login-user/
      const endpoint = loginType === "admin" 
        ? LOGIN_ENDPOINTS.auth.adminLogin
        : LOGIN_ENDPOINTS.auth.roleLogin;

      console.log(`Logging in as ${loginType}:`, formData);
      console.log("Endpoint:", endpoint);

      // Build request body - same for both admin and user login
      const requestBody = {
        email: formData.email,
        password: formData.password,
      };

      const response = await fetch(endpoint, {
        method: "POST",
        mode: "cors",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      console.log("Response status:", response.status);
      
      const data = await response.json();
      console.log("Response data:", data);

      if (!response.ok) {
        const errorMessage = data.message || data.error || data.detail || 
          `Login failed with status ${response.status}`;
        throw new Error(errorMessage);
      }

      // Store auth data based on login type
      if (loginType === "admin") {
        // Admin login response
        if (data?.workspace?.id) {
          localStorage.setItem("workspaceId", data.workspace.id);
          localStorage.setItem("workspaceName", data.workspace.workspaceName || "");
          localStorage.setItem("companyName", data.workspace.companyName || "");
          localStorage.setItem("adminName", data.workspace.adminName || "");
          localStorage.setItem("adminEmail", data.workspace.adminEmail || formData.email);
        }
        localStorage.setItem("userRole", "admin");
        localStorage.setItem("authToken", data.token || "");
        
        // Set scrumai_user for AuthContext (required for ProtectedRoute)
        const adminUser = {
          id: data.workspace?.id || Date.now(),
          email: data.workspace?.adminEmail || formData.email,
          role: "admin",
          name: data.workspace?.adminName || formData.email.split("@")[0],
          avatar: (data.workspace?.adminName || formData.email).substring(0, 2).toUpperCase(),
          loginTime: new Date().toISOString(),
        };
        localStorage.setItem("scrumai_user", JSON.stringify(adminUser));
        // Store session timestamp for session validation
        localStorage.setItem("scrumai_session_timestamp", Date.now().toString());
        
        // Redirect to admin portal (use window.location.replace to prevent back navigation to login)
        window.location.replace("/admin");
      } else {
        // User login response (SM/PO/Dev)
        // Backend returns: { success: true, user: { id, name, email, role, type, workspaceId, workspaceName } }
        const user = data.user || data;
        
        console.log("User data from backend:", user);
        console.log("Role from backend:", user.role);
        
        localStorage.setItem("userId", user.id || "");
        localStorage.setItem("userName", user.name || "");
        localStorage.setItem("userEmail", user.email || formData.email);
        localStorage.setItem("authToken", data.token || "");
        if (user.workspaceId) {
          localStorage.setItem("workspaceId", user.workspaceId);
        }
        const resolvedWorkspaceName =
          user.workspaceName || user.workspace?.workspaceName || user.workspace_name || "";
        if (resolvedWorkspaceName) {
          localStorage.setItem("workspaceName", resolvedWorkspaceName);
        }

        // Normalize role from backend (SCRUM_MASTER, PRODUCT_OWNER, DEVELOPER)
        const backendRole = (user.role || "").toUpperCase().replace(/[\s-]/g, "_");
        let normalizedRole;
        let redirectPath;
        
        if (backendRole === "SCRUM_MASTER" || backendRole === "SCRUMMASTER") {
          normalizedRole = "SCRUM_MASTER";
          redirectPath = "/scrum-master";
        } else if (backendRole === "PRODUCT_OWNER" || backendRole === "PRODUCTOWNER") {
          normalizedRole = "PRODUCT_OWNER";
          redirectPath = "/product-owner";
        } else if (backendRole === "DEVELOPER" || backendRole === "TEAM_MEMBER" || backendRole === "TEAMMEMBER") {
          normalizedRole = "DEVELOPER";
          redirectPath = "/team-member";
        } else {
          normalizedRole = backendRole || "DEVELOPER";
          redirectPath = "/team-member";
        }
        
        console.log("Normalized role:", normalizedRole);
        console.log("Redirect path:", redirectPath);
        
        localStorage.setItem("userRole", normalizedRole);
        
        // Set scrumai_user for AuthContext (required for ProtectedRoute)
        const teamUser = {
          id: user.id || Date.now(),
          email: user.email || formData.email,
          role: normalizedRole,
          name: user.name || formData.email.split("@")[0],
          type: user.type || "TEAM_MEMBER",
          workspaceName: resolvedWorkspaceName,
          avatar: (user.name || formData.email).substring(0, 2).toUpperCase(),
          loginTime: new Date().toISOString(),
        };
        localStorage.setItem("scrumai_user", JSON.stringify(teamUser));
        // Store session timestamp for session validation
        localStorage.setItem("scrumai_session_timestamp", Date.now().toString());

        // Redirect based on role (use window.location.replace to prevent back navigation to login)
        window.location.replace(redirectPath);
      }
    } catch (err) {
      console.error("Login error:", err);
      const errorMessage = err?.message || "Failed to login. Please try again.";
      
      if (errorMessage.includes("Failed to fetch") || errorMessage.includes("NetworkError")) {
        setError("Cannot connect to the server. Please ensure the backend is running.");
      } else if (errorMessage.includes("Invalid") || errorMessage.includes("credentials")) {
        setError("Invalid email or password. Please check your credentials.");
      } else if (errorMessage.includes("404")) {
        setError("Login endpoint not found. Please check the backend configuration.");
      } else {
        setError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const benefits = [
    { icon: "🚀", title: "Get Started Fast", desc: "Access your workspace in seconds" },
    { icon: "📈", title: "Track Progress", desc: "Monitor your team's performance" },
    { icon: "🔒", title: "Secure & Private", desc: "Your data is safe with us" },
    { icon: "💡", title: "AI Insights", desc: "Get intelligent recommendations" },
  ];

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gradient-to-br from-background via-surface to-surfaceDark flex">
        {/* Left Side - Full Height Info Panel */}
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
          className="hidden lg:flex lg:w-1/2 min-h-screen"
        >
          <div className="bg-gradient-to-br from-primaryDark via-primary to-primaryLight w-full min-h-screen p-8 lg:p-12 text-white relative overflow-hidden flex flex-col justify-center">
              {/* Background Pattern */}
              <div className="absolute inset-0 opacity-10">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full blur-3xl"></div>
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-secondary rounded-full blur-3xl"></div>
              </div>

              <div className="relative z-10">
                {/* Logo/Brand */}
                <div className="mb-8">
                  <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mb-4">
                    <span className="text-3xl font-bold">S</span>
                  </div>
                  <h1 className="text-4xl font-bold mb-2">Welcome Back</h1>
                  <p className="text-white/80 text-lg">Login to your ScrumAI workspace</p>
                </div>

                {/* Benefits List */}
                <div className="space-y-6 mb-8">
                  {benefits.map((benefit, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2 + index * 0.1 }}
                      className="flex items-start gap-4"
                    >
                      <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center text-2xl flex-shrink-0">
                        {benefit.icon}
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg mb-1">{benefit.title}</h3>
                        <p className="text-white/70 text-sm">{benefit.desc}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-3 gap-4 pt-8 border-t border-white/20">
                  <div>
                    <div className="text-3xl font-bold">500+</div>
                    <div className="text-white/70 text-sm">Active Teams</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold">99.9%</div>
                    <div className="text-white/70 text-sm">Uptime</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold">24/7</div>
                    <div className="text-white/70 text-sm">Support</div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Right Side - Login Form */}
          <div className="w-full lg:w-1/2 min-h-screen flex items-center justify-center px-4 py-12 lg:px-12">
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              className="w-full max-w-md"
            >
              <div className="bg-white rounded-3xl shadow-2xl border border-border p-8 lg:p-10">
                {/* Mobile Logo */}
                <div className="lg:hidden mb-6 text-center">
                  <div className="w-12 h-12 bg-gradient-to-r from-primary to-secondary rounded-xl flex items-center justify-center mx-auto mb-3">
                    <span className="text-2xl font-bold text-white">S</span>
                  </div>
                  <h1 className="text-2xl font-bold text-textPrimary">ScrumAI</h1>
                </div>

                <div className="mb-6">
                  <h2 className="text-3xl font-bold text-textPrimary mb-2">Login to Workspace</h2>
                <p className="text-textSecondary">
                  Choose your login type and access your dashboard
                </p>
              </div>

              {/* Login Type Toggle */}
              <div className="mb-6">
                <div className="flex bg-surface rounded-xl p-1">
                  <button
                    type="button"
                    onClick={() => setLoginType("admin")}
                    className={`flex-1 py-3 px-4 rounded-lg font-semibold text-sm transition-all flex items-center justify-center gap-2 ${
                      loginType === "admin"
                        ? "bg-gradient-to-r from-primary to-primaryDark text-white shadow-md"
                        : "text-textSecondary hover:text-textPrimary"
                    }`}
                  >
                    <span>🔐</span>
                    <span>Admin Login</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setLoginType("user")}
                    className={`flex-1 py-3 px-4 rounded-lg font-semibold text-sm transition-all flex items-center justify-center gap-2 ${
                      loginType === "user"
                        ? "bg-gradient-to-r from-secondary to-accent text-white shadow-md"
                        : "text-textSecondary hover:text-textPrimary"
                    }`}
                  >
                    <span>👥</span>
                    <span>Team Login</span>
                  </button>
                </div>
                <p className="text-xs text-textMuted mt-2 text-center">
                  {loginType === "admin" 
                    ? "Login as workspace administrator" 
                    : "Login as Scrum Master, Product Owner, or Developer"}
                </p>
              </div>

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm"
                >
                  {error}
                </motion.div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-textPrimary mb-2">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className={`w-full px-4 py-3 border border-border rounded-xl focus:ring-2 ${
                      loginType === "admin" 
                        ? "focus:ring-primary focus:border-primary" 
                        : "focus:ring-secondary focus:border-secondary"
                    } bg-white text-textPrimary transition-all`}
                    placeholder="you@example.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-textPrimary mb-2">
                    Password <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    className={`w-full px-4 py-3 border border-border rounded-xl focus:ring-2 ${
                      loginType === "admin" 
                        ? "focus:ring-primary focus:border-primary" 
                        : "focus:ring-secondary focus:border-secondary"
                    } bg-white text-textPrimary transition-all`}
                    placeholder="Enter your password"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 text-sm text-textSecondary">
                    <input type="checkbox" className="rounded border-border" />
                    <span>Remember me</span>
                  </label>
                  <button
                    type="button"
                    className="text-sm text-primary hover:underline font-medium"
                  >
                    Forgot password?
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className={`w-full py-3.5 text-white rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${
                    loginType === "admin"
                      ? "bg-gradient-to-r from-primary to-primaryDark"
                      : "bg-gradient-to-r from-secondary to-accent"
                  }`}
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>Logging in...</span>
                    </>
                  ) : (
                    <span>
                      {loginType === "admin" ? "Login as Admin" : "Login to Team"}
                    </span>
                  )}
                </button>
              </form>

              {/* Role Information - Only for User Login */}
              {loginType === "user" && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="mt-6 bg-surface rounded-xl p-4"
                >
                  <p className="text-sm font-semibold text-textPrimary mb-3">Supported Roles:</p>
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div className="p-2">
                      <span className="text-2xl">👨‍💼</span>
                      <p className="text-xs text-textSecondary mt-1">Scrum Master</p>
                    </div>
                    <div className="p-2">
                      <span className="text-2xl">📋</span>
                      <p className="text-xs text-textSecondary mt-1">Product Owner</p>
                    </div>
                    <div className="p-2">
                      <span className="text-2xl">👨‍💻</span>
                      <p className="text-xs text-textSecondary mt-1">Developer</p>
                    </div>
                  </div>
                </motion.div>
              )}

              <div className="text-sm text-textSecondary mt-6 text-center">
                Don't have a workspace?{" "}
                <button
                  onClick={() => navigate("/workspace/register")}
                  className="text-primary font-semibold hover:underline transition-colors"
                >
                  Create one now
                </button>
              </div>
              </div>
            </motion.div>
          </div>
        </div>
    </>
  );
}
