import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { LOGIN_ENDPOINTS, apiRequest } from "../config/api";
import Navbar from "../components/Navbar";

export default function WorkspaceRegister() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    adminName: "",
    adminEmail: "",
    password: "",
    workspaceName: "",
    companyName: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");
    setLoading(true);
    
    try {
      console.log('Submitting workspace registration:', formData);
      console.log('Endpoint:', LOGIN_ENDPOINTS.auth.registerWorkspace);
      
      // Make POST request with explicit headers
      const response = await fetch(LOGIN_ENDPOINTS.auth.registerWorkspace, {
        method: "POST",
        mode: "cors",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        body: JSON.stringify({
          adminName: formData.adminName,
          adminEmail: formData.adminEmail,
          password: formData.password,
          workspaceName: formData.workspaceName,
          companyName: formData.companyName,
        }),
      });

      console.log('Response status:', response.status);
      
      // Parse response
      const data = await response.json();
      console.log('Response data:', data);

      if (!response.ok) {
        // Handle error response
        const errorMessage = data.message || data.error || data.detail || 
          `Request failed with status ${response.status}`;
        throw new Error(errorMessage);
      }

      // Handle API response: { message, workspace: { id, adminName, adminEmail, workspaceName, companyName } }
      if (data?.workspace?.id) {
        localStorage.setItem("workspaceId", data.workspace.id);
        localStorage.setItem("workspaceName", data.workspace.workspaceName || "");
        localStorage.setItem("companyName", data.workspace.companyName || "");
        localStorage.setItem("adminName", data.workspace.adminName || "");
        localStorage.setItem("adminEmail", data.workspace.adminEmail || "");
      }

      setSuccessMessage(data?.message || "Workspace created successfully.");

      // Redirect to admin portal
      setTimeout(() => {
        navigate("/admin");
      }, 500);
    } catch (err) {
      console.error('Workspace registration error:', err);
      const errorMessage = err?.message || "Failed to create workspace. Please try again.";
      
      // Provide more helpful error message
      if (errorMessage.includes('Failed to fetch') || errorMessage.includes('NetworkError')) {
        setError("Cannot connect to the server. Please ensure the backend server is running at http://localhost:8000 and CORS is properly configured.");
      } else if (errorMessage.includes('404')) {
        setError("Workspace registration endpoint not found. Please check the backend API configuration.");
      } else if (errorMessage.includes('400') || errorMessage.includes('422')) {
        setError(errorMessage + " Please check your input fields.");
      } else {
        setError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const features = [
    { icon: "🤖", title: "AI-Powered Planning", desc: "Intelligent sprint planning and task allocation" },
    { icon: "📊", title: "Real-Time Analytics", desc: "Track progress with comprehensive dashboards" },
    { icon: "👥", title: "Team Management", desc: "Manage your team members and roles efficiently" },
    { icon: "⚡", title: "Automated Workflows", desc: "Streamline your agile processes" },
  ];

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gradient-to-br from-background via-surface to-surfaceDark flex items-center justify-center px-4 pt-24 pb-12">
      <div className="w-full max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          {/* Left Side - ScrumAI Info Card */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="hidden lg:block"
          >
            <div className="bg-gradient-to-br from-primaryDark via-primary to-primaryLight rounded-3xl p-8 lg:p-12 shadow-2xl text-white relative overflow-hidden">
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
                  <h1 className="text-4xl font-bold mb-2">ScrumAI</h1>
                  <p className="text-white/80 text-lg">Transform Your Agile Workflow</p>
                </div>

                {/* Features List */}
                <div className="space-y-6 mb-8">
                  {features.map((feature, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2 + index * 0.1 }}
                      className="flex items-start gap-4"
                    >
                      <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center text-2xl flex-shrink-0">
                        {feature.icon}
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg mb-1">{feature.title}</h3>
                        <p className="text-white/70 text-sm">{feature.desc}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4 pt-8 border-t border-white/20">
                  <div>
                    <div className="text-3xl font-bold">500+</div>
                    <div className="text-white/70 text-sm">Teams</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold">98%</div>
                    <div className="text-white/70 text-sm">Satisfaction</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold">24/7</div>
                    <div className="text-white/70 text-sm">Support</div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Right Side - Registration Form */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="w-full"
          >
            <div className="bg-white rounded-3xl shadow-2xl border border-border p-8 lg:p-10">
              {/* Mobile Logo */}
              <div className="lg:hidden mb-6 text-center">
                <div className="w-12 h-12 bg-gradient-to-r from-primary to-secondary rounded-xl flex items-center justify-center mx-auto mb-3">
                  <span className="text-2xl font-bold text-white">S</span>
                </div>
                <h1 className="text-2xl font-bold text-textPrimary">ScrumAI</h1>
              </div>

              <div className="mb-8">
                <h2 className="text-3xl font-bold text-textPrimary mb-2">Create Your Workspace</h2>
                <p className="text-textSecondary">
                  Set up your admin account and workspace in one step
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

              {successMessage && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl text-sm"
                >
                  {successMessage}
                </motion.div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-textPrimary mb-2">
                    Admin Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="adminName"
                    value={formData.adminName}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-primary bg-white text-textPrimary transition-all"
                    placeholder="Enter your full name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-textPrimary mb-2">
                    Admin Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    name="adminEmail"
                    value={formData.adminEmail}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-primary bg-white text-textPrimary transition-all"
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
                    className="w-full px-4 py-3 border border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-primary bg-white text-textPrimary transition-all"
                    placeholder="Create a strong password"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-textPrimary mb-2">
                      Workspace Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="workspaceName"
                      value={formData.workspaceName}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 border border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-primary bg-white text-textPrimary transition-all"
                      placeholder="My Workspace"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-textPrimary mb-2">
                      Company Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="companyName"
                      value={formData.companyName}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 border border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-primary bg-white text-textPrimary transition-all"
                      placeholder="My Company"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 bg-gradient-to-r from-primary to-secondary text-white rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>Creating workspace...</span>
                    </>
                  ) : (
                    <span>Create Workspace</span>
                  )}
                </button>
              </form>

              <div className="text-sm text-textSecondary mt-6 text-center">
                Already have a workspace?{" "}
                <button
                  onClick={() => navigate("/workspace/login")}
                  className="text-primary font-semibold hover:underline transition-colors"
                >
                  Login here
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
    </>
  );
}
