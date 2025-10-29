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
    <div className="min-h-screen bg-gradient-to-b from-nightBlue to-nightBlueShadow text-sandTan font-sans">
      {/* Header */}
      <header className="bg-gradient-to-r from-nightBlue to-nightBlueShadow py-4 px-4 md:px-6 sticky top-0 z-50 shadow-md border-b border-sandTan/20">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          {/* Left side */}
          <div className="flex items-center gap-2 md:gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden text-sandTan hover:text-sandTanShadow transition-colors p-2 -m-2"
              aria-label="Toggle sidebar"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <h1 className="text-lg md:text-2xl font-bold text-sandTan tracking-wide">
              <span className="text-sandTanShadow">Scrum</span>AI
            </h1>
            <span className="hidden sm:block text-sandTan/80 text-sm md:text-base font-medium ml-2 border-l pl-3 border-sandTan/30">
              User Portal
            </span>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-2 text-sm text-textMuted">
              <span>Welcome back,</span>
              <span className="text-sandTan font-medium">{user?.name || "User"}</span>
            </div>
            <div className="w-9 h-9 rounded-full bg-sandTan text-nightBlue font-bold flex items-center justify-center shadow-sm">
              {user?.avatar || "U"}
            </div>
            <button
              onClick={logout}
              className="text-sandTan hover:text-sandTanShadow transition-colors text-sm"
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

      <div className="flex">
        {/* Mobile Sidebar */}
        <motion.aside
          initial={false}
          animate={{ 
            x: sidebarOpen ? 0 : -280,
            width: sidebarOpen ? "280px" : "0px" 
          }}
          transition={{ duration: 0.3 }}
          className="fixed lg:hidden top-0 left-0 h-full bg-nightBlueShadow/95 backdrop-blur-sm border-r border-sandTan/20 z-40 overflow-hidden"
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
                      ? "bg-sandTan text-nightBlue shadow-lg"
                      : "text-sandTan hover:bg-sandTan/20"
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
        <aside className="hidden lg:block w-64 bg-nightBlueShadow/60 border-r border-sandTan/20">
          <div className="p-6">
            <nav className="space-y-2">
              {navigationItems.map((item) => (
      <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300 ${
                    activeTab === item.id
                      ? "bg-sandTan text-nightBlue shadow-lg"
                      : "text-sandTan hover:bg-sandTan/20"
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
