import React from "react";
import { motion } from "framer-motion";

export default function Features() {
  const features = [
    {
      title: "AI Story Generator",
      desc: "Transform user stories into actionable tasks instantly with intelligent automation.",
      visual: (
        <div className="bg-white border border-border rounded-2xl p-6 w-full shadow-lg">
          <div className="bg-gradient-to-r from-surfaceLight/20 to-surface/20 border border-surfaceLight rounded-xl p-4 mb-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-primary text-lg">🧠</span>
              <p className="text-primary font-semibold">User Story Input</p>
            </div>
            <p className="text-textSecondary italic text-sm">
              "As a user, I want to filter products by category so I can find what I need quickly."
            </p>
          </div>

          <motion.div
            animate={{ y: [0, 5, 0] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
            className="flex justify-center mb-4 text-primary text-2xl"
          >
            ⬇️
          </motion.div>

          <div className="space-y-2">
            {[
              "Create category filter component",
              "Add API endpoint for filtering",
              "Update product list view",
              "Write unit tests",
            ].map((task, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className="bg-gradient-to-r from-success/10 to-success/5 border border-success/20 rounded-lg px-4 py-2 text-textPrimary text-sm hover:shadow-md transition-all"
              >
                <span className="text-success mr-2">✓</span>
                {task}
              </motion.div>
            ))}
          </div>
        </div>
      ),
    },

    {
      title: "Smart Sprint Planner",
      desc: "AI-powered prioritization and capacity balancing for realistic timelines.",
      visual: (
        <div className="bg-white border border-border rounded-2xl p-6 w-full shadow-lg">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2">
              <span className="text-primary text-lg">🗓️</span>
              <p className="text-primary text-sm font-semibold">Sprint 24 - Week 1</p>
            </div>
            <p className="text-textMuted text-sm">👥 5 members</p>
          </div>

          <div className="grid grid-cols-5 text-center text-textMuted text-xs mb-3 font-medium">
            <p>Mon</p><p>Tue</p><p>Wed</p><p>Thu</p><p>Fri</p>
          </div>

          <div className="space-y-3">
            {[
              { name: "Design System", days: "3d", progress: 80, color: "primary" },
              { name: "API Integration", days: "2d", progress: 60, color: "secondary" },
              { name: "Testing Suite", days: "2d", progress: 40, color: "accent" },
            ].map((task, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="bg-gradient-to-r from-surface to-surfaceDark border border-border rounded-lg p-3 hover:shadow-md transition-all"
              >
                <div className="flex justify-between items-center mb-2">
                  <span className="text-textPrimary text-sm font-medium">{task.name}</span>
                  <span className="text-primary text-xs font-semibold bg-primary/10 px-2 py-1 rounded">{task.days}</span>
                </div>
                <div className="w-full bg-border rounded-full h-2">
                  <motion.div 
                    className={`bg-${task.color} h-2 rounded-full`}
                    initial={{ width: 0 }}
                    animate={{ width: `${task.progress}%` }}
                    transition={{ duration: 1, delay: 0.5 + i * 0.2 }}
                  ></motion.div>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="mt-4 p-3 bg-gradient-to-r from-accent/10 to-accent/5 border border-accent/20 rounded-lg">
            <p className="text-xs text-accent flex items-center gap-1">
              ⚡ Optimized for 87% team capacity
            </p>
          </div>
        </div>
      ),
    },

    {
      title: "Dependency Mapper",
      desc: "Visualize task connections and get intelligent sequencing suggestions.",
      visual: (
        <div className="bg-white border border-border rounded-2xl p-6 w-full shadow-lg">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-primary text-lg">🔗</span>
            <p className="text-textPrimary text-sm font-semibold">Task Dependencies</p>
          </div>
          
          <div className="relative flex justify-center items-center min-h-[200px]">
            {/* Central Auth Task */}
            <div className="absolute top-8 left-1/2 transform -translate-x-1/2">
              <div className="bg-gradient-to-r from-primary to-primaryDark text-white rounded-xl px-4 py-3 text-sm font-semibold shadow-lg">
                🔐 Authentication
              </div>
            </div>

                    {/* Left Tasks */}
                    <div className="absolute top-20 left-8">
                      <div className="bg-gradient-to-r from-surfaceLight to-surfaceDark text-textPrimary rounded-lg px-3 py-2 text-sm font-medium shadow-md">
                        🎨 UI Components
                      </div>
                    </div>
                    <div className="absolute top-32 left-8">
                      <div className="bg-gradient-to-r from-surfaceDark to-surfaceLight text-textPrimary rounded-lg px-3 py-2 text-sm font-medium shadow-md">
                        🧪 Testing
                      </div>
                    </div>

                    {/* Right Tasks */}
                    <div className="absolute top-20 right-8">
                      <div className="bg-gradient-to-r from-primary to-primaryDark text-white rounded-lg px-3 py-2 text-sm font-medium shadow-md">
                        🔌 API Layer
                      </div>
                    </div>
                    <div className="absolute top-32 right-8">
                      <div className="bg-gradient-to-r from-secondary to-secondaryDark text-white rounded-lg px-3 py-2 text-sm font-medium shadow-md">
                        📊 Analytics
                      </div>
                    </div>

            {/* Final Task */}
            <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
              <div className="bg-gradient-to-r from-warning to-warning/80 text-white rounded-xl px-4 py-3 text-sm font-semibold shadow-lg">
                🚀 Deployment
              </div>
            </div>

            {/* Connection Lines */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none">
                      {/* Auth to UI */}
                      <motion.line
                        x1="50%"
                        y1="60"
                        x2="25%"
                        y2="100"
                        stroke="#A0E7E5"
                        strokeWidth="2"
                        strokeDasharray="5,5"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 1, delay: 0.5 }}
                      />
                      {/* Auth to API */}
                      <motion.line
                        x1="50%"
                        y1="60"
                        x2="75%"
                        y2="100"
                        stroke="#87E0E0"
                        strokeWidth="2"
                        strokeDasharray="5,5"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 1, delay: 0.7 }}
                      />
                      {/* UI to Testing */}
                      <motion.line
                        x1="25%"
                        y1="120"
                        x2="25%"
                        y2="140"
                        stroke="#BAEDE6"
                        strokeWidth="2"
                        strokeDasharray="5,5"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 1, delay: 0.9 }}
                      />
                      {/* API to Analytics */}
                      <motion.line
                        x1="75%"
                        y1="120"
                        x2="75%"
                        y2="140"
                        stroke="#06B6D4"
                        strokeWidth="2"
                        strokeDasharray="5,5"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 1, delay: 1.1 }}
                      />
                      {/* All to Deployment */}
                      <motion.line
                        x1="25%"
                        y1="160"
                        x2="50%"
                        y2="180"
                        stroke="#10B981"
                        strokeWidth="3"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 1, delay: 1.3 }}
                      />
                      <motion.line
                        x1="75%"
                        y1="160"
                        x2="50%"
                        y2="180"
                        stroke="#10B981"
                        strokeWidth="3"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 1, delay: 1.5 }}
                      />
            </svg>
          </div>

          <div className="flex justify-center gap-4 text-xs text-textSecondary mt-6">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-success rounded-full"></div>
              <span>Completed</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-warning rounded-full"></div>
              <span>In Progress</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-border border border-borderDark rounded-full"></div>
              <span>Ready</span>
            </div>
          </div>
        </div>
      ),
    },

    {
      title: "Delay Alert System",
      desc: "Early detection with AI alerts and actionable recommendations.",
      visual: (
        <div className="bg-white border border-border rounded-2xl p-6 w-full shadow-lg">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-warning text-lg">⚠️</span>
            <p className="text-warning font-semibold">Potential Delay Detected</p>
          </div>
          
          <div className="bg-gradient-to-r from-warning/10 to-error/10 border border-warning/30 rounded-xl p-4 space-y-3 text-sm">
            <div className="flex justify-between items-center">
              <p className="text-textMuted">Estimated Delay</p>
              <div className="bg-error/20 text-error px-3 py-1 rounded-full text-xs font-semibold">
                2 days
              </div>
            </div>
            <div className="flex justify-between items-center">
              <p className="text-textMuted">Impact Score</p>
              <div className="bg-warning/20 text-warning px-3 py-1 rounded-full text-xs font-semibold">
                High
              </div>
            </div>
            
            <div className="bg-gradient-to-r from-accent/10 to-accent/5 border border-accent/30 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-accent text-lg">🤖</span>
                <p className="text-accent text-sm font-semibold">AI Recommendation</p>
              </div>
              <p className="text-textSecondary text-xs">
                Reassign 2 subtasks to available team members to meet deadline.
              </p>
            </div>
            
            <div className="flex gap-3 mt-3">
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-success text-white px-4 py-2 rounded-lg hover:bg-success/80 transition-all text-xs font-medium"
              >
                Apply Fix
              </motion.button>
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="border border-warning text-warning px-4 py-2 rounded-lg hover:bg-warning hover:text-white transition-all text-xs font-medium"
              >
                Dismiss
              </motion.button>
            </div>
          </div>
        </div>
      ),
    },

    {
      title: "Command Center",
      desc: "Monitor sprint health, velocity, and performance in one dashboard.",
      visual: (
        <div className="bg-white border border-border rounded-2xl p-6 w-full shadow-lg">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-primary text-lg">📊</span>
            <p className="text-primary text-sm font-semibold">Command Center</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { label: "Optimization Score", value: "94%", trend: "↑ 12%", color: "success" },
              { label: "Delay Risk", value: "2%", trend: "↓ 4%", color: "error" },
              { label: "Sprint Health", value: "Excellent", trend: "✅", color: "primary" },
            ].map((metric, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.1 }}
                className="bg-gradient-to-br from-surface to-surfaceDark border border-border rounded-xl p-4 text-center hover:shadow-md transition-all"
              >
                <p className={`text-${metric.color} text-sm mb-1 font-semibold`}>{metric.trend}</p>
                <h3 className="text-2xl font-bold text-textPrimary">{metric.value}</h3>
                <p className="text-xs text-textMuted">{metric.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      ),
    },
  ];

  return (
    <section id="features" className="max-w-6xl mx-auto py-20 px-6">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="text-center mb-16"
      >
        <h2 className="text-4xl font-bold text-textPrimary mb-4">
          Intelligent Features for Modern Teams
        </h2>
        <p className="text-xl text-textSecondary max-w-3xl mx-auto">
          Harness the power of AI to transform how you plan and execute sprints with intelligent automation.
        </p>
      </motion.div>

      <div className="flex flex-col gap-20">
        {features.map((f, i) => (
          <motion.div
            key={f.title}
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: i * 0.1 }}
            className={`flex flex-col lg:flex-row items-center gap-12 ${
              i % 2 === 1 ? "lg:flex-row-reverse" : ""
            }`}
          >
            <div className="lg:w-2/5">
              <motion.div
                initial={{ opacity: 0, x: i % 2 === 0 ? -30 : 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                <h3 className="text-3xl font-bold mb-4 text-textPrimary">
                  {f.title}
                </h3>
                <p className="text-lg text-textSecondary leading-relaxed">{f.desc}</p>
              </motion.div>
            </div>
            <div className="lg:w-3/5 flex justify-center items-center min-h-[400px]">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="w-full max-w-2xl"
              >
                {f.visual}
              </motion.div>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
