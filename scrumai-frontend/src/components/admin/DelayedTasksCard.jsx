import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";

export default function DelayedTasksCard({ sprintId, workspaceId }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          `http://localhost:8000/api/module2/analytics/delayed-tasks/?sprint_id=${sprintId}`,
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
        console.error("Error fetching delayed tasks data:", err);
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
        <div className="animate-pulse h-24 bg-gray-200 rounded"></div>
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
        <p className="text-red-600">Error loading delayed tasks</p>
      </motion.div>
    );
  }

  const isHighSeverity = data.delayed_count > 0;
  const bgColor = isHighSeverity
    ? "bg-gradient-to-br from-red-50 to-orange-50"
    : "bg-gradient-to-br from-green-50 to-emerald-50";
  const accentColor = isHighSeverity ? "text-red-600" : "text-green-600";
  const borderColor = isHighSeverity ? "border-red-200" : "border-green-200";
  const iconBg = isHighSeverity ? "bg-red-100" : "bg-green-100";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className={`${bgColor} border ${borderColor} rounded-2xl p-6 shadow-lg`}
    >
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-lg font-bold text-textPrimary mb-2">Delayed Tasks</h2>
          <div className="flex items-baseline gap-2">
            <div className={`text-4xl font-bold ${accentColor}`}>
              {data.delayed_count}
            </div>
            <p className="text-textSecondary text-sm">
              {data.delayed_count === 1 ? "task" : "tasks"} beyond deadline
            </p>
          </div>
        </div>
        <div className={`${iconBg} w-14 h-14 rounded-full flex items-center justify-center`}>
          <span className="text-2xl">
            {isHighSeverity ? "⚠️" : "✓"}
          </span>
        </div>
      </div>

      {/* Status Indicator */}
      <div className={`mt-4 p-3 rounded-lg ${isHighSeverity ? "bg-red-100" : "bg-green-100"}`}>
        <p className={`text-sm font-medium ${accentColor}`}>
          {isHighSeverity
            ? "Action Required: Tasks are overdue"
            : "All tasks on track - No delays"}
        </p>
      </div>

      {/* Info */}
      <p className="text-textMuted text-xs mt-4">
        {data.note}
      </p>
    </motion.div>
  );
}
