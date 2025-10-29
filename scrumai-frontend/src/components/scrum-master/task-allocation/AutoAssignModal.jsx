import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";

export default function AutoAssignModal({ tasks, teamMembers, onClose, onAssign }) {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate AI processing
    setTimeout(() => {
      const newSuggestions = generateSuggestions(tasks, teamMembers);
      setSuggestions(newSuggestions);
      setLoading(false);
    }, 1500);
  }, [tasks, teamMembers]);

  const generateSuggestions = (tasks, developers) => {
    return tasks.map(task => {
      // Find developers with matching skills
      const matchingDevs = developers.filter(dev =>
        task.requiredSkills.some(skill => dev.skills.includes(skill))
      );

      // Sort by workload (ascending)
      const sortedDevs = matchingDevs.sort((a, b) => a.assignedHours - b.assignedHours);

      const suggestedDev = sortedDevs[0] || developers[0];
      const skillMatch = task.requiredSkills.filter(skill => 
        suggestedDev.skills.includes(skill)
      ).length;
      const matchPercentage = Math.round((skillMatch / task.requiredSkills.length) * 100);

      return {
        task,
        suggestedDeveloper: suggestedDev,
        matchPercentage,
        confidence: matchPercentage >= 80 ? "high" : matchPercentage >= 50 ? "medium" : "low"
      };
    });
  };

  const handleAcceptAll = () => {
    suggestions.forEach(suggestion => {
      onAssign(suggestion.task.id, suggestion.suggestedDeveloper.id);
    });
    onClose();
  };

  const handleAcceptSingle = (suggestion) => {
    onAssign(suggestion.task.id, suggestion.suggestedDeveloper.id);
    setSuggestions(suggestions.filter(s => s.task.id !== suggestion.task.id));
  };

  const getConfidenceColor = (confidence) => {
    switch (confidence) {
      case "high": return "bg-success/20 text-success border-success/30";
      case "medium": return "bg-warning/20 text-warning border-warning/30";
      case "low": return "bg-error/20 text-error border-error/30";
      default: return "bg-surface text-textSecondary border-border";
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[80vh] overflow-hidden"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-primaryDark to-primary p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <span>🧠</span>
                AI Assignment Suggestions
              </h2>
              <p className="text-white/80 text-sm mt-1">
                {loading ? "Analyzing tasks and team capacity..." : `${suggestions.length} suggestions generated`}
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
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-primary"></div>
              <p className="text-textMuted mt-4">Processing assignments...</p>
            </div>
          ) : suggestions.length === 0 ? (
            <div className="text-center py-12">
              <span className="text-6xl">✅</span>
              <p className="text-textMuted mt-4">All tasks have been assigned!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {suggestions.map((suggestion, index) => (
                <motion.div
                  key={suggestion.task.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-gradient-to-br from-surface to-surfaceLight border border-border rounded-xl p-4"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      {/* Task Info */}
                      <div className="mb-3">
                        <h3 className="font-bold text-textPrimary mb-1">
                          {suggestion.task.title}
                        </h3>
                        <div className="flex flex-wrap items-center gap-2 text-sm text-textMuted">
                          <span>⏱️ {suggestion.task.effortHours}h</span>
                          <span>•</span>
                          <span className="capitalize">{suggestion.task.priority} Priority</span>
                        </div>
                      </div>

                      {/* Suggested Developer */}
                      <div className="bg-white rounded-lg p-3 border border-border">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-r from-primary to-secondary rounded-full flex items-center justify-center text-white font-bold text-sm">
                              {suggestion.suggestedDeveloper.avatar}
                            </div>
                            <div>
                              <p className="font-semibold text-textPrimary">
                                {suggestion.suggestedDeveloper.name}
                              </p>
                              <p className="text-xs text-textMuted">
                                {suggestion.suggestedDeveloper.role}
                              </p>
                            </div>
                          </div>
                          
                          <div className="text-right">
                            <div className={`px-3 py-1 rounded-full text-xs font-semibold border inline-block ${getConfidenceColor(suggestion.confidence)}`}>
                              {suggestion.matchPercentage}% Match
                            </div>
                            <p className="text-xs text-textMuted mt-1">
                              {suggestion.suggestedDeveloper.assignedHours}h / {suggestion.suggestedDeveloper.capacityHours}h
                            </p>
                          </div>
                        </div>

                        {/* Skill Match */}
                        <div className="mt-3 pt-3 border-t border-border">
                          <p className="text-xs text-textMuted mb-2">Skill Match:</p>
                          <div className="flex flex-wrap gap-2">
                            {suggestion.task.requiredSkills.map((skill, idx) => {
                              const hasSkill = suggestion.suggestedDeveloper.skills.includes(skill);
                              return (
                                <span
                                  key={idx}
                                  className={`px-2 py-1 rounded-md text-xs font-medium ${
                                    hasSkill
                                      ? "bg-success/20 text-success border border-success/30"
                                      : "bg-error/20 text-error border border-error/30"
                                  }`}
                                >
                                  {hasSkill ? "✓" : "✗"} {skill}
                                </span>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Action */}
                    <button
                      onClick={() => handleAcceptSingle(suggestion)}
                      className="px-4 py-2 bg-gradient-to-r from-primary to-secondary text-white rounded-lg hover:shadow-lg transition-all whitespace-nowrap"
                    >
                      Accept
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {!loading && suggestions.length > 0 && (
          <div className="border-t border-border p-6 bg-surface flex items-center justify-between">
            <p className="text-sm text-textMuted">
              Review and accept suggestions individually or all at once
            </p>
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="px-6 py-2 border border-border text-textSecondary rounded-lg hover:bg-white transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleAcceptAll}
                className="px-6 py-2 bg-gradient-to-r from-primaryDark to-primary text-white rounded-lg hover:shadow-lg transition-all"
              >
                Accept All ({suggestions.length})
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}



