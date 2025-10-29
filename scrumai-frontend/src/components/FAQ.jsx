import React, { useState } from "react";
import { motion } from "framer-motion";

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState(null);

  const faqs = [
    {
      question: "What is ScrumAI and how does it work?",
      answer: "ScrumAI is an intelligent project management platform that uses AI to automate sprint planning, task allocation, and dependency management. It analyzes your team's capacity, identifies potential bottlenecks, and provides actionable insights to optimize your agile workflow."
    },
    {
      question: "How does the AI story generator work?",
      answer: "Our AI story generator takes user stories and automatically breaks them down into actionable tasks. It considers dependencies, team capacity, and historical data to create realistic task estimates and optimal task sequences."
    },
    {
      question: "Can I integrate ScrumAI with my existing tools?",
      answer: "Yes! ScrumAI integrates seamlessly with popular tools like Jira, Slack, GitHub, and Microsoft Teams. We also provide comprehensive APIs for custom integrations."
    },
    {
      question: "Is my data secure with ScrumAI?",
      answer: "Absolutely. We use enterprise-grade security measures including end-to-end encryption, SOC 2 compliance, and regular security audits. Your data is never shared with third parties without your explicit consent."
    },
    {
      question: "How accurate are the AI predictions?",
      answer: "Our AI models achieve 94% accuracy in delay prediction and sprint completion forecasting. The accuracy improves over time as the system learns from your team's patterns and historical data."
    },
    {
      question: "What support options are available?",
      answer: "We offer 24/7 customer support via chat, email, and phone. Premium plans include dedicated account managers and priority support. We also provide comprehensive documentation and video tutorials."
    },
    {
      question: "Can I try ScrumAI before purchasing?",
      answer: "Yes! We offer a 14-day free trial with full access to all features. No credit card required. You can also schedule a demo with our team to see ScrumAI in action."
    },
    {
      question: "How does pricing work for larger teams?",
      answer: "Our pricing scales with your team size. We offer volume discounts for teams over 50 members and custom enterprise plans for organizations with specific needs. Contact our sales team for a personalized quote."
    }
  ];

  const toggleFAQ = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section id="faq" className="py-20 bg-gradient-to-br from-background to-surface">
      <div className="max-w-4xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl font-bold text-textPrimary mb-4">
            Frequently Asked Questions
          </h2>
          <p className="text-xl text-textSecondary">
            Everything you need to know about ScrumAI
          </p>
        </motion.div>

        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="bg-white rounded-2xl shadow-lg overflow-hidden"
            >
              <button
                onClick={() => toggleFAQ(index)}
                className="w-full px-8 py-6 text-left flex justify-between items-center hover:bg-surface transition-colors"
              >
                <h3 className="text-lg font-semibold text-textPrimary pr-4">
                  {faq.question}
                </h3>
                <motion.div
                  animate={{ rotate: openIndex === index ? 180 : 0 }}
                  transition={{ duration: 0.3 }}
                  className="text-primary text-xl"
                >
                  ▼
                </motion.div>
              </button>
              
              <motion.div
                initial={false}
                animate={{
                  height: openIndex === index ? "auto" : 0,
                  opacity: openIndex === index ? 1 : 0
                }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                <div className="px-8 pb-6">
                  <p className="text-textSecondary leading-relaxed">
                    {faq.answer}
                  </p>
                </div>
              </motion.div>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="text-center mt-16"
        >
          <div className="bg-gradient-to-r from-primary/10 to-secondary/10 rounded-2xl p-8">
            <h3 className="text-2xl font-bold text-textPrimary mb-4">
              Still have questions?
            </h3>
            <p className="text-textSecondary mb-6">
              Our support team is here to help you get the most out of ScrumAI.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="bg-primary text-white px-6 py-3 rounded-xl font-semibold hover:bg-primaryDark transition-all">
                Contact Support
              </button>
              <button className="border border-primary text-primary px-6 py-3 rounded-xl font-semibold hover:bg-primary hover:text-white transition-all">
                Schedule Demo
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}