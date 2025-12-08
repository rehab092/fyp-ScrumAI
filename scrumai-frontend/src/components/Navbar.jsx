import React from "react";
import { useNavigate } from "react-router-dom";

export default function Navbar() {
  const navigate = useNavigate();

  const scrollToSection = (sectionId) => {
    if (sectionId.startsWith('#')) {
      const element = document.querySelector(sectionId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    } else {
      navigate(sectionId);
    }
  };

  return (
    <nav className="fixed top-0 w-full bg-primaryDark/95 backdrop-blur-lg z-50 shadow-lg border-b border-primary">
      <div className="max-w-7xl mx-auto flex justify-between items-center px-4 md:px-6 py-4">
        <button 
          onClick={() => navigate('/')}
          className="text-2xl font-bold text-white tracking-wide hover:text-surfaceLight transition-colors"
        >
          ScrumAI
        </button>

        <ul className="hidden md:flex gap-6 lg:gap-8 text-white/90">
          <li onClick={() => navigate('/')} className="hover:text-white cursor-pointer transition-colors font-medium">Home</li>
          <li onClick={() => scrollToSection('#features')} className="hover:text-white cursor-pointer transition-colors font-medium">Features</li>
          <li onClick={() => scrollToSection('#about')} className="hover:text-white cursor-pointer transition-colors font-medium">About</li>
          <li onClick={() => navigate('/pricing')} className="hover:text-white cursor-pointer transition-colors font-medium">Pricing</li>
          <li onClick={() => navigate('/faq')} className="hover:text-white cursor-pointer transition-colors font-medium">FAQ</li>
        </ul>

        <div className="flex gap-2 md:gap-3">
          <button 
            onClick={() => navigate('/workspace/login')}
            className="border border-white/30 text-white px-3 md:px-4 py-2 rounded-lg hover:bg-white/10 hover:text-white transition-all text-sm md:text-base font-medium"
          >
            Login
          </button>
        </div>
      </div>
    </nav>
  );
}
