import React, { useState } from "react";
import { motion } from "framer-motion";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

export default function Reports() {
  const [reportType, setReportType] = useState("velocity"); // 'velocity', 'burndown'
  const [timeRange, setTimeRange] = useState("last-4-sprints");

  const velocityData = [
    { sprint: "Sprint 21", planned: 40, completed: 35, velocity: 35 },
    { sprint: "Sprint 22", planned: 42, completed: 38, velocity: 38 },
    { sprint: "Sprint 23", planned: 45, completed: 42, velocity: 42 },
    { sprint: "Sprint 24", planned: 40, completed: 0, velocity: 0 }
  ];

  const burndownData = [
    { day: 1, remaining: 40, ideal: 40 },
    { day: 2, remaining: 35, ideal: 35 },
    { day: 3, remaining: 30, ideal: 30 },
    { day: 4, remaining: 28, ideal: 25 },
    { day: 5, remaining: 25, ideal: 20 },
    { day: 6, remaining: 20, ideal: 15 },
    { day: 7, remaining: 15, ideal: 10 },
    { day: 8, remaining: 10, ideal: 5 },
    { day: 9, remaining: 5, ideal: 0 },
    { day: 10, remaining: 0, ideal: 0 }
  ];

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white border border-border rounded-lg p-3 shadow-lg">
          <p className="text-textPrimary font-medium">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} className="text-textSecondary" style={{ color: entry.color }}>
              {entry.name}: {entry.value} {entry.name === 'velocity' || entry.name === 'planned' || entry.name === 'completed' ? 'points' : '%'}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Report Type Selector */}
      <div className="flex flex-wrap gap-4 mb-8">
        <button
          onClick={() => setReportType("velocity")}
          className={`px-6 py-3 rounded-lg transition-all ${
            reportType === "velocity"
              ? "bg-primary text-white shadow-lg"
              : "border border-primary text-primary hover:bg-primary hover:text-white"
          }`}
        >
          📈 Velocity
        </button>
        <button
          onClick={() => setReportType("burndown")}
          className={`px-6 py-3 rounded-lg transition-all ${
            reportType === "burndown"
              ? "bg-primary text-white shadow-lg"
              : "border border-primary text-primary hover:bg-primary hover:text-white"
          }`}
        >
          📉 Burndown
        </button>
      </div>

      {/* Time Range Selector */}
      <div className="flex gap-4 mb-8">
        <select
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value)}
          className="bg-white border border-border rounded-lg p-3 text-textPrimary focus:outline-none focus:border-primary"
        >
          <option value="last-4-sprints">Last 4 Sprints</option>
          <option value="last-8-sprints">Last 8 Sprints</option>
          <option value="last-quarter">Last Quarter</option>
          <option value="last-year">Last Year</option>
        </select>
        <button className="bg-primary text-white px-6 py-3 rounded-lg hover:bg-primaryDark transition-all font-medium">
          Export Report
        </button>
      </div>

      {/* Velocity Report */}
      {reportType === "velocity" && (
        <div className="space-y-8">
          {/* Velocity Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="bg-white border border-border rounded-2xl p-6 shadow-lg"
          >
            <h2 className="text-xl font-bold text-textPrimary mb-6">Sprint Velocity Trend</h2>
            
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={velocityData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis 
                  dataKey="sprint" 
                  stroke="#6B7280"
                  fontSize={12}
                />
                <YAxis 
                  stroke="#6B7280"
                  fontSize={12}
                />
                <Tooltip content={<CustomTooltip />} />
                <Line 
                  type="monotone" 
                  dataKey="planned" 
                  stroke="#F59E0B" 
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  name="Planned"
                  dot={{ fill: '#F59E0B', strokeWidth: 2, r: 4 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="completed" 
                  stroke="#10B981" 
                  strokeWidth={3}
                  name="Completed"
                  dot={{ fill: '#10B981', strokeWidth: 2, r: 6 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="velocity" 
                  stroke="#6366F1" 
                  strokeWidth={3}
                  name="Velocity"
                  dot={{ fill: '#6366F1', strokeWidth: 2, r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Velocity Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white border border-border rounded-2xl p-6 text-center shadow-lg">
              <div className="text-3xl font-bold text-primary mb-2">38.3</div>
              <div className="text-textSecondary">Average Velocity</div>
            </div>
            <div className="bg-white border border-border rounded-2xl p-6 text-center shadow-lg">
              <div className="text-3xl font-bold text-success mb-2">+8.6%</div>
              <div className="text-textSecondary">Velocity Growth</div>
            </div>
            <div className="bg-white border border-border rounded-2xl p-6 text-center shadow-lg">
              <div className="text-3xl font-bold text-primary mb-2">91%</div>
              <div className="text-textSecondary">Completion Rate</div>
            </div>
            <div className="bg-white border border-border rounded-2xl p-6 text-center shadow-lg">
              <div className="text-3xl font-bold text-warning mb-2">2.1</div>
              <div className="text-textSecondary">Sprint Variance</div>
            </div>
          </div>
        </div>
      )}

      {/* Burndown Report */}
      {reportType === "burndown" && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="space-y-8"
        >
          <div className="bg-white border border-border rounded-2xl p-6 shadow-lg">
            <h2 className="text-xl font-bold text-textPrimary mb-6">Sprint 24 Burndown Chart</h2>
            
            <ResponsiveContainer width="100%" height={400}>
              <AreaChart data={burndownData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis 
                  dataKey="day" 
                  stroke="#6B7280"
                  fontSize={12}
                />
                <YAxis 
                  stroke="#6B7280"
                  fontSize={12}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area 
                  type="monotone" 
                  dataKey="ideal" 
                  stackId="1"
                  stroke="#6B7280" 
                  fill="#6B7280"
                  fillOpacity={0.3}
                  name="Ideal"
                />
                <Area 
                  type="monotone" 
                  dataKey="remaining" 
                  stackId="2"
                  stroke="#6366F1" 
                  fill="#6366F1"
                  fillOpacity={0.6}
                  name="Remaining"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Burndown Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white border border-border rounded-2xl p-6 text-center shadow-lg">
              <div className="text-3xl font-bold text-success mb-2">On Track</div>
              <div className="text-textSecondary">Sprint Status</div>
            </div>
            <div className="bg-white border border-border rounded-2xl p-6 text-center shadow-lg">
              <div className="text-3xl font-bold text-primary mb-2">2.5</div>
              <div className="text-textSecondary">Days Ahead</div>
            </div>
            <div className="bg-white border border-border rounded-2xl p-6 text-center shadow-lg">
              <div className="text-3xl font-bold text-primary mb-2">4.0</div>
              <div className="text-textSecondary">Points/Day</div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Export Options */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
        className="mt-8 bg-white border border-border rounded-2xl p-6 shadow-lg"
      >
        <h2 className="text-xl font-bold text-textPrimary mb-4">Export & Share</h2>
        <div className="flex flex-wrap gap-4">
          <button className="bg-primary text-white px-6 py-3 rounded-lg hover:bg-primaryDark transition-all font-medium">
            📊 Export as PDF
          </button>
          <button className="border border-primary text-primary px-6 py-3 rounded-lg hover:bg-primary hover:text-white transition-all font-medium">
            📈 Export as Excel
          </button>
          <button className="border border-primary text-primary px-6 py-3 rounded-lg hover:bg-primary hover:text-white transition-all font-medium">
            📧 Email Report
          </button>
          <button className="border border-primary text-primary px-6 py-3 rounded-lg hover:bg-primary hover:text-white transition-all font-medium">
            🔗 Share Link
          </button>
        </div>
      </motion.div>
    </div>
  );
}
