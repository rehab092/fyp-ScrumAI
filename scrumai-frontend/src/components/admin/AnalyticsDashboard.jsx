import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import POOverviewStats from "./POOverviewStats";
import SprintCompletionChart from "./SprintCompletionChart";
import CompletionTrendChart from "./CompletionTrendChart";
import ProductivityChart from "./ProductivityChart";
import DeveloperUtilizationChart from "./DeveloperUtilizationChart";
import DelayedTasksCard from "./DelayedTasksCard";

export default function AnalyticsDashboard({ onBack }) {
  const [sprints, setSprints] = useState([]);
  const [selectedSprintId, setSelectedSprintId] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSprints = async () => {
      try {
        setLoading(true);
        const workspaceId = localStorage.getItem("workspaceId");
        
        const response = await fetch(
          "http://localhost:8000/api/module2/sprints/available/?limit=10",
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              "Workspace-ID": workspaceId,
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          const sprintsArray = data.sprints || [];
          setSprints(sprintsArray);
          
          // Select first sprint by default
          if (sprintsArray.length > 0) {
            setSelectedSprintId(sprintsArray[0].sprint_id);
          }
        }
      } catch (err) {
        console.error("Error fetching sprints:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchSprints();
  }, []);

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="mb-8 flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold text-textPrimary mb-2">📊 Analytics Dashboard</h1>
          <p className="text-textSecondary">Track sprint performance, productivity, and team workload</p>
        </div>
        <button
          onClick={onBack}
          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-medium"
        >
          ← Back to Dashboard
        </button>
      </motion.div>

      {/* Workspace Overview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="mb-8"
      >
        <POOverviewStats workspaceId={localStorage.getItem("workspaceId")} />
      </motion.div>

      {/* Sprint Selector */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="bg-white border border-border rounded-2xl p-6 mb-8 shadow-lg"
      >
        <label className="text-sm font-medium text-textPrimary mb-3 block">
          Select Sprint for Detailed Analytics
        </label>
        <div className="flex flex-wrap gap-2">
          {loading ? (
            <p className="text-textSecondary">Loading sprints...</p>
          ) : sprints.length > 0 ? (
            <>
              <select
                value={selectedSprintId || ""}
                onChange={(e) => setSelectedSprintId(Number(e.target.value))}
                className="px-4 py-2 border border-border rounded-lg bg-white text-textPrimary focus:outline-none focus:ring-2 focus:ring-primary font-medium"
              >
                <option value="">-- Select a Sprint --</option>
                {sprints.map((sprint) => (
                  <option key={sprint.sprint_id} value={sprint.sprint_id}>
                    {sprint.sprint_name} • {sprint.total_tasks} tasks
                  </option>
                ))}
              </select>
              {selectedSprintId && (
                <div className="flex items-center gap-2 px-3 py-2 bg-primary/10 rounded-lg">
                  <span className="text-sm text-primary font-medium">
                    ✓ Sprint {selectedSprintId} selected
                  </span>
                </div>
              )}
            </>
          ) : (
            <p className="text-amber-600 font-medium">No sprints available</p>
          )}
        </div>
      </motion.div>

      {/* Analytics Charts Grid */}
      {selectedSprintId && !loading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="space-y-6"
        >
          {/* Row 1: Completion Rate & Daily Trend */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <SprintCompletionChart
              sprintId={selectedSprintId}
              workspaceId={localStorage.getItem("workspaceId")}
            />
            <CompletionTrendChart
              sprintId={selectedSprintId}
              workspaceId={localStorage.getItem("workspaceId")}
              type="daily"
            />
          </div>

          {/* Row 2: Productivity & Delayed Tasks */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ProductivityChart
              sprintId={selectedSprintId}
              workspaceId={localStorage.getItem("workspaceId")}
            />
            <DelayedTasksCard
              sprintId={selectedSprintId}
              workspaceId={localStorage.getItem("workspaceId")}
            />
          </div>

          {/* Row 3: Developer Utilization (Full Width) */}
          <div>
            <DeveloperUtilizationChart
              sprintId={selectedSprintId}
              workspaceId={localStorage.getItem("workspaceId")}
            />
          </div>

          {/* Row 4: Weekly Trend */}
          <div>
            <CompletionTrendChart
              sprintId={selectedSprintId}
              workspaceId={localStorage.getItem("workspaceId")}
              type="weekly"
            />
          </div>
        </motion.div>
      )}

      {/* Empty States */}
      {selectedSprintId && loading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-blue-50 border border-blue-200 rounded-2xl p-12 text-center"
        >
          <div className="animate-pulse">
            <p className="text-blue-700 font-medium">Loading analytics...</p>
          </div>
        </motion.div>
      )}

      {!selectedSprintId && sprints.length > 0 && !loading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-blue-50 border border-blue-200 rounded-2xl p-12 text-center"
        >
          <p className="text-blue-700 font-medium text-lg">
            👆 Select a sprint above to view detailed analytics
          </p>
        </motion.div>
      )}

      {sprints.length === 0 && !loading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-amber-50 border border-amber-200 rounded-2xl p-12 text-center"
        >
          <p className="text-amber-700 font-medium text-lg">
            📭 No sprints available yet. Create a sprint to see analytics.
          </p>
        </motion.div>
      )}
    </div>
  );
}
