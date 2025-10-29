import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";

export default function Settings() {
  const [activeTab, setActiveTab] = useState("profile");
  const [settings, setSettings] = useState({
    profile: {
      name: "John Doe",
      email: "john.doe@example.com",
      role: "Product Owner",
      timezone: "PST",
      notifications: {
        email: true,
        push: true,
        sms: false
      }
    },
    preferences: {
      theme: "light",
      language: "en",
      dateFormat: "MM/DD/YYYY",
      timeFormat: "12h",
      autoSave: true,
      aiSuggestions: true
    }
  });

  const tabs = [
    { id: "profile", label: "Profile", icon: "👤" },
    { id: "preferences", label: "Preferences", icon: "⚙️" },
    { id: "security", label: "Security", icon: "🔒" }
  ];

  // Apply theme changes
  useEffect(() => {
    const root = document.documentElement;
    if (settings.preferences.theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }, [settings.preferences.theme]);

  const handleSettingChange = (category, key, value) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: value
      }
    }));
  };

  const handleNestedSettingChange = (category, parentKey, key, value) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [parentKey]: {
          ...prev[category][parentKey],
          [key]: value
        }
      }
    }));
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-textPrimary mb-2">Settings</h1>
        <p className="text-textSecondary">Manage your account and application preferences.</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Settings Navigation */}
        <div className="lg:w-64">
          <div className="bg-white border border-border rounded-2xl p-6 shadow-lg">
            <nav className="space-y-2">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300 ${
                    activeTab === tab.id
                      ? "bg-primary text-white shadow-lg"
                      : "text-textPrimary hover:bg-surface"
                  }`}
                >
                  <span className="text-lg">{tab.icon}</span>
                  <span className="font-medium">{tab.label}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Settings Content */}
        <div className="flex-1">
          {/* Profile Settings */}
          {activeTab === "profile" && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
              className="space-y-8"
            >
              <div className="bg-white border border-border rounded-2xl p-6 shadow-lg">
                <h2 className="text-xl font-bold text-textPrimary mb-6">Profile Information</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block mb-2 text-textPrimary font-medium">Full Name</label>
                    <input
                      type="text"
                      value={settings.profile.name}
                      onChange={(e) => handleSettingChange("profile", "name", e.target.value)}
                      className="w-full bg-background border border-border rounded-lg p-3 text-textPrimary focus:outline-none focus:border-primary"
                    />
                  </div>
                  
                  <div>
                    <label className="block mb-2 text-textPrimary font-medium">Email</label>
                    <input
                      type="email"
                      value={settings.profile.email}
                      onChange={(e) => handleSettingChange("profile", "email", e.target.value)}
                      className="w-full bg-background border border-border rounded-lg p-3 text-textPrimary focus:outline-none focus:border-primary"
                    />
                  </div>
                  
                  <div>
                    <label className="block mb-2 text-textPrimary font-medium">Role</label>
                    <select
                      value={settings.profile.role}
                      onChange={(e) => handleSettingChange("profile", "role", e.target.value)}
                      className="w-full bg-background border border-border rounded-lg p-3 text-textPrimary focus:outline-none focus:border-primary"
                    >
                      <option value="Product Owner">Product Owner</option>
                      <option value="Scrum Master">Scrum Master</option>
                      <option value="Developer">Developer</option>
                      <option value="Designer">Designer</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block mb-2 text-textPrimary font-medium">Timezone</label>
                    <select
                      value={settings.profile.timezone}
                      onChange={(e) => handleSettingChange("profile", "timezone", e.target.value)}
                      className="w-full bg-background border border-border rounded-lg p-3 text-textPrimary focus:outline-none focus:border-primary"
                    >
                      <option value="PST">Pacific Standard Time</option>
                      <option value="EST">Eastern Standard Time</option>
                      <option value="GMT">Greenwich Mean Time</option>
                      <option value="CET">Central European Time</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="bg-white border border-border rounded-2xl p-6 shadow-lg">
                <h2 className="text-xl font-bold text-textPrimary mb-6">Notification Preferences</h2>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-textPrimary font-medium">Email Notifications</h3>
                      <p className="text-textSecondary text-sm">Receive updates via email</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.profile.notifications.email}
                        onChange={(e) => handleNestedSettingChange("profile", "notifications", "email", e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-border peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-textPrimary font-medium">Push Notifications</h3>
                      <p className="text-textSecondary text-sm">Receive browser notifications</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.profile.notifications.push}
                        onChange={(e) => handleNestedSettingChange("profile", "notifications", "push", e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-border peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-textPrimary font-medium">SMS Notifications</h3>
                      <p className="text-textSecondary text-sm">Receive text message alerts</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.profile.notifications.sms}
                        onChange={(e) => handleNestedSettingChange("profile", "notifications", "sms", e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-border peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Preferences Settings */}
          {activeTab === "preferences" && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
              className="space-y-8"
            >
              <div className="bg-white border border-border rounded-2xl p-6 shadow-lg">
                <h2 className="text-xl font-bold text-textPrimary mb-6">Application Preferences</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block mb-2 text-textPrimary font-medium">Theme</label>
                    <select
                      value={settings.preferences.theme}
                      onChange={(e) => handleSettingChange("preferences", "theme", e.target.value)}
                      className="w-full bg-background border border-border rounded-lg p-3 text-textPrimary focus:outline-none focus:border-primary"
                    >
                      <option value="light">Light</option>
                      <option value="dark">Dark</option>
                      <option value="auto">Auto</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block mb-2 text-textPrimary font-medium">Language</label>
                    <select
                      value={settings.preferences.language}
                      onChange={(e) => handleSettingChange("preferences", "language", e.target.value)}
                      className="w-full bg-background border border-border rounded-lg p-3 text-textPrimary focus:outline-none focus:border-primary"
                    >
                      <option value="en">English</option>
                      <option value="es">Spanish</option>
                      <option value="fr">French</option>
                      <option value="de">German</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block mb-2 text-textPrimary font-medium">Date Format</label>
                    <select
                      value={settings.preferences.dateFormat}
                      onChange={(e) => handleSettingChange("preferences", "dateFormat", e.target.value)}
                      className="w-full bg-background border border-border rounded-lg p-3 text-textPrimary focus:outline-none focus:border-primary"
                    >
                      <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                      <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                      <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block mb-2 text-textPrimary font-medium">Time Format</label>
                    <select
                      value={settings.preferences.timeFormat}
                      onChange={(e) => handleSettingChange("preferences", "timeFormat", e.target.value)}
                      className="w-full bg-background border border-border rounded-lg p-3 text-textPrimary focus:outline-none focus:border-primary"
                    >
                      <option value="12h">12 Hour</option>
                      <option value="24h">24 Hour</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="bg-white border border-border rounded-2xl p-6 shadow-lg">
                <h2 className="text-xl font-bold text-textPrimary mb-6">Feature Preferences</h2>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-textPrimary font-medium">Auto Save</h3>
                      <p className="text-textSecondary text-sm">Automatically save changes</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.preferences.autoSave}
                        onChange={(e) => handleSettingChange("preferences", "autoSave", e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-border peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-textPrimary font-medium">AI Suggestions</h3>
                      <p className="text-textSecondary text-sm">Show AI-powered recommendations</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.preferences.aiSuggestions}
                        onChange={(e) => handleSettingChange("preferences", "aiSuggestions", e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-border peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Security Settings */}
          {activeTab === "security" && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
              className="space-y-8"
            >
              <div className="bg-white border border-border rounded-2xl p-6 shadow-lg">
                <h2 className="text-xl font-bold text-textPrimary mb-6">Password & Security</h2>
                
                <div className="space-y-6">
                  <div>
                    <label className="block mb-2 text-textPrimary font-medium">Current Password</label>
                    <input
                      type="password"
                      className="w-full bg-background border border-border rounded-lg p-3 text-textPrimary focus:outline-none focus:border-primary"
                    />
                  </div>
                  
                  <div>
                    <label className="block mb-2 text-textPrimary font-medium">New Password</label>
                    <input
                      type="password"
                      className="w-full bg-background border border-border rounded-lg p-3 text-textPrimary focus:outline-none focus:border-primary"
                    />
                  </div>
                  
                  <div>
                    <label className="block mb-2 text-textPrimary font-medium">Confirm New Password</label>
                    <input
                      type="password"
                      className="w-full bg-background border border-border rounded-lg p-3 text-textPrimary focus:outline-none focus:border-primary"
                    />
                  </div>
                  
                  <button className="bg-primary text-white px-6 py-3 rounded-lg hover:bg-primaryDark transition-all font-medium">
                    Update Password
                  </button>
                </div>
              </div>

              <div className="bg-white border border-border rounded-2xl p-6 shadow-lg">
                <h2 className="text-xl font-bold text-textPrimary mb-6">Two-Factor Authentication</h2>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-textPrimary font-medium">Enable 2FA</h3>
                      <p className="text-textSecondary text-sm">Add an extra layer of security to your account</p>
                    </div>
                    <button className="border border-primary text-primary px-4 py-2 rounded-lg hover:bg-primary hover:text-white transition-all">
                      Enable
                    </button>
                  </div>
                </div>
              </div>

              <div className="bg-white border border-border rounded-2xl p-6 shadow-lg">
                <h2 className="text-xl font-bold text-textPrimary mb-6">Active Sessions</h2>
                
                <div className="space-y-4">
                  <div className="bg-surface border border-border rounded-xl p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-textPrimary font-semibold">Current Session</h3>
                        <p className="text-textSecondary text-sm">Chrome on Windows • Last active: Now</p>
                      </div>
                      <span className="px-3 py-1 rounded-full text-sm font-medium bg-success/20 text-success">
                        Active
                      </span>
                    </div>
                  </div>
                  
                  <div className="bg-surface border border-border rounded-xl p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-textPrimary font-semibold">Mobile App</h3>
                        <p className="text-textSecondary text-sm">iOS App • Last active: 2 hours ago</p>
                      </div>
                      <div className="flex gap-2">
                        <span className="px-3 py-1 rounded-full text-sm font-medium bg-warning/20 text-warning">
                          Inactive
                        </span>
                        <button className="text-error hover:text-error/80 transition-colors text-sm">
                          Revoke
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Save Button */}
          <div className="flex justify-end">
            <button className="bg-primary text-white px-8 py-3 rounded-lg hover:bg-primaryDark transition-all font-semibold shadow-lg">
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}