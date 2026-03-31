import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { LOGIN_ENDPOINTS, apiRequest } from "../../config/api";

const NODE_WIDTH = 210;
const NODE_HEIGHT = 72;
const COLUMN_GAP = 72;
const ROW_GAP = 34;

const normalizeStatus = (status) => {
  const raw = String(status || "").toLowerCase();
  if (raw.includes("complete") || raw.includes("done")) return "completed";
  if (raw.includes("progress") || raw.includes("active")) return "in_progress";
  if (raw.includes("block")) return "blocked";
  if (raw.includes("ready")) return "ready";
  return "pending";
};

const formatConfidence = (confidence) => {
  const asNumber = Number(confidence);
  if (Number.isNaN(asNumber)) return "-";
  if (asNumber <= 1) return `${Math.round(asNumber * 100)}%`;
  return `${Math.round(asNumber)}%`;
};

const splitLooseList = (value) =>
  String(value)
    .split(/[,;|]/)
    .map((part) => part.trim())
    .filter(Boolean);

const readExplicitDependencyTokens = (task) => {
  const candidates = [
    task.dependencies,
    task.dependency_ids,
    task.depends_on,
    task.dependsOn,
    task.predecessors,
    task.predecessor_ids,
    task.blocked_by,
    task.blockedBy,
  ];

  const tokens = [];

  candidates.forEach((candidate) => {
    if (!candidate) return;

    if (Array.isArray(candidate)) {
      candidate.forEach((entry) => {
        if (entry == null) return;
        if (typeof entry === "object") {
          tokens.push(
            String(entry.id || entry.task_id || entry.title || entry.name || "").trim()
          );
          return;
        }
        tokens.push(String(entry).trim());
      });
      return;
    }

    if (typeof candidate === "object") {
      Object.values(candidate).forEach((value) => {
        if (value != null) tokens.push(String(value).trim());
      });
      return;
    }

    splitLooseList(candidate).forEach((token) => tokens.push(token));
  });

  return tokens.filter(Boolean);
};

const resolveTokenToTaskId = (token, byId, byTitle) => {
  const normalized = String(token || "").trim();
  if (!normalized) return null;

  const asNumber = Number(normalized);
  if (!Number.isNaN(asNumber) && byId.has(asNumber)) {
    return asNumber;
  }

  const titleMatch = byTitle.get(normalized.toLowerCase());
  if (titleMatch) return titleMatch;

  return null;
};

const inferDependenciesFromText = (task, allTasks) => {
  const sourceText = `${task.title} ${task.subtitle}`.toLowerCase();
  const inferMarkers = ["depends on", "after", "blocked by", "requires"];

  if (!inferMarkers.some((marker) => sourceText.includes(marker))) {
    return [];
  }

  const inferred = [];

  allTasks.forEach((candidate) => {
    if (candidate.id === task.id) return;

    const candidateTitle = candidate.title.toLowerCase();
    if (!candidateTitle || candidateTitle.length < 3) return;

    if (sourceText.includes(candidateTitle)) {
      inferred.push(candidate.id);
    }
  });

  return inferred;
};

const groupDisconnectedComponents = (tasks) => {
  const adjacency = new Map();
  tasks.forEach((task) => adjacency.set(task.id, new Set()));

  tasks.forEach((task) => {
    task.dependencies.forEach((depId) => {
      if (!adjacency.has(depId)) return;
      adjacency.get(task.id).add(depId);
      adjacency.get(depId).add(task.id);
    });
  });

  const visited = new Set();
  const components = [];

  tasks.forEach((task) => {
    if (visited.has(task.id)) return;

    const stack = [task.id];
    const current = [];

    while (stack.length > 0) {
      const nodeId = stack.pop();
      if (visited.has(nodeId)) continue;

      visited.add(nodeId);
      current.push(nodeId);

      adjacency.get(nodeId).forEach((neighbour) => {
        if (!visited.has(neighbour)) stack.push(neighbour);
      });
    }

    components.push(current);
  });

  return components;
};

