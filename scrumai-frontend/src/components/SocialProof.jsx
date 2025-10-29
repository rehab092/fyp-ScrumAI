import React from "react";
import { motion } from "framer-motion";

export default function SocialProof() {
  const companies = [
    { name: "TechCorp", logo: "🏢", industry: "Technology" },
    { name: "InnovateLab", logo: "🔬", industry: "Research" },
    { name: "StartupHub", logo: "🚀", industry: "Startups" },
    { name: "DevStudio", logo: "💻", industry: "Development" },
    { name: "AgileCo", logo: "⚡", industry: "Consulting" },
    { name: "CloudTech", logo: "☁️", industry: "Cloud Services" }
  ];

  const testimonials = [
    {
      name: "Sarah Johnson",
      role: "Scrum Master",
      company: "TechCorp",
      avatar: "👩‍💼",
      content: "ScrumAI has revolutionized our sprint planning. The AI-powered task allocation reduced our planning time by 60% and improved accuracy significantly.",
      rating: 5
    },
    {
      name: "Michael Chen",
      role: "Product Owner",
      company: "InnovateLab",
      avatar: "👨‍💻",
      content: "The dependency mapping feature is a game-changer. We can now visualize complex project relationships and avoid bottlenecks before they happen.",
      rating: 5
    },
    {
      name: "Emily Rodriguez",
      role: "Team Lead",
      company: "StartupHub",
      avatar: "👩‍🚀",
      content: "The predictive analytics help us stay ahead of potential delays. Our sprint completion rate improved from 75% to 95% in just 3 months.",
      rating: 5
    }
  ];

  const stats = [
    { number: "500+", label: "Teams Using ScrumAI" },
    { number: "95%", label: "Sprint Completion Rate" },
    { number: "60%", label: "Faster Planning" },
    { number: "40%", label: "Reduced Delays" }
  ];

  return (
    <section className="py-20 bg-gradient-to-br from-surface to-surfaceDark">
      <div className="max-w-7xl mx-auto px-6">
        {/* Stats Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl font-bold text-textPrimary mb-4">
            Trusted by Teams Worldwide
          </h2>
          <p className="text-xl text-textSecondary max-w-3xl mx-auto mb-12">
            Join thousands of teams who have transformed their agile workflow with ScrumAI
          </p>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: i * 0.1 }}
                className="text-center"
              >
                <div className="text-4xl font-bold text-primary mb-2">{stat.number}</div>
                <div className="text-textSecondary font-medium">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Companies Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="mb-16"
        >
          <h3 className="text-2xl font-bold text-textPrimary text-center mb-8">
            Trusted by Leading Companies
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            {companies.map((company, i) => (
              <motion.div
                key={company.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: i * 0.1 }}
                className="bg-white/80 backdrop-blur-sm border border-border rounded-xl p-6 text-center hover:shadow-lg transition-all"
              >
                <div className="text-3xl mb-2">{company.logo}</div>
                <div className="font-semibold text-textPrimary text-sm">{company.name}</div>
                <div className="text-textMuted text-xs">{company.industry}</div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Testimonials Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
        >
          <h3 className="text-2xl font-bold text-textPrimary text-center mb-12">
            What Our Users Say
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, i) => (
              <motion.div
                key={testimonial.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: i * 0.2 }}
                className="bg-white border border-border rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all"
              >
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, j) => (
                    <span key={j} className="text-accent text-lg">⭐</span>
                  ))}
                </div>
                <p className="text-textSecondary mb-6 italic">
                  "{testimonial.content}"
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-r from-primary to-secondary rounded-full flex items-center justify-center text-white text-xl">
                    {testimonial.avatar}
                  </div>
                  <div>
                    <div className="font-semibold text-textPrimary">{testimonial.name}</div>
                    <div className="text-textMuted text-sm">{testimonial.role}</div>
                    <div className="text-primary text-sm font-medium">{testimonial.company}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}

