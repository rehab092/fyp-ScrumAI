import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { LOGIN_ENDPOINTS } from "../config/api";

export default function UserStoryForm({
  story = null,
  projects = [],
  onClose,
  onSuccess,
}) {
  const [formData, setFormData] = useState({
    role: "",
    goal: "",
    benefit: "",
    priority: "Medium",
    project_id: "",
    project_name: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [newProjectName, setNewProjectName] = useState("");
  const [showNewProjectInput, setShowNewProjectInput] = useState(false);

  const workspaceId = localStorage.getItem("workspaceId");
  const ownerId = localStorage.getItem("ownerId") || localStorage.getItem("userId");

  useEffect(() => {
    if (story) {
      setFormData({
        role: story.role || "",
        goal: story.goal || "",
        benefit: story.benefit || "",
        priority: story.priority || "Medium",
        project_id: story.project || "",
        project_name: story.project_name || "",
      });
    }
  }, [story]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleProjectSelect = (projectId, projectName) => {
    setFormData((prev) => ({
      ...prev,
      project_id: projectId,
      project_name: projectName,
    }));
    setShowNewProjectInput(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // Validate form
      if (!formData.role.trim()) throw new Error("Role is required");
      if (!formData.goal.trim()) throw new Error("Goal is required");
      if (!formData.benefit.trim()) throw new Error("Benefit is required");
      if (!formData.project_name.trim())
        throw new Error("Project is required");

      const endpoint = story
        ? LOGIN_ENDPOINTS.userStories.update(story.id)
        : LOGIN_ENDPOINTS.userStories.create;

      const method = story ? "PUT" : "POST";

      const payload = {
        ...(story ? {} : { owner_id: ownerId }),
        role: formData.role.trim(),
        goal: formData.goal.trim(),
        benefit: formData.benefit.trim(),
        priority: formData.priority,
        project_id: formData.project_id,  // Include project_id for new endpoint
        project_name: formData.project_name.trim(),
      };

      console.log("Sending payload to:", endpoint);
      console.log("Payload:", payload);

      const response = await fetch(endpoint, {
        method,
        headers: {
          "Content-Type": "application/json",
          "Workspace-ID": workspaceId,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || `Request failed with status ${response.status}`
        );
      }

      alert(
        story
          ? "User story updated successfully!"
          : "User story created successfully!"
      );
      onSuccess();
    } catch (err) {
      console.error("Error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-surface border border-border rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-primary to-primaryLight p-6 flex justify-between items-center border-b border-border z-10">
          <h2 className="text-2xl font-bold text-white">
            {story ? "Edit User Story" : "Create New User Story"}
          </h2>
          <button
            onClick={onClose}
            className="text-white hover:bg-white/20 p-2 rounded-lg transition-colors"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-error/20 border border-error text-error rounded-lg p-4"
            >
              {error}
            </motion.div>
          )}

          {/* Role Field */}
          <div>
            <label className="block text-sm font-semibold text-textPrimary mb-2">
              Role <span className="text-error">*</span>
            </label>
            <p className="text-xs text-textSecondary mb-2">
              Who is this story for? (e.g., "As a Product Manager", "As a
              Developer")
            </p>
            <input
              type="text"
              name="role"
              value={formData.role}
              onChange={handleChange}
              placeholder="e.g., As a user"
              className="w-full bg-background border border-border rounded-lg px-4 py-3 text-textPrimary focus:outline-none focus:ring-2 focus:ring-primary placeholder-textSecondary/50"
            />
          </div>

          {/* Goal Field */}
          <div>
            <label className="block text-sm font-semibold text-textPrimary mb-2">
              Goal <span className="text-error">*</span>
            </label>
            <p className="text-xs text-textSecondary mb-2">
              What do they want to accomplish?
            </p>
            <textarea
              name="goal"
              value={formData.goal}
              onChange={handleChange}
              placeholder="e.g., I want to view all my tasks in one place"
              rows="3"
              className="w-full bg-background border border-border rounded-lg px-4 py-3 text-textPrimary focus:outline-none focus:ring-2 focus:ring-primary placeholder-textSecondary/50 resize-none"
            />
          </div>

          {/* Benefit Field */}
          <div>
            <label className="block text-sm font-semibold text-textPrimary mb-2">
              Benefit <span className="text-error">*</span>
            </label>
            <p className="text-xs text-textSecondary mb-2">
              Why is this important? What value does it bring?
            </p>
            <textarea
              name="benefit"
              value={formData.benefit}
              onChange={handleChange}
              placeholder="e.g., So I can prioritize my work effectively"
              rows="3"
              className="w-full bg-background border border-border rounded-lg px-4 py-3 text-textPrimary focus:outline-none focus:ring-2 focus:ring-primary placeholder-textSecondary/50 resize-none"
            />
          </div>

          {/* Priority Field */}
          <div>
            <label className="block text-sm font-semibold text-textPrimary mb-2">
              Priority <span className="text-error">*</span>
            </label>
            <select
              name="priority"
              value={formData.priority}
              onChange={handleChange}
              className="w-full bg-background border border-border rounded-lg px-4 py-3 text-textPrimary focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="Low">🟢 Low</option>
              <option value="Medium">🟡 Medium</option>
              <option value="High">🔴 High</option>
            </select>
          </div>

          {/* Project Selection */}
          <div>
            <label className="block text-sm font-semibold text-textPrimary mb-2">
              Project <span className="text-error">*</span>
            </label>

            {!showNewProjectInput ? (
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
                  {projects.map((project) => (
                    <button
                      key={project.id}
                      type="button"
                      onClick={() =>
                        handleProjectSelect(project.id, project.name)
                      }
                      className={`p-3 rounded-lg border transition-colors text-left ${
                        formData.project_id === project.id
                          ? "bg-primary border-primary text-white"
                          : "bg-background border-border text-textPrimary hover:border-primary"
                      }`}
                    >
                      <div className="font-medium">{project.name}</div>
                      <div className="text-xs opacity-75">
                        {project.description || "No description"}
                      </div>
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => setShowNewProjectInput(true)}
                  className="w-full bg-primary/20 border border-primary text-primary rounded-lg px-4 py-3 font-medium hover:bg-primary/30 transition-colors"
                >
                  ➕ Create New Project
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <input
                  type="text"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  placeholder="Enter project name"
                  className="w-full bg-background border border-border rounded-lg px-4 py-3 text-textPrimary focus:outline-none focus:ring-2 focus:ring-primary placeholder-textSecondary/50"
                  autoFocus
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (newProjectName.trim()) {
                        handleProjectSelect(null, newProjectName.trim());
                        setNewProjectName("");
                      }
                    }}
                    className="flex-1 bg-success text-white rounded-lg px-4 py-3 font-medium hover:bg-success/90 transition-colors"
                  >
                    ✓ Use New Project
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowNewProjectInput(false);
                      setNewProjectName("");
                    }}
                    className="flex-1 bg-border text-textPrimary rounded-lg px-4 py-3 font-medium hover:bg-border/80 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Story Points Info */}
          <div className="bg-primary/10 border border-primary rounded-lg p-4">
            <p className="text-sm text-textPrimary font-medium mb-1">💡 Story Points</p>
            <p className="text-xs text-textSecondary">
              You'll be able to assign story points in the main dashboard after
              creating this user story. Story points help estimate complexity
              and effort (1-100 scale, typically using Fibonacci sequence: 1, 2,
              3, 5, 8, 13, 21, etc.).
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-6 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-border text-textPrimary rounded-lg px-6 py-3 font-semibold hover:bg-border/80 transition-colors"
            >
              Cancel
            </button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading}
              className="flex-1 bg-gradient-to-r from-primary to-primaryLight text-white rounded-lg px-6 py-3 font-semibold hover:shadow-lg transition-shadow disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity }}
                    className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                  />
                  Saving...
                </>
              ) : (
                <>
                  ✓ {story ? "Update Story" : "Create Story"}
                </>
              )}
            </motion.button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
