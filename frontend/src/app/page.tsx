import { Navbar } from "@/components/landing/navbar";
import { Hero } from "@/components/landing/hero";
import { BentoGrid } from "@/components/landing/bento-grid";
import { Pricing } from "@/components/landing/pricing";
import { LearningEngine } from "@/components/landing/learning-engine";

export default function Home() {
  return (
    <div className="min-h-screen bg-black text-white selection:bg-indigo-500/30 selection:text-white">
      <Navbar />
      <main>
        <Hero />
        <BentoGrid />
        <LearningEngine />
        <Pricing />
      </main>

      {/* Footer */}
      <footer className="py-8 text-center text-slate-600 text-sm border-t border-white/5 bg-black">
        <p>&copy; {new Date().getFullYear()} Orbit. All rights reserved.</p>
        <p className="mt-2 text-xs">System Status: <span className="text-green-500">Operational</span></p>
      </footer>
    </div>
  );
}
