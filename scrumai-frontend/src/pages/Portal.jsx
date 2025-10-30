import React, { useState } from "react";
import { motion } from "framer-motion";
import { useAuth } from "../contexts/AuthContext";
import Dashboard from "../components/portal/Dashboard";
import BacklogManager from "../components/portal/BacklogManager";
import SprintPlanner from "../components/portal/SprintPlanner";
import DependencyMapper from "../components/portal/DependencyMapper";
import TaskAllocation from "../components/portal/TaskAllocation";
import Reports from "../components/portal/Reports";
import Settings from "../components/portal/Settings";

export default function Portal() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navigationItems = [
    { id: "dashboard", label: "Dashboard", icon: "📊" },
    { id: "backlog", label: "Backlog", icon: "📋" },
    { id: "sprint", label: "Sprint Planning", icon: "🗓️" },
    { id: "dependencies", label: "Dependencies", icon: "🔗" },
    { id: "allocation", label: "Task Allocation", icon: "👥" },
    { id: "reports", label: "Reports", icon: "📈" },
    { id: "settings", label: "Settings", icon: "⚙️" }
  ];

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return <Dashboard />;
      case "backlog":
        return <BacklogManager />;
      case "sprint":
        return <SprintPlanner />;
      case "dependencies":
        return <DependencyMapper />;
      case "allocation":
        return <TaskAllocation />;
      case "reports":
        return <Reports />;
      case "settings":
        return <Settings />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-surface to-surfaceLight text-textPrimary font-sans">
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
              </div>
            </div>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-4">
            <div className="hidden lg:flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2 bg-white/15 backdrop-blur-sm rounded-lg px-3 py-2 border border-white/20">
                <div className="w-2 h-2 bg-success rounded-full animate-pulse"></div>
                <span className="text-white font-medium">Sprint Active</span>
              </div>
              <div className="flex items-center gap-2 bg-white/15 backdrop-blur-sm rounded-lg px-3 py-2 border border-white/20">
                <span className="text-white font-semibold">87%</span>
                <span className="text-white/80">Progress</span>
              </div>
            </div>

            <div className="hidden md:flex items-center gap-2 text-sm text-white/80">
              <span>Welcome back,</span>
              <span className="text-white font-medium">{user?.name || "User"}</span>
            </div>
            
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-secondary to-accent text-white font-bold flex items-center justify-center shadow-lg hover:shadow-xl transition-all ring-2 ring-white/20">
              {user?.avatar || "U"}
            </div>
            <button
              onClick={logout}
              className="hidden md:block text-white/80 hover:text-white transition-colors text-sm"
            >
              Logout
            </button>
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
              <h2 className="text-white font-bold text-lg drop-shadow-sm">User Portal</h2>
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
        <aside className="hidden lg:block w-72 bg-white/98 backdrop-blur-sm border-r border-border shadow-xl fixed left-0 h-full overflow-y-auto">
          <div className="p-6">
            
            <nav className="space-y-2">
              {navigationItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-300 ${
                    activeTab === item.id
                      ? "bg-gradient-to-r from-primaryDark to-primary text-white shadow-lg transform scale-105 ring-2 ring-primary/20"
                      : "text-textSecondary hover:bg-surface hover:text-textPrimary"
                  }`}
                >
                  <span className="text-xl">{item.icon}</span>
                  <span className="font-semibold">{item.label}</span>
                </button>
              ))}
            </nav>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 lg:ml-72 overflow-y-auto p-6">
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
