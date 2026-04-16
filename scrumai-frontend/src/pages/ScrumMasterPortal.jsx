import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useAuth } from "../contexts/AuthContext";
import { getAllSprints } from "../config/api";
import ScrumMasterDashboard from "../components/scrum-master/ScrumMasterDashboard";
import TeamOverview from "../components/scrum-master/TeamOverview";
import SprintManagement from "../components/scrum-master/SprintManagement";
import ResourcePlanning from "../components/scrum-master/ResourcePlanning";
import DependencyMonitor from "../components/scrum-master/DependencyMonitor";
import Reports from "../components/scrum-master/Reports";
import TaskAllocationHelper from "../components/scrum-master/TaskAllocationHelper";

export default function ScrumMasterPortal() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [sprints, setSprints] = useState([]);
  const [selectedSprintId, setSelectedSprintId] = useState(null);
  const workspaceName = localStorage.getItem("workspaceName") || "My Workspace";

  useEffect(() => {
    loadSprints();
  }, []);

  const loadSprints = async () => {
    try {
      const workspaceId = localStorage.getItem('workspaceId');
      const data = await getAllSprints(workspaceId);
      setSprints(data);

      if (data.length > 0) {
        const currentId = selectedSprintId ? selectedSprintId.toString() : null;
        const hasCurrent = currentId && data.some(s => s.id.toString() === currentId);

        if (!hasCurrent) {
          setSelectedSprintId(data[0].id.toString());
        }
      }
    } catch (error) {
      console.error('Failed to load sprints:', error);
    }
  };

  const navigationItems = [
    { id: "dashboard", label: "Dashboard", icon: "📊" },
    { id: "taskAllocation", label: "Task Allocation", icon: "🧩" },
    { id: "team", label: "Team Overview", icon: "👥" },
    { id: "sprints", label: "Sprint Management", icon: "🗓️" },
    { id: "resources", label: "Resource Planning", icon: "📈" },
    { id: "dependencies", label: "Dependency Monitor", icon: "🔗" },
    { id: "reports", label: "Reports", icon: "📋" }
  ];

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return <ScrumMasterDashboard sprints={sprints} selectedSprintId={selectedSprintId} setSelectedSprintId={setSelectedSprintId} onStartNewSprint={() => setActiveTab("sprints")} />;
      case "taskAllocation":
        return <TaskAllocationHelper />;
      case "team":
        return <TeamOverview />;
      case "sprints":
        return <SprintManagement sprints={sprints} selectedSprintId={selectedSprintId} setSelectedSprintId={setSelectedSprintId} onSprintCreated={loadSprints} />;
      case "resources":
        return <ResourcePlanning />;
      case "dependencies":
        return <DependencyMonitor />;
      case "reports":
        return <Reports />;
      default:
        return <ScrumMasterDashboard sprints={sprints} selectedSprintId={selectedSprintId} setSelectedSprintId={setSelectedSprintId} />;
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
                <p className="text-xs text-white/70 hidden md:block">{workspaceName}</p>
              </div>
            </div>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-4">
            {/* Quick Stats */}
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
              <span className="text-white font-medium">{user?.name || "Scrum Master"}</span>
            </div>
            
            <div className="relative">
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                className="w-10 h-10 rounded-full bg-gradient-to-r from-secondary to-accent text-white font-bold flex items-center justify-center shadow-lg hover:shadow-xl transition-all ring-2 ring-white/20"
              >
                {user?.avatar || "SM"}
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
                    <p className="text-sm font-semibold text-textPrimary">{user?.name || "Scrum Master"}</p>
                    <p className="text-xs text-textSecondary">{user?.email || "scrum@scrumai.com"}</p>
                    <div className="mt-2 flex items-center gap-2">
                      <span className="px-2 py-1 bg-primary/10 rounded-lg text-xs text-primary font-medium">Scrum Master</span>
                    </div>
                    <div className="mt-2 flex items-center gap-1 text-xs text-textSecondary">
                      <span>🏢</span>
                      <span>{workspaceName}</span>
                    </div>
                  </div>
                  
                  <div className="py-2">
                    <button className="w-full text-left px-4 py-2 text-sm text-textSecondary hover:bg-surface transition-colors flex items-center gap-2">
                      <span>👤</span>
                      Profile Settings
                    </button>
                    <button className="w-full text-left px-4 py-2 text-sm text-textSecondary hover:bg-surface transition-colors flex items-center gap-2">
                      <span>👥</span>
                      Team Management
                    </button>
                    <button className="w-full text-left px-4 py-2 text-sm text-textSecondary hover:bg-surface transition-colors flex items-center gap-2">
                      <span>📊</span>
                      Analytics
                    </button>
                    <button className="w-full text-left px-4 py-2 text-sm text-textSecondary hover:bg-surface transition-colors flex items-center gap-2">
                      <span>❓</span>
                      Help & Support
                    </button>
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
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
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
              <h2 className="text-white font-bold text-lg drop-shadow-sm">Scrum Master Portal</h2>
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
                  <div className="font-medium">{item.label}</div>
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
                  <div className="font-semibold">{item.label}</div>
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