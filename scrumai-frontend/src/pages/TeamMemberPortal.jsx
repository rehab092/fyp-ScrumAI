import React, { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useAuth } from "../contexts/AuthContext";
import MemberDashboard from "../components/member-portal/MemberDashboard";
import MyTasksBoard from "../components/member-portal/MyTasksBoard";
import TaskDetailsModal from "../components/member-portal/TaskDetailsModal";
import NotificationsPanel from "../components/member-portal/NotificationsPanel";
import ProfileAndSkills from "../components/member-portal/ProfileAndSkills";

export default function TeamMemberPortal() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedTask, setSelectedTask] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  // Demo data – in your full system this would come from the API using user.id
  const demoSprint = {
    id: "Sprint 24",
    name: "Q4 Feature Release",
    startDate: "2024-12-16",
    endDate: "2024-12-30",
    goal: "Deliver the first production‑ready version of the ScrumAI portals.",
  };

  const demoUser = useMemo(
    () => ({
      id: user?.id || "member-1",
      name: user?.name || "Alex Johnson",
      email: user?.email || "alex.johnson@example.com",
      capacityHours: 40,
      skills: ["React", "Node.js", "CI/CD"],
      preferredAreas: ["Frontend", "APIs"],
      availability: "Full‑time (40h / week)",
    }),
    [user]
  );

  const [tasks, setTasks] = useState(() => [
    {
      id: "TASK-101",
      title: "Implement team member sprint overview",
      storyId: "STORY-12",
      sprintId: demoSprint.id,
      priority: "High",
      effortHours: 8,
      requiredSkills: ["React", "Tailwind", "UX"],
      category: "Frontend",
      status: "in_progress",
      description:
        "Create the 'My Sprint Overview' section for team members, showing their progress, workload, and critical tasks.",
      assignedTo: demoUser.id,
      dueStatus: "today",
    },
    {
      id: "TASK-102",
      title: "Connect personal workload chart",
      storyId: "STORY-12",
      sprintId: demoSprint.id,
      priority: "Medium",
      effortHours: 5,
      requiredSkills: ["React", "Charts"],
      category: "Frontend",
      status: "todo",
      description:
        "Display a simple capacity bar for the current team member, using their assigned tasks vs capacity.",
      assignedTo: demoUser.id,
      dueStatus: "upcoming",
    },
    {
      id: "TASK-103",
      title: "Improve blocked task messaging",
      storyId: "STORY-9",
      sprintId: demoSprint.id,
      priority: "High",
      effortHours: 3,
      requiredSkills: ["React"],
      category: "Frontend",
      status: "blocked",
      blockedReason: "Waiting for API contract from backend team.",
      description:
        "Ensure that blocked tasks clearly show the reason so the Scrum Master can act.",
      assignedTo: demoUser.id,
      dueStatus: "overdue",
    },
    {
      id: "TASK-104",
      title: "Refactor notification cards",
      storyId: "STORY-14",
      sprintId: "Sprint 23",
      priority: "Low",
      effortHours: 2,
      requiredSkills: ["React"],
      category: "Frontend",
      status: "done",
      description: "Polish notification styles to match the new design system.",
      assignedTo: demoUser.id,
      dueStatus: "upcoming",
    },
  ]);

  const [notifications] = useState(() => [
    {
      id: 1,
      type: "assigned",
      message: "New task assigned: Implement team member sprint overview",
      time: "5 min ago",
      taskId: "TASK-101",
      icon: "📝",
    },
    {
      id: 2,
      type: "due",
      message: "Task TASK-103 is overdue. Clarify the blocker with your Scrum Master.",
      time: "2 hours ago",
      taskId: "TASK-103",
      icon: "⏰",
    },
    {
      id: 3,
      type: "overload",
      message: "You are close to 90% capacity in this sprint. Consider re‑prioritising.",
      time: "Today",
      icon: "⚠️",
    },
    {
      id: 4,
      type: "dependency",
      message:
        "Dependency warning: 'Implement member portal' depends on 'Define API schema' which is delayed.",
      time: "Yesterday",
      icon: "🔗",
    },
  ]);

  const handleOpenTask = (taskOrId) => {
    const task =
      typeof taskOrId === "string"
        ? tasks.find((t) => t.id === taskOrId)
        : taskOrId;
    if (!task) return;
    setSelectedTask(task);
    setModalOpen(true);
  };

  const handleStatusChange = (task, nextStatus, blockedReason) => {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === task.id
          ? {
              ...t,
              status: nextStatus,
              blockedReason:
                nextStatus === "blocked" ? blockedReason || t.blockedReason : "",
            }
          : t
      )
    );
  };

  const handleLogWork = (task, hours) => {
    // For the FYP front‑end demo we only log to console. In a real app this
    // would call the backend and feed into burndown / capacity analytics.
    // eslint-disable-next-line no-console
    console.log("Log work", { taskId: task.id, hours });
  };

  const navigationItems = [
    { id: "overview", label: "My Sprint", icon: "🏠" },
    { id: "tasks", label: "My Tasks", icon: "✅" },
    { id: "history", label: "My History", icon: "📈" },
    { id: "profile", label: "Profile & Skills", icon: "👤" },
  ];

  const myTasks = useMemo(
    () => tasks.filter((task) => task.assignedTo === demoUser.id),
    [tasks, demoUser.id]
  );
  const myCompletedTasks = myTasks.filter((t) => t.status === "done").length;
  const dueTodayCount = myTasks.filter((t) => t.dueStatus === "today").length;
  const overdueCount = myTasks.filter((t) => t.dueStatus === "overdue").length;
  const blockedCount = myTasks.filter((t) => t.status === "blocked").length;
  const capacityHours = demoUser.capacityHours ?? 40;
  const assignedHours = myTasks.reduce(
    (sum, t) => sum + (t.effortHours || 0),
    0
  );
  const capacityPct = capacityHours
    ? Math.round((assignedHours / capacityHours) * 100)
    : 0;
  const focusTask =
    myTasks.find((task) => task.status !== "done") || myTasks[0];

  const quickStats = [
    {
      label: "My Completed Tasks",
      value: `${myCompletedTasks}/${myTasks.length || 0}`,
      sublabel: "This sprint",
      accent: "text-white",
    },
    {
      label: "Capacity Load",
      value: `${capacityPct}%`,
      sublabel: `${assignedHours}h / ${capacityHours}h`,
      accent:
        capacityPct > 100
          ? "text-error"
          : capacityPct >= 80
          ? "text-warning"
          : "text-success",
    },
    {
      label: "Focus Task",
      value: focusTask?.title || "All clear",
      sublabel: focusTask?.storyId
        ? `Story ${focusTask.storyId}`
        : "Pick your next win",
      accent: "text-white",
    },
  ];

  const highlightCards = [
    {
      icon: "🎯",
      title: "Next Deliverable",
      value: focusTask?.title || "No active task",
      meta: focusTask
        ? `Priority • ${focusTask.priority}`
        : "Enjoy the calm",
    },
    {
      icon: "⏱️",
      title: "Capacity Pulse",
      value: `${assignedHours}h / ${capacityHours}h`,
      meta: `${capacityPct}% • ${
        capacityPct >= 100
          ? "Overloaded"
          : capacityPct >= 80
          ? "Near limit"
          : "Healthy flow"
      }`,
    },
    {
      icon: "📌",
      title: "Today’s Radar",
      value: `${dueTodayCount} due • ${overdueCount} overdue`,
      meta: blockedCount
        ? `${blockedCount} blocked — flag your Scrum Master`
        : "No blockers reported",
    },
  ];

  const creativeSpark = {
    mood: capacityPct >= 100 ? "🔥 Stretch Mode" : "🌊 Smooth Flow",
    tip:
      capacityPct >= 100
        ? "Consider nudging your Scrum Master—load balance saves the sprint."
        : "Perfect moment to grab a learning task or help unblock a teammate.",
    inspiration:
      focusTask?.description ||
      "Stay curious. Document your wins—they become tomorrow’s playbook.",
  };

  const renderContent = () => {
    switch (activeTab) {
      case "overview":
        return (
          <div className="space-y-6">
            <MemberDashboard
              currentUser={demoUser}
              tasks={tasks}
              sprint={demoSprint}
            />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <MyTasksBoard
                  tasks={tasks}
                  currentUser={demoUser}
                  onTaskClick={handleOpenTask}
                  onStatusChange={handleStatusChange}
                />
              </div>
              <NotificationsPanel
                notifications={notifications}
                onViewTask={(taskId) => handleOpenTask(taskId)}
              />
            </div>
          </div>
        );
      case "tasks":
        return (
          <MyTasksBoard
            tasks={tasks}
            currentUser={demoUser}
            onTaskClick={handleOpenTask}
            onStatusChange={handleStatusChange}
          />
        );
      case "history":
        return (
          <div className="max-w-4xl space-y-6">
            <div className="bg-white border border-border rounded-2xl p-6">
              <h2 className="text-xl font-semibold text-textPrimary mb-1">
                Personal History & Performance
              </h2>
              <p className="text-sm text-textSecondary mb-3">
                This section is designed to host charts like{" "}
                <span className="font-semibold">completed tasks per sprint</span>{" "}
                and{" "}
                <span className="font-semibold">
                  hours delivered vs capacity
                </span>{" "}
                over time. For now it gives you a clear spot in the{" "}
                team‑member portal to showcase those analytics in your FYP
                report.
              </p>
              <ul className="list-disc list-inside text-sm text-textSecondary space-y-1">
                <li>Tasks completed in the last sprint: 3</li>
                <li>Average capacity usage over the last 3 sprints: 82%</li>
                <li>Most frequent work area: Frontend</li>
              </ul>
            </div>
          </div>
        );
      case "profile":
        return <ProfileAndSkills currentUser={demoUser} />;
      default:
        return <MemberDashboard currentUser={demoUser} tasks={tasks} sprint={demoSprint} />;
    }
  };

  const initials = demoUser.name
    .split(" ")
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-surface to-surfaceLight text-textPrimary font-sans">
      {/* Header */}
      <header className="bg-gradient-to-r from-primaryDark via-primary to-primaryLight backdrop-blur-lg py-4 px-4 md:px-6 sticky top-0 z-50 shadow-xl border-b border-primary">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden text-white hover:text-surfaceLight transition-colors p-2 -m-2"
              aria-label="Toggle sidebar"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
            <div className="w-10 h-10 bg-gradient-to-r from-secondary to-accent rounded-xl flex items-center justify-center shadow-lg ring-2 ring-white/20">
              <span className="text-white font-bold text-lg">S</span>
            </div>
            <div>
              <h1 className="text-lg md:text-2xl font-bold text-white tracking-wide drop-shadow-sm">
                Team Member Portal
              </h1>
              <p className="text-xs text-white/80">
                Personal cockpit for sprints, workload, and focus.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden xl:flex items-center gap-4 text-xs text-white/80">
              {quickStats.map((stat) => (
                <div
                  key={stat.label}
                  className="px-3 py-2 bg-white/10 rounded-xl border border-white/20 backdrop-blur-sm"
                >
                  <p className="uppercase tracking-wide text-[10px]">
                    {stat.label}
                  </p>
                  <p className={`text-sm font-semibold ${stat.accent}`}>
                    {stat.value}
                  </p>
                  <p className="text-[10px]">{stat.sublabel}</p>
                </div>
              ))}
            </div>
            <div className="hidden md:flex flex-col text-right">
              <span className="text-xs text-white/80">Signed in as</span>
              <span className="text-sm text-white font-medium">
                {demoUser.name}
              </span>
            </div>
            <div className="relative">
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                className="w-10 h-10 rounded-full bg-white/15 text-white font-bold flex items-center justify-center shadow-lg hover:shadow-xl transition-all ring-2 ring-white/30"
              >
                {initials}
              </button>
              {profileOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute right-0 mt-3 w-64 bg-white border border-border rounded-2xl shadow-2xl py-4 z-50"
                >
                  <div className="px-4 pb-3 border-b border-border">
                    <p className="text-sm font-semibold text-textPrimary">
                      {demoUser.name}
                    </p>
                    <p className="text-xs text-textSecondary">
                      {demoUser.email}
                    </p>
                    <p className="mt-2 text-[11px] text-textMuted">
                      Fueling Sprint 24
                    </p>
                  </div>
                  <div className="py-2">
                    <button className="w-full text-left px-4 py-2 text-sm text-textSecondary hover:bg-surface transition-colors">
                      View profile
                    </button>
                    <button className="w-full text-left px-4 py-2 text-sm text-textSecondary hover:bg-surface transition-colors">
                      My notifications
                    </button>
                  </div>
                  <div className="border-t border-border px-4 pt-2">
                    <button
                      onClick={logout}
                      className="w-full text-left px-4 py-2 text-sm text-error hover:bg-error/10 transition-colors flex items-center gap-2"
                    >
                      <span>🚪</span> Logout
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

      <div className="flex">
        {/* Mobile Sidebar */}
        <motion.aside
          initial={false}
          animate={{
            x: sidebarOpen ? 0 : -280,
            width: sidebarOpen ? "280px" : "0px",
          }}
          transition={{ duration: 0.3 }}
          className="fixed lg:hidden top-0 left-0 h-full bg-gradient-to-b from-primaryDark via-primary to-primaryLight backdrop-blur-sm border-r border-primary z-40 overflow-y-auto"
        >
          <div className="p-6 space-y-6">
            <div>
              <div className="w-12 h-12 bg-gradient-to-r from-secondary to-accent rounded-xl flex items-center justify-center text-white font-bold text-xl ring-2 ring-white/20 mb-3">
                TM
              </div>
              <p className="text-white font-semibold">Welcome back,</p>
              <p className="text-white/80 text-sm">{demoUser.name}</p>
            </div>
            <nav className="space-y-2">
              {navigationItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
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
        <aside className="hidden lg:block w-72 bg-white/98 backdrop-blur-sm border-r border-border shadow-xl min-h-screen">
          <div className="p-6 space-y-6">
            <div className="p-4 rounded-2xl bg-gradient-to-br from-primary/10 to-secondary/10 border border-primary/20">
              <p className="text-xs text-textMuted uppercase tracking-wide mb-1">
                Sprint 24
              </p>
              <p className="text-sm font-semibold text-textPrimary">
                {demoSprint.name}
              </p>
              <p className="text-xs text-textSecondary">
                {demoSprint.startDate} → {demoSprint.endDate}
              </p>
            </div>
            <nav className="space-y-2">
              {navigationItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all ${
                    activeTab === item.id
                      ? "bg-gradient-to-r from-primaryDark to-primary text-white shadow-lg ring-2 ring-primary/20"
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

        {/* Main content */}
        <main className="flex-1 p-4 md:p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="grid grid-cols-1 md:grid-cols-3 gap-4"
            >
              {highlightCards.map((card) => (
                <div
                  key={card.title}
                  className="p-4 rounded-2xl border border-border bg-white/90 shadow-sm hover:shadow-md transition-all"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-2xl">{card.icon}</span>
                    <p className="text-xs uppercase tracking-wide text-textMuted">
                      {card.title}
                    </p>
                  </div>
                  <p className="text-lg font-semibold text-textPrimary">
                    {card.value}
                  </p>
                  <p className="text-xs text-textSecondary mt-1">{card.meta}</p>
                </div>
              ))}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-gradient-to-r from-surface to-surfaceLight border border-border rounded-2xl p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4"
            >
              <div>
                <p className="text-xs uppercase tracking-wide text-textMuted mb-1">
                  Daily Pulse
                </p>
                <h3 className="text-xl font-semibold text-textPrimary">
                  {creativeSpark.mood}
                </h3>
                <p className="text-sm text-textSecondary mt-2">
                  {creativeSpark.tip}
                </p>
              </div>
              <div className="bg-white/80 rounded-2xl p-4 border border-border shadow-inner max-w-md">
                <p className="text-xs text-primary font-semibold tracking-wide mb-1">
                  Inspiration
                </p>
                <p className="text-sm text-textPrimary leading-relaxed">
                  {creativeSpark.inspiration}
                </p>
              </div>
            </motion.div>

            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.25 }}
            >
              {renderContent()}
            </motion.div>
          </div>
        </main>
      </div>

      <TaskDetailsModal
        open={modalOpen}
        task={selectedTask}
        onClose={() => setModalOpen(false)}
        onStatusChange={handleStatusChange}
        onLogWork={handleLogWork}
      />
    </div>
  );
}


