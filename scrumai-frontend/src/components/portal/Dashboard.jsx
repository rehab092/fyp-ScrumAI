import React from "react";
import { motion } from "framer-motion";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';

export default function Dashboard() {
  // Chart data
  const velocityData = [
    { sprint: 'Sprint 1', velocity: 95 },
    { sprint: 'Sprint 2', velocity: 110 },
    { sprint: 'Sprint 3', velocity: 120 },
    { sprint: 'Sprint 4', velocity: 115 },
    { sprint: 'Sprint 5', velocity: 130 },
  ];

  const taskStatusData = [
    { name: 'Completed', value: 45, color: '#10B981' },
    { name: 'In Progress', value: 25, color: '#F59E0B' },
    { name: 'To Do', value: 20, color: '#6B7280' },
    { name: 'Blocked', value: 10, color: '#EF4444' },
  ];

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-nightBlue border border-sandTan/30 rounded-lg p-3 shadow-lg">
          <p className="text-sandTan font-medium">{label}</p>
          <p className="text-textLight">
            {payload[0].name}: {payload[0].value} {payload[0].name === 'velocity' ? 'points' : '%'}
          </p>
        </div>
      );
    }
    return null;
  };

  const metrics = [
    {
      title: "Sprint Progress",
      value: "87%",
      change: "+12%",
      trend: "up",
      icon: "📊"
    },
    {
      title: "Tasks Completed",
      value: "24/28",
      change: "+3 today",
      trend: "up",
      icon: "✅"
    },
    {
      title: "Team Velocity",
      value: "42 pts",
      change: "+8%",
      trend: "up",
      icon: "🚀"
    },
    {
      title: "Risk Level",
      value: "Low",
      change: "-2%",
      trend: "down",
      icon: "⚠️"
    }
  ];

  const recentActivities = [
    {
      type: "task_completed",
      message: "Sarah completed 'User Authentication' task",
      time: "2 hours ago",
      icon: "✅"
    },
    {
      type: "sprint_updated",
      message: "Sprint 24 progress updated to 87%",
      time: "4 hours ago",
      icon: "📊"
    },
    {
      type: "dependency_alert",
      message: "New dependency detected: API → UI Components",
      time: "6 hours ago",
      icon: "🔗"
    },
    {
      type: "task_assigned",
      message: "Mike assigned to 'Database Migration' task",
      time: "8 hours ago",
      icon: "👤"
    }
  ];

  const upcomingTasks = [
    {
      title: "API Integration",
      assignee: "Mike Johnson",
      dueDate: "Tomorrow",
      priority: "High",
      status: "In Progress"
    },
    {
      title: "UI Components",
      assignee: "Sarah Chen",
      dueDate: "Dec 20",
      priority: "Medium",
      status: "Ready"
    },
    {
      title: "Testing Suite",
      assignee: "Emma Davis",
      dueDate: "Dec 22",
      priority: "High",
      status: "Blocked"
    },
    {
      title: "Documentation",
      assignee: "Alex Rodriguez",
      dueDate: "Dec 25",
      priority: "Low",
      status: "Ready"
    }
  ];

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
            className="bg-nightBlueShadow/60 border border-sandTan/20 rounded-2xl p-6 hover:shadow-glow transition-all duration-300"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="text-2xl">{metric.icon}</div>
              <div className={`text-sm font-medium ${
                metric.trend === "up" ? "text-green-400" : "text-red-400"
              }`}>
                {metric.change}
              </div>
            </div>
            <div className="text-2xl font-bold text-sandTan mb-1">{metric.value}</div>
            <div className="text-textMuted text-sm">{metric.title}</div>
          </motion.div>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Sprint Velocity Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="bg-nightBlueShadow/60 border border-sandTan/20 rounded-2xl p-6"
        >
          <ResponsiveContainer width="100%" height={300} className="chart-container">
            <LineChart data={velocityData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis 
                dataKey="sprint" 
                stroke="#D1D5DB"
                fontSize={12}
              />
              <YAxis 
                stroke="#D1D5DB"
                fontSize={12}
              />
              <Tooltip content={<CustomTooltip />} />
              <Line 
                type="monotone" 
                dataKey="velocity" 
                stroke="#F4E4BC" 
                strokeWidth={3}
                dot={{ fill: '#F4E4BC', strokeWidth: 2, r: 6 }}
                activeDot={{ r: 8, stroke: '#F4E4BC', strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Task Status Distribution */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="bg-nightBlueShadow/60 border border-sandTan/20 rounded-2xl p-6"
        >
          <ResponsiveContainer width="100%" height={300} className="chart-container">
            <PieChart>
              <Pie
                data={taskStatusData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {taskStatusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{
                  backgroundColor: '#1E3A8A',
                  border: '1px solid #F4E4BC',
                  borderRadius: '8px',
                  color: '#F4E4BC'
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Sprint Progress */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="lg:col-span-2 bg-nightBlueShadow/60 border border-sandTan/20 rounded-2xl p-6"
        >
          <div className="space-y-4">
            {[
              { name: "User Authentication", progress: 100, status: "Completed" },
              { name: "API Integration", progress: 75, status: "In Progress" },
              { name: "UI Components", progress: 45, status: "In Progress" },
              { name: "Testing Suite", progress: 20, status: "Blocked" },
              { name: "Documentation", progress: 0, status: "Ready" }
            ].map((task, index) => (
              <div key={index} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-textLight font-medium">{task.name}</span>
                  <span className="text-sandTan text-sm font-semibold">{task.progress}%</span>
                </div>
                <div className="w-full bg-nightBlueShadow rounded-full h-2">
                  <div
                    className="bg-sandTan h-2 rounded-full transition-all duration-500"
                    style={{ width: `${task.progress}%` }}
                  />
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-textMuted">{task.status}</span>
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    task.status === "Completed" ? "bg-green-500/20 text-green-400" :
                    task.status === "In Progress" ? "bg-blue-500/20 text-blue-400" :
                    task.status === "Blocked" ? "bg-red-500/20 text-red-400" :
                    "bg-gray-500/20 text-gray-400"
                  }`}>
                    {task.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Recent Activities */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="bg-nightBlueShadow/60 border border-sandTan/20 rounded-2xl p-6"
        >
          <div className="space-y-4">
            {recentActivities.map((activity, index) => (
              <div key={index} className="flex items-start gap-3">
                <div className="text-lg">{activity.icon}</div>
                <div className="flex-1">
                  <p className="text-textLight text-sm">{activity.message}</p>
                  <p className="text-textMuted text-xs mt-1">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Upcoming Tasks */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.7 }}
        className="mt-8 bg-nightBlueShadow/60 border border-sandTan/20 rounded-2xl p-6"
      >
        <div className="overflow-x-auto">
          <table className="w-full responsive-table">
            <thead>
              <tr className="border-b border-sandTan/20">
                <th className="text-left py-3 text-sandTan font-semibold">Task</th>
                <th className="text-left py-3 text-sandTan font-semibold">Assignee</th>
                <th className="text-left py-3 text-sandTan font-semibold">Due Date</th>
                <th className="text-left py-3 text-sandTan font-semibold">Priority</th>
                <th className="text-left py-3 text-sandTan font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {upcomingTasks.map((task, index) => (
                <tr key={index} className="border-b border-sandTan/10">
                  <td className="py-3 text-textLight font-medium">{task.title}</td>
                  <td className="py-3 text-textMuted">{task.assignee}</td>
                  <td className="py-3 text-textMuted">{task.dueDate}</td>
                  <td className="py-3">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      task.priority === "High" ? "bg-red-500/20 text-red-400" :
                      task.priority === "Medium" ? "bg-yellow-500/20 text-yellow-400" :
                      "bg-green-500/20 text-green-400"
                    }`}>
                      {task.priority}
                    </span>
                  </td>
                  <td className="py-3">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      task.status === "In Progress" ? "bg-blue-500/20 text-blue-400" :
                      task.status === "Ready" ? "bg-gray-500/20 text-gray-400" :
                      "bg-red-500/20 text-red-400"
                    }`}>
                      {task.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}
