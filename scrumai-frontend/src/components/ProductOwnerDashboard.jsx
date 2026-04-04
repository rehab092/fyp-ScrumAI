import React, { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { LOGIN_ENDPOINTS } from "../config/api";

export default function ProductOwnerDashboard() {
  const [userStories, setUserStories] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  const workspaceId = localStorage.getItem("workspaceId");
  const ownerId = localStorage.getItem("ownerId") || localStorage.getItem("userId");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      
      if (!ownerId) {
        setLoading(false);
        return;
      }

      try {
        const projectsResponse = await fetch(
          LOGIN_ENDPOINTS.projects.getByOwner(ownerId),
          { headers: { "Workspace-ID": workspaceId } }
        );
        if (projectsResponse.ok) {
          const projectsData = await projectsResponse.json();
          setProjects(Array.isArray(projectsData) ? projectsData : []);
        }
      } catch (err) {
        console.error("Error fetching projects:", err);
      }

      try {
        const storiesResponse = await fetch(
          LOGIN_ENDPOINTS.userStories.getByOwner(ownerId),
          { headers: { "Workspace-ID": workspaceId } }
        );
        if (storiesResponse.ok) {
          const storiesData = await storiesResponse.json();
          setUserStories(Array.isArray(storiesData) ? storiesData : []);
        }
      } catch (err) {
        console.error("Error fetching stories:", err);
      }
    } finally {
      setLoading(false);
    }
  }, [ownerId, workspaceId]);

  // Chart data - Sprint velocity
  const velocityData = [
    { sprint: 'Sprint 1', stories: 12, completed: 10 },
    { sprint: 'Sprint 2', stories: 15, completed: 14 },
    { sprint: 'Sprint 3', stories: 18, completed: 16 },
    { sprint: 'Sprint 4', stories: 16, completed: 14 },
    { sprint: 'Sprint 5', stories: 20, completed: 19 },
  ];

  // Story priority distribution
  const priorityData = [
    { name: 'High', value: userStories.filter(s => s.priority === 'High').length, color: '#EF4444' },
    { name: 'Medium', value: userStories.filter(s => s.priority === 'Medium').length, color: '#F59E0B' },
    { name: 'Low', value: userStories.filter(s => s.priority === 'Low').length, color: '#10B981' },
  ];

  const metrics = [
    {
      title: "Total Stories",
      value: userStories.length,
      change: `${projects.length} projects`,
      trend: "neutral",
      icon: "📚"
    },
    {
      title: "High Priority",
      value: userStories.filter(s => s.priority === 'High').length,
      change: "Requires attention",
      trend: "up",
      icon: "🔴"
    },
    {
      title: "Projects",
      value: projects.length,
      change: "Active projects",
      trend: "neutral",
      icon: "📦"
    },
    {
      title: "Backlog Ready",
      value: Math.ceil(userStories.length * 0.7),
      change: "Ready for sprint",
      trend: "up",
      icon: "✅"
    }
  ];

  const recentActivities = [
    {
      type: "story_created",
      message: "New user story created - Dashboard Enhancement",
      time: "2 hours ago",
      icon: "📝"
    },
    {
      type: "story_updated",
      message: "Updated priority for API Integration story",
      time: "4 hours ago",
      icon: "✏️"
    },
    {
      type: "project_added",
      message: "New project added - Mobile App",
      time: "6 hours ago",
      icon: "📱"
    },
    {
      type: "sprint_planned",
      message: "Sprint 5 planning completed",
      time: "8 hours ago",
      icon: "🎯"
    }
  ];

  const topStories = userStories.slice(0, 5).map((story, idx) => ({
    id: story.id,
    title: story.goal,
    project: story.project_name,
    priority: story.priority,
    status: "Ready",
    index: idx
  }));

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-surface border border-border rounded-lg p-3 shadow-lg">
          <p className="text-textPrimary font-medium">{label}</p>
          <p className="text-textSecondary text-sm">
            {payload[0].name}: {payload[0].value}
          </p>
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity }}
          className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full"
        />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
        {metrics.map((metric, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: index * 0.1 }}
            className="bg-surface border border-border rounded-2xl p-6 hover:shadow-lg transition-all duration-300"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="text-3xl">{metric.icon}</div>
              <div className={`text-sm font-medium px-2 py-1 rounded ${
                metric.trend === "up" ? "bg-success/20 text-success" : "bg-textSecondary/20 text-textSecondary"
              }`}>
                {metric.change}
              </div>
            </div>
            <div className="text-3xl font-bold text-textPrimary mb-1">{metric.value}</div>
            <div className="text-textSecondary text-sm">{metric.title}</div>
          </motion.div>
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Story Velocity Chart */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="bg-surface border border-border rounded-2xl p-6"
        >
          <h3 className="text-lg font-bold text-textPrimary mb-4">Story Velocity</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={velocityData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="sprint" />
              <YAxis />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="stories" fill="#8b5cf6" name="Total" />
              <Bar dataKey="completed" fill="#10b981" name="Completed" />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Priority Distribution */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="bg-surface border border-border rounded-2xl p-6"
        >
          <h3 className="text-lg font-bold text-textPrimary mb-4">Priority Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={priorityData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value}`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {priorityData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activities */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="bg-surface border border-border rounded-2xl p-6"
        >
          <h3 className="text-lg font-bold text-textPrimary mb-4">Recent Activities</h3>
          <div className="space-y-4">
            {recentActivities.map((activity, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + index * 0.1 }}
                className="flex items-start gap-4 pb-4 border-b border-border last:border-b-0 last:pb-0"
              >
                <div className="text-2xl mt-1">{activity.icon}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-textPrimary">{activity.message}</p>
                  <p className="text-xs text-textSecondary mt-1">{activity.time}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Top Stories */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="bg-surface border border-border rounded-2xl p-6"
        >
          <h3 className="text-lg font-bold text-textPrimary mb-4">Top Stories</h3>
          <div className="space-y-3">
            {topStories.length > 0 ? topStories.map((story) => (
              <motion.div
                key={story.id}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 + story.index * 0.1 }}
                className="flex items-start gap-3 p-3 bg-background/50 rounded-lg hover:bg-background transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-textPrimary truncate">{story.title}</p>
                  <p className="text-xs text-textSecondary">{story.project}</p>
                </div>
                <span className={`px-2 py-1 rounded text-xs font-semibold flex-shrink-0 ${
                  story.priority === 'High' ? 'bg-error/20 text-error' :
                  story.priority === 'Medium' ? 'bg-warning/20 text-warning' :
                  'bg-success/20 text-success'
                }`}>
                  {story.priority}
                </span>
              </motion.div>
            )) : (
              <p className="text-textSecondary text-sm">No stories yet</p>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
