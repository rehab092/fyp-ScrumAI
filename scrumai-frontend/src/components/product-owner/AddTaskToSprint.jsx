import React, { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LOGIN_ENDPOINTS, apiRequest } from "../../config/api";

export default function AddTaskToSprint() {
  const [projects, setProjects] = useState([]);
  const [userStories, setUserStories] = useState([]);
  const [sprintAssignments, setSprintAssignments] = useState({});
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [selectedSprintNum, setSelectedSprintNum] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [draggedStory, setDraggedStory] = useState(null);
  
  const MAX_SPRINTS = 5;

  const getOwnerId = () => {
    let ownerId = localStorage.getItem("ownerId");
    if (ownerId) return ownerId;
    
    try {
      const user = JSON.parse(localStorage.getItem("scrumai_user") || "{}");
      ownerId = user.owner_id || user.id;
      if (ownerId) {
        localStorage.setItem("ownerId", String(ownerId));
        return ownerId;
      }
    } catch (e) {
      console.error("Error parsing scrumai_user:", e);
    }
    return null;
  };

  const ownerId = getOwnerId();

  useEffect(() => {
    if (!ownerId) {
      setError("Owner ID not found. Please log in again.");
      setLoading(false);
      return;
    }
    fetchInitialData();
  }, [ownerId]);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      setError(null);

      const projectsResponse = await apiRequest(
        LOGIN_ENDPOINTS.projects.getByOwner(ownerId)
      );
      const projectsList = projectsResponse.data || projectsResponse || [];
      setProjects(projectsList);

      if (projectsList.length > 0) {
        const firstProjectId = projectsList[0].id || projectsList[0].project_id;
        setSelectedProjectId(firstProjectId);
        await fetchUserStoriesByProject(firstProjectId);
      }

      setLoading(false);
    } catch (err) {
      console.error("Error fetching initial data:", err);
      
      // Check for backend database errors
      if (err.message && err.message.includes("MultipleObjectsReturned")) {
        setError("⚠️ Backend Error: Database integrity issue detected. Please contact your administrator to fix the ProductOwner records. Multiple owner entries exist for this workspace.");
      } else {
        setError(err.message || "Failed to load data");
      }
      
      setLoading(false);
    }
  };

  const fetchUserStoriesByProject = async (projectId) => {
    try {
      const storiesResponse = await apiRequest(
        LOGIN_ENDPOINTS.userStories.getByOwner(ownerId)
      );
      
      let allStories = storiesResponse.data || storiesResponse || [];
      const projectStories = allStories.filter(story => {
        const storyProjectId = story.project || story.project_id;
        return String(storyProjectId) === String(projectId);
      });
      
      setUserStories(projectStories);
      setSprintAssignments({});
      setSelectedSprintNum(1);

      // Load previously saved assignments for this project
      console.log("Loading saved assignments for project:", projectId);
      const savedAssignments = await fetchSavedAssignments(projectId);
      if (savedAssignments && Object.keys(savedAssignments).length > 0) {
        console.log("Found saved assignments, loading them:", savedAssignments);
        // Convert saved assignments to sprint assignments format
        const loadedAssignments = {};
        Object.entries(savedAssignments).forEach(([sprintNum, stories]) => {
          loadedAssignments[sprintNum] = stories.map(s => ({
            id: s.user_story__id,
            user_story_id: s.user_story__id,
            role: s.user_story__role,
            goal: s.user_story__goal,
            priority: s.priority,
            story_points: s.story_points
          }));
        });
        setSprintAssignments(loadedAssignments);
        console.log("✅ Loaded saved assignments:", loadedAssignments);
      }
    } catch (err) {
      console.error("Error fetching user stories:", err);
      
      // Handle backend errors gracefully
      if (err.message && err.message.includes("MultipleObjectsReturned")) {
        setError("Backend configuration error: Multiple owner records found. Please contact support.");
      } else if (err.message) {
        setError(`Failed to load stories: ${err.message}`);
      } else {
        setError("Failed to load user stories. Please try again.");
      }
      
      setUserStories([]);
    }
  };

  const unassignedStories = useMemo(() => {
    const assignedStoryIds = new Set();
    Object.values(sprintAssignments).forEach(stories => {
      stories.forEach(story => {
        assignedStoryIds.add(story.id || story.user_story_id);
      });
    });
    return userStories.filter(story => !assignedStoryIds.has(story.id || story.user_story_id));
  }, [userStories, sprintAssignments]);

  const currentSprintStories = useMemo(() => {
    if (!selectedSprintNum) return [];
    return sprintAssignments[selectedSprintNum] || [];
  }, [selectedSprintNum, sprintAssignments]);

  const availableSprintOptions = useMemo(() => {
    const options = [];
    for (let i = 1; i <= MAX_SPRINTS; i++) {
      if (i === 1 || (sprintAssignments[i - 1] && sprintAssignments[i - 1].length > 0)) {
        options.push(i);
      }
    }
    return options;
  }, [sprintAssignments]);

  useEffect(() => {
    if (selectedSprintNum === null && availableSprintOptions.length > 0) {
      setSelectedSprintNum(availableSprintOptions[0]);
    }
  }, [availableSprintOptions, selectedSprintNum]);

  const handleDragStart = (e, story) => {
    e.dataTransfer.effectAllowed = "move";
    setDraggedStory(story);
    e.dataTransfer.setData("storyId", JSON.stringify(story));
  };

  const handleDragEnd = () => {
    setDraggedStory(null);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDropOnSprint = (e) => {
    e.preventDefault();
    
    if (!selectedSprintNum) {
      setError("Please select a sprint first");
      setTimeout(() => setError(""), 3000);
      return;
    }

    const storyData = JSON.parse(e.dataTransfer.getData("storyId"));
    const alreadyInSprint = currentSprintStories.some(
      s => (s.id || s.user_story_id) === (storyData.id || storyData.user_story_id)
    );
    
    if (alreadyInSprint) {
      setError("This user story is already in this sprint");
      setTimeout(() => setError(""), 3000);
      return;
    }

    setSprintAssignments(prev => ({
      ...prev,
      [selectedSprintNum]: [...(prev[selectedSprintNum] || []), storyData]
    }));

    setSuccessMessage(`✅ Added to Sprint ${selectedSprintNum}!`);
    setTimeout(() => setSuccessMessage(""), 3000);
  };

  const handleRemoveFromSprint = (storyId) => {
    setSprintAssignments(prev => ({
      ...prev,
      [selectedSprintNum]: (prev[selectedSprintNum] || []).filter(
        s => (s.id || s.user_story_id) !== storyId
      )
    }));

    setSuccessMessage("🗑️ Removed from sprint");
    setTimeout(() => setSuccessMessage(""), 3000);
  };

  const handleSaveAssignments = async () => {
    try {
      if (!selectedProjectId || Object.keys(sprintAssignments).length === 0) {
        setError("Please assign at least one story before saving");
        setTimeout(() => setError(""), 3000);
        return;
      }

      // Format data for backend
      const assignmentsData = {};
      Object.entries(sprintAssignments).forEach(([sprintNum, stories]) => {
        assignmentsData[sprintNum] = stories.map(story => ({
          user_story_id: story.id || story.user_story_id,
          priority: story.priority,
          story_points: story.story_points
        }));
      });

      // Call backend API to save
      const response = await fetch(
        `${window.location.origin.replace(':5173', ':8000')}/userstories/sprint-assignments/save/`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            owner_id: ownerId,
            project_id: selectedProjectId,
            assignments: assignmentsData
          })
        }
      );

      const result = await response.json();

      if (response.ok) {
        console.log("Sprint assignments saved:", result);
        setSuccessMessage(`✅ ${result.count} sprint assignments saved successfully!`);
        setTimeout(() => setSuccessMessage(""), 4000);
      } else {
        setError(result.error || "Failed to save assignments");
        setTimeout(() => setError(""), 3000);
      }
    } catch (err) {
      console.error("Error saving assignments:", err);
      setError(err.message || "Failed to save assignments");
      setTimeout(() => setError(""), 3000);
    }
  };

  const fetchSavedAssignments = async (projectId) => {
    try {
      const response = await fetch(
        `${window.location.origin.replace(':5173', ':8000')}/userstories/sprint-assignments/project/${projectId}/`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        console.log("Retrieved saved assignments:", data);
        return data.assignments;
      }
    } catch (err) {
      console.error("Error fetching saved assignments:", err);
    }
    return null;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="text-gray-600 mt-4">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-white p-6"
    >
      <div className="max-w-6xl mx-auto">
        

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-50 border-l-4 border-red-500 rounded-lg p-4 mb-6 text-red-700"
          >
            {error}
          </motion.div>
        )}

        {successMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-green-50 border-l-4 border-green-500 rounded-lg p-4 mb-6 text-green-700"
          >
            {successMessage}
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-blue-50 border-l-4 border-blue-500 rounded-lg p-4 mb-8"
        >
          <p className="text-blue-900 font-medium mb-1"> How to Prioritize Tasks</p>
          <p className="text-blue-800 text-sm mb-2">
            Use the <strong>$100 Dollar Test</strong> to prioritize: Imagine you have $100 to allocate across all user stories based on their business value and impact. Assign higher priority (and story points) to stories that deserve more of the budget. This helps focus on the most valuable work first.
          </p>
         
        </motion.div>

        {/* Project & Sprint Selectors - Side by Side */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Left: Select Project */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Select Project</label>
            <select
              value={selectedProjectId || ""}
              onChange={(e) => {
                const projectId = e.target.value;
                setSelectedProjectId(projectId);
                if (projectId) {
                  fetchUserStoriesByProject(projectId);
                }
              }}
              className="w-full px-4 py-3 bg-white border-2 border-teal-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 font-medium"
            >
              <option value="">-- Select a project --</option>
              {projects.map(p => (
                <option key={p.id || p.project_id} value={p.id || p.project_id}>
                  {p.name || p.project_name}
                </option>
              ))}
            </select>
          </div>

          {/* Right: Select Sprint */}
          {selectedProjectId && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Select Sprint</label>
              <select
                value={selectedSprintNum || ""}
                onChange={(e) => setSelectedSprintNum(parseInt(e.target.value) || null)}
                className="w-full px-4 py-3 bg-white border-2 border-indigo-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-medium"
              >
                <option value="">-- Select a sprint --</option>
                {availableSprintOptions.map((sprintNum) => {
                  const sprintStories = sprintAssignments[sprintNum] || [];
                  return (
                    <option key={sprintNum} value={sprintNum}>
                      Sprint {sprintNum} ({sprintStories.length} stories)
                    </option>
                  );
                })}
              </select>
            </div>
          )}
        </div>

        {selectedProjectId && selectedSprintNum && (
          <div>
            {userStories.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-yellow-50 border-l-4 border-yellow-500 rounded-lg p-6 mb-8 text-center"
              >
                <p className="text-yellow-900 font-medium text-lg">⚠️ No user stories found</p>
                <p className="text-yellow-800 text-sm mt-2">
                  No user stories are available for this project. Please create stories first or select a different project.
                </p>
              </motion.div>
            ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* LEFT: Unassigned User Stories */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-white rounded-lg border-2 border-teal-200 shadow-sm overflow-hidden flex flex-col"
              >
                <div className="bg-gradient-to-r from-teal-50 to-cyan-50 px-6 py-4 border-b border-teal-200">
                  <h2 className="text-lg font-bold text-gray-900"> Unassigned User Stories</h2>
                  <p className="text-sm text-gray-600 mt-1">{unassignedStories.length} available</p>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-2 max-h-96">
                  {unassignedStories.length > 0 ? (
                    <AnimatePresence>
                      {unassignedStories.map((story) => (
                        <motion.div
                          key={story.id || story.user_story_id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -10 }}
                          draggable
                          onDragStart={(e) => handleDragStart(e, story)}
                          onDragEnd={handleDragEnd}
                          className={`bg-gradient-to-r from-teal-50 to-cyan-50 border-2 border-teal-300 rounded-lg p-4 cursor-grab hover:shadow-md hover:border-teal-400 transition ${
                            draggedStory && (draggedStory.id || draggedStory.user_story_id) === (story.id || story.user_story_id)
                              ? "opacity-50"
                              : ""
                          }`}
                        >
                          <p className="font-semibold text-gray-900 text-sm">👤 {story.role}</p>
                          <p className="text-xs text-gray-700 mt-2 line-clamp-2">"{story.goal}"</p>
                          <div className="flex gap-2 mt-3 flex-wrap">
                            {story.priority && (
                              <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                                story.priority === 'High' ? 'bg-red-100 text-red-700' :
                                story.priority === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                                'bg-green-100 text-green-700'
                              }`}>
                                {story.priority}
                              </span>
                            )}
                            {story.story_points && (
                              <span className="inline-block px-2 py-1 rounded text-xs font-medium bg-purple-100 text-purple-700">
                                {story.story_points} pts
                              </span>
                            )}
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  ) : (
                    <div className="text-center py-12 text-gray-400">
                      <p className="text-sm">✅ All stories assigned!</p>
                    </div>
                  )}
                </div>
              </motion.div>

              {/* RIGHT: Sprint Drop Zone */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-white rounded-lg border-2 border-indigo-200 shadow-sm overflow-hidden flex flex-col"
              >
                <div className="bg-gradient-to-r from-indigo-50 to-blue-50 px-6 py-4 border-b border-indigo-200">
                  <h2 className="text-lg font-bold text-gray-900">🏃 Sprint {selectedSprintNum}</h2>
                  <p className="text-sm text-gray-600 mt-1">{currentSprintStories.length} stories</p>
                </div>

                <div
                  onDragOver={handleDragOver}
                  onDrop={handleDropOnSprint}
                  className="flex-1 p-6 min-h-96 border-4 border-dashed border-indigo-300 rounded-lg m-4 bg-gradient-to-br from-indigo-50 to-blue-50 hover:border-indigo-400 hover:from-indigo-100 hover:to-blue-100 transition flex flex-col items-start justify-start cursor-drop max-h-96 overflow-y-auto"
                >
                  {currentSprintStories.length > 0 ? (
                    <div className="w-full space-y-2">
                      <AnimatePresence>
                        {currentSprintStories.map((story) => (
                          <motion.div
                            key={story.id || story.user_story_id}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="bg-white border-2 border-indigo-300 rounded-lg p-4 flex justify-between items-start shadow-sm"
                          >
                            <div className="flex-1">
                              <p className="font-semibold text-sm text-gray-900">👤 {story.role}</p>
                              <p className="text-xs text-gray-700 mt-1 line-clamp-2">"{story.goal}"</p>
                            </div>
                            <button
                              onClick={() => handleRemoveFromSprint(story.id || story.user_story_id)}
                              className="ml-2 text-red-600 hover:bg-red-50 rounded p-2 transition text-lg hover:text-red-700"
                            >
                              ✕
                            </button>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </div>
                  ) : (
                    <div className="text-center w-full py-12 text-gray-400">
                      <p className="text-base">💧 Drop stories here</p>
                    </div>
                  )}
                </div>
              </motion.div>
            </div>
            )}

            {/* Blue Background Section with Save Button */}
            {selectedProjectId && selectedSprintNum && (
              <div className="bg-gradient-to-r  rounded-lg p-6 mt-8 shadow-md">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleSaveAssignments}
                  disabled={userStories.length === 0}
                  className={`w-full py-3 rounded-lg font-semibold text-base transition shadow-md ${
                    userStories.length === 0
                      ? 'bg-primary text-white rounded-lg hover:bg-primaryDark transition'
                      : 'bg-primary text-white rounded-lg hover:bg-primaryDark transition'
                  }`}
                >
                   Save  Sprint Assignments
                </motion.button>
              </div>
            )}
          </div>
        )}

        {!selectedProjectId && (
          <div className="bg-white rounded-lg border-2 border-gray-200 p-12 text-center">
            <p className="text-gray-600 text-lg">👈 Select a project to get started</p>
          </div>
        )}
      </div>
    </motion.div>
  );
}

// Component complete
