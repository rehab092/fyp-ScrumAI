import React from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

export default function Hero() {
  const navigate = useNavigate();

  return (
    <section className="min-h-screen bg-gradient-to-br from-background via-surface to-surfaceDark flex items-center relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-secondary/10 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-accent/5 rounded-full blur-3xl"></div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-20 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
      <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8 }}
            className="space-y-8"
          >
            <div className="space-y-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium"
              >
                <span className="w-2 h-2 bg-primary rounded-full animate-pulse"></span>
                AI-Powered Agile Management
              </motion.div>
              
              <h1 className="text-5xl lg:text-6xl font-bold text-textPrimary leading-tight">
                Transform Your
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary block">
                  Agile Workflow
                </span>
                with Intelligence
        </h1>
              
              <p className="text-xl text-textSecondary leading-relaxed">
                ScrumAI revolutionizes sprint planning, task allocation, and dependency management 
                with intelligent automation and real-time insights that adapt to your team's needs.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/signup')}
                className="bg-gradient-to-r from-primary to-primaryDark text-white px-8 py-4 rounded-xl font-semibold text-lg hover:shadow-xl transition-all shadow-lg"
              >
                Start Free Trial
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/login')}
                className="border-2 border-primary text-primary px-8 py-4 rounded-xl font-semibold text-lg hover:bg-primary hover:text-white transition-all"
              >
                Login
              </motion.button>
            </div>

            <div className="flex items-center gap-8 text-sm text-textMuted">
              <div className="flex items-center gap-2">
                <span className="text-success text-lg">✓</span>
                <span>14-day free trial</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-success text-lg">✓</span>
                <span>No credit card required</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-success text-lg">✓</span>
                <span>Setup in minutes</span>
              </div>
        </div>
      </motion.div>

          {/* Right Content - Interactive Dashboard Preview */}
      <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative"
          >
            <div className="bg-white border border-border rounded-3xl p-6 shadow-2xl relative overflow-hidden">
              {/* Browser Header */}
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-border">
                <div className="flex gap-2">
                  <div className="w-3 h-3 bg-error rounded-full"></div>
                  <div className="w-3 h-3 bg-warning rounded-full"></div>
                  <div className="w-3 h-3 bg-success rounded-full"></div>
                </div>
                <span className="text-textMuted text-sm font-medium">ScrumAI Dashboard</span>
              </div>
              
              {/* Dashboard Content */}
              <div className="space-y-6">
                {/* Metrics Row */}
                <div className="grid grid-cols-2 gap-4">
                  <motion.div 
                    whileHover={{ scale: 1.05 }}
                    className="bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 rounded-xl p-4 cursor-pointer"
                  >
                    <div className="text-2xl font-bold text-primary">87%</div>
                    <div className="text-sm text-textSecondary">Sprint Progress</div>
                    <div className="w-full bg-primary/20 rounded-full h-2 mt-2">
                      <div className="bg-primary h-2 rounded-full w-3/4"></div>
                    </div>
                  </motion.div>
                  <motion.div 
                    whileHover={{ scale: 1.05 }}
                    className="bg-gradient-to-br from-success/10 to-success/5 border border-success/20 rounded-xl p-4 cursor-pointer"
                  >
                    <div className="text-2xl font-bold text-success">24/28</div>
                    <div className="text-sm text-textSecondary">Tasks Done</div>
                    <div className="w-full bg-success/20 rounded-full h-2 mt-2">
                      <div className="bg-success h-2 rounded-full w-5/6"></div>
                    </div>
                  </motion.div>
                </div>

                {/* Team Performance */}
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-textPrimary">Team Performance</h4>
                  {[
                    { name: "Frontend Team", progress: 75, color: "primary" },
                    { name: "Backend Team", progress: 50, color: "secondary" },
                    { name: "QA Team", progress: 90, color: "accent" },
                  ].map((team, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.5 + i * 0.1 }}
                      className="flex items-center gap-3"
                    >
                      <div className="w-2 h-2 bg-primary rounded-full"></div>
                      <div className="flex-1 bg-border rounded-full h-2">
                        <motion.div 
                          className={`bg-${team.color} h-2 rounded-full`}
                          initial={{ width: 0 }}
                          animate={{ width: `${team.progress}%` }}
                          transition={{ duration: 1, delay: 0.8 + i * 0.1 }}
                        ></motion.div>
                      </div>
                      <span className="text-xs text-textMuted">{team.progress}%</span>
                    </motion.div>
                  ))}
                </div>

                {/* AI Insights */}
                <div className="bg-gradient-to-r from-accent/10 to-accent/5 border border-accent/20 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-accent text-lg">🤖</span>
                    <span className="text-sm font-semibold text-textPrimary">AI Insight</span>
                  </div>
                  <p className="text-xs text-textSecondary">
                    "Consider redistributing 2 tasks from Frontend to Backend team for optimal velocity."
              </p>
            </div>
        </div>
        </div>

            {/* Floating Elements */}
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ repeat: Infinity, duration: 3 }}
              className="absolute -top-4 -right-4 w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center"
            >
              <span className="text-primary text-sm">⚡</span>
            </motion.div>
            <motion.div
              animate={{ y: [0, 10, 0] }}
              transition={{ repeat: Infinity, duration: 3, delay: 1 }}
              className="absolute -bottom-4 -left-4 w-8 h-8 bg-secondary/20 rounded-full flex items-center justify-center"
            >
              <span className="text-secondary text-sm">📊</span>
            </motion.div>
      </motion.div>
        </div>
      </div>
    </section>
  );
}