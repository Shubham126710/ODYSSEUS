import { CompassLogo } from "@/components/CompassLogo";
import { InteractiveCompass } from "@/components/InteractiveCompass";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col font-sans bg-background text-foreground transition-colors duration-300">
      {/* Header */}
      <header className="w-full py-6 px-8 flex justify-between items-center z-50">
        <div className="flex items-center gap-3">
          <CompassLogo className="w-8 h-8 text-foreground" />
          <span className="font-serif text-2xl font-bold tracking-wide">Odysseus</span>
        </div>
        <nav className="hidden md:flex gap-8 text-sm font-medium text-gray-800/80">
          <a href="#" className="hover:text-foreground transition-colors">Stories</a>
          <a href="#" className="hover:text-foreground transition-colors">Manifesto</a>
          <a href="#" className="hover:text-foreground transition-colors">Login</a>
        </nav>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 text-center relative py-20">
        
        {/* Dynamic Background Elements (Subtle) */}
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-white/20 rounded-full blur-3xl -z-10 translate-x-1/3 -translate-y-1/3 animate-[float_10s_ease-in-out_infinite]" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-teal/20 rounded-full blur-3xl -z-10 -translate-x-1/3 translate-y-1/3 animate-[float_12s_ease-in-out_infinite_reverse]" />
        
        {/* New Subtle Elements */}
        <div className="absolute top-1/4 left-10 w-32 h-32 bg-indigo-faded/20 rounded-full blur-2xl -z-10 animate-[pulse_6s_ease-in-out_infinite]" />
        <div className="absolute bottom-1/4 right-10 w-40 h-40 bg-salmon/20 rounded-full blur-2xl -z-10 animate-[float_8s_ease-in-out_infinite]" />

        <div className="max-w-4xl mx-auto space-y-8 z-10 flex flex-col items-center relative">
          
          {/* Interactive Compass - Smaller and Above Title */}
          <div className="mb-2 relative z-20">
             <InteractiveCompass className="w-32 h-32 md:w-40 md:h-40 text-foreground/80" />
          </div>

          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/40 backdrop-blur-md border border-white/30 text-xs font-medium text-gray-800 mb-4 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-teal animate-pulse" />
            Now in Beta
          </div>
          
          <h1 className="font-serif text-6xl md:text-8xl font-bold text-foreground leading-tight drop-shadow-sm">
            Odysseus: Journey through <br />
            <span className="italic text-gray-900">stories</span>
          </h1>
          
          <p className="text-lg md:text-xl text-gray-800 max-w-2xl mx-auto leading-relaxed font-medium">
            Sail the sea of information with a compass built for curiosity. 
            Odysseus brings you perspectives that matter, without the noise.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-8">
            <button className="px-8 py-4 bg-foreground text-white rounded-full font-medium hover:bg-gray-800 transition-all transform hover:scale-105 shadow-lg cursor-pointer">
              Start Exploring
            </button>
            <button className="px-8 py-4 bg-white/60 backdrop-blur-sm text-foreground border border-white/40 rounded-full font-medium hover:bg-white/80 transition-all cursor-pointer shadow-sm">
              Read the Manifesto
            </button>
          </div>
        </div>
      </main>

      {/* Feature Grid (Brief) */}
      <section className="py-24 px-8 bg-white/20 backdrop-blur-md border-t border-white/10">
        <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-12">
          <div className="space-y-4 p-6 rounded-2xl bg-white/30 border border-white/20 shadow-sm hover:shadow-md transition-all">
            <div className="w-12 h-12 bg-salmon/20 rounded-full flex items-center justify-center mb-4 text-salmon">
              <CompassLogo className="w-6 h-6" />
            </div>
            <h3 className="font-serif text-2xl font-bold text-gray-900">Curated Paths</h3>
            <p className="text-gray-700 leading-relaxed">
              Move beyond the feed. Follow narrative threads that weave through different sources and viewpoints.
            </p>
          </div>
          <div className="space-y-4 p-6 rounded-2xl bg-white/30 border border-white/20 shadow-sm hover:shadow-md transition-all">
            <div className="w-12 h-12 bg-indigo-faded/40 rounded-full flex items-center justify-center mb-4 text-indigo-600">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="font-serif text-2xl font-bold text-gray-900">Diverse Horizons</h3>
            <p className="text-gray-700 leading-relaxed">
              Break the echo chamber. Discover stories from across the globe and across the political spectrum.
            </p>
          </div>
          <div className="space-y-4 p-6 rounded-2xl bg-white/30 border border-white/20 shadow-sm hover:shadow-md transition-all">
            <div className="w-12 h-12 bg-teal/30 rounded-full flex items-center justify-center mb-4 text-teal-800">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
              </svg>
            </div>
            <h3 className="font-serif text-2xl font-bold text-gray-900">Calm Waters</h3>
            <p className="text-gray-700 leading-relaxed">
              Designed for focus, not addiction. No infinite scroll, no red badges, just pure reading.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 text-center text-gray-600 text-sm bg-white/20">
        <p>© 2025 Odysseus. Chart your own course.</p>
      </footer>
    </div>
  );
}
