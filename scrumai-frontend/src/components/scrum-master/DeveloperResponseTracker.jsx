import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { LOGIN_ENDPOINTS } from "../../config/api";

export default function DeveloperResponseTracker() {
  const [responses, setResponses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState("all"); // all, accepted, rejected
  const [expandedReason, setExpandedReason] = useState(null);

  const workspaceId = localStorage.getItem("workspaceId");

  useEffect(() => {
    fetchDeveloperResponses();
  }, []);

  const fetchDeveloperResponses = async () => {
    try {
      setLoading(true);
      const response = await fetch(LOGIN_ENDPOINTS.taskAllocation.developerResponses, {
        headers: { "Workspace-ID": workspaceId },
      });

      if (response.ok) {
        const data = await response.json();
        setResponses(data.all_responses || []);
      }
    } catch (err) {
      console.error("Error fetching developer responses:", err);
    } finally {
      setLoading(false);
    }
  };

  const getFilteredResponses = () => {
    if (selectedFilter === "accepted") {
      return responses.filter((r) => r.status === "ACCEPT");
    } else if (selectedFilter === "rejected") {
      return responses.filter((r) => r.status === "REJECT");
    }
    return responses;
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return "-";
    const date = new Date(timestamp);
    return date.toLocaleDateString() + " " + date.toLocaleTimeString();
  };

  const filteredResponses = getFilteredResponses();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity }}
          className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full"
        />
      </div>
    );
  }

  return (
    <div className="bg-surface border border-border rounded-2xl p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-textPrimary mb-4">Developer Response Tracker</h2>
        
        {/* Filter Tabs */}
        <div className="flex gap-3 mb-4">
          {[
            { value: "all", label: "All Responses", icon: "📋" },
            { value: "accepted", label: "Accepted", icon: "✅" },
            { value: "rejected", label: "Rejected", icon: "❌" },
          ].map((filter) => (
            <button
              key={filter.value}
              onClick={() => setSelectedFilter(filter.value)}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                selectedFilter === filter.value
                  ? "bg-primary text-white"
                  : "bg-gray-200 text-textPrimary hover:bg-gray-300"
              }`}
            >
              {filter.icon} {filter.label}
            </button>
          ))}
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="bg-primary/10 border border-primary/30 rounded-lg p-3">
            <div className="text-sm text-textSecondary">Total Responses</div>
            <div className="text-2xl font-bold text-primary">{responses.length}</div>
          </div>
          <div className="bg-success/10 border border-success/30 rounded-lg p-3">
            <div className="text-sm text-textSecondary">Accepted</div>
            <div className="text-2xl font-bold text-success">
              {responses.filter((r) => r.status === "ACCEPT").length}
            </div>
          </div>
          <div className="bg-error/10 border border-error/30 rounded-lg p-3">
            <div className="text-sm text-textSecondary">Rejected</div>
            <div className="text-2xl font-bold text-error">
              {responses.filter((r) => r.status === "REJECT").length}
            </div>
          </div>
        </div>
      </div>

      {/* Responses List */}
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {filteredResponses.length === 0 ? (
          <div className="text-center py-8 text-textSecondary">
            No {selectedFilter !== "all" ? selectedFilter : ""} responses yet
          </div>
        ) : (
          filteredResponses.map((response) => (
            <motion.div
              key={response.workflow_id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`border rounded-lg p-4 cursor-pointer transition-all hover:shadow-md ${
                response.status === "ACCEPT"
                  ? "bg-success/5 border-success/30"
                  : "bg-error/5 border-error/30"
              }`}
              onClick={() =>
                setExpandedReason(
                  expandedReason === response.workflow_id ? null : response.workflow_id
                )
              }
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{response.status_icon}</span>
                  <div>
                    <div className="font-semibold text-textPrimary">
                      {response.developer_name}
                    </div>
                    <div className="text-xs text-textSecondary">{response.developer_email}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div
                    className={`text-xs font-medium px-2 py-1 rounded ${
                      response.status === "ACCEPT"
                        ? "bg-success/20 text-success"
                        : "bg-error/20 text-error"
                    }`}
                  >
                    {response.status}
                  </div>
                </div>
              </div>

              {/* Task & Sprint Info */}
              <div className="grid grid-cols-2 gap-4 mb-2 text-sm">
                <div>
                  <div className="text-textSecondary text-xs">Task</div>
                  <div className="font-medium text-textPrimary">{response.task_id}</div>
                </div>
                <div>
                  <div className="text-textSecondary text-xs">Sprint</div>
                  <div className="font-medium text-textPrimary">{response.sprint_name}</div>
                </div>
              </div>

              {/* Task Title */}
              <div className="mb-2 text-sm text-textSecondary truncate">{response.task_title}</div>

              {/* Response Time */}
              <div className="text-xs text-textSecondary mb-2">
                Responded: {formatTime(response.responded_at)}
              </div>

              {/* Rejection Reason - Expandable */}
              {response.status === "REJECT" && response.reason && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{
                    height: expandedReason === response.workflow_id ? "auto" : 0,
                    opacity: expandedReason === response.workflow_id ? 1 : 0,
                  }}
                  transition={{ duration: 0.2 }}
                  overflow="hidden"
                  className="mt-3 bg-error/10 border-l-4 border-error rounded px-3 py-2"
                >
                  <div className="text-xs text-textSecondary font-semibold mb-1">
                    Rejection Reason:
                  </div>
                  <div className="text-sm text-textPrimary">{response.reason}</div>
                </motion.div>
              )}

              {/* Expand Indicator */}
              {response.status === "REJECT" && response.reason && (
                <div className="text-xs text-textSecondary mt-2">
                  {expandedReason === response.workflow_id ? "▲ Hide reason" : "▼ Show reason"}
                </div>
              )}
            </motion.div>
          ))
        )}
      </div>

      {/* Refresh Button */}
      <div className="mt-4 flex gap-2">
        <button
          onClick={fetchDeveloperResponses}
          className="px-4 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition-all"
        >
          🔄 Refresh
        </button>
      </div>
    </div>
  );
}
