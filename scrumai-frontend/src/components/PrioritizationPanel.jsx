import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function PrioritizationPanel({
  stories,
  storyPoints,
  onStoryPointsUpdate,
}) {
  const [priorityLanes, setPriorityLanes] = useState({
    High: [],
    Medium: [],
    Low: [],
  });

  const [sprintStories, setSprintStories] = useState([]);
  const [currentSprint, setCurrentSprint] = useState(1);
  const [draggedStory, setDraggedStory] = useState(null);
  const [dragSource, setDragSource] = useState(null);
  const [filterByPoints, setFilterByPoints] = useState(null);

  useEffect(() => {
    // Populate priority lanes from stories
    const lanes = { High: [], Medium: [], Low: [] };
    stories.forEach((story) => {
      const priority = story.priority || "Medium";
      if (lanes[priority]) {
        lanes[priority].push(story);
      }
    });
    setPriorityLanes(lanes);
  }, [stories]);

  // Calculate total story points
  const getTotalPoints = (storyList) => {
    return storyList.reduce((sum, story) => sum + (storyPoints[story.id] || 0), 0);
  };

  // Handle drag start
  const handleDragStart = (story, source) => {
    setDraggedStory(story);
    setDragSource(source);
  };

  // Handle drag over
  const handleDragOver = (e) => {
    e.preventDefault();
  };

  // Handle drop in lane
  const handleDropInLane = (priority) => {
    if (!draggedStory) return;

    // If dragging from sprint, remove from sprint
    if (dragSource === "sprint") {
      setSprintStories(sprintStories.filter((s) => s.id !== draggedStory.id));
    }

    // Add to priority lane (avoid duplicates)
    setPriorityLanes((prev) => {
      const lane = prev[priority] || [];
      if (!lane.find((s) => s.id === draggedStory.id)) {
        return {
          ...prev,
          [priority]: [...lane, draggedStory],
        };
      }
      return prev;
    });

    setDraggedStory(null);
    setDragSource(null);
  };

  // Handle drop in sprint
  const handleDropInSprint = () => {
    if (!draggedStory) return;

    // Remove from priority lanes
    if (dragSource !== "sprint") {
      setPriorityLanes((prev) => {
        const updated = { ...prev };
        Object.keys(updated).forEach((priority) => {
          updated[priority] = updated[priority].filter(
            (s) => s.id !== draggedStory.id
          );
        });
        return updated;
      });
    }

    // Add to sprint (avoid duplicates)
    if (!sprintStories.find((s) => s.id === draggedStory.id)) {
      setSprintStories([...sprintStories, draggedStory]);
    }

    setDraggedStory(null);
    setDragSource(null);
  };

  // Reorder stories in a lane
  const reorderInLane = (priority, fromIndex, toIndex) => {
    const lane = [...priorityLanes[priority]];
    const [moved] = lane.splice(fromIndex, 1);
    lane.splice(toIndex, 0, moved);

    setPriorityLanes((prev) => ({
      ...prev,
      [priority]: lane,
    }));
  };

  // Reorder stories in sprint
  const reorderInSprint = (fromIndex, toIndex) => {
    const updated = [...sprintStories];
    const [moved] = updated.splice(fromIndex, 1);
    updated.splice(toIndex, 0, moved);
    setSprintStories(updated);
  };

  // Remove story from sprint
  const removeFromSprint = (storyId) => {
    setSprintStories(sprintStories.filter((s) => s.id !== storyId));
  };

  // Filter stories by story points
  const getFilteredStories = (storyList) => {
    if (!filterByPoints) return storyList;
    return storyList.filter((s) => storyPoints[s.id] === filterByPoints);
  };

  const StoryCard = ({ story, source, index, lane = null }) => {
    const points = storyPoints[story.id] || 0;

    return (
      <motion.div
        draggable
        onDragStart={() => handleDragStart(story, source)}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className="bg-background border border-border rounded-lg p-4 cursor-move hover:shadow-lg transition-shadow group"
      >
        <div className="flex justify-between items-start gap-2 mb-2">
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-textPrimary truncate">
              {story.role}
            </h4>
            <p className="text-xs text-textSecondary truncate">
              {story.project_name}
            </p>
          </div>
          {points > 0 && (
            <span className="bg-primary text-white px-2 py-1 rounded text-xs font-semibold flex-shrink-0">
              {points}
            </span>
          )}
        </div>

        <p className="text-xs text-textSecondary line-clamp-2 mb-3">
          {story.goal}
        </p>

        {source === "sprint" && (
          <button
            onClick={() => removeFromSprint(story.id)}
            className="w-full text-xs bg-error/20 text-error px-2 py-1 rounded hover:bg-error/30 transition-colors"
          >
            Remove from Sprint
          </button>
        )}
      </motion.div>
    );
  };

  const LaneHeader = ({ priority, count, totalPoints }) => {
    const colors = {
      High: "from-error to-red-600",
      Medium: "from-warning to-orange-600",
      Low: "from-success to-emerald-600",
    };

    return (
      <div className={`bg-gradient-to-r ${colors[priority]} rounded-t-lg p-4`}>
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-bold text-white">{priority} Priority</h3>
            <p className="text-white/80 text-sm">
              {count} stories • {totalPoints} points
            </p>
          </div>
          <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
            <span className="text-white font-bold">{count}</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Sprint Planning Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-primaryDark to-primary rounded-lg p-6 text-white shadow-lg border border-primary/50"
      >
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-2xl font-bold mb-1">🎯 Sprint Planning</h2>
            <p className="text-white/80">
              Drag and drop stories to plan your sprint
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() =>
                setCurrentSprint(Math.max(1, currentSprint - 1))
              }
              className="px-3 py-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
            >
              ←
            </button>
            <input
              type="number"
              value={currentSprint}
              onChange={(e) =>
                setCurrentSprint(Math.max(1, parseInt(e.target.value) || 1))
              }
              min="1"
              className="w-20 bg-white/20 border border-white/30 rounded px-3 py-2 text-center text-white"
            />
            <button
              onClick={() => setCurrentSprint(currentSprint + 1)}
              className="px-3 py-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
            >
              →
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="bg-white/10 rounded-lg p-3">
            <p className="text-white/80">Sprint Number</p>
            <p className="text-2xl font-bold">Sprint {currentSprint}</p>
          </div>
          <div className="bg-white/10 rounded-lg p-3">
            <p className="text-white/80">Planned Stories</p>
            <p className="text-2xl font-bold">{sprintStories.length}</p>
          </div>
          <div className="bg-white/10 rounded-lg p-3">
            <p className="text-white/80">Total Story Points</p>
            <p className="text-2xl font-bold">{getTotalPoints(sprintStories)}</p>
          </div>
        </div>
      </motion.div>

      {/* Sprint Drop Zone */}
      <motion.div
        onDragOver={handleDragOver}
        onDrop={handleDropInSprint}
        className="bg-surface border-2 border-dashed border-primary rounded-lg p-6 min-h-40 transition-colors hover:bg-primary/5"
      >
        <p className="text-textSecondary font-medium mb-4">
          📦 Sprint {currentSprint} Stories (Drag here)
        </p>

        {sprintStories.length === 0 ? (
          <div className="text-center text-textSecondary py-8">
            <p>Drop stories here to add them to this sprint</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <AnimatePresence>
              {sprintStories.map((story, index) => (
                <StoryCard
                  key={story.id}
                  story={story}
                  source="sprint"
                  index={index}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </motion.div>

      {/* Filter by Story Points */}
      <div className="flex items-center gap-4">
        <label className="text-sm font-medium text-textSecondary">
          Filter by Story Points:
        </label>
        <select
          value={filterByPoints || ""}
          onChange={(e) =>
            setFilterByPoints(e.target.value ? parseInt(e.target.value) : null)
          }
          className="bg-surface border border-border rounded-lg px-4 py-2 text-textPrimary focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="">All Stories</option>
          {[1, 2, 3, 5, 8, 13, 21, 34, 55, 89].map((points) => (
            <option key={points} value={points}>
              {points} points
            </option>
          ))}
        </select>
      </div>

      {/* Priority Lanes */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {Object.entries(priorityLanes).map(([priority, storyList]) => {
          const filteredList = getFilteredStories(storyList);
          const totalPoints = getTotalPoints(filteredList);

          return (
            <motion.div
              key={priority}
              layout
              className="bg-surface border border-border rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow"
            >
              <LaneHeader
                priority={priority}
                count={filteredList.length}
                totalPoints={totalPoints}
              />

              <div
                onDragOver={handleDragOver}
                onDrop={() => handleDropInLane(priority)}
                className="p-4 min-h-96 bg-background/50 space-y-3"
              >
                <AnimatePresence>
                  {filteredList.length === 0 ? (
                    <div className="text-center text-textSecondary py-12">
                      <p>No stories</p>
                    </div>
                  ) : (
                    filteredList.map((story, index) => (
                      <StoryCard
                        key={`${priority}-${story.id}`}
                        story={story}
                        source="lane"
                        index={index}
                        lane={priority}
                      />
                    ))
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Story Points Legend */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="bg-primary/10 border border-primary rounded-lg p-4"
      >
        <p className="text-sm font-semibold text-textPrimary mb-3">
          💡 How to Prioritize:
        </p>
        <ul className="text-xs text-textSecondary space-y-2">
          <li>
            • <strong>Drag & Drop</strong> stories between priority lanes to reorganize them
          </li>
          <li>
            • <strong>Sprint Planning:</strong> Drag stories into the sprint
            drop zone to plan your sprint
          </li>
          <li>
            • <strong>Story Points:</strong> Represent complexity (1-100 scale,
            typically Fibonacci)
          </li>
          <li>
            • <strong>Filters:</strong> Use story points to filter and focus on
            similar-sized stories
          </li>
        </ul>
      </motion.div>
    </div>
  );
}
