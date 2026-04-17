import React, { useState, useEffect } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { motion } from "framer-motion";

export default function DeveloperUtilizationChart({ sprintId, workspaceId }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [avgUtilization, setAvgUtilization] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          `http://localhost:8000/api/module2/analytics/developer-utilization/?sprint_id=${sprintId}`,
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
          const avg = result.average_utilization || 0;
          setAvgUtilization(avg);
        }
      } catch (err) {
        console.error("Error fetching utilization data:", err);
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

  if (error || !data || data.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="bg-white border border-border rounded-2xl p-6 shadow-lg"
      >
        <p className="text-textSecondary">No developer data available</p>
      </motion.div>
    );
  }

  // Get color based on utilization
  const getColor = (percentage) => {
    if (percentage > 80) return "#ef4444"; // red - overloaded
    if (percentage >= 60) return "#f59e0b"; // amber - high load
    return "#10b981"; // green - available
  };

  // Count status
  const overloaded = data.filter((d) => d.utilization_percentage > 80).length;
  const highLoad = data.filter((d) => d.utilization_percentage >= 60 && d.utilization_percentage <= 80).length;
  const available = data.filter((d) => d.utilization_percentage < 60).length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="bg-white border border-border rounded-2xl p-6 shadow-lg"
    >
      <div className="mb-6">
        <h2 className="text-xl font-bold text-textPrimary mb-2">Developer Workload Utilization</h2>
        <div className="flex items-baseline gap-4">
          <div className="text-4xl font-bold text-primary">{avgUtilization.toFixed(1)}%</div>
          <p className="text-textSecondary text-sm">Average utilization across team</p>
        </div>
      </div>

      {/* Status Summary */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-green-50 rounded-lg p-3 border border-green-200">
          <p className="text-green-600 text-xs font-medium">Available</p>
          <p className="text-2xl font-bold text-green-700">{available}</p>
        </div>
        <div className="bg-amber-50 rounded-lg p-3 border border-amber-200">
          <p className="text-amber-600 text-xs font-medium">High Load</p>
          <p className="text-2xl font-bold text-amber-700">{highLoad}</p>
        </div>
        <div className="bg-red-50 rounded-lg p-3 border border-red-200">
          <p className="text-red-600 text-xs font-medium">Overloaded</p>
          <p className="text-2xl font-bold text-red-700">{overloaded}</p>
        </div>
      </div>

      {/* Bar Chart */}
      <ResponsiveContainer width="100%" height={300}>
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 5, right: 30, left: 120, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis type="number" stroke="#9ca3af" style={{ fontSize: "12px" }} />
          <YAxis
            dataKey="developer_name"
            type="category"
            width={110}
            stroke="#9ca3af"
            style={{ fontSize: "11px" }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#ffffff",
              border: "1px solid #e5e7eb",
              borderRadius: "8px",
            }}
            formatter={(value) => `${value.toFixed(1)}%`}
          />
          <Bar dataKey="utilization_percentage" fill="#3b82f6" radius={[0, 8, 8, 0]}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={getColor(entry.utilization_percentage)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* Detailed Developer List */}
      <div className="mt-6 space-y-3 border-t pt-4">
        <p className="text-sm font-semibold text-textPrimary mb-3">Developer Details</p>
        {data.slice(0, 5).map((dev) => (
          <div key={dev.developer_id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex-1">
              <p className="font-medium text-sm text-textPrimary">{dev.developer_name}</p>
              <p className="text-xs text-textSecondary">
                {dev.assigned_hours.toFixed(1)}h / {dev.total_capacity_hours.toFixed(1)}h
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="font-bold text-sm">{dev.utilization_percentage.toFixed(1)}%</p>
                <p className="text-xs text-textSecondary">
                  {dev.status === "available"
                    ? "✓"
                    : dev.status === "high_load"
                    ? "⚠"
                    : "✗"}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
