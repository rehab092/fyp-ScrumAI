import React from "react";
import { motion } from "framer-motion";

export default function About() {
  const stats = [
    { number: "10K+", label: "Teams Transformed" },
    { number: "40%", label: "Productivity Increase" },
    { number: "95%", label: "Sprint Success Rate" },
    { number: "24/7", label: "AI Monitoring" },
  ];

  const values = [
    {
      icon: "🚀",
      title: "Innovation First",
      description: "We continuously push the boundaries of what's possible in agile project management."
    },
    {
      icon: "🤝",
      title: "Team Collaboration",
      description: "Building tools that bring teams together and enhance communication."
    },
    {
      icon: "📈",
      title: "Data-Driven Decisions",
      description: "Empowering teams with insights that drive better project outcomes."
    },
    {
      icon: "🔒",
      title: "Security & Privacy",
      description: "Your data is protected with enterprise-grade security measures."
    }
  ];

  return (
    <section id="about" className="py-20 bg-gradient-to-br from-surface to-surfaceDark">
      <div className="max-w-7xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl font-bold text-textPrimary mb-4">
            About ScrumAI
          </h2>
          <p className="text-xl text-textSecondary max-w-3xl mx-auto">
            We're revolutionizing agile project management with AI-powered insights and intelligent automation.
          </p>
        </motion.div>

        {/* Stats Section */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-20"
        >
          {stats.map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: i * 0.1 }}
              className="text-center"
            >
              <div className="text-4xl font-bold text-primary mb-2">{stat.number}</div>
              <div className="text-textSecondary">{stat.label}</div>
            </motion.div>
          ))}
        </motion.div>

        {/* Mission Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-20">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h3 className="text-3xl font-bold text-textPrimary mb-6">Why ScrumAI is the Best Choice</h3>
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 bg-success/20 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <span className="text-success text-sm">✓</span>
                </div>
                <div>
                  <h4 className="font-semibold text-textPrimary mb-2">AI-Powered Intelligence</h4>
                  <p className="text-textSecondary">Unlike traditional tools, ScrumAI learns from your team's patterns and provides intelligent recommendations that improve over time.</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 bg-success/20 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <span className="text-success text-sm">✓</span>
                </div>
                <div>
                  <h4 className="font-semibold text-textPrimary mb-2">Predictive Analytics</h4>
                  <p className="text-textSecondary">Get early warnings about potential delays and bottlenecks before they impact your project timeline.</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 bg-success/20 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <span className="text-success text-sm">✓</span>
                </div>
                <div>
                  <h4 className="font-semibold text-textPrimary mb-2">Seamless Integration</h4>
                  <p className="text-textSecondary">Works with your existing tools and workflows without disrupting your team's established processes.</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 bg-success/20 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <span className="text-success text-sm">✓</span>
                </div>
                <div>
                  <h4 className="font-semibold text-textPrimary mb-2">Enterprise Security</h4>
                  <p className="text-textSecondary">Bank-level security with SOC 2 compliance, ensuring your data is always protected and private.</p>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative"
          >
            <div className="bg-white rounded-3xl p-8 shadow-xl">
              <h4 className="text-xl font-bold text-textPrimary mb-6 text-center">ScrumAI vs Traditional Tools</h4>
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <span className="text-textSecondary">Planning Speed</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 bg-border rounded-full h-2">
                      <div className="bg-error h-2 rounded-full w-1/3"></div>
                    </div>
                    <span className="text-error text-sm font-medium">Traditional</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-24 bg-border rounded-full h-2">
                      <div className="bg-success h-2 rounded-full w-4/5"></div>
                    </div>
                    <span className="text-success text-sm font-medium">ScrumAI</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-textSecondary">Accuracy</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 bg-border rounded-full h-2">
                      <div className="bg-error h-2 rounded-full w-2/5"></div>
                    </div>
                    <span className="text-error text-sm font-medium">Traditional</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-24 bg-border rounded-full h-2">
                      <div className="bg-success h-2 rounded-full w-5/6"></div>
                    </div>
                    <span className="text-success text-sm font-medium">ScrumAI</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-textSecondary">Predictive Power</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 bg-border rounded-full h-2">
                      <div className="bg-error h-2 rounded-full w-1/4"></div>
                    </div>
                    <span className="text-error text-sm font-medium">Traditional</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-24 bg-border rounded-full h-2">
                      <div className="bg-success h-2 rounded-full w-full"></div>
                    </div>
                    <span className="text-success text-sm font-medium">ScrumAI</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-textSecondary">Team Satisfaction</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 bg-border rounded-full h-2">
                      <div className="bg-error h-2 rounded-full w-1/2"></div>
                    </div>
                    <span className="text-error text-sm font-medium">Traditional</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-24 bg-border rounded-full h-2">
                      <div className="bg-success h-2 rounded-full w-5/6"></div>
                    </div>
                    <span className="text-success text-sm font-medium">ScrumAI</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Values Section */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <h3 className="text-3xl font-bold text-textPrimary text-center mb-12">Our Values</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: i * 0.1 }}
                className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all"
              >
                <div className="text-4xl mb-4">{value.icon}</div>
                <h4 className="text-xl font-semibold text-textPrimary mb-3">{value.title}</h4>
                <p className="text-textSecondary">{value.description}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
