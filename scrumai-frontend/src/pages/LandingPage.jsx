import React from "react";
import Navbar from "../components/Navbar";
import Hero from "../components/Hero";
import Features from "../components/Features";
import About from "../components/About";
import SocialProof from "../components/SocialProof";
import CTA from "../components/CTA";
import Footer from "../components/Footer";

export default function LandingPage() {
  return (
    <>
      <Navbar />
      <main className="pt-20">
        <Hero />
        <Features />
        <About />
        <SocialProof />
        <CTA />
      </main>
      <Footer />
    </>
  );
}
