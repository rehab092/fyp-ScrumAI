import React from "react";
import { motion } from "framer-motion";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

export default function FAQ() {
  const faqs = [
    {
      question: "What is ScrumAI and how does it work?",
      answer: "ScrumAI is an AI-powered agile project management platform that uses machine learning to optimize sprint planning, task allocation, and dependency management. It analyzes your team's patterns and provides intelligent recommendations to improve productivity and reduce delays."
    },
    {
      question: "How does the AI story generator work?",
      answer: "Our AI story generator takes user stories written in natural language and automatically breaks them down into actionable tasks with proper dependencies, time estimates, and resource requirements. It learns from your team's historical data to provide increasingly accurate suggestions."
    },
    {
      question: "Can ScrumAI integrate with existing tools?",
      answer: "Yes! ScrumAI integrates seamlessly with popular tools like Jira, Slack, GitHub, Trello, and Microsoft Teams. We also provide comprehensive APIs for custom integrations with your existing workflow tools."
    },
    {
      question: "Is my data secure with ScrumAI?",
      answer: "Absolutely. We use enterprise-grade security with SOC 2 compliance, end-to-end encryption, and regular security audits. Your data is stored in secure, encrypted databases and we never share your information with third parties."
    },
    {
      question: "How accurate are the AI predictions?",
      answer: "Our AI predictions improve over time as it learns from your team's patterns. Most teams see 85-95% accuracy in sprint completion predictions within 3 months of use. The system continuously adapts to your team's unique working style."
    },
    {
      question: "What's the difference between ScrumAI and traditional project management tools?",
      answer: "Unlike traditional tools that require manual configuration, ScrumAI uses AI to automatically optimize your workflow. It provides predictive insights, intelligent task allocation, and learns from your team's behavior to continuously improve recommendations."
    },
    {
      question: "Do I need technical expertise to use ScrumAI?",
      answer: "Not at all! ScrumAI is designed for all team members regardless of technical background. The interface is intuitive and user-friendly, with guided setup wizards and comprehensive help documentation."
    },
    {
      question: "Can I customize ScrumAI for my team's specific needs?",
      answer: "Yes, ScrumAI offers extensive customization options including custom workflows, team roles, notification preferences, and integration settings. You can also create custom AI models trained on your specific project types."
    },
    {
      question: "What support options are available?",
      answer: "We offer multiple support channels including email support, live chat, comprehensive documentation, video tutorials, and dedicated account managers for enterprise customers. Our support team is available 24/7 for critical issues."
    },
    {
      question: "How do I get started with ScrumAI?",
      answer: "Getting started is easy! Sign up for a free trial, invite your team members, and our AI will analyze your existing project data to provide initial recommendations. Most teams see benefits within the first week of use."
    },
    {
      question: "What happens to my data if I cancel my subscription?",
      answer: "Your data remains accessible for 30 days after cancellation. You can export all your data in standard formats (CSV, JSON) during this period. We never delete your data without your explicit request."
    },
    {
      question: "Does ScrumAI work for remote teams?",
      answer: "Yes! ScrumAI is designed for modern distributed teams. It provides real-time collaboration features, timezone-aware scheduling, and remote-friendly communication tools to keep your team connected and productive."
    }
  ];

  return (
    <>
      <Navbar />
      <main className="pt-20 bg-background text-textPrimary">
        {/* Hero Section */}
        <section className="max-w-4xl mx-auto py-20 px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-4xl md:text-5xl font-bold text-primary mb-6">
              Frequently Asked Questions
            </h1>
            <p className="text-xl text-textSecondary max-w-3xl mx-auto">
              Find answers to common questions about ScrumAI and how it can transform your agile workflow.
            </p>
          </motion.div>
        </section>

        {/* FAQ Section */}
        <section className="max-w-4xl mx-auto px-6 pb-20">
          <div className="space-y-6">
            {faqs.map((faq, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="bg-white border border-border rounded-2xl shadow-lg hover:shadow-xl transition-all"
              >
                <details className="group">
                  <summary className="flex items-center justify-between p-6 cursor-pointer list-none">
                    <h3 className="text-lg font-semibold text-textPrimary group-open:text-primary transition-colors">
                      {faq.question}
                    </h3>
                    <div className="flex-shrink-0 ml-4">
                      <svg
                        className="w-5 h-5 text-textMuted group-open:text-primary group-open:rotate-180 transition-all duration-300"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </div>
                  </summary>
                  <div className="px-6 pb-6">
                    <div className="border-t border-border pt-4">
                      <p className="text-textSecondary leading-relaxed">
                        {faq.answer}
                      </p>
                    </div>
                  </div>
                </details>
              </motion.div>
            ))}
          </div>

          {/* Contact Section */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="mt-16 bg-gradient-to-r from-primary/10 to-secondary/10 rounded-2xl p-8 text-center"
          >
            <h3 className="text-2xl font-bold text-textPrimary mb-4">
              Still have questions?
            </h3>
            <p className="text-textSecondary mb-6">
              Can't find what you're looking for? Our support team is here to help.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="bg-primary text-white px-6 py-3 rounded-lg font-semibold hover:bg-primaryDark transition-all shadow-lg">
                Contact Support
              </button>
              <button className="border border-primary text-primary px-6 py-3 rounded-lg font-semibold hover:bg-primary hover:text-white transition-all">
                Schedule Demo
              </button>
            </div>
          </motion.div>
        </section>
      </main>
      <Footer />
    </>
  );
}


