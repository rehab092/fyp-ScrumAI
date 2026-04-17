import React, { useState, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { motion } from "framer-motion";

export default function SprintCompletionChart({ sprintId, workspaceId }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          `http://localhost:8000/api/module2/analytics/sprint-completion/?sprint_id=${sprintId}`,
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
        console.error("Error fetching sprint completion data:", err);
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
        <p className="text-red-600">Error loading completion data</p>
      </motion.div>
    );
  }

  // Prepare chart data
  const chartData = [
    {
      name: "Tasks",
      completed: data.completed_tasks,
      pending: data.pending_tasks,
      inProgress: data.in_progress_tasks,
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="bg-white border border-border rounded-2xl p-6 shadow-lg"
    >
      <div className="mb-6">
        <h2 className="text-xl font-bold text-textPrimary mb-2">Sprint Completion Rate</h2>
        <div className="flex items-baseline gap-4">
          <div className="text-4xl font-bold text-primary">
            {data.completion_percentage.toFixed(1)}%
          </div>
          <p className="text-textSecondary text-sm">
            {data.completed_tasks} of {data.total_tasks} tasks completed
          </p>
        </div>
      </div>

      <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-xl p-4 mb-6">
        <div className="grid grid-cols-3 gap-4">
          <div>
            <p className="text-textSecondary text-xs font-medium mb-1">Completed</p>
            <p className="text-2xl font-bold text-success">{data.completed_tasks}</p>
          </div>
          <div>
            <p className="text-textSecondary text-xs font-medium mb-1">In Progress</p>
            <p className="text-2xl font-bold text-warning">{data.in_progress_tasks}</p>
          </div>
          <div>
            <p className="text-textSecondary text-xs font-medium mb-1">Pending</p>
            <p className="text-2xl font-bold text-danger">{data.pending_tasks}</p>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
        <div
          className="bg-gradient-to-r from-primary to-success h-full transition-all duration-500"
          style={{ width: `${data.completion_percentage}%` }}
        />
      </div>
    </motion.div>
  );
}
