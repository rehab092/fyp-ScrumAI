import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

export default function Pricing() {
  const [billingCycle, setBillingCycle] = useState("monthly");

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const pricingPlans = [
    {
      name: "Free",
      price: { monthly: 0, yearly: 0 },
      description: "Perfect for small teams getting started",
      features: [
        "Up to 5 team members",
        "Basic sprint planning",
        "Simple task management",
        "Basic reporting",
        "Email support",
        "1 project"
      ],
      limitations: [
        "Limited AI features",
        "Basic analytics only"
      ],
      popular: false,
      cta: "Get Started Free",
      ctaStyle: "border border-primary text-primary hover:bg-primary hover:text-white"
    },
    {
      name: "Pro",
      price: { monthly: 29, yearly: 290 },
      description: "Ideal for growing agile teams",
      features: [
        "Up to 25 team members",
        "AI-powered sprint planning",
        "Advanced task allocation",
        "Dependency mapping",
        "Predictive analytics",
        "Priority support",
        "Unlimited projects",
        "Custom integrations",
        "Advanced reporting",
        "Team collaboration tools"
      ],
      limitations: [],
      popular: true,
      cta: "Start Free Trial",
      ctaStyle: "bg-primary text-white hover:bg-primaryDark"
    },
    {
      name: "Enterprise",
      price: { monthly: 99, yearly: 990 },
      description: "For large organizations with complex needs",
      features: [
        "Unlimited team members",
        "Full AI suite",
        "Custom AI models",
        "Advanced security",
        "SSO integration",
        "Dedicated account manager",
        "Custom training",
        "API access",
        "White-label options",
        "24/7 phone support",
        "Custom workflows",
        "Advanced analytics"
      ],
      limitations: [],
      popular: false,
      cta: "Contact Sales",
      ctaStyle: "border border-primary text-primary hover:bg-primary hover:text-white"
    }
  ];

  return (
    <>
      <Navbar />
      <main className="pt-20 bg-background text-textPrimary">
        {/* Hero Section */}
        <section className="max-w-7xl mx-auto py-20 px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-4xl md:text-5xl font-bold text-primary mb-6">
              Simple, Transparent Pricing
            </h1>
            <p className="text-xl text-textSecondary max-w-3xl mx-auto mb-12">
              Choose the perfect plan for your team. Start free, scale as you grow.
            </p>

            {/* Billing Toggle */}
            <div className="flex items-center justify-center gap-4 mb-16">
              <span className={`text-lg font-medium ${billingCycle === 'monthly' ? 'text-textPrimary' : 'text-textMuted'}`}>
                Monthly
              </span>
              <button
                onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'yearly' : 'monthly')}
                className={`relative w-16 h-8 rounded-full transition-colors ${
                  billingCycle === 'yearly' ? 'bg-primary' : 'bg-textMuted'
                }`}
              >
                <div
                  className={`absolute top-1 w-6 h-6 bg-background rounded-full transition-transform ${
                    billingCycle === 'yearly' ? 'translate-x-9' : 'translate-x-1'
                  }`}
                />
              </button>
              <span className={`text-lg font-medium ${billingCycle === 'yearly' ? 'text-textPrimary' : 'text-textMuted'}`}>
                Yearly
              </span>
              {billingCycle === 'yearly' && (
                <span className="bg-success/20 text-success px-3 py-1 rounded-full text-sm font-medium">
                  Save 17%
                </span>
              )}
            </div>
          </motion.div>
        </section>

        {/* Pricing Cards */}
        <section className="max-w-7xl mx-auto px-6 pb-20">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {pricingPlans.map((plan, index) => (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
                className={`relative bg-white border border-border rounded-3xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 ${
                  plan.popular ? 'ring-2 ring-primary scale-105' : ''
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-primary text-white px-6 py-2 rounded-full text-sm font-semibold">
                      Most Popular
                    </span>
                  </div>
                )}

                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold text-textPrimary mb-2">{plan.name}</h3>
                  <p className="text-textSecondary mb-6">{plan.description}</p>
                  
                  <div className="mb-6">
                    <span className="text-5xl font-bold text-primary">
                      ${plan.price[billingCycle]}
                    </span>
                    <span className="text-textMuted ml-2">
                      /{billingCycle === 'monthly' ? 'month' : 'year'}
                    </span>
                  </div>

                  <button
                    className={`w-full py-3 px-6 rounded-xl font-semibold transition-all ${plan.ctaStyle}`}
                  >
                    {plan.cta}
                  </button>
                </div>

                <div className="space-y-4">
                  <h4 className="font-semibold text-textPrimary mb-4">What's included:</h4>
                  <ul className="space-y-3">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-start gap-3">
                        <span className="text-success text-lg">✓</span>
                        <span className="text-textSecondary">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  
                  {plan.limitations.length > 0 && (
                    <div className="mt-6 pt-6 border-t border-border">
                      <h5 className="font-medium text-textMuted mb-3">Limitations:</h5>
                      <ul className="space-y-2">
                        {plan.limitations.map((limitation, limitIndex) => (
                          <li key={limitIndex} className="flex items-start gap-3">
                            <span className="text-textMuted text-sm">•</span>
                            <span className="text-textMuted text-sm">{limitation}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Features Comparison */}
        <section className="bg-surface py-20">
          <div className="max-w-7xl mx-auto px-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-center mb-16"
            >
              <h2 className="text-3xl font-bold text-textPrimary mb-4">
                Compare All Features
              </h2>
              <p className="text-textSecondary max-w-2xl mx-auto">
                See exactly what's included in each plan to make the best choice for your team.
              </p>
            </motion.div>

            <div className="bg-white border border-border rounded-2xl overflow-hidden shadow-lg">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-surface">
                    <tr>
                      <th className="text-left py-4 px-6 text-textPrimary font-semibold">Features</th>
                      <th className="text-center py-4 px-6 text-textPrimary font-semibold">Free</th>
                      <th className="text-center py-4 px-6 text-textPrimary font-semibold">Pro</th>
                      <th className="text-center py-4 px-6 text-textPrimary font-semibold">Enterprise</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { feature: "Team Members", free: "5", pro: "25", enterprise: "Unlimited" },
                      { feature: "Projects", free: "1", pro: "Unlimited", enterprise: "Unlimited" },
                      { feature: "AI Sprint Planning", free: "Basic", pro: "Advanced", enterprise: "Full Suite" },
                      { feature: "Dependency Mapping", free: "❌", pro: "✓", enterprise: "✓" },
                      { feature: "Predictive Analytics", free: "❌", pro: "✓", enterprise: "✓" },
                      { feature: "Custom Integrations", free: "❌", pro: "✓", enterprise: "✓" },
                      { feature: "API Access", free: "❌", pro: "Basic", enterprise: "Full" },
                      { feature: "Support", free: "Email", pro: "Priority", enterprise: "24/7 Phone" },
                      { feature: "SSO Integration", free: "❌", pro: "❌", enterprise: "✓" },
                      { feature: "White-label", free: "❌", pro: "❌", enterprise: "✓" }
                    ].map((row, index) => (
                      <tr key={index} className="border-t border-border">
                        <td className="py-4 px-6 text-textPrimary font-medium">{row.feature}</td>
                        <td className="py-4 px-6 text-center text-textSecondary">{row.free}</td>
                        <td className="py-4 px-6 text-center text-textSecondary">{row.pro}</td>
                        <td className="py-4 px-6 text-center text-textSecondary">{row.enterprise}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="bg-gradient-to-r from-primary/10 to-secondary/10 py-20">
          <div className="max-w-4xl mx-auto text-center px-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <h2 className="text-3xl font-bold text-textPrimary mb-4">
                Ready to Transform Your Agile Workflow?
              </h2>
              <p className="text-xl text-textSecondary mb-8">
                Join thousands of teams already using ScrumAI to boost their productivity.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button className="bg-primary text-white px-8 py-3 rounded-xl font-semibold hover:bg-primaryDark transition-all shadow-lg">
                  Start Free Trial
                </button>
                <button className="border border-primary text-primary px-8 py-3 rounded-xl font-semibold hover:bg-primary hover:text-white transition-all">
                  Contact Sales
                </button>
              </div>
            </motion.div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}


