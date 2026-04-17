import React, { useState, useEffect } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { motion } from "framer-motion";

export default function CompletionTrendChart({ sprintId, workspaceId, type = "daily" }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          `http://localhost:8000/api/module2/analytics/completion-trend/?sprint_id=${sprintId}&type=${type}`,
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
        console.error("Error fetching trend data:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (sprintId && workspaceId) {
      fetchData();
    }
  }, [sprintId, workspaceId, type]);

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

  if (error || !data || data.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="bg-white border border-border rounded-2xl p-6 shadow-lg"
      >
        <p className="text-textSecondary">No completion trend data available yet</p>
      </motion.div>
    );
  }

  const chartTitle = type === "weekly" ? "Weekly Completion Trend" : "Daily Completion Trend";
  const xAxisLabel = type === "weekly" ? "week" : "date";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="bg-white border border-border rounded-2xl p-6 shadow-lg"
    >
      <div className="mb-6">
        <h2 className="text-xl font-bold text-textPrimary mb-2">{chartTitle}</h2>
        <p className="text-textSecondary text-sm">
          {data.length} {type === "weekly" ? "weeks" : "days"} of activity
        </p>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey={type === "weekly" ? "week" : "date"}
            stroke="#9ca3af"
            style={{ fontSize: "12px" }}
          />
          <YAxis stroke="#9ca3af" style={{ fontSize: "12px" }} />
          <Tooltip
            contentStyle={{
              backgroundColor: "#ffffff",
              border: "1px solid #e5e7eb",
              borderRadius: "8px",
            }}
          />
          <Legend />
          <Line
            type="monotone"
            dataKey="tasks_completed"
            stroke="#3b82f6"
            strokeWidth={2}
            dot={{ fill: "#3b82f6" }}
            name="Tasks Completed"
          />
          <Line
            type="monotone"
            dataKey="cumulative"
            stroke="#10b981"
            strokeWidth={2}
            dot={{ fill: "#10b981" }}
            name="Cumulative"
          />
        </LineChart>
      </ResponsiveContainer>

      {/* Stats Summary */}
      <div className="mt-6 grid grid-cols-2 gap-4">
        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
          <p className="text-blue-600 text-xs font-medium mb-1">Total Completed</p>
          <p className="text-2xl font-bold text-blue-700">
            {data[data.length - 1]?.cumulative || 0}
          </p>
        </div>
        <div className="bg-green-50 rounded-lg p-4 border border-green-200">
          <p className="text-green-600 text-xs font-medium mb-1">Avg per {type === "weekly" ? "Week" : "Day"}</p>
          <p className="text-2xl font-bold text-green-700">
            {(data[data.length - 1]?.cumulative / data.length).toFixed(1)}
          </p>
        </div>
      </div>
    </motion.div>
  );
}
