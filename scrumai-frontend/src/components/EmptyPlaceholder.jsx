import React from "react";
import { motion } from "framer-motion";

export default function EmptyPlaceholder({ title, icon, description }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center min-h-[60vh] text-center"
    >
      <motion.div
        animate={{ scale: [1, 1.1, 1] }}
        transition={{ duration: 2, repeat: Infinity }}
        className="text-8xl mb-6"
      >
        {icon}
      </motion.div>
      
      <h2 className="text-3xl font-bold text-textPrimary mb-3">{title}</h2>
      
      <p className="text-textSecondary max-w-md mb-8">
        {description}
      </p>

      <motion.div
        whileHover={{ scale: 1.05 }}
        className="bg-gradient-to-r from-primary to-primaryLight text-white px-8 py-3 rounded-lg font-semibold hover:shadow-lg transition-shadow"
      >
        Coming Soon
      </motion.div>

      <div className="mt-12 pt-8 border-t border-border w-full max-w-2xl">
        <p className="text-sm text-textSecondary">
          This feature is being prepared. Check back soon for updates!
        </p>
      </div>
    </motion.div>
  );
}
