import React from "react";

export default function Footer() {
  return (
    <footer className="bg-nightBlueShadow text-textMuted py-10 text-center border-t border-sandTan/30">
      <div className="flex justify-center gap-8 mb-4 flex-wrap">
        <a href="#" className="hover:text-sandTan transition-colors">
          About
        </a>
        <a href="#" className="hover:text-sandTan transition-colors">
          Terms
        </a>
        <a href="#" className="hover:text-sandTan transition-colors">
          Privacy
        </a>
        <a href="#" className="hover:text-sandTan transition-colors">
          Support
        </a>
        <a href="#" className="hover:text-sandTan transition-colors">
          GitHub
        </a>
      </div>
      <p className="text-sm opacity-70">
        © 2025 ScrumAI — All Rights Reserved.
      </p>
    </footer>
  );
}
