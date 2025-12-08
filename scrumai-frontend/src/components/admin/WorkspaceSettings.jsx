import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";

export default function WorkspaceSettings({ workspaceInfo }) {
  const [formData, setFormData] = useState({
    workspaceName: "",
    companyName: "",
    adminName: "",
    adminEmail: "",
    defaultSprintLength: "2",
    defaultWorkingHours: "40",
    defaultCapacityHours: "40"
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (workspaceInfo) {
      setFormData({
        workspaceName: workspaceInfo.workspaceName || "",
        companyName: workspaceInfo.companyName || "",
        adminName: workspaceInfo.adminName || "",
        adminEmail: workspaceInfo.adminEmail || "",
        defaultSprintLength: "2",
        defaultWorkingHours: "40",
        defaultCapacityHours: "40"
      });
    }
  }, [workspaceInfo]);

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
    setSuccess("");

    try {
      // TODO: Implement API call to update workspace settings
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      
      // Update localStorage
      localStorage.setItem('workspaceName', formData.workspaceName);
      localStorage.setItem('companyName', formData.companyName);
      localStorage.setItem('adminName', formData.adminName);
      localStorage.setItem('adminEmail', formData.adminEmail);

      setSuccess("Workspace settings updated successfully!");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      console.error('Error updating settings:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <h1 className="text-3xl font-bold text-textPrimary mb-2">Workspace Settings</h1>
        <p className="text-textSecondary mb-8">
          Manage your workspace information and configuration
        </p>

        <div className="bg-white border border-border rounded-2xl shadow-lg p-8">
          {success && (
            <div className="bg-green-500/20 border border-green-500/50 text-green-700 px-4 py-3 rounded-lg mb-6">
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Workspace Information */}
            <div>
              <h2 className="text-xl font-bold text-textPrimary mb-4">Workspace Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-textPrimary mb-2">
                    Workspace Name *
                  </label>
                  <input
                    type="text"
                    name="workspaceName"
                    value={formData.workspaceName}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2.5 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary bg-white text-textPrimary transition-all"
                    placeholder="My Workspace"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-textPrimary mb-2">
                    Company Name *
                  </label>
                  <input
                    type="text"
                    name="companyName"
                    value={formData.companyName}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2.5 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary bg-white text-textPrimary transition-all"
                    placeholder="My Company"
                  />
                </div>
              </div>
            </div>

            {/* Admin Information */}
            <div>
              <h2 className="text-xl font-bold text-textPrimary mb-4">Admin Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-textPrimary mb-2">
                    Admin Name *
                  </label>
                  <input
                    type="text"
                    name="adminName"
                    value={formData.adminName}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2.5 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary bg-white text-textPrimary transition-all"
                    placeholder="Admin Name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-textPrimary mb-2">
                    Admin Email *
                  </label>
                  <input
                    type="email"
                    name="adminEmail"
                    value={formData.adminEmail}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2.5 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary bg-white text-textPrimary transition-all"
                    placeholder="admin@example.com"
                  />
                </div>
              </div>
            </div>

            {/* Scrum Configuration */}
            <div>
              <h2 className="text-xl font-bold text-textPrimary mb-4">Scrum Configuration</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-textPrimary mb-2">
                    Default Sprint Length (weeks)
                  </label>
                  <input
                    type="number"
                    name="defaultSprintLength"
                    value={formData.defaultSprintLength}
                    onChange={handleChange}
                    min="1"
                    max="4"
                    className="w-full px-4 py-2.5 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary bg-white text-textPrimary transition-all"
                    placeholder="2"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-textPrimary mb-2">
                    Default Working Hours/Week
                  </label>
                  <input
                    type="number"
                    name="defaultWorkingHours"
                    value={formData.defaultWorkingHours}
                    onChange={handleChange}
                    min="1"
                    max="168"
                    className="w-full px-4 py-2.5 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary bg-white text-textPrimary transition-all"
                    placeholder="40"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-textPrimary mb-2">
                    Default Capacity Hours
                  </label>
                  <input
                    type="number"
                    name="defaultCapacityHours"
                    value={formData.defaultCapacityHours}
                    onChange={handleChange}
                    min="1"
                    max="168"
                    className="w-full px-4 py-2.5 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary bg-white text-textPrimary transition-all"
                    placeholder="40"
                  />
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end pt-4">
              <button
                type="submit"
                disabled={loading}
                className="px-8 py-3 bg-gradient-to-r from-primary to-primaryDark text-white rounded-lg hover:shadow-lg transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Saving...</span>
                  </>
                ) : (
                  <span>Save Settings</span>
                )}
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
}


