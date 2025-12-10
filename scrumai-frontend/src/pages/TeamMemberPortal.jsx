import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useAuth } from "../contexts/AuthContext";
import { LOGIN_ENDPOINTS } from "../config/api";

export default function TeamMemberPortal() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [memberData, setMemberData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  const [editProfileOpen, setEditProfileOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    name: "",
    skills: "",
    capacityHours: 40,
  });
  const [saving, setSaving] = useState(false);
  const workspaceName = localStorage.getItem("workspaceName") || "My Workspace";

  useEffect(() => {
    const fetchMemberData = async () => {
      try {
        setLoading(true);
        const memberId = user?.id;
        const workspaceId = localStorage.getItem("workspaceId");
        
        if (!memberId) {
          setMemberData({
            id: user?.id,
            name: user?.name || "Team Member",
            email: user?.email || "",
            role: "DEVELOPER",
            skills: [],
            capacityHours: 40,
            assignedHours: 0,
            status: "available",
          });
          setLoading(false);
          return;
        }

        const response = await fetch(LOGIN_ENDPOINTS.team.getById(memberId), {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "Workspace-ID": workspaceId || "",
          },
        });

        if (response.ok) {
          const result = await response.json();
          console.log("API Response:", result); // Debug log
          // Backend returns { success: true, data: {...} }
          const memberInfo = result.data || result;
          console.log("Member Info:", memberInfo); // Debug log
          console.log("Skills from API:", memberInfo.skills); // Debug skills
          
          // Handle skills - could be array or string
          let skillsArray = [];
          if (memberInfo.skills) {
            if (Array.isArray(memberInfo.skills)) {
              skillsArray = memberInfo.skills;
            } else if (typeof memberInfo.skills === 'string') {
              // If skills is a JSON string, parse it
              try {
                skillsArray = JSON.parse(memberInfo.skills);
              } catch {
                // If not JSON, split by comma
                skillsArray = memberInfo.skills.split(',').map(s => s.trim()).filter(Boolean);
              }
            }
          }
          
          setMemberData({
            id: memberInfo.id,
            name: memberInfo.name,
            email: memberInfo.email,
            role: memberInfo.role || "DEVELOPER",
            skills: skillsArray,
            capacityHours: memberInfo.capacityHours || 40,
            assignedHours: memberInfo.assignedHours || 0,
            remainingHours: (memberInfo.capacityHours || 40) - (memberInfo.assignedHours || 0),
            status: memberInfo.status || "available",
          });
          setEditForm({
            name: memberInfo.name || "",
            skills: skillsArray.join(", "),
            capacityHours: memberInfo.capacityHours || 40,
          });
        } else {
          setMemberData({
            id: user?.id,
            name: user?.name || "Team Member",
            email: user?.email || "",
            role: "DEVELOPER",
            skills: [],
            capacityHours: 40,
            assignedHours: 0,
            status: "available",
          });
        }
      } catch (err) {
        console.error("Error fetching member data:", err);
        setMemberData({
          id: user?.id,
          name: user?.name || "Team Member",
          email: user?.email || "",
          role: "DEVELOPER",
          skills: [],
          capacityHours: 40,
          assignedHours: 0,
          status: "available",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchMemberData();
  }, [user]);

  const handleUpdateProfile = async () => {
    try {
      setSaving(true);
      const memberId = user?.id;
      const workspaceId = localStorage.getItem("workspaceId");
      
      const skillsArray = editForm.skills.split(",").map(s => s.trim()).filter(Boolean);

      const updateData = {
        name: editForm.name,
        skills: skillsArray,
        capacityHours: parseInt(editForm.capacityHours) || 40,
      };

      const response = await fetch(LOGIN_ENDPOINTS.team.update(memberId), {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Workspace-ID": workspaceId || "",
        },
        body: JSON.stringify(updateData),
      });

      if (response.ok) {
        const result = await response.json();
        console.log("Update Response:", result); // Debug log
        // Backend returns { success: true, updated: {...} }
        const updatedInfo = result.updated || result;
        
        // Handle skills from response - could be array or string
        let updatedSkills = skillsArray;
        if (updatedInfo.skills) {
          if (Array.isArray(updatedInfo.skills)) {
            updatedSkills = updatedInfo.skills;
          } else if (typeof updatedInfo.skills === 'string') {
            try {
              updatedSkills = JSON.parse(updatedInfo.skills);
            } catch {
              updatedSkills = updatedInfo.skills.split(',').map(s => s.trim()).filter(Boolean);
            }
          }
        }
        
        const newCapacity = updatedInfo.capacityHours || parseInt(editForm.capacityHours) || 40;
        const assigned = updatedInfo.assignedHours ?? memberData?.assignedHours ?? 0;
        
        setMemberData(prev => ({ 
          ...prev,
          name: updatedInfo.name || editForm.name || prev.name,
          skills: updatedSkills,
          capacityHours: newCapacity,
          assignedHours: assigned,
          remainingHours: newCapacity - assigned,
          status: updatedInfo.status || prev.status,
        }));
        setEditProfileOpen(false);
      } else {
        alert("Failed to update skills");
      }
    } catch (err) {
      console.error("Error updating profile:", err);
      alert("Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const openEditModal = () => {
    setEditForm({
      name: memberData?.name || "",
      skills: memberData?.skills?.join(", ") || "",
      capacityHours: memberData?.capacityHours || 40,
    });
    setEditProfileOpen(true);
  };

  const navigationItems = [
    { id: "dashboard", label: "Dashboard", icon: "📊" },
    { id: "myTasks", label: "My Tasks", icon: "✅" },
    { id: "skills", label: "My Skills", icon: "🎯" },
    { id: "profile", label: "Profile", icon: "👤" },
  ];

  const initials = (memberData?.name || user?.name || "TM")
    .split(" ")
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return <DashboardContent memberData={memberData} />;
      case "myTasks":
        return <MyTasksContent memberData={memberData} />;
      case "skills":
        return (
          <SkillsContent 
            memberData={memberData} 
            onEditSkills={openEditModal} 
          />
        );
      case "profile":
        return (
          <ProfileContent 
            memberData={memberData} 
            onEditProfile={openEditModal}
          />
        );
      default:
        return <DashboardContent memberData={memberData} />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-surface to-surfaceLight flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-primary mx-auto mb-4"></div>
          <p className="text-textSecondary">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-surface to-surfaceLight text-textPrimary font-sans">
      <header className="bg-gradient-to-r from-primaryDark via-primary to-primaryLight backdrop-blur-lg py-4 px-4 md:px-6 sticky top-0 z-50 shadow-xl border-b border-primary">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden text-white hover:text-surfaceLight transition-colors p-2 -m-2"
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
                <h1 className="text-lg md:text-2xl font-bold text-white tracking-wide drop-shadow-sm">ScrumAI</h1>
                <p className="text-xs text-white/70 hidden md:block">{workspaceName}</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden lg:flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2 bg-white/15 backdrop-blur-sm rounded-lg px-3 py-2 border border-white/20">
                <div className="w-2 h-2 bg-success rounded-full animate-pulse"></div>
                <span className="text-white font-medium">Active</span>
              </div>
              <div className="flex items-center gap-2 bg-white/15 backdrop-blur-sm rounded-lg px-3 py-2 border border-white/20">
                <span className="text-white font-semibold">{memberData?.skills?.length || 0}</span>
                <span className="text-white/80">Skills</span>
              </div>
            </div>

            <div className="hidden md:flex items-center gap-2 text-sm text-white/80">
              <span>Welcome,</span>
              <span className="text-white font-medium">{memberData?.name || user?.name || "Team Member"}</span>
            </div>
            
            <div className="relative">
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                className="w-10 h-10 rounded-full bg-gradient-to-r from-secondary to-accent text-white font-bold flex items-center justify-center shadow-lg hover:shadow-xl transition-all ring-2 ring-white/20"
              >
                {initials}
              </button>

              {profileOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="absolute right-0 mt-3 w-64 bg-white border border-border rounded-2xl shadow-2xl py-4 z-50"
                >
                  <div className="px-4 pb-3 border-b border-border">
                    <p className="text-sm font-semibold text-textPrimary">{memberData?.name || user?.name}</p>
                    <p className="text-xs text-textSecondary">{memberData?.email || user?.email}</p>
                    <div className="mt-2 flex items-center gap-2">
                      <span className="px-2 py-1 bg-primary/10 rounded-lg text-xs text-primary font-medium">Developer</span>
                    </div>
                    <div className="mt-2 flex items-center gap-1 text-xs text-textSecondary">
                      <span>🏢</span>
                      <span>{workspaceName}</span>
                    </div>
                  </div>
                  <div className="py-2">
                    <button onClick={() => { setActiveTab("profile"); setProfileOpen(false); }} className="w-full text-left px-4 py-2 text-sm text-textSecondary hover:bg-surface transition-colors">View Profile</button>
                    <button onClick={() => { setActiveTab("skills"); setProfileOpen(false); }} className="w-full text-left px-4 py-2 text-sm text-textSecondary hover:bg-surface transition-colors">Manage Skills</button>
                  </div>
                  <div className="border-t border-border px-4 pt-2">
                    <button onClick={logout} className="w-full text-left py-2 text-sm text-error hover:bg-error/10 rounded-lg transition-colors flex items-center gap-2 px-2">
                      <span>🚪</span> Logout
                    </button>
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </header>

      {sidebarOpen && <div className="lg:hidden fixed inset-0 bg-black/50 z-40" onClick={() => setSidebarOpen(false)} />}

      <div className="flex">
        <motion.aside
          initial={false}
          animate={{ x: sidebarOpen ? 0 : -280 }}
          transition={{ duration: 0.3 }}
          className="fixed lg:hidden top-0 left-0 h-full w-72 bg-gradient-to-b from-primaryDark via-primary to-primaryLight border-r border-primary z-40 overflow-y-auto"
        >
          <div className="p-6 pt-20 space-y-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-r from-secondary to-accent rounded-xl flex items-center justify-center text-white font-bold shadow-lg">{initials}</div>
              <div>
                <p className="text-white font-semibold">{memberData?.name}</p>
                <p className="text-white/70 text-sm">Developer</p>
              </div>
            </div>
            <nav className="space-y-2">
              {navigationItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => { setActiveTab(item.id); setSidebarOpen(false); }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === item.id ? "bg-white/20 text-white shadow-lg" : "text-white/70 hover:bg-white/10 hover:text-white"}`}
                >
                  <span className="text-xl">{item.icon}</span>
                  <span className="font-medium">{item.label}</span>
                </button>
              ))}
            </nav>
          </div>
        </motion.aside>

        <aside className="hidden lg:block w-64 bg-white border-r border-border shadow-lg min-h-screen sticky top-[73px]">
          <div className="p-6 space-y-6">
            <div className="bg-gradient-to-br from-primary/10 to-secondary/10 rounded-2xl p-4 border border-primary/20">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 bg-gradient-to-r from-primary to-secondary rounded-xl flex items-center justify-center text-white font-bold shadow-lg">{initials}</div>
                <div>
                  <p className="font-semibold text-textPrimary">{memberData?.name}</p>
                  <p className="text-xs text-textSecondary">Developer</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs text-textSecondary">
                <span className="w-2 h-2 bg-success rounded-full"></span>
                <span>Online</span>
              </div>
            </div>

            <nav className="space-y-2">
              {navigationItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === item.id ? "bg-gradient-to-r from-primary to-primaryDark text-white shadow-lg" : "text-textSecondary hover:bg-surface hover:text-textPrimary"}`}
                >
                  <span className="text-xl">{item.icon}</span>
                  <span className="font-medium">{item.label}</span>
                </button>
              ))}
            </nav>
          </div>
        </aside>

        <main className="flex-1 p-6">
          <motion.div key={activeTab} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="max-w-6xl mx-auto">
            {renderContent()}
          </motion.div>
        </main>
      </div>

      {editProfileOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-2xl p-6 max-w-lg w-full shadow-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-textPrimary mb-6">Edit Profile</h3>
            
            {/* Name Field */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-textPrimary mb-2">Name</label>
              <input
                type="text"
                value={editForm.name}
                onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-4 py-3 border border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-primary bg-surface text-textPrimary"
                placeholder="Enter your name"
              />
            </div>

            {/* Capacity Hours Field */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-textPrimary mb-2">Weekly Capacity (hours)</label>
              <input
                type="number"
                value={editForm.capacityHours}
                onChange={(e) => setEditForm(prev => ({ ...prev, capacityHours: e.target.value }))}
                className="w-full px-4 py-3 border border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-primary bg-surface text-textPrimary"
                placeholder="40"
                min="1"
                max="168"
              />
              <p className="text-xs text-textSecondary mt-1">How many hours you can work per week</p>
            </div>

            {/* Skills Field */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-textPrimary mb-2">Skills</label>
              <textarea
                value={editForm.skills}
                onChange={(e) => setEditForm(prev => ({ ...prev, skills: e.target.value }))}
                className="w-full px-4 py-3 border border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-primary bg-surface text-textPrimary min-h-[100px] resize-none"
                placeholder="React, Node.js, Python, Django..."
              />
              <p className="text-xs text-textSecondary mt-1">Enter your skills separated by commas</p>
            </div>

            <div className="flex gap-4 justify-end">
              <button onClick={() => setEditProfileOpen(false)} className="px-6 py-2 border border-border text-textSecondary rounded-xl hover:bg-surface transition-colors">Cancel</button>
              <button onClick={handleUpdateProfile} disabled={saving} className="px-6 py-2 bg-gradient-to-r from-primary to-primaryDark text-white rounded-xl hover:shadow-lg transition-all disabled:opacity-50">{saving ? "Saving..." : "Save Changes"}</button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

function DashboardContent({ memberData }) {
  const getStatusColor = (status) => {
    switch (status) {
      case "overloaded": return "text-error";
      case "high_load": return "text-warning";
      default: return "text-success";
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case "overloaded": return "Overloaded";
      case "high_load": return "High Load";
      default: return "Available";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "overloaded": return "🔴";
      case "high_load": return "🟡";
      default: return "🟢";
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-primary via-primaryDark to-primary rounded-2xl p-8 text-white shadow-xl">
        <h1 className="text-3xl font-bold mb-2">Welcome back, {memberData?.name?.split(" ")[0] || "Developer"}! 👋</h1>
        <p className="text-white/80 text-lg">Ready to crush some tasks today? Here is your overview.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white rounded-2xl p-6 border border-border shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500/20 to-blue-500/10 rounded-xl flex items-center justify-center"><span className="text-2xl">🎯</span></div>
            <span className="text-3xl font-bold text-primary">{memberData?.skills?.length || 0}</span>
          </div>
          <h3 className="text-textSecondary text-sm font-medium">Total Skills</h3>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white rounded-2xl p-6 border border-border shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-green-500/20 to-green-500/10 rounded-xl flex items-center justify-center"><span className="text-2xl">⏱️</span></div>
            <span className="text-3xl font-bold text-success">{memberData?.capacityHours || 40}h</span>
          </div>
          <h3 className="text-textSecondary text-sm font-medium">Weekly Capacity</h3>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-white rounded-2xl p-6 border border-border shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500/20 to-purple-500/10 rounded-xl flex items-center justify-center"><span className="text-2xl">📊</span></div>
            <span className="text-3xl font-bold text-purple-600">{memberData?.assignedHours || 0}h</span>
          </div>
          <h3 className="text-textSecondary text-sm font-medium">Assigned Hours</h3>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="bg-white rounded-2xl p-6 border border-border shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-orange-500/20 to-orange-500/10 rounded-xl flex items-center justify-center"><span className="text-2xl">{getStatusIcon(memberData?.status)}</span></div>
            <span className={`text-2xl font-bold ${getStatusColor(memberData?.status)}`}>{getStatusLabel(memberData?.status)}</span>
          </div>
          <h3 className="text-textSecondary text-sm font-medium">Workload Status</h3>
        </motion.div>
      </div>

      {/* Workload Progress Bar */}
      <div className="bg-white rounded-2xl p-6 border border-border shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-textPrimary">Workload Overview</h2>
          <span className="text-sm text-textSecondary">
            {memberData?.assignedHours || 0}h / {memberData?.capacityHours || 40}h used
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-4 mb-4">
          <div 
            className={`h-4 rounded-full transition-all ${
              memberData?.status === "overloaded" ? "bg-error" : 
              memberData?.status === "high_load" ? "bg-warning" : "bg-success"
            }`}
            style={{ width: `${Math.min(((memberData?.assignedHours || 0) / (memberData?.capacityHours || 40)) * 100, 100)}%` }}
          ></div>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-textSecondary">Remaining: <span className="font-semibold text-textPrimary">{memberData?.remainingHours || (memberData?.capacityHours || 40) - (memberData?.assignedHours || 0)}h</span></span>
          <span className={`font-medium ${getStatusColor(memberData?.status)}`}>{getStatusLabel(memberData?.status)}</span>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-6 border border-border shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-textPrimary">Your Skills</h2>
          <span className="text-sm text-textSecondary">Quick preview</span>
        </div>
        <div className="flex flex-wrap gap-3">
          {memberData?.skills?.length > 0 ? (
            memberData.skills.map((skill, index) => (
              <span key={index} className="px-4 py-2 bg-gradient-to-r from-primary/10 to-secondary/10 text-primary rounded-full text-sm font-medium border border-primary/20">{skill}</span>
            ))
          ) : (
            <p className="text-textSecondary">No skills added yet. Go to Skills tab to add your skills!</p>
          )}
        </div>
      </div>
    </div>
  );
}

function MyTasksContent({ memberData }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-textPrimary">My Tasks</h1>
      </div>
      <div className="bg-white rounded-2xl p-8 border border-border shadow-sm text-center">
        <div className="w-20 h-20 bg-gradient-to-br from-primary/10 to-secondary/10 rounded-full flex items-center justify-center mx-auto mb-4"><span className="text-4xl">📋</span></div>
        <h3 className="text-xl font-semibold text-textPrimary mb-2">No Tasks Assigned Yet</h3>
        <p className="text-textSecondary max-w-md mx-auto">Tasks will appear here once your Scrum Master assigns work to you. Check back later or contact your team lead.</p>
      </div>
    </div>
  );
}

function SkillsContent({ memberData, onEditSkills }) {
  const skills = memberData?.skills || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-textPrimary">My Skills</h1>
          <p className="text-textSecondary mt-1">Manage your technical skills and expertise</p>
        </div>
        <button onClick={onEditSkills} className="px-6 py-3 bg-gradient-to-r from-primary to-primaryDark text-white rounded-xl hover:shadow-lg transition-all flex items-center gap-2 font-medium">
          <span>✏️</span>Edit Skills
        </button>
      </div>

      <div className="bg-white rounded-2xl p-6 border border-border shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-xl flex items-center justify-center"><span className="text-2xl">🎯</span></div>
          <div>
            <h2 className="text-lg font-semibold text-textPrimary">Technical Skills</h2>
            <p className="text-sm text-textSecondary">{skills.length} skills listed</p>
          </div>
        </div>

        {skills.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {skills.map((skill, index) => (
              <motion.div key={index} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: index * 0.05 }} className="bg-gradient-to-br from-surface to-surfaceLight rounded-xl p-4 border border-border hover:shadow-md transition-all text-center">
                <div className="w-10 h-10 bg-gradient-to-r from-primary to-secondary rounded-lg flex items-center justify-center mx-auto mb-3">
                  <span className="text-white font-bold text-sm">{skill.charAt(0).toUpperCase()}</span>
                </div>
                <p className="font-medium text-textPrimary">{skill}</p>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="w-20 h-20 bg-gradient-to-br from-primary/10 to-secondary/10 rounded-full flex items-center justify-center mx-auto mb-4"><span className="text-4xl">🎓</span></div>
            <h3 className="text-lg font-semibold text-textPrimary mb-2">No Skills Added Yet</h3>
            <p className="text-textSecondary mb-6 max-w-md mx-auto">Add your technical skills to help your Scrum Master assign tasks that match your expertise.</p>
            <button onClick={onEditSkills} className="px-6 py-3 bg-gradient-to-r from-primary to-primaryDark text-white rounded-xl hover:shadow-lg transition-all">Add Your First Skill</button>
          </div>
        )}
      </div>

      <div className="bg-gradient-to-r from-secondary/10 to-accent/10 rounded-2xl p-6 border border-secondary/20">
        <h3 className="font-semibold text-textPrimary mb-3 flex items-center gap-2"><span>💡</span> Tips for Adding Skills</h3>
        <ul className="text-sm text-textSecondary space-y-2">
          <li>• Include programming languages you are proficient in (e.g., Python, JavaScript)</li>
          <li>• Add frameworks and libraries (e.g., React, Django, Node.js)</li>
          <li>• Mention tools and technologies (e.g., Docker, Git, AWS)</li>
          <li>• Include soft skills relevant to development (e.g., Code Review, Testing)</li>
        </ul>
      </div>
    </div>
  );
}

function ProfileContent({ memberData, onEditProfile }) {
  const getStatusColor = (status) => {
    switch (status) {
      case "overloaded": return { bg: "bg-error/10", text: "text-error", dot: "bg-error" };
      case "high_load": return { bg: "bg-warning/10", text: "text-warning", dot: "bg-warning" };
      default: return { bg: "bg-success/10", text: "text-success", dot: "bg-success" };
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case "overloaded": return "Overloaded";
      case "high_load": return "High Load";
      default: return "Available";
    }
  };

  const statusStyle = getStatusColor(memberData?.status);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-textPrimary">My Profile</h1>
        <button onClick={onEditProfile} className="px-4 py-2 bg-gradient-to-r from-primary to-primaryDark text-white rounded-xl hover:shadow-lg transition-all flex items-center gap-2 text-sm font-medium">
          <span>✏️</span> Edit Profile
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
        <div className="h-32 bg-gradient-to-r from-primary via-primaryDark to-secondary"></div>
        <div className="px-6 pb-6 pt-2">
          <div className="flex flex-col md:flex-row md:items-start gap-4 -mt-16">
            <div className="w-24 h-24 bg-gradient-to-r from-secondary to-accent rounded-2xl flex items-center justify-center text-white font-bold text-3xl shadow-xl border-4 border-white flex-shrink-0">
              {(memberData?.name || "TM").split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase()}
            </div>
            <div className="flex-1 bg-white rounded-xl p-4 shadow-sm border border-border mt-8 md:mt-4">
              <h2 className="text-2xl font-bold text-textPrimary">{memberData?.name || "Team Member"}</h2>
              <p className="text-textSecondary mt-1">{memberData?.email}</p>
              <div className="flex items-center gap-2 mt-3 flex-wrap">
                <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium">{memberData?.role || "Developer"}</span>
                <span className={`px-3 py-1 ${statusStyle.bg} ${statusStyle.text} rounded-full text-sm font-medium flex items-center gap-1`}>
                  <span className={`w-2 h-2 ${statusStyle.dot} rounded-full`}></span>{getStatusLabel(memberData?.status)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl p-6 border border-border shadow-sm">
          <h3 className="font-semibold text-textPrimary mb-4 flex items-center gap-2"><span>📧</span> Contact Information</h3>
          <div className="space-y-4">
            <div>
              <label className="text-xs text-textSecondary uppercase tracking-wide">Email</label>
              <p className="text-textPrimary font-medium">{memberData?.email || "Not set"}</p>
            </div>
            <div>
              <label className="text-xs text-textSecondary uppercase tracking-wide">Member ID</label>
              <p className="text-textPrimary font-medium">#{memberData?.id || "N/A"}</p>
            </div>
            <div>
              <label className="text-xs text-textSecondary uppercase tracking-wide">Role</label>
              <p className="text-textPrimary font-medium">{memberData?.role || "Developer"}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-border shadow-sm">
          <h3 className="font-semibold text-textPrimary mb-4 flex items-center gap-2"><span>⏱️</span> Workload Details</h3>
          <div className="space-y-4">
            <div>
              <label className="text-xs text-textSecondary uppercase tracking-wide">Weekly Capacity</label>
              <p className="text-textPrimary font-medium">{memberData?.capacityHours || 40} hours</p>
            </div>
            <div>
              <label className="text-xs text-textSecondary uppercase tracking-wide">Assigned Hours</label>
              <p className="text-textPrimary font-medium">{memberData?.assignedHours || 0} hours</p>
            </div>
            <div>
              <label className="text-xs text-textSecondary uppercase tracking-wide">Remaining Hours</label>
              <p className="text-textPrimary font-medium">{memberData?.remainingHours || (memberData?.capacityHours || 40) - (memberData?.assignedHours || 0)} hours</p>
            </div>
            <div>
              <label className="text-xs text-textSecondary uppercase tracking-wide">Workload Status</label>
              <p className={`font-medium ${statusStyle.text}`}>{getStatusLabel(memberData?.status)}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-6 border border-border shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-textPrimary flex items-center gap-2"><span>🎯</span> Skills and Expertise</h3>
          <button onClick={onEditProfile} className="text-primary hover:text-primaryDark font-medium text-sm flex items-center gap-1"><span>✏️</span> Edit</button>
        </div>
        <div className="flex flex-wrap gap-2">
          {memberData?.skills?.length > 0 ? (
            memberData.skills.map((skill, index) => (
              <span key={index} className="px-4 py-2 bg-gradient-to-r from-primary/10 to-secondary/10 text-primary rounded-full text-sm font-medium border border-primary/20">{skill}</span>
            ))
          ) : (
            <p className="text-textSecondary">No skills added yet</p>
          )}
        </div>
      </div>
    </div>
  );
}
