import React from "react";
import { motion } from "framer-motion";

export default function NotificationsPanel({ notifications = [], onViewTask }) {
  return (
    <div className="bg-white border border-border rounded-2xl p-4 max-h-[320px] overflow-y-auto">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-textPrimary">
          Notifications
        </h3>
        <span className="text-[11px] text-textMuted">
          {notifications.length} alerts
        </span>
      </div>

      {notifications.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-3xl mb-2">🎉</p>
          <p className="text-xs text-textMuted">
            You are all caught up. No new notifications.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((n, index) => (
            <motion.div
              key={n.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.03 }}
              className={`flex items-start gap-3 rounded-xl border px-3 py-2 text-xs ${
                n.type === "overload"
                  ? "border-error/40 bg-error/5"
                  : n.type === "due"
                  ? "border-warning/40 bg-warning/5"
                  : n.type === "dependency"
                  ? "border-primary/40 bg-primary/5"
                  : "border-border bg-surface"
              }`}
            >
              <div className="mt-0.5">
                <span className="text-base">
                  {n.icon ||
                    (n.type === "assigned"
                      ? "📝"
                      : n.type === "overload"
                      ? "⚠️"
                      : n.type === "dependency"
                      ? "🔗"
                      : "ℹ️")}
                </span>
              </div>
              <div className="flex-1">
                <p className="text-[11px] text-textPrimary mb-0.5">
                  {n.message}
                </p>
                <p className="text-[10px] text-textMuted mb-1">{n.time}</p>
                {n.taskId && (
                  <button
                    onClick={() => onViewTask?.(n.taskId)}
                    className="text-[10px] font-medium text-primary hover:text-primaryDark"
                  >
                    View task →
                  </button>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}












