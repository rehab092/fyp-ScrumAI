import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LOGIN_ENDPOINTS } from "../../config/api";

export default function UserStoryModal({ isOpen, story, projectId, onClose, onSave }) {
  const [formData, setFormData] = useState({
    role: "",
    goal: "",
    benefit: "",
    priority: "Medium",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const workspaceId = localStorage.getItem("workspaceId");
  const ownerId = localStorage.getItem("ownerId") || localStorage.getItem("userId");

  useEffect(() => {
    if (story) {
      setFormData({
        role: story.role || "",
        goal: story.goal || "",
        benefit: story.benefit || "",
        priority: story.priority || "Medium",
      });
    } else {
      setFormData({
        role: "",
        goal: "",
        benefit: "",
        priority: "Medium",
      });
    }
    setError("");
  }, [story, isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (!formData.role.trim()) throw new Error("Role is required");
      if (!formData.goal.trim()) throw new Error("Goal is required");
      if (!formData.benefit.trim()) throw new Error("Benefit is required");
      
      // Determine if we're creating or updating
      const isEditing = !!story?.id;
      
      // Debug: log all values
      console.log("=== FORM SUBMISSION DEBUG ===");
      console.log("isEditing:", isEditing);
      console.log("storyId:", story?.id);
      console.log("projectId:", projectId, "type:", typeof projectId);
      console.log("ownerId:", ownerId, "type:", typeof ownerId);
      console.log("workspaceId:", workspaceId);
      
      let apiUrl;
      let method = "POST";
      let payload = {};

      if (isEditing) {
        // UPDATE MODE
        apiUrl = LOGIN_ENDPOINTS.userStories.update(story.id);
        method = "PUT";
        payload = {
          role: formData.role.trim(),
          goal: formData.goal.trim(),
          benefit: formData.benefit.trim(),
          priority: formData.priority,
        };
      } else {
        // CREATE MODE
        if (!projectId) {
          throw new Error(`Project is required (projectId: ${projectId})`);
        }
        if (!ownerId) {
          throw new Error(`Owner ID not found in localStorage (ownerId: ${ownerId})`);
        }

        const project_id = parseInt(projectId);
        const owner_id = parseInt(ownerId);

        if (isNaN(project_id)) throw new Error(`Invalid project_id: ${projectId}`);
        if (isNaN(owner_id)) throw new Error(`Invalid owner_id: ${ownerId}`);

        apiUrl = LOGIN_ENDPOINTS.userStories.create;
        method = "POST";
        payload = {
          owner_id,
          project_id,
          role: formData.role.trim(),
          goal: formData.goal.trim(),
          benefit: formData.benefit.trim(),
          priority: formData.priority,
        };
      }

      console.log("Sending payload:", payload);
      console.log("To URL:", apiUrl, "Method:", method);

      const response = await fetch(apiUrl, {
        method,
        headers: {
          "Content-Type": "application/json",
          "Workspace-ID": workspaceId || "",
        },
        body: JSON.stringify(payload),
      });

      console.log("Response status:", response.status);
      
      let responseData = {};
      try {
        responseData = await response.json();
      } catch (e) {
        console.warn("Could not parse response JSON:", e);
      }
      console.log("Response data:", responseData);

      if (!response.ok) {
        throw new Error(responseData.error || responseData.message || `Request failed: ${response.status}`);
      }

      // Show success
      console.log(isEditing ? "✅ Story updated successfully!" : "✅ Story created successfully!");
      
      // Close modal - parent will handle refresh
      onClose();
    } catch (err) {
      console.error("❌ Error creating story:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-40"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-0 flex items-center justify-center z-50 p-4"
          >
            <div className="bg-white rounded-2xl shadow-2xl p-6 border border-border w-full max-w-2xl max-h-screen overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-textPrimary">
                  {story?.id ? "Edit User Story" : "Add New User Story"}
                </h2>
                <button
                  onClick={onClose}
                  className="text-textSecondary hover:text-textPrimary transition-colors"
                >
                  ✕
                </button>
              </div>

              {error && (
                <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
                  {error}
                </div>
              )}

              {!projectId && (
                <div className="mb-4 p-4 bg-yellow-100 border border-yellow-400 text-yellow-700 rounded-lg">
                  ⚠️ Warning: No project selected (projectId: {projectId})
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4 max-h-96 overflow-y-auto pr-4">
                {/* Role */}
                <div>
                  <label className="block text-sm font-semibold text-textPrimary mb-2">
                    Role *
                  </label>
                  <input
                    type="text"
                    name="role"
                    value={formData.role}
                    onChange={handleChange}
                    placeholder="e.g., As a user, As an admin"
                    className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    required
                  />
                </div>

                {/* Goal */}
                <div>
                  <label className="block text-sm font-semibold text-textPrimary mb-2">
                    Goal *
                  </label>
                  <textarea
                    name="goal"
                    value={formData.goal}
                    onChange={handleChange}
                    placeholder="What do they want to accomplish?"
                    rows="3"
                    className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                    required
                  />
                </div>

                {/* Benefit */}
                <div>
                  <label className="block text-sm font-semibold text-textPrimary mb-2">
                    Benefit *
                  </label>
                  <textarea
                    name="benefit"
                    value={formData.benefit}
                    onChange={handleChange}
                    placeholder="Why is this important? What value does it bring?"
                    rows="3"
                    className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                    required
                  />
                </div>

                {/* Priority */}
                <div>
                  <label className="block text-sm font-semibold text-textPrimary mb-2">
                    Priority
                  </label>
                  <select
                    name="priority"
                    value={formData.priority}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </div>

                {/* Submit Button */}
                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    disabled={loading}
                    className={`flex-1 py-2 rounded-lg font-semibold transition-all ${
                      loading
                        ? "bg-gray-400 text-white cursor-not-allowed"
                        : "bg-primary text-white hover:bg-primaryDark"
                    }`}
                  >
                  {loading ? (story?.id ? "Updating..." : "Adding...") : (story?.id ? "Update" : "Add User Story")}
                  </button>
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 py-2 rounded-lg font-semibold border border-border text-textPrimary hover:bg-gray-100 transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
