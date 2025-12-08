import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { LOGIN_ENDPOINTS, apiRequest } from "../../config/api";

export default function TeamMemberForm({ onClose, onSuccess, editMember = null }) {
  const [formData, setFormData] = useState({
    name: editMember?.name || "",
    email: editMember?.email || "",
    skills: editMember?.skills ? editMember.skills.join(", ") : "",
    capacityHours: editMember?.capacityHours || "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Update form data when editMember changes
  useEffect(() => {
    if (editMember) {
      setFormData({
        name: editMember.name || "",
        email: editMember.email || "",
        skills: editMember.skills ? (Array.isArray(editMember.skills) ? editMember.skills.join(", ") : editMember.skills) : "",
        capacityHours: editMember.capacityHours || "",
      });
    }
  }, [editMember]);

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
      if (!formData.capacityHours || parseFloat(formData.capacityHours) <= 0) {
        throw new Error("Capacity hours must be a positive number");
      }

      // Convert skills string to array
      const skillsArray = formData.skills
        .split(",")
        .map((skill) => skill.trim())
        .filter((skill) => skill.length > 0);

      // Prepare request data
      const requestData = editMember
        ? {
            // For update, only send fields that changed
            name: formData.name.trim(),
            skills: skillsArray,
            capacityHours: parseFloat(formData.capacityHours),
          }
        : {
            // For create, include email
            name: formData.name.trim(),
            email: formData.email.trim(),
            skills: skillsArray,
            capacityHours: parseFloat(formData.capacityHours),
          };

      // Make API call - update if editing, create if new
      const endpoint = editMember 
        ? LOGIN_ENDPOINTS.team.update(editMember.id)
        : LOGIN_ENDPOINTS.team.add;
      const method = editMember ? "PATCH" : "POST";
      
      // Get workspace ID and token
      const workspaceId = localStorage.getItem('workspaceId');
      const token = localStorage.getItem('authToken');
      
      console.log('Sending request to:', endpoint);
      console.log('Request data:', requestData);
      console.log('Method:', method);
      console.log('Workspace ID:', workspaceId);
      
      if (!workspaceId) {
        throw new Error("Workspace ID not found. Please log in again.");
      }
      
      // Use fetch - Vite proxy handles CORS for /api/* routes
      const fetchResponse = await fetch(endpoint, {
        method: method,
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          "Workspace-ID": workspaceId,
          ...(token && { "Authorization": `Bearer ${token}` }),
        },
        body: JSON.stringify(requestData),
      });

      if (!fetchResponse.ok) {
        const errorData = await fetchResponse.json().catch(() => ({}));
        throw new Error(errorData.error || errorData.message || `Request failed with status ${fetchResponse.status}`);
      }

      const response = await fetchResponse.json();

      console.log('API Response:', response);

      // Success - call onSuccess callback with the new member
      // Backend returns: { success, message, member, credentials, invitation, emailSent }
      if (onSuccess) {
        if (response.member) {
          onSuccess(response.member);
        } else if (response.updated) {
          // For updates, response has 'updated' field
          onSuccess(response.updated);
        } else {
          onSuccess(response);
        }
      }

      // Show credentials alert for new members (optional - you can remove this if you don't want to show password)
      if (!editMember && response.credentials) {
        alert(`Team member created successfully!\n\nEmail: ${response.credentials.email}\nPassword: ${response.credentials.password}\n\nCredentials have been sent via email.`);
      }

      // Reset form
      setFormData({
        name: "",
        email: "",
        skills: "",
        capacityHours: "",
      });

      // Close modal
      if (onClose) {
        onClose();
      }
    } catch (err) {
      console.error('Error details:', err);
      let errorMessage = err.message || "Failed to add team member";
      
      // Provide more helpful error messages
      const endpointPath = LOGIN_ENDPOINTS.team.add.replace('http://localhost:8000/', '');
      if (errorMessage.includes('HTML instead of JSON')) {
        errorMessage = `The server endpoint may not exist. Please check that the backend server is running and the endpoint '${endpointPath}' is configured correctly. Verify that your Django urls.py includes: path('api/module2/', include('assignment_module.urls')) and path("team/add/", add_team_member).`;
      } else if (errorMessage.includes('Failed to fetch')) {
        errorMessage = "Cannot connect to the server. Please ensure the backend server is running at http://localhost:8000";
      } else if (errorMessage.includes('404')) {
        errorMessage = `Endpoint not found (404). Please verify the API endpoint '${endpointPath}' exists on the server. Check your Django urls.py file to ensure the route is properly configured.`;
      } else if (errorMessage.includes('500')) {
        errorMessage = "Server error. Please check the server logs for more details.";
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-[#1a202c]/95 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-700/50"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-700 to-slate-800 p-6 text-white border-b border-slate-600/50">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <span>👤</span>
                {editMember ? "Edit Team Member" : "Add Team Member"}
              </h2>
              <p className="text-white/80 text-sm mt-1">
                {editMember ? "Update team member information" : "Create a new team member profile"}
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

        {/* Form Content */}
        <div className="p-6 bg-white">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-500/20 border border-red-500/50 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Name *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-400 focus:border-slate-400 bg-white text-slate-900 placeholder:text-slate-400 transition-all"
                placeholder="Enter team member name"
              />
            </div>

            {!editMember && (
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-400 focus:border-slate-400 bg-white text-slate-900 placeholder:text-slate-400 transition-all"
                  placeholder="developer@example.com"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Skills
              </label>
              <input
                type="text"
                name="skills"
                value={formData.skills}
                onChange={handleChange}
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-400 focus:border-slate-400 bg-white text-slate-900 placeholder:text-slate-400 transition-all"
                placeholder="Comma-separated (e.g., React, Node.js, MongoDB)"
              />
              <p className="text-slate-500 text-xs mt-1">
                Separate multiple skills with commas
              </p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Capacity Hours *
              </label>
              <input
                type="number"
                name="capacityHours"
                value={formData.capacityHours}
                onChange={handleChange}
                required
                min="1"
                step="0.5"
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-400 focus:border-slate-400 bg-white text-slate-900 placeholder:text-slate-400 transition-all"
                placeholder="e.g., 40"
              />
              <p className="text-slate-500 text-xs mt-1">
                Weekly capacity in hours
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-6 py-2.5 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-all font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-6 py-2.5 bg-gradient-to-r from-teal-600 to-teal-500 text-white rounded-lg hover:shadow-lg transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
                  <span>{editMember ? "Update Member" : "Add Member"}</span>
                )}
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
}

