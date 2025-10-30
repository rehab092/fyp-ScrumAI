import React from 'react';
import { motion } from 'framer-motion';

export default function ChartContainer({ 
  title, 
  children, 
  className = "", 
  delay = 0,
  actions = null 
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay }}
      className={`bg-nightBlueShadow/60 border border-sandTan/20 rounded-2xl p-6 ${className}`}
    >
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-sandTan">{title}</h2>
        {actions && (
          <div className="flex gap-2">
            {actions}
          </div>
        )}
      </div>
      {children}
    </motion.div>
  );
}






