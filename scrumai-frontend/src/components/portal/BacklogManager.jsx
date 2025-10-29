import React, { useState } from "react";
import { motion } from "framer-motion";
import Papa from "papaparse";
import FileUpload from "../common/FileUpload";
import DataTable from "../common/DataTable";
import MetricCard from "../common/MetricCard";

export default function BacklogManager() {
  const [mode, setMode] = useState("view"); // 'view', 'add', 'upload'
  const [userStories, setUserStories] = useState([
    {
      id: 1,
      role: "Developer",
      goal: "provide FABS groups that function under the FREC paradigm",
      benefit: "we can maintain consistent reporting standards",
      priority: "High",
      status: "Ready",
      estimate: "5 points",
      createdAt: "2024-12-15"
    },
    {
      id: 2,
      role: "User",
      goal: "filter products by category",
      benefit: "I can quickly find the items I need",
      priority: "Medium",
      status: "In Progress",
      estimate: "3 points",
      createdAt: "2024-12-14"
    },
    {
      id: 3,
      role: "Admin",
      goal: "view user analytics dashboard",
      benefit: "I can monitor system usage and performance",
      priority: "Low",
      status: "Ready",
      estimate: "8 points",
      createdAt: "2024-12-13"
    }
  ]);

  const [newStory, setNewStory] = useState({
    role: "",
    goal: "",
    benefit: "",
    priority: "Medium",
    estimate: "3 points"
  });

  const [csvData, setCsvData] = useState([]);
  const [error, setError] = useState("");

  const handleCsvUpload = (file) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        setCsvData(results.data);
        setError("");
      },
      error: (error) => {
        setError("Error parsing CSV file: " + error.message);
      }
    });
  };

  const handleAddStory = () => {
    if (!newStory.role.trim() || !newStory.goal.trim() || !newStory.benefit.trim()) {
      setError("All fields are required");
      return;
    }

    const story = {
      id: userStories.length + 1,
      ...newStory,
      status: "Ready",
      createdAt: new Date().toISOString().split('T')[0]
    };

    setUserStories([...userStories, story]);
    setNewStory({ role: "", goal: "", benefit: "", priority: "Medium", estimate: "3 points" });
    setMode("view");
    setError("");
  };

  const handleImportFromCSV = () => {
    const importedStories = csvData.map((row, index) => ({
      id: userStories.length + index + 1,
      role: row.Role || row.role || "",
      goal: row.Goal || row.goal || "",
      benefit: row.Benefit || row.benefit || "",
      priority: row.Priority || row.priority || "Medium",
      estimate: row.Estimate || row.estimate || "3 points",
      status: "Ready",
      createdAt: new Date().toISOString().split('T')[0]
    }));

    setUserStories([...userStories, ...importedStories]);
    setCsvData([]);
    setMode("view");
    setError("");
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "High": return "bg-red-500/20 text-red-400";
      case "Medium": return "bg-yellow-500/20 text-yellow-400";
      case "Low": return "bg-green-500/20 text-green-400";
      default: return "bg-gray-500/20 text-gray-400";
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "In Progress": return "bg-blue-500/20 text-blue-400";
      case "Ready": return "bg-gray-500/20 text-gray-400";
      case "Completed": return "bg-green-500/20 text-green-400";
      default: return "bg-gray-500/20 text-gray-400";
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-sandTan mb-2">Backlog Manager</h1>
        <p className="text-textMuted">Manage your user stories and product backlog efficiently.</p>
      </div>

      {/* Mode Selector */}
      <div className="flex flex-wrap gap-4 mb-8">
        <button
          onClick={() => setMode("view")}
          className={`px-6 py-3 rounded-lg transition-all ${
            mode === "view"
              ? "bg-sandTan text-nightBlue shadow-lg"
              : "border border-sandTan text-sandTan hover:bg-sandTan hover:text-nightBlue"
          }`}
        >
          📋 View Backlog
        </button>
        <button
          onClick={() => setMode("add")}
          className={`px-6 py-3 rounded-lg transition-all ${
            mode === "add"
              ? "bg-sandTan text-nightBlue shadow-lg"
              : "border border-sandTan text-sandTan hover:bg-sandTan hover:text-nightBlue"
          }`}
        >
          ➕ Add Story
        </button>
        <button
          onClick={() => setMode("upload")}
          className={`px-6 py-3 rounded-lg transition-all ${
            mode === "upload"
              ? "bg-sandTan text-nightBlue shadow-lg"
              : "border border-sandTan text-sandTan hover:bg-sandTan hover:text-nightBlue"
          }`}
        >
          📁 Upload CSV
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-4 mb-6">
          <p className="text-red-400">{error}</p>
        </div>
      )}

      {/* Content based on mode */}
      {mode === "view" && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="space-y-6"
        >
          {/* Backlog Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <MetricCard
              title="Total Stories"
              value={userStories.length}
              icon="📋"
              delay={0.1}
            />
            <MetricCard
              title="Ready"
              value={userStories.filter(s => s.status === "Ready").length}
              icon="✅"
              delay={0.2}
            />
            <MetricCard
              title="In Progress"
              value={userStories.filter(s => s.status === "In Progress").length}
              icon="🔄"
              delay={0.3}
            />
            <MetricCard
              title="Completed"
              value={userStories.filter(s => s.status === "Completed").length}
              icon="🎯"
              delay={0.4}
            />
          </div>

          {/* User Stories List */}
          <div className="bg-surface border border-border rounded-2xl p-6">
            <h2 className="text-xl font-bold text-textPrimary mb-6">User Stories</h2>
            
            <div className="space-y-3">
              {userStories.map((story, index) => (
                <motion.div
                  key={story.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  className="bg-surface border border-border rounded-lg p-4 hover:shadow-soft transition-all duration-300"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div className="flex-1">
                      <p className="text-textPrimary text-base mb-2">
                        As a <span className="text-primary font-semibold">{story.role}</span>, 
                        I want to <span className="text-primary font-semibold">{story.goal}</span>, 
                        so that <span className="text-primary font-semibold">{story.benefit}</span>.
                      </p>
                      <div className="flex flex-wrap gap-4 text-sm text-textSecondary">
                        <span>Created: {story.createdAt}</span>
                        <span>Estimate: {story.estimate}</span>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-3">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getPriorityColor(story.priority)}`}>
                        {story.priority}
                      </span>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(story.status)}`}>
                        {story.status}
                      </span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {mode === "add" && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="bg-nightBlueShadow/60 border border-sandTan/20 rounded-2xl p-8"
        >
          <h2 className="text-2xl font-bold text-sandTan mb-6">Add New User Story</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block mb-2 text-sandTan font-medium">Role</label>
              <input
                type="text"
                placeholder="e.g. Developer, User, Admin"
                value={newStory.role}
                onChange={(e) => setNewStory({ ...newStory, role: e.target.value })}
                className="w-full bg-nightBlue border border-sandTan/30 rounded-lg p-3 text-textLight focus:outline-none focus:border-sandTan"
              />
            </div>

            <div>
              <label className="block mb-2 text-sandTan font-medium">Priority</label>
              <select
                value={newStory.priority}
                onChange={(e) => setNewStory({ ...newStory, priority: e.target.value })}
                className="w-full bg-nightBlue border border-sandTan/30 rounded-lg p-3 text-textLight focus:outline-none focus:border-sandTan"
              >
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block mb-2 text-sandTan font-medium">Goal</label>
              <input
                type="text"
                placeholder="e.g. provide FABS groups that function under the FREC paradigm"
                value={newStory.goal}
                onChange={(e) => setNewStory({ ...newStory, goal: e.target.value })}
                className="w-full bg-nightBlue border border-sandTan/30 rounded-lg p-3 text-textLight focus:outline-none focus:border-sandTan"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block mb-2 text-sandTan font-medium">Benefit</label>
              <input
                type="text"
                placeholder="e.g. we can maintain consistent reporting standards"
                value={newStory.benefit}
                onChange={(e) => setNewStory({ ...newStory, benefit: e.target.value })}
                className="w-full bg-nightBlue border border-sandTan/30 rounded-lg p-3 text-textLight focus:outline-none focus:border-sandTan"
              />
            </div>

            <div>
              <label className="block mb-2 text-sandTan font-medium">Estimate</label>
              <select
                value={newStory.estimate}
                onChange={(e) => setNewStory({ ...newStory, estimate: e.target.value })}
                className="w-full bg-nightBlue border border-sandTan/30 rounded-lg p-3 text-textLight focus:outline-none focus:border-sandTan"
              >
                <option value="1 point">1 point</option>
                <option value="2 points">2 points</option>
                <option value="3 points">3 points</option>
                <option value="5 points">5 points</option>
                <option value="8 points">8 points</option>
                <option value="13 points">13 points</option>
              </select>
            </div>
          </div>

          {/* Preview */}
          <div className="bg-nightBlue/50 border border-sandTan/30 p-5 rounded-lg mb-6">
            <h3 className="text-sandTan font-semibold mb-2">Preview:</h3>
            {newStory.role && newStory.goal && newStory.benefit ? (
              <p className="text-textLight italic">
                As a <span className="text-sandTan font-semibold">{newStory.role}</span>, 
                I want to <span className="text-sandTan font-semibold">{newStory.goal}</span>, 
                so that <span className="text-sandTan font-semibold">{newStory.benefit}</span>.
              </p>
            ) : (
              <p className="text-textMuted">Preview will appear once all fields are filled.</p>
            )}
          </div>

          <div className="flex gap-4">
            <button
              onClick={handleAddStory}
              disabled={!newStory.role.trim() || !newStory.goal.trim() || !newStory.benefit.trim()}
              className={`px-6 py-3 rounded-lg font-medium transition-all ${
                newStory.role.trim() && newStory.goal.trim() && newStory.benefit.trim()
                  ? "bg-sandTan text-nightBlue hover:bg-sandTanShadow"
                  : "bg-gray-600 text-gray-300 cursor-not-allowed"
              }`}
            >
              Add Story
            </button>
            <button
              onClick={() => setMode("view")}
              className="border border-sandTan text-sandTan px-6 py-3 rounded-lg hover:bg-sandTan hover:text-nightBlue transition-all"
            >
              Cancel
            </button>
          </div>
        </motion.div>
      )}

      {mode === "upload" && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="bg-nightBlueShadow/60 border border-sandTan/20 rounded-2xl p-8"
        >
          <h2 className="text-2xl font-bold text-sandTan mb-6">Upload CSV File</h2>
          
          <div className="mb-6">
            <FileUpload
              onFileSelect={handleCsvUpload}
              accept=".csv"
              maxSize={5 * 1024 * 1024}
            />
            <p className="text-textMuted text-sm mt-2">
              CSV should have columns: Role, Goal, Benefit, Priority, Estimate
            </p>
          </div>

          {csvData.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-sandTan mb-4">Preview Imported Stories:</h3>
              <div className="space-y-3 max-h-60 overflow-y-auto">
                {csvData.map((story, index) => (
                  <div key={index} className="bg-nightBlue/60 p-4 rounded-lg border border-sandTan/30">
                    <p className="text-textLight text-sm">
                      As a <span className="text-sandTan font-semibold">{story.Role || story.role}</span>, 
                      I want to <span className="text-sandTan font-semibold">{story.Goal || story.goal}</span>, 
                      so that <span className="text-sandTan font-semibold">{story.Benefit || story.benefit}</span>.
                    </p>
                    <div className="flex gap-2 mt-2">
                      <span className="text-xs text-textMuted">
                        Priority: {story.Priority || story.priority || "Medium"}
                      </span>
                      <span className="text-xs text-textMuted">
                        Estimate: {story.Estimate || story.estimate || "3 points"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-4">
            {csvData.length > 0 && (
              <button
                onClick={handleImportFromCSV}
                className="bg-sandTan text-nightBlue px-6 py-3 rounded-lg hover:bg-sandTanShadow transition-all font-medium"
              >
                Import {csvData.length} Stories
              </button>
            )}
            <button
              onClick={() => setMode("view")}
              className="border border-sandTan text-sandTan px-6 py-3 rounded-lg hover:bg-sandTan hover:text-nightBlue transition-all"
            >
              Cancel
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
