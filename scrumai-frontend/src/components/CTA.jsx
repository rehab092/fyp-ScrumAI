import React from "react";
import { useNavigate } from "react-router-dom";

export default function CTA() {
  const navigate = useNavigate();

  return (
    <section className="bg-gradient-to-r from-primary/10 to-secondary/10 text-textPrimary text-center py-20">
      <div className="max-w-4xl mx-auto px-6">
        <h2 className="text-4xl font-bold mb-6">
          Experience Agile, Reimagined.
        </h2>
        <p className="text-xl text-textSecondary mb-8">
          Join 500+ teams planning smarter with ScrumAI.
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-6">
          <button 
            onClick={() => navigate('/workspace/register')}
            className="bg-primary text-background px-8 py-3 rounded-xl font-semibold hover:bg-primaryDark hover:scale-105 transition-all"
          >
            Create Your Workspace
          </button>
          <button 
            onClick={() => navigate('/pricing')}
            className="border border-primary text-primary px-8 py-3 rounded-xl font-semibold hover:bg-primary hover:text-background transition-all"
          >
            View Pricing
          </button>
        </div>
        <p className="mt-6 text-sm text-textMuted">
          No credit card required • 14-day free trial • Cancel anytime
        </p>
      </div>
    </section>
  );
}
