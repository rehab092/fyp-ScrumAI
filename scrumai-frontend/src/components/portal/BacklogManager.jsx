import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
// import { API_ENDPOINTS, apiRequest } from "../../config/api"; // TODO: Uncomment when backend is ready
import MetricCard from "../common/MetricCard";

export default function BacklogManager() {
  const [mode, setMode] = useState("view"); // 'view', 'add', 'bulk', 'edit'
  const [userStories, setUserStories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedStory, setSelectedStory] = useState(null);

  const [newStory, setNewStory] = useState({
    role: "",
    goal: "",
    benefit: "",
    priority: "Medium",
    estimate: "3 points"
  });

  const [bulkStoriesText, setBulkStoriesText] = useState("");
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Fetch user stories from backend on component mount
  useEffect(() => {
    fetchUserStories();
  }, []);

  const fetchUserStories = async () => {
    setLoading(true);
    setError("");
    try {
      // TODO: Uncomment this when backend is ready
      // const response = await apiRequest(API_ENDPOINTS.userStories.getAll, {
      //   method: 'GET',
      // });
      // setUserStories(response.data || response);

      // TEMPORARY: Mock data - Remove when backend is ready
      const mockData = [
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
      ];
      setUserStories(mockData);
    } catch (err) {
      setError("Failed to fetch user stories: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddStory = async () => {
    if (!newStory.role.trim() || !newStory.goal.trim() || !newStory.benefit.trim()) {
      setError("All fields are required");
      return;
    }

    setLoading(true);
    setError("");
    setSuccessMessage("");

    try {
      // TODO: Uncomment this when backend is ready
      // const response = await apiRequest(API_ENDPOINTS.userStories.create, {
      //   method: 'POST',
      //   body: JSON.stringify(newStory),
      // });
      // setUserStories([...userStories, response.data]);

      // TEMPORARY: Mock add - Remove when backend is ready
      const story = {
        id: userStories.length + 1,
        ...newStory,
        status: "Ready",
        createdAt: new Date().toISOString().split('T')[0]
      };
      setUserStories([...userStories, story]);

      setNewStory({ role: "", goal: "", benefit: "", priority: "Medium", estimate: "3 points" });
      setMode("view");
      setSuccessMessage("User story added successfully!");
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (err) {
      setError("Failed to add story: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleBulkAdd = async () => {
    if (!bulkStoriesText.trim()) {
      setError("Please enter user stories");
      return;
    }

    setLoading(true);
    setError("");
    setSuccessMessage("");

    try {
      // Parse bulk text input
      // Expected format: Each line should be: Role | Goal | Benefit | Priority | Estimate
      // Or: Role, Goal, Benefit, Priority, Estimate
      const lines = bulkStoriesText.split('\n').filter(line => line.trim());
      const parsedStories = lines.map(line => {
        // Support both pipe and comma separators
        const parts = line.includes('|') 
          ? line.split('|').map(p => p.trim())
          : line.split(',').map(p => p.trim());
        
        return {
          role: parts[0] || "",
          goal: parts[1] || "",
          benefit: parts[2] || "",
          priority: parts[3] || "Medium",
          estimate: parts[4] || "3 points",
        };
      });

      // Validate parsed stories
      const validStories = parsedStories.filter(story => 
        story.role && story.goal && story.benefit
      );

      if (validStories.length === 0) {
        throw new Error("No valid stories found. Please check the format.");
      }

      // TODO: Uncomment this when backend is ready
      // const response = await apiRequest(API_ENDPOINTS.userStories.createBulk, {
      //   method: 'POST',
      //   body: JSON.stringify({ stories: validStories }),
      // });
      // setUserStories([...userStories, ...response.data]);

      // TEMPORARY: Mock bulk add - Remove when backend is ready
      const newStories = validStories.map((story, index) => ({
        id: userStories.length + index + 1,
        ...story,
        status: "Ready",
        createdAt: new Date().toISOString().split('T')[0]
      }));
      setUserStories([...userStories, ...newStories]);

      setBulkStoriesText("");
      setMode("view");
      setSuccessMessage(`${validStories.length} user stories added successfully!`);
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (err) {
      setError("Failed to add stories: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStory = async () => {
    if (!selectedStory || !selectedStory.role.trim() || !selectedStory.goal.trim() || !selectedStory.benefit.trim()) {
      setError("All fields are required");
      return;
    }

    setLoading(true);
    setError("");
    setSuccessMessage("");

    try {
      // TODO: Uncomment this when backend is ready
      // await apiRequest(API_ENDPOINTS.userStories.update(selectedStory.id), {
      //   method: 'PUT',
      //   body: JSON.stringify(selectedStory),
      // });

      // TEMPORARY: Mock update - Remove when backend is ready
      setUserStories(userStories.map(story => 
        story.id === selectedStory.id ? selectedStory : story
      ));

      setSelectedStory(null);
      setMode("view");
      setSuccessMessage("User story updated successfully!");
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (err) {
      setError("Failed to update story: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteStory = async (storyId) => {
    if (!window.confirm("Are you sure you want to delete this user story?")) {
      return;
    }

    setLoading(true);
    setError("");
    setSuccessMessage("");

    try {
      // TODO: Uncomment this when backend is ready
      // await apiRequest(API_ENDPOINTS.userStories.delete(storyId), {
      //   method: 'DELETE',
      // });

      // TEMPORARY: Mock delete - Remove when backend is ready
      setUserStories(userStories.filter(story => story.id !== storyId));

      setSuccessMessage("User story deleted successfully!");
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (err) {
      setError("Failed to delete story: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (story) => {
    setSelectedStory({ ...story });
    setMode("edit");
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
          onClick={() => setMode("bulk")}
          className={`px-6 py-3 rounded-lg transition-all ${
            mode === "bulk"
              ? "bg-sandTan text-nightBlue shadow-lg"
              : "border border-sandTan text-sandTan hover:bg-sandTan hover:text-nightBlue"
          }`}
        >
          📝 Add Bulk Stories
        </button>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="bg-green-500/20 border border-green-500/30 rounded-lg p-4 mb-6">
          <p className="text-green-400">{successMessage}</p>
        </div>
      )}

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
            
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              </div>
            ) : userStories.length === 0 ? (
              <div className="text-center py-12 text-textMuted">
                <p>No user stories yet. Add your first story to get started!</p>
              </div>
            ) : (
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
                      
                      <div className="flex flex-wrap gap-3 items-center">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getPriorityColor(story.priority)}`}>
                          {story.priority}
                        </span>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(story.status)}`}>
                          {story.status}
                        </span>
                        
                        {/* CRUD Buttons */}
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEditClick(story)}
                            className="p-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-all"
                            title="Edit"
                          >
                            ✏️
                          </button>
                          <button
                            onClick={() => handleDeleteStory(story.id)}
                            className="p-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-all"
                            title="Delete"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
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
              disabled={loading || !newStory.role.trim() || !newStory.goal.trim() || !newStory.benefit.trim()}
              className={`px-6 py-3 rounded-lg font-medium transition-all ${
                newStory.role.trim() && newStory.goal.trim() && newStory.benefit.trim() && !loading
                  ? "bg-sandTan text-nightBlue hover:bg-sandTanShadow"
                  : "bg-gray-600 text-gray-300 cursor-not-allowed"
              }`}
            >
              {loading ? "Adding..." : "Add Story"}
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

      {mode === "bulk" && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="bg-nightBlueShadow/60 border border-sandTan/20 rounded-2xl p-8"
        >
          <h2 className="text-2xl font-bold text-sandTan mb-6">Add Bulk User Stories</h2>
          
          <div className="mb-6">
            <label className="block mb-2 text-sandTan font-medium">Enter User Stories</label>
            <p className="text-textMuted text-sm mb-4">
              Enter one story per line in the format:<br/>
              <code className="bg-nightBlue px-2 py-1 rounded text-sm">
                Role | Goal | Benefit | Priority | Estimate
              </code><br/>
              Or use commas: <code className="bg-nightBlue px-2 py-1 rounded text-sm">
                Role, Goal, Benefit, Priority, Estimate
              </code><br/>
              Priority and Estimate are optional (default: Medium, 3 points)
            </p>
            <textarea
              value={bulkStoriesText}
              onChange={(e) => setBulkStoriesText(e.target.value)}
              placeholder="Example:
Developer | implement user authentication | users can securely access the system | High | 8 points
User | search products by name | I can quickly find what I need | Medium | 3 points
Admin | generate monthly reports | I can track system performance | Low | 5 points"
              rows={12}
              className="w-full bg-nightBlue border border-sandTan/30 rounded-lg p-4 text-textLight focus:outline-none focus:border-sandTan font-mono text-sm"
            />
          </div>

          <div className="flex gap-4">
            <button
              onClick={handleBulkAdd}
              disabled={loading || !bulkStoriesText.trim()}
              className={`px-6 py-3 rounded-lg font-medium transition-all ${
                bulkStoriesText.trim() && !loading
                  ? "bg-sandTan text-nightBlue hover:bg-sandTanShadow"
                  : "bg-gray-600 text-gray-300 cursor-not-allowed"
              }`}
            >
              {loading ? "Adding..." : "Add All Stories"}
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

      {mode === "edit" && selectedStory && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="bg-nightBlueShadow/60 border border-sandTan/20 rounded-2xl p-8"
        >
          <h2 className="text-2xl font-bold text-sandTan mb-6">Edit User Story</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block mb-2 text-sandTan font-medium">Role</label>
              <input
                type="text"
                value={selectedStory.role}
                onChange={(e) => setSelectedStory({ ...selectedStory, role: e.target.value })}
                className="w-full bg-nightBlue border border-sandTan/30 rounded-lg p-3 text-textLight focus:outline-none focus:border-sandTan"
              />
            </div>

            <div>
              <label className="block mb-2 text-sandTan font-medium">Priority</label>
              <select
                value={selectedStory.priority}
                onChange={(e) => setSelectedStory({ ...selectedStory, priority: e.target.value })}
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
                value={selectedStory.goal}
                onChange={(e) => setSelectedStory({ ...selectedStory, goal: e.target.value })}
                className="w-full bg-nightBlue border border-sandTan/30 rounded-lg p-3 text-textLight focus:outline-none focus:border-sandTan"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block mb-2 text-sandTan font-medium">Benefit</label>
              <input
                type="text"
                value={selectedStory.benefit}
                onChange={(e) => setSelectedStory({ ...selectedStory, benefit: e.target.value })}
                className="w-full bg-nightBlue border border-sandTan/30 rounded-lg p-3 text-textLight focus:outline-none focus:border-sandTan"
              />
            </div>

            <div>
              <label className="block mb-2 text-sandTan font-medium">Estimate</label>
              <select
                value={selectedStory.estimate}
                onChange={(e) => setSelectedStory({ ...selectedStory, estimate: e.target.value })}
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

            <div>
              <label className="block mb-2 text-sandTan font-medium">Status</label>
              <select
                value={selectedStory.status}
                onChange={(e) => setSelectedStory({ ...selectedStory, status: e.target.value })}
                className="w-full bg-nightBlue border border-sandTan/30 rounded-lg p-3 text-textLight focus:outline-none focus:border-sandTan"
              >
                <option value="Ready">Ready</option>
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
              </select>
            </div>
          </div>

          <div className="flex gap-4">
            <button
              onClick={handleUpdateStory}
              disabled={loading || !selectedStory.role.trim() || !selectedStory.goal.trim() || !selectedStory.benefit.trim()}
              className={`px-6 py-3 rounded-lg font-medium transition-all ${
                selectedStory.role.trim() && selectedStory.goal.trim() && selectedStory.benefit.trim() && !loading
                  ? "bg-sandTan text-nightBlue hover:bg-sandTanShadow"
                  : "bg-gray-600 text-gray-300 cursor-not-allowed"
              }`}
            >
              {loading ? "Updating..." : "Update Story"}
            </button>
            <button
              onClick={() => {
                setSelectedStory(null);
                setMode("view");
              }}
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
