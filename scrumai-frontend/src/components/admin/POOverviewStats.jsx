import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";

export default function POOverviewStats({ workspaceId }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          `http://localhost:8000/api/module2/analytics/po-overview/`,
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
        console.error("Error fetching PO overview data:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (workspaceId) {
      fetchData();
    }
  }, [workspaceId]);

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="bg-white border border-border rounded-2xl p-6 shadow-lg"
      >
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
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
        <p className="text-red-600">Error loading overview</p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="bg-white border border-border rounded-2xl p-6 shadow-lg"
    >
      <h2 className="text-xl font-bold text-textPrimary mb-6">Workspace Overview</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Sprints */}
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-600 text-xs font-medium mb-1">Total Sprints</p>
              <p className="text-3xl font-bold text-blue-700">{data.total_sprints}</p>
            </div>
            <span className="text-3xl">📊</span>
          </div>
        </div>

        {/* Total Tasks */}
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 border border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-600 text-xs font-medium mb-1">Total Tasks</p>
              <p className="text-3xl font-bold text-purple-700">{data.total_tasks}</p>
            </div>
            <span className="text-3xl">✓</span>
          </div>
        </div>

        {/* Completed Tasks */}
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 border border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-600 text-xs font-medium mb-1">Completed</p>
              <p className="text-3xl font-bold text-green-700">{data.total_completed}</p>
            </div>
            <span className="text-3xl">🎉</span>
          </div>
        </div>

        {/* Overall Completion Rate */}
        <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl p-4 border border-amber-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-amber-600 text-xs font-medium mb-1">Completion Rate</p>
              <p className="text-3xl font-bold text-amber-700">
                {data.overall_completion_rate.toFixed(1)}%
              </p>
            </div>
            <span className="text-3xl">📈</span>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-textPrimary">Overall Progress</span>
          <span className="text-sm font-bold text-primary">
            {data.total_completed} / {data.total_tasks}
          </span>
        </div>
        <div className="w-full bg-gray-300 rounded-full h-2 overflow-hidden">
          <div
            className="bg-gradient-to-r from-primary to-secondary h-full transition-all duration-500"
            style={{
              width: `${data.total_tasks > 0 ? (data.total_completed / data.total_tasks) * 100 : 0}%`,
            }}
          />
        </div>
      </div>

      {/* Additional Stats */}
      {data.sprints && (
        <div className="mt-6 pt-6 border-t border-gray-200">
          <p className="text-sm font-semibold text-textPrimary mb-3">Recent Sprint Performance</p>
          <div className="space-y-2">
            {data.sprints.slice(-3).map((sprint) => (
              <div key={sprint.sprint_id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <span className="text-sm text-textSecondary">{sprint.sprint_name}</span>
                <span className="text-sm font-bold text-primary">
                  {sprint.completion_percentage.toFixed(1)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}
