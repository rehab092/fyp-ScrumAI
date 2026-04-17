import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useAuth } from "../contexts/AuthContext";
import AdminDashboard from "../components/admin/AdminDashboard";
import TeamManagement from "../components/admin/TeamManagement";
import WorkspaceSettings from "../components/admin/WorkspaceSettings";
import { LOGIN_ENDPOINTS, apiRequest } from "../config/api";

export default function AdminPortal() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [workspaceInfo, setWorkspaceInfo] = useState(null);

  const navigationItems = [
    { id: "dashboard", label: "Dashboard", icon: "📊" },
    { id: "team", label: "Team Management", icon: "👥" },
    { id: "settings", label: "Workspace Settings", icon: "⚙️" }
  ];

  // Fetch workspace info
  useEffect(() => {
    const fetchWorkspaceInfo = async () => {
      try {
        const workspaceId = localStorage.getItem('workspaceId');
        const workspaceName = localStorage.getItem('workspaceName');
        const companyName = localStorage.getItem('companyName');
        const adminName = localStorage.getItem('adminName');
        const adminEmail = localStorage.getItem('adminEmail');

        if (workspaceId) {
          setWorkspaceInfo({
            id: workspaceId,
            workspaceName: workspaceName || "My Workspace",
            companyName: companyName || "My Company",
            adminName: adminName || "Admin",
            adminEmail: adminEmail || ""
          });
        }
      } catch (err) {
        console.error('Error fetching workspace info:', err);
      }
    };

    fetchWorkspaceInfo();
  }, []);

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return <AdminDashboard workspaceInfo={workspaceInfo} onNavigateToTeam={() => setActiveTab("team")} />;
      case "team":
        return <TeamManagement workspaceInfo={workspaceInfo} />;
      case "settings":
        return <WorkspaceSettings workspaceInfo={workspaceInfo} />;
      default:
        return <AdminDashboard workspaceInfo={workspaceInfo} onNavigateToTeam={() => setActiveTab("team")} />;
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
                <span className="text-white font-bold text-lg">A</span>
              </div>
              <div>
                <h1 className="text-lg md:text-2xl font-bold text-white tracking-wide drop-shadow-sm">
                  ScrumAI Admin
                </h1>
                {workspaceInfo && (
                  <p className="text-xs text-white/80">
                    {workspaceInfo.workspaceName} • {workspaceInfo.companyName}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-4">
            {/* Workspace Info */}
            {workspaceInfo && (
              <div className="hidden lg:flex items-center gap-2 bg-white/15 backdrop-blur-sm rounded-lg px-3 py-2 border border-white/20">
                <span className="text-white text-sm font-medium">
                  Welcome, {workspaceInfo.adminName}
                </span>
              </div>
            )}

            <div className="relative">
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                className="w-10 h-10 rounded-full bg-gradient-to-r from-secondary to-accent text-white font-bold flex items-center justify-center shadow-lg hover:shadow-xl transition-all ring-2 ring-white/20"
              >
                {workspaceInfo?.adminName?.split(' ').map(n => n[0]).join('').toUpperCase() || "AD"}
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
                    <p className="text-sm font-semibold text-textPrimary">{workspaceInfo?.adminName || "Admin"}</p>
                    <p className="text-xs text-textSecondary">{workspaceInfo?.adminEmail || "admin@workspace.com"}</p>
                    <div className="mt-2 px-2 py-1 bg-primary/10 rounded-lg">
                      <span className="text-xs text-primary font-medium">Workspace Admin</span>
                    </div>
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
                <span className="text-white font-bold text-xl">A</span>
              </div>
              <h2 className="text-white font-bold text-lg drop-shadow-sm">Admin Portal</h2>
              {workspaceInfo && (
                <p className="text-white/80 text-xs mt-1">{workspaceInfo.workspaceName}</p>
              )}
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
            {workspaceInfo && (
              <div className="mb-6 p-4 bg-gradient-to-br from-primary/10 to-secondary/10 rounded-xl border border-primary/20">
                <h3 className="text-sm font-semibold text-textPrimary mb-1">{workspaceInfo.workspaceName}</h3>
                <p className="text-xs text-textSecondary">{workspaceInfo.companyName}</p>
                <div className="mt-2 pt-2 border-t border-primary/20">
                  <p className="text-xs text-textMuted">Admin: {workspaceInfo.adminName}</p>
                </div>
              </div>
            )}
            
            <nav className="space-y-2">
              {navigationItems.map((item) => (
                <button
                  key={item.id}
                  data-tab={item.id}
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

