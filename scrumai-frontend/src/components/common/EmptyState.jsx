import { motion } from "framer-motion";

export default function EmptyState({ icon = "📦", title, description, actionLabel, onAction }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center min-h-96 text-center"
    >
      <div className="text-6xl mb-4">{icon}</div>
      <h2 className="text-2xl font-bold text-textPrimary mb-2">{title}</h2>
      <p className="text-textSecondary mb-6 max-w-md">{description}</p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primaryDark transition font-medium"
        >
          {actionLabel}
        </button>
      )}
    </motion.div>
  );
}