const buildLevels = (taskIds, taskMap) => {
  const idSet = new Set(taskIds);
  const inDegree = new Map();
  const children = new Map();

  taskIds.forEach((id) => {
    inDegree.set(id, 0);
    children.set(id, []);
  });

  taskIds.forEach((id) => {
    const task = taskMap.get(id);
    task.dependencies.forEach((depId) => {
      if (!idSet.has(depId)) return;
      inDegree.set(id, inDegree.get(id) + 1);
      children.get(depId).push(id);
    });
  });

  const queue = [];
  const level = new Map();

  taskIds.forEach((id) => {
    if (inDegree.get(id) === 0) {
      queue.push(id);
      level.set(id, 0);
    }
  });

  while (queue.length > 0) {
    const current = queue.shift();
    const currentLevel = level.get(current) || 0;

    children.get(current).forEach((nextId) => {
      const nextIn = inDegree.get(nextId) - 1;
      inDegree.set(nextId, nextIn);
      level.set(nextId, Math.max(level.get(nextId) || 0, currentLevel + 1));
      if (nextIn === 0) queue.push(nextId);
    });
  }

  // Fallback for cycles or unresolved nodes.
  taskIds.forEach((id) => {
    if (!level.has(id)) level.set(id, 0);
  });

  const buckets = [];
  level.forEach((lvl, id) => {
    if (!buckets[lvl]) buckets[lvl] = [];
    buckets[lvl].push(id);
  });

  return buckets.filter(Boolean);
};

const buildComponentLayout = (taskIds, taskMap) => {
  const levels = buildLevels(taskIds, taskMap);
  const positionedNodes = [];

  levels.forEach((levelIds, colIdx) => {
    levelIds.forEach((taskId, rowIdx) => {
      positionedNodes.push({
        ...taskMap.get(taskId),
        x: colIdx * (NODE_WIDTH + COLUMN_GAP),
        y: rowIdx * (NODE_HEIGHT + ROW_GAP),
      });
    });
  });

  const width = Math.max(1, levels.length) * NODE_WIDTH + Math.max(0, levels.length - 1) * COLUMN_GAP + 36;
  const tallestColumn = Math.max(...levels.map((column) => column.length));
  const height = Math.max(1, tallestColumn) * NODE_HEIGHT + Math.max(0, tallestColumn - 1) * ROW_GAP + 36;

  return {
    nodes: positionedNodes,
    width,
    height,
  };
};

