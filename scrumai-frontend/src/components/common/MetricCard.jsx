import React from 'react';
import { motion } from 'framer-motion';

export default function MetricCard({ 
  title, 
  value, 
  change, 
  trend, 
  icon, 
  delay = 0,
  className = "" 
}) {
  const getTrendColor = (trend) => {
    switch (trend) {
      case "up": return "text-green-400";
      case "down": return "text-red-400";
      default: return "text-textMuted";
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay }}
      className={`bg-nightBlueShadow/60 border border-sandTan/20 rounded-2xl p-6 hover:shadow-glow transition-all duration-300 ${className}`}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="text-2xl">{icon}</div>
        {change && (
          <div className={`text-sm font-medium ${getTrendColor(trend)}`}>
            {change}
          </div>
        )}
      </div>
      <div className="text-2xl font-bold text-sandTan mb-1">{value}</div>
      <div className="text-textMuted text-sm">{title}</div>
    </motion.div>
  );
}




