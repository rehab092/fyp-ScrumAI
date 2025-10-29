import React, { useState } from "react";
import { motion } from "framer-motion";
import { useAuth } from "../contexts/AuthContext";
import Dashboard from "../components/portal/Dashboard";
import BacklogManager from "../components/portal/BacklogManager";
import Reports from "../components/portal/Reports";
import Settings from "../components/portal/Settings";

export default function ProductOwnerPortal() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const navigationItems = [
    { id: "dashboard", label: "Dashboard", icon: "📊" },
    { id: "backlog", label: "Backlog", icon: "📋" },
    { id: "reports", label: "Reports", icon: "📈" },
    { id: "settings", label: "Settings", icon: "⚙️" }
  ];

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return <Dashboard />;
      case "backlog":
        return <BacklogManager />;
      case "reports":
        return <Reports />;
      case "settings":
        return <Settings />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-background text-textPrimary font-sans">
      {/* Header */}
      <header className="bg-background/95 backdrop-blur-lg py-4 px-4 md:px-6 sticky top-0 z-50 shadow-soft border-b border-border">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          {/* Left side */}
          <div className="flex items-center gap-2 md:gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden text-textPrimary hover:text-primary transition-colors p-2 -m-2"
              aria-label="Toggle sidebar"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <h1 className="text-lg md:text-2xl font-bold text-primary tracking-wide">
              ScrumAI
            </h1>
            <span className="hidden sm:block text-textSecondary text-sm md:text-base font-medium ml-2 border-l pl-3 border-border">
              Product Owner Portal
            </span>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-2 text-sm text-textSecondary">
              <span>Welcome back,</span>
              <span className="text-textPrimary font-medium">{user?.name || "Product Owner"}</span>
            </div>
            <div className="relative">
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                className="w-9 h-9 rounded-full bg-primary text-background font-bold flex items-center justify-center shadow-soft hover:bg-primaryDark transition-all"
              >
                {user?.avatar || "PO"}
              </button>
              
              {/* Profile Dropdown */}
              {profileOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-background border border-border rounded-lg shadow-soft py-2 z-50">
                  <div className="px-4 py-2 border-b border-border">
                    <p className="text-sm font-medium text-textPrimary">{user?.name || "Product Owner"}</p>
                    <p className="text-xs text-textSecondary">{user?.email || "owner@scrumai.com"}</p>
                  </div>
                  <button className="w-full text-left px-4 py-2 text-sm text-textSecondary hover:bg-surface transition-colors">
                    Profile Settings
                  </button>
                  <button className="w-full text-left px-4 py-2 text-sm text-textSecondary hover:bg-surface transition-colors">
                    Help & Support
                  </button>
                  <button
                    onClick={logout}
                    className="w-full text-left px-4 py-2 text-sm text-error hover:bg-surface transition-colors"
                  >
                    Logout
                  </button>
                </div>
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

      <div className="flex">
        {/* Mobile Sidebar */}
        <motion.aside
          initial={false}
          animate={{ 
            x: sidebarOpen ? 0 : -280,
            width: sidebarOpen ? "280px" : "0px" 
          }}
          transition={{ duration: 0.3 }}
          className="fixed lg:hidden top-0 left-0 h-full bg-background/95 backdrop-blur-sm border-r border-border z-40 overflow-hidden"
        >
          <div className="p-6">
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
                      ? "bg-primary text-background shadow-soft"
                      : "text-textPrimary hover:bg-surface"
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
        <aside className="hidden lg:block w-64 bg-surface border-r border-border">
          <div className="p-6">
            <nav className="space-y-2">
              {navigationItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300 ${
                    activeTab === item.id
                      ? "bg-primary text-background shadow-soft"
                      : "text-textPrimary hover:bg-surface"
                  }`}
                >
                  <span className="text-lg">{item.icon}</span>
                  <span className="font-medium">{item.label}</span>
                </button>
              ))}
            </nav>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-4 md:p-6 min-h-screen">
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