export default function DependencyMapper() {
  const [viewMode, setViewMode] = useState("graph");
  const [selectedNode, setSelectedNode] = useState(null);
  const [rawTasks, setRawTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [projectDependencies, setProjectDependencies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchProjectsAndTasks = async () => {
      setLoading(true);
      setError("");

      try {
        let projectList = [];
        const ownerId = localStorage.getItem("ownerId");

        try {
          if (ownerId) {
            const ownerProjects = await apiRequest(LOGIN_ENDPOINTS.projects.getByOwner(ownerId), {
              method: "GET",
            });
            projectList = Array.isArray(ownerProjects) ? ownerProjects : [];
          }
        } catch (projectErr) {
          // Keep page usable even if projects endpoint is unavailable.
          projectList = [];
        }

        if (projectList.length === 0) {
          try {
            const allProjects = await apiRequest(LOGIN_ENDPOINTS.projects.getAllFromUserStories, {
              method: "GET",
            });
            projectList = Array.isArray(allProjects) ? allProjects : [];
          } catch (projectErr) {
            projectList = [];
          }
        }

        setProjects(projectList);

        if (projectList.length > 0) {
          const firstProjectId = String(projectList[0].id || projectList[0].pk || projectList[0].ID);
          setSelectedProjectId(firstProjectId);
        } else {
          setSelectedProjectId("");
        }

        const response = await apiRequest(LOGIN_ENDPOINTS.tasks.getAll, { method: "GET" });
        const normalized = (Array.isArray(response) ? response : [])
          .map((task, idx) => ({
            id: Number(task.task_id || task.id || idx + 1),
            title: String(task.tasks || task.title || task.name || `Task ${idx + 1}`),
            subtitle: String(task.subtasks || task.description || ""),
            projectId: String(task.project_id || task.projectId || task.project || "unassigned"),
            normalizedStatus: normalizeStatus(task.status),
            raw: task,
          }))
          .filter((task) => !Number.isNaN(task.id));

        setRawTasks(normalized);
      } catch (err) {
        setError(err.message || "Failed to load tasks");
        setRawTasks([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProjectsAndTasks();
  }, []);

  useEffect(() => {
    const fetchProjectDependencies = async () => {
      if (!selectedProjectId) {
        setProjectDependencies([]);
        return;
      }

      try {
        const response = await apiRequest(
          LOGIN_ENDPOINTS.dependencies.getByProject(selectedProjectId),
          { method: "GET" }
        );

        const rows = Array.isArray(response)
          ? response
          : Array.isArray(response?.dependencies)
            ? response.dependencies
            : [];

        const normalized = rows
          .map((dep) => {
            const predecessorId = Number(
              dep.predecessor_id || dep.predecessor?.id || dep.predecessor || dep.from_task_id || dep.from
            );
            const successorId = Number(
              dep.successor_id || dep.successor?.id || dep.successor || dep.to_task_id || dep.to
            );

            if (Number.isNaN(predecessorId) || Number.isNaN(successorId)) return null;

            return {
              predecessorId,
              successorId,
              confidence: dep.confidence_score ?? dep.confidence ?? null,
              source: String(dep.source || dep.model_source || dep.dependency_source || "-").toUpperCase(),
              predecessorStatus: normalizeStatus(dep.predecessor_status || dep.predecessor?.status || "pending"),
            };
          })
          .filter(Boolean);

        setProjectDependencies(normalized);
      } catch (depErr) {
        setProjectDependencies([]);
      }
    };

    fetchProjectDependencies();
  }, [selectedProjectId]);

  const projectOptions = useMemo(() => {
    return (Array.isArray(projects) ? projects : []).map((project) => ({
      id: String(project.id || project.pk || project.ID),
      name: String(project.name || project.title || `Project ${project.id || project.pk || project.ID}`),
    }));
  }, [projects]);

  useEffect(() => {
    if (!selectedProjectId && projectOptions.length > 0) {
      setSelectedProjectId(projectOptions[0].id);
    }
  }, [projectOptions, selectedProjectId]);

  const filteredRawTasks = useMemo(() => {
    if (!selectedProjectId) return [];
    return rawTasks.filter((task) => task.projectId === selectedProjectId);
  }, [rawTasks, selectedProjectId]);

  const tasks = useMemo(() => {
    if (filteredRawTasks.length === 0) return [];

    if (selectedProjectId && projectDependencies.length > 0) {
      const depBySuccessor = new Map();
      projectDependencies.forEach((row) => {
        if (!depBySuccessor.has(row.successorId)) {
          depBySuccessor.set(row.successorId, []);
        }
        depBySuccessor.get(row.successorId).push(row.predecessorId);
      });

      return filteredRawTasks.map((task) => ({
        ...task,
        dependencies: Array.from(new Set(depBySuccessor.get(task.id) || [])),
      }));
    }

    const byId = new Map(filteredRawTasks.map((task) => [task.id, task]));
    const byTitle = new Map(filteredRawTasks.map((task) => [task.title.toLowerCase().trim(), task.id]));

    return filteredRawTasks.map((task) => {
      const explicitTokens = readExplicitDependencyTokens(task.raw);
      const explicitIds = explicitTokens
        .map((token) => resolveTokenToTaskId(token, byId, byTitle))
        .filter((depId) => depId && depId !== task.id);

      const inferredIds = inferDependenciesFromText(task, filteredRawTasks).filter((depId) => depId !== task.id);
      const dependencies = Array.from(new Set([...explicitIds, ...inferredIds]));

      return {
        ...task,
        dependencies,
      };
    });
  }, [filteredRawTasks, projectDependencies, selectedProjectId]);

  const tasksWithDependents = useMemo(() => {
    if (tasks.length === 0) return [];

    const dependentsById = new Map(tasks.map((task) => [task.id, []]));

    tasks.forEach((task) => {
      task.dependencies.forEach((depId) => {
        if (dependentsById.has(depId)) {
          dependentsById.get(depId).push(task.id);
        }
      });
    });

    return tasks.map((task) => ({
      ...task,
      dependents: dependentsById.get(task.id),
    }));
  }, [tasks]);

  const tasksMap = useMemo(() => new Map(tasksWithDependents.map((task) => [task.id, task])), [tasksWithDependents]);

  const components = useMemo(() => {
    const disconnected = groupDisconnectedComponents(tasksWithDependents);

    return disconnected.map((taskIds, idx) => {
      const layout = buildComponentLayout(taskIds, tasksMap);
      const edgeCount = layout.nodes.reduce((count, node) => count + node.dependencies.length, 0);
      return {
        id: idx + 1,
        taskIds,
        edgeCount,
        ...layout,
      };
    });
  }, [tasksWithDependents, tasksMap]);

  const selectedTask = selectedNode ? tasksMap.get(selectedNode) : null;
  const hasProjects = projectOptions.length > 0;

  const graphComponents = useMemo(
    () => components.filter((component) => !(component.taskIds.length === 1 && component.edgeCount === 0)),
    [components]
  );

  const dependencyRows = useMemo(() => {
    const taskStatusById = new Map(filteredRawTasks.map((task) => [task.id, task.normalizedStatus]));

    if (selectedProjectId && projectDependencies.length > 0) {
      return projectDependencies
        .map((row) => {
          const predecessor = tasksMap.get(row.predecessorId);
          const successor = tasksMap.get(row.successorId);
          if (!predecessor || !successor) return null;

          const predecessorStatus = row.predecessorStatus || taskStatusById.get(row.predecessorId) || "pending";
          const resolved = predecessorStatus === "completed";

          return {
            predecessorId: row.predecessorId,
            successorId: row.successorId,
            predecessorTitle: predecessor.title,
            successorTitle: successor.title,
            predecessorStatus,
            resolved,
            confidence: row.confidence,
            source: row.source,
          };
        })
        .filter(Boolean);
    }

    const rows = [];
    tasksWithDependents.forEach((task) => {
      task.dependencies.forEach((predecessorId) => {
        const predecessor = tasksMap.get(predecessorId);
        if (!predecessor) return;

        const predecessorStatus = taskStatusById.get(predecessorId) || "pending";
        rows.push({
          predecessorId,
          successorId: task.id,
          predecessorTitle: predecessor.title,
          successorTitle: task.title,
          predecessorStatus,
          resolved: predecessorStatus === "completed",
          confidence: null,
          source: "-",
        });
      });
    });

    return rows;
  }, [filteredRawTasks, projectDependencies, selectedProjectId, tasksMap, tasksWithDependents]);

  const stats = useMemo(() => {
    const totalDependencies = tasksWithDependents.reduce((sum, task) => sum + task.dependencies.length, 0);
    const blockedCount = tasksWithDependents.filter((task) => task.dependencies.length > 0).length;
    const isolatedCount = components.filter((component) => component.taskIds.length === 1 && component.edgeCount === 0).length;

    return {
      totalTasks: tasksWithDependents.length,
      totalDependencies,
      blockedCount,
      componentsCount: graphComponents.length,
      isolatedCount,
    };
  }, [tasksWithDependents, components, graphComponents]);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-wrap gap-3 items-center">
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => setViewMode("graph")}
            className={`px-5 py-2 rounded-xl border transition-all ${
              viewMode === "graph"
                ? "bg-primary text-white border-primary"
                : "bg-white text-primary border-border hover:bg-surface"
            }`}
          >
            Graph View
          </button>
          <button
            onClick={() => setViewMode("table")}
            className={`px-5 py-2 rounded-xl border transition-all ${
              viewMode === "table"
                ? "bg-primary text-white border-primary"
                : "bg-white text-primary border-border hover:bg-surface"
            }`}
          >
            Table View
          </button>
        </div>

        <div className="ml-auto min-w-[240px]">
          <label className="block text-xs font-semibold text-textMuted mb-1">Project</label>
          <select
            value={selectedProjectId}
            onChange={(e) => {
              setSelectedNode(null);
              setSelectedProjectId(e.target.value);
            }}
            disabled={!hasProjects}
            className="w-full bg-white border border-border rounded-xl px-3 py-2 text-sm text-textPrimary focus:outline-none focus:ring-2 focus:ring-primary/30"
          >
            {!hasProjects && <option value="">No projects found</option>}
            {projectOptions.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {!loading && !error && !hasProjects && (
        <div className="bg-white border border-border rounded-xl p-8 text-center text-textMuted">
          No projects found in database. Create a project first to view dependency mapping.
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
        <div className="bg-white border border-border rounded-xl p-4">
          <p className="text-textMuted text-sm">Total Tasks</p>
          <p className="text-2xl font-bold text-textPrimary">{stats.totalTasks}</p>
        </div>
        <div className="bg-white border border-border rounded-xl p-4">
          <p className="text-textMuted text-sm">Total Dependencies</p>
          <p className="text-2xl font-bold text-textPrimary">{dependencyRows.length}</p>
        </div>
        <div className="bg-white border border-border rounded-xl p-4">
          <p className="text-textMuted text-sm">Tasks With Dependencies</p>
          <p className="text-2xl font-bold text-textPrimary">{stats.blockedCount}</p>
        </div>
        <div className="bg-white border border-border rounded-xl p-4">
          <p className="text-textMuted text-sm">Disconnected Groups</p>
          <p className="text-2xl font-bold text-textPrimary">{stats.componentsCount}</p>
        </div>
        <div className="bg-white border border-border rounded-xl p-4">
          <p className="text-textMuted text-sm">Isolated Tasks</p>
          <p className="text-2xl font-bold text-textPrimary">{stats.isolatedCount}</p>
        </div>
      </div>

      {loading && (
        <div className="bg-white border border-border rounded-xl p-8 text-center text-textMuted">
          Loading dependencies...
        </div>
      )}

      {!loading && error && (
        <div className="bg-error/10 border border-error/30 rounded-xl p-4 text-error">{error}</div>
      )}

      {!loading && !error && hasProjects && tasksWithDependents.length === 0 && (
        <div className="bg-white border border-border rounded-xl p-8 text-center text-textMuted">
          No tasks found for the selected project.
        </div>
      )}

      {!loading && !error && tasksWithDependents.length > 0 && viewMode === "graph" && (
        <div className="space-y-6">
          {graphComponents.length === 0 ? (
            <div className="bg-white border border-border rounded-xl p-8 text-center text-textMuted">
              No dependency links to render in graph view for this project.
            </div>
          ) : (
            graphComponents.map((component) => (
              <motion.div
                key={component.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25 }}
                className="bg-white border border-border rounded-2xl p-5 shadow-sm"
              >
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-textPrimary">
                      Dependency Group {component.id}
                    </h3>
                    <p className="text-sm text-textMuted">
                      {component.taskIds.length} task(s), {component.edgeCount} dependency link(s)
                    </p>
                  </div>
                </div>

                <div className="overflow-auto border border-border rounded-xl bg-surface/50 p-4">
                  <div
                    className="relative"
                    style={{ width: component.width, height: component.height, minWidth: "100%" }}
                  >
                    <svg className="absolute inset-0 w-full h-full pointer-events-none">
                      {component.nodes.map((task) =>
                        task.dependencies.map((depId) => {
                          const parent = component.nodes.find((node) => node.id === depId);
                          if (!parent) return null;

                          const edgeMeta = dependencyRows.find(
                            (edge) => edge.predecessorId === depId && edge.successorId === task.id
                          );
                          const isResolved = edgeMeta?.resolved;

                          const x1 = parent.x + NODE_WIDTH;
                          const y1 = parent.y + NODE_HEIGHT / 2;
                          const x2 = task.x;
                          const y2 = task.y + NODE_HEIGHT / 2;
                          const midX = (x1 + x2) / 2;
                          const path = `M ${x1} ${y1} C ${midX} ${y1}, ${midX} ${y2}, ${x2} ${y2}`;

                          return (
                            <g key={`${depId}-${task.id}`}>
                              <path
                                d={path}
                                stroke={isResolved ? "#16A34A" : "#3182CE"}
                                strokeWidth="2.4"
                                fill="none"
                                opacity="0.8"
                              />
                              <polygon
                                points={`${x2},${y2} ${x2 - 8},${y2 - 5} ${x2 - 8},${y2 + 5}`}
                                fill={isResolved ? "#16A34A" : "#3182CE"}
                                opacity="0.85"
                              />
                            </g>
                          );
                        })
                      )}
                    </svg>

                    {component.nodes.map((task) => {
                      const isSelected = selectedNode === task.id;

                      return (
                        <button
                          key={task.id}
                          type="button"
                          className={`absolute border rounded-xl px-3 py-2 text-left shadow-sm transition-all hover:shadow-md ${
                            isSelected ? "ring-2 ring-info z-20" : ""
                          } bg-white border-border text-slate-800`}
                          style={{
                            left: task.x,
                            top: task.y,
                            width: isSelected ? 320 : NODE_WIDTH,
                            minHeight: isSelected ? 110 : NODE_HEIGHT,
                            height: isSelected ? "auto" : NODE_HEIGHT,
                          }}
                          onClick={() => setSelectedNode(task.id)}
                        >
                          <p
                            className={`font-semibold text-sm ${
                              isSelected ? "whitespace-normal break-words leading-5" : "truncate"
                            }`}
                            title={task.title}
                          >
                            {task.title}
                          </p>
                          <p className={`text-xs opacity-80 ${isSelected ? "mt-2" : "truncate"}`}>
                            Depends on: {task.dependencies.length} | Dependents: {task.dependents.length}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      )}

      {!loading && !error && tasksWithDependents.length > 0 && viewMode === "table" && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="bg-white border border-border rounded-2xl shadow-sm overflow-hidden"
        >
          <div className="overflow-auto">
            <table className="w-full min-w-[960px]">
              <thead className="bg-surface border-b border-border">
                <tr>
                  <th className="text-left px-4 py-3 text-sm font-semibold text-textPrimary">Predecessor</th>
                  <th className="text-left px-4 py-3 text-sm font-semibold text-textPrimary">Successor</th>
                  <th className="text-left px-4 py-3 text-sm font-semibold text-textPrimary">Predecessor Status</th>
                  <th className="text-left px-4 py-3 text-sm font-semibold text-textPrimary">Resolved</th>
                  <th className="text-left px-4 py-3 text-sm font-semibold text-textPrimary">Confidence</th>
                  <th className="text-left px-4 py-3 text-sm font-semibold text-textPrimary">Source</th>
                </tr>
              </thead>
              <tbody>
                {dependencyRows.length === 0 ? (
                  <tr>
                    <td className="px-4 py-4 text-sm text-textMuted" colSpan={6}>
                      No dependency pairs found for the selected project.
                    </td>
                  </tr>
                ) : (
                  dependencyRows.map((row) => (
                    <tr
                      key={`${row.predecessorId}-${row.successorId}`}
                      className="border-b border-border/70 hover:bg-surfaceLight"
                    >
                      <td className="px-4 py-3 text-sm text-textPrimary font-medium">{row.predecessorTitle}</td>
                      <td className="px-4 py-3 text-sm text-textPrimary font-medium">{row.successorTitle}</td>
                      <td className="px-4 py-3 text-sm text-textSecondary">{row.predecessorStatus}</td>
                      <td className="px-4 py-3 text-sm text-textSecondary">{row.resolved ? "Yes" : "No"}</td>
                      <td className="px-4 py-3 text-sm text-textSecondary">{formatConfidence(row.confidence)}</td>
                      <td className="px-4 py-3 text-sm text-textSecondary">{row.source}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      {selectedTask && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="bg-white border border-border rounded-xl p-5"
        >
          <h3 className="text-lg font-semibold text-textPrimary mb-3">{selectedTask.title}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-sm">
            <div>
              <p className="font-semibold text-textPrimary mb-2">Dependencies</p>
              {selectedTask.dependencies.length === 0 ? (
                <p className="text-textMuted">No dependencies</p>
              ) : (
                <ul className="space-y-1">
                  {selectedTask.dependencies.map((depId) => (
                    <li key={depId} className="text-textSecondary">
                      {tasksMap.get(depId)?.title || `Task ${depId}`}
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div>
              <p className="font-semibold text-textPrimary mb-2">Dependents</p>
              {selectedTask.dependents.length === 0 ? (
                <p className="text-textMuted">No dependent tasks</p>
              ) : (
                <ul className="space-y-1">
                  {selectedTask.dependents.map((depId) => (
                    <li key={depId} className="text-textSecondary">
                      {tasksMap.get(depId)?.title || `Task ${depId}`}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
