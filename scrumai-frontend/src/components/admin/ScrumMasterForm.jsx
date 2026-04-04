import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { LOGIN_ENDPOINTS } from "../../config/api";

export default function ScrumMasterForm({ onClose, onSuccess, editMember = null }) {
  const [formData, setFormData] = useState({
    name: editMember?.name || "",
    email: editMember?.email || "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Update form data when editMember changes
  useEffect(() => {
    if (editMember) {
      setFormData({
        name: editMember.name || "",
        email: editMember.email || "",
      });
    }
  }, [editMember]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // Validate form
      if (!formData.name.trim()) {
        throw new Error("Name is required");
      }
      if (!editMember && !formData.email.trim()) {
        throw new Error("Email is required");
      }

      // Prepare request data
      const requestData = editMember
        ? {
            // For update, only send fields that changed
            name: formData.name.trim(),
          }
        : {
            // For create, include email and role
            name: formData.name.trim(),
            email: formData.email.trim(),
            role: "SCRUM_MASTER", // Automatically set - backend expects uppercase
          };

      const workspaceId = localStorage.getItem('workspaceId');
      if (!workspaceId) {
        throw new Error("Workspace ID not found. Please log in again.");
      }

      // Determine endpoint and method
      const endpoint = editMember
        ? LOGIN_ENDPOINTS.management.updateManagementUser(editMember.id)
        : LOGIN_ENDPOINTS.management.addManagementUser;
      const method = editMember ? "PUT" : "POST";

      const fetchResponse = await fetch(endpoint, {
        method: method,
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          "Workspace-ID": workspaceId,
        },
        body: JSON.stringify(requestData),
      });

      if (!fetchResponse.ok) {
        const errorData = await fetchResponse.json().catch(() => ({}));
        throw new Error(errorData.error || errorData.message || `Request failed with status ${fetchResponse.status}`);
      }

      const response = await fetchResponse.json();

      if (onSuccess) {
        onSuccess(response);
      }

      // Show success message with credentials (if available)
      if (!editMember && response.credentials) {
        alert(`Scrum Master created successfully!\n\nEmail: ${response.credentials.email}\nPassword: ${response.credentials.password}\n\nCredentials have been sent via email.`);
      } else if (editMember) {
        alert("Scrum Master updated successfully!");
      }

      // Reset form
      setFormData({
        name: "",
        email: "",
      });

      if (onClose) {
        onClose();
      }
    } catch (err) {
      console.error('Error details:', err);
      setError(err.message || `Failed to ${editMember ? "update" : "add"} Scrum Master`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-[#1a202c]/95 rounded-2xl shadow-2xl w-full max-w-sm sm:max-w-md overflow-hidden border border-slate-700/50 max-h-[90vh] flex flex-col"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-secondary to-secondaryDark p-4 sm:p-6 text-white border-b border-slate-600/50 flex-shrink-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <h2 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
                <span>🎯</span>
                <span className="truncate">{editMember ? "Edit Scrum Master" : "Add Scrum Master"}</span>
              </h2>
              <p className="text-white/80 text-xs sm:text-sm mt-1">
                {editMember ? "Update Scrum Master information" : "Create a new Scrum Master profile"}
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 transition-all flex items-center justify-center flex-shrink-0"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Form Content */}
        <div className="p-4 sm:p-6 bg-white overflow-y-auto flex-1">
          <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
            {error && (
              <div className="bg-red-500/20 border border-red-500/50 text-red-700 px-3 sm:px-4 py-2 sm:py-3 rounded-lg text-xs sm:text-sm">
                {error}
              </div>
            )}

            <div>
              <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1 sm:mb-2">
                Name *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full px-3 sm:px-4 py-2 sm:py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-secondary focus:border-secondary bg-white text-slate-900 placeholder:text-slate-400 transition-all text-sm"
                placeholder="Enter Scrum Master name"
              />
            </div>

            {!editMember && (
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1 sm:mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full px-3 sm:px-4 py-2 sm:py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-secondary focus:border-secondary bg-white text-slate-900 placeholder:text-slate-400 transition-all text-sm"
                  placeholder="scrummaster@example.com"
                />
              </div>
            )}



            {/* Action Buttons */}
            <div className="flex gap-2 sm:gap-3 pt-2 flex-col-reverse sm:flex-row">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 sm:px-6 py-2 sm:py-2.5 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-all font-medium text-sm"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-4 sm:px-6 py-2 sm:py-2.5 bg-gradient-to-r from-secondary to-secondaryDark text-white rounded-lg hover:shadow-lg transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>{editMember ? "Updating..." : "Adding..."}</span>
                  </>
                ) : (
                  <span>{editMember ? "Update Scrum Master" : "Add Scrum Master"}</span>
                )}
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
}