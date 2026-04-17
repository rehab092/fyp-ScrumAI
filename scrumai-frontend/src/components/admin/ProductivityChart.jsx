import React, { useState, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { motion } from "framer-motion";

export default function ProductivityChart({ sprintId, workspaceId }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          `http://localhost:8000/api/module2/analytics/productivity/?sprint_id=${sprintId}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              "Workspace-ID": workspaceId,
            },
          }
        );

        if (!response.ok) throw new Error("Failed to fetch data");
        const result = await response.json();
        
        if (result.success && result.data) {
          setData(result.data);
        }
      } catch (err) {
        console.error("Error fetching productivity data:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (sprintId && workspaceId) {
      fetchData();
    }
  }, [sprintId, workspaceId]);

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="bg-white border border-border rounded-2xl p-6 shadow-lg"
      >
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </motion.div>
    );
  }

  if (error || !data) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="bg-white border border-border rounded-2xl p-6 shadow-lg"
      >
        <p className="text-red-600">Error loading productivity data</p>
      </motion.div>
    );
  }

  // Prepare chart data
  const chartData = [
    {
      name: "Hours",
      estimated: data.estimated_total_hours,
      completed: data.completed_hours,
    },
  ];

  const efficiency = data.completed_hours > 0 
    ? ((data.estimated_total_hours / data.completed_hours) * 100).toFixed(1)
    : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="bg-white border border-border rounded-2xl p-6 shadow-lg"
    >
      <div className="mb-6">
        <h2 className="text-xl font-bold text-textPrimary mb-2">Productivity Metrics</h2>
        <p className="text-textSecondary text-sm">Estimated vs Actual Hours</p>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey="name" stroke="#9ca3af" style={{ fontSize: "12px" }} />
          <YAxis stroke="#9ca3af" style={{ fontSize: "12px" }} />
          <Tooltip
            contentStyle={{
              backgroundColor: "#ffffff",
              border: "1px solid #e5e7eb",
              borderRadius: "8px",
            }}
          />
          <Legend />
          <Bar dataKey="estimated" fill="#fbbf24" name="Estimated Hours" />
          <Bar dataKey="completed" fill="#10b981" name="Completed Hours" />
        </BarChart>
      </ResponsiveContainer>

      {/* Metrics Grid */}
      <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-amber-50 rounded-lg p-4 border border-amber-200">
          <p className="text-amber-600 text-xs font-medium mb-1">Estimated</p>
          <p className="text-lg font-bold text-amber-700">
            {data.estimated_total_hours.toFixed(1)}h
          </p>
        </div>
        <div className="bg-green-50 rounded-lg p-4 border border-green-200">
          <p className="text-green-600 text-xs font-medium mb-1">Completed</p>
          <p className="text-lg font-bold text-green-700">
            {data.completed_hours.toFixed(1)}h
          </p>
        </div>
        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
          <p className="text-blue-600 text-xs font-medium mb-1">Avg per Task</p>
          <p className="text-lg font-bold text-blue-700">
            {data.avg_estimated_hours_per_task.toFixed(1)}h
          </p>
        </div>
        <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
          <p className="text-purple-600 text-xs font-medium mb-1">Efficiency</p>
          <p className="text-lg font-bold text-purple-700">
            {efficiency}%
            <span className="text-xs ml-1">
              {efficiency >= 100 ? "✓" : "●"}
            </span>
          </p>
        </div>
      </div>

      {/* Note */}
      <p className="text-textMuted text-xs mt-4">
        📌 Note: {data.note}
      </p>
    </motion.div>
  );
}
