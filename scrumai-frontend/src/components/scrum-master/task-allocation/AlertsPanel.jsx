import React from "react";
import { motion } from "framer-motion";

export default function AlertsPanel({ alerts, onClose, onResolve }) {
  const getSeverityColor = (severity) => {
    switch (severity) {
      case "high": return "bg-error/10 border-error/30 text-error";
      case "medium": return "bg-warning/10 border-warning/30 text-warning";
      case "low": return "bg-info/10 border-info/30 text-info";
      default: return "bg-surface border-border text-textSecondary";
    }
  };

  const getSeverityIcon = (severity) => {
    switch (severity) {
      case "high": return "🔴";
      case "medium": return "🟡";
      case "low": return "🔵";
      default: return "ℹ️";
    }
  };

  const getAlertIcon = (type) => {
    switch (type) {
      case "overload": return "⚠️";
      case "unassigned": return "📋";
      case "skill_mismatch": return "🎯";
      default: return "🔔";
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end lg:items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-primaryDark to-primary p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <span>🔔</span>
                Alerts & Notifications
              </h2>
              <p className="text-white/80 text-sm mt-1">
                {alerts.length} active {alerts.length === 1 ? "alert" : "alerts"}
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 transition-all flex items-center justify-center"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[60vh] overflow-y-auto">
          {alerts.length === 0 ? (
            <div className="text-center py-12">
              <span className="text-6xl">✅</span>
              <p className="text-textMuted mt-4 text-lg">All clear! No alerts at this time.</p>
              <p className="text-textSecondary text-sm mt-2">Your team is running smoothly.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {alerts.map((alert, index) => (
                <motion.div
                  key={alert.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`border-2 rounded-xl p-4 ${getSeverityColor(alert.severity)}`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1">
                      <div className="text-2xl">
                        {getAlertIcon(alert.type)}
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xs font-bold uppercase tracking-wide opacity-75">
                            {alert.type.replace("_", " ")}
                          </span>
                          <span className="text-lg">
                            {getSeverityIcon(alert.severity)}
                          </span>
                        </div>
                        
                        <p className="font-semibold text-textPrimary mb-1">
                          {alert.message}
                        </p>

                        {/* Additional Info */}
                        {alert.developer && (
                          <p className="text-sm text-textMuted">
                            Developer ID: {alert.developer}
                          </p>
                        )}
                        {alert.taskCount && (
                          <p className="text-sm text-textMuted">
                            {alert.taskCount} tasks affected
                          </p>
                        )}
                        {alert.task && (
                          <p className="text-sm text-textMuted">
                            Task ID: {alert.task}
                          </p>
                        )}

                        {/* Severity Badge */}
                        <div className="mt-3">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold border inline-block ${getSeverityColor(alert.severity)}`}>
                            {alert.severity.toUpperCase()} PRIORITY
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-2">
                      {alert.action === "reassign" && (
                        <button
                          onClick={() => onResolve(alert.id)}
                          className="px-4 py-2 bg-white border-2 border-current rounded-lg font-semibold hover:bg-current hover:text-white transition-all text-sm whitespace-nowrap"
                        >
                          Reassign Tasks
                        </button>
                      )}
                      {alert.action === "assign" && (
                        <button
                          onClick={() => onResolve(alert.id)}
                          className="px-4 py-2 bg-white border-2 border-current rounded-lg font-semibold hover:bg-current hover:text-white transition-all text-sm whitespace-nowrap"
                        >
                          Assign Now
                        </button>
                      )}
                      {alert.action === "review" && (
                        <button
                          onClick={() => onResolve(alert.id)}
                          className="px-4 py-2 bg-white border-2 border-current rounded-lg font-semibold hover:bg-current hover:text-white transition-all text-sm whitespace-nowrap"
                        >
                          Review Task
                        </button>
                      )}
                      
                      <button
                        onClick={() => onResolve(alert.id)}
                        className="px-4 py-2 bg-white/50 border border-current rounded-lg text-sm hover:bg-white transition-all"
                      >
                        Dismiss
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {alerts.length > 0 && (
          <div className="border-t border-border p-6 bg-surface">
            <div className="flex items-center justify-between">
              <p className="text-sm text-textMuted">
                Address these alerts to optimize team performance
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => alerts.forEach(alert => onResolve(alert.id))}
                  className="px-6 py-2 border border-border text-textSecondary rounded-lg hover:bg-white transition-all"
                >
                  Dismiss All
                </button>
                <button
                  onClick={onClose}
                  className="px-6 py-2 bg-gradient-to-r from-primaryDark to-primary text-white rounded-lg hover:shadow-lg transition-all"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}





