import React, { useState } from "react";
import { motion } from "framer-motion";
import { useAuth } from "../contexts/AuthContext";
import ProductOwnerDashboard from "../components/product-owner/ProductOwnerDashboard";
import AddTaskToSprint from "../components/product-owner/AddTaskToSprint";
import BacklogManager from "../components/portal/BacklogManager";

const resolveWorkspaceName = () => {
  const directName = localStorage.getItem("workspaceName");
  if (directName && directName.trim()) return directName;

  try {
    const storedUser = JSON.parse(localStorage.getItem("scrumai_user") || "{}");
    const fallbackName =
      storedUser.workspaceName ||
      storedUser.workspace?.workspaceName ||
      storedUser.workspace_name ||
      "";
    if (fallbackName) {
      localStorage.setItem("workspaceName", fallbackName);
      return fallbackName;
    }
  } catch {
    // ignore malformed localStorage payloads
  }

  return "My Workspace";
};

export default function ProductOwnerPortal() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const workspaceName = resolveWorkspaceName();

  const navigationItems = [
    { id: "dashboard", label: "Dashboard", icon: "📊", description: "Projects & stories" },
    { id: "backlog", label: "Backlog", icon: "📋", description: "Project backlog" },
    { id: "addtask", label: "Prioritize Tasks", icon: "🎯", description: "Assign stories to sprint" }
  ];

  const [storyPoints, setStoryPoints] = useState({});

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return <ProductOwnerDashboard onNavigateToBacklog={() => setActiveTab("backlog")} />;
      case "addtask":
        return <AddTaskToSprint />;
      case "backlog":
        return <BacklogManager />;
      default:
        return <ProductOwnerDashboard onNavigateToBacklog={() => setActiveTab("backlog")} />;
    }
  };

  return (
    <div className="min-h-screen bg-background text-textPrimary font-sans">
      {/* Header */}
      <header className="bg-gradient-to-r from-primaryDark via-primary to-primaryLight backdrop-blur-lg py-4 px-4 md:px-6 sticky top-0 z-50 shadow-xl border-b border-primary">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          {/* Left side */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden text-white hover:text-surfaceLight transition-colors p-2 -m-2"
              aria-label="Toggle sidebar"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-secondary to-accent rounded-xl flex items-center justify-center shadow-lg ring-2 ring-white/20">
                <span className="text-white font-bold text-lg">S</span>
              </div>
              <div>
                <h1 className="text-lg md:text-2xl font-bold text-white tracking-wide drop-shadow-sm">
                  ScrumAI
                </h1>
                <p className="text-xs text-white/70 hidden md:block">{workspaceName}</p>
              </div>
            </div>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-2 text-sm text-white/80">
              <span>Welcome back,</span>
              <span className="text-white font-medium">{user?.name || "Product Owner"}</span>
            </div>
            
            <div className="relative">
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                className="w-10 h-10 rounded-full bg-gradient-to-r from-secondary to-accent text-white font-bold flex items-center justify-center shadow-lg hover:shadow-xl transition-all ring-2 ring-white/20"
              >
                {user?.avatar || "PO"}
              </button>
              
              {/* Profile Dropdown */}
              {profileOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute right-0 mt-2 w-56 bg-white border border-border rounded-xl shadow-xl py-2 z-50 backdrop-blur-sm"
                >
                  <div className="px-4 py-3 border-b border-border">
                    <p className="text-sm font-semibold text-textPrimary">{user?.name || "Product Owner"}</p>
                    <p className="text-xs text-textSecondary">{user?.email || "owner@scrumai.com"}</p>
                    <div className="mt-2 flex items-center gap-2">
                      <span className="px-2 py-1 bg-primary/10 rounded-lg text-xs text-primary font-medium">Product Owner</span>
                    </div>
                    <div className="mt-2 flex items-center gap-1 text-xs text-textSecondary">
                      <span>🏢</span>
                      <span>{workspaceName}</span>
                    </div>
                  </div>
                  
                  <div className="py-2">
                    {/* Removed Profile Settings, Analytics, Help & Support - not implemented */}
                  </div>
                  
                  <div className="border-t border-border pt-2">
                    <button
                      onClick={logout}
                      className="w-full text-left px-4 py-2 text-sm text-error hover:bg-error/10 transition-colors flex items-center gap-2"
                    >
                      <span>🚪</span>
                      Logout
                    </button>
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className="flex h-screen overflow-hidden">
        {/* Mobile Sidebar */}
        <motion.aside
          initial={false}
          animate={{ 
            x: sidebarOpen ? 0 : -280,
            width: sidebarOpen ? "280px" : "0px" 
          }}
          transition={{ duration: 0.3 }}
          className="fixed lg:hidden top-0 left-0 h-full bg-gradient-to-b from-primaryDark via-primary to-primaryLight backdrop-blur-sm border-r border-primary z-40 overflow-y-auto"
        >
          <div className="p-6">
            <div className="mb-6">
              <div className="w-12 h-12 bg-gradient-to-r from-secondary to-accent rounded-xl flex items-center justify-center shadow-lg mb-3 ring-2 ring-white/20">
                <span className="text-white font-bold text-xl">S</span>
              </div>
              <h2 className="text-white font-bold text-lg drop-shadow-sm">Product Owner Portal</h2>
            </div>
            
            <nav className="space-y-2">
              {navigationItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300 ${
                    activeTab === item.id
                      ? "bg-secondary text-white shadow-lg ring-2 ring-white/20"
                      : "text-white/80 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <span className="text-lg">{item.icon}</span>
                  <span className="font-medium">{item.label}</span>
                </button>
              ))}
            </nav>
          </div>
        </motion.aside>

        {/* Desktop Sidebar */}
        <aside className="hidden lg:block w-64 bg-white/98 backdrop-blur-sm border-r border-border shadow-xl fixed left-0 h-full overflow-y-auto">
          <div className="p-4">
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-9 h-9 bg-gradient-to-r from-primary to-primaryLight rounded-lg flex items-center justify-center text-sm">
                  <span className="text-white font-bold">PO</span>
                </div>
                <div>
                  <h2 className="font-bold text-sm text-textPrimary">Product Owner</h2>
                  <p className="text-xs text-textSecondary truncate">{workspaceName}</p>
                </div>
              </div>
            </div>
            
            <nav className="space-y-1">
              {navigationItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex flex-col items-start gap-0.5 px-3 py-3 rounded-lg transition-all duration-300 ${
                    activeTab === item.id
                      ? "bg-gradient-to-r from-primaryDark to-primary text-white shadow-lg ring-1 ring-primary/30"
                      : "text-textSecondary hover:bg-surface hover:text-textPrimary"
                  }`}
                >
                  <div className="flex items-center gap-2 w-full">
                    <span className="text-lg">{item.icon}</span>
                    <span className="font-semibold text-xs">{item.label}</span>
                  </div>
                  <p className={`text-xs px-8 leading-tight ${
                    activeTab === item.id
                      ? "text-white/70"
                      : "text-textSecondary"
                  }`}>
                    {item.description}
                  </p>
                </button>
              ))}
            </nav>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 lg:ml-64 overflow-y-auto p-6">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
            className="max-w-7xl mx-auto"
          >
            {renderContent()}
          </motion.div>
        </main>
      </div>
    </div>
  );
}