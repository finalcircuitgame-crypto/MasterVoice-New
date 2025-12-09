import React from 'react';

interface LandingPageProps {
  onGetStarted: () => void;
  onLogin: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onGetStarted, onLogin }) => {
  return (
    <div className="min-h-screen bg-[#030014] text-white overflow-hidden relative selection:bg-indigo-500 selection:text-white font-['Outfit']">
      
      {/* Background Effects */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[20%] w-[50vw] h-[50vw] bg-indigo-600/20 rounded-full blur-[100px] animate-pulse-glow" />
        <div className="absolute bottom-[-10%] right-[10%] w-[40vw] h-[40vw] bg-fuchsia-600/20 rounded-full blur-[100px] animate-pulse-glow" style={{ animationDelay: '2s' }} />
        {/* Noise Texture */}
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
      </div>

      {/* Navbar */}
      <nav className="relative z-50 container mx-auto px-6 py-6 flex justify-between items-center">
        <div className="flex items-center space-x-3 cursor-pointer group">
          <div className="relative w-10 h-10 flex items-center justify-center">
             <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500 to-fuchsia-500 rounded-xl rotate-6 group-hover:rotate-12 transition-transform opacity-80 blur-[2px]"></div>
             <div className="relative w-full h-full bg-black/50 backdrop-blur-md border border-white/10 rounded-xl flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                </svg>
             </div>
          </div>
          <span className="text-xl font-bold tracking-tight text-white group-hover:text-indigo-300 transition-colors">
            MasterVoice
          </span>
        </div>
        <div className="flex items-center space-x-8">
          <button 
            onClick={onLogin}
            className="hidden md:block text-sm font-semibold text-gray-300 hover:text-white transition-colors tracking-wide"
          >
            LOG IN
          </button>
          <button 
            onClick={onGetStarted}
            className="px-6 py-2 bg-white text-black hover:bg-gray-200 rounded-lg font-bold text-sm transition shadow-[0_0_20px_-5px_rgba(255,255,255,0.3)]"
          >
            GET STARTED
          </button>
        </div>
      </nav>

      {/* Hero */}
      <main className="relative z-10 container mx-auto px-6 pt-24 pb-32 flex flex-col items-center text-center">
        <div className="max-w-5xl mx-auto animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            <div className="inline-flex items-center px-3 py-1 rounded-full border border-indigo-500/30 bg-indigo-500/10 text-indigo-300 text-xs font-bold uppercase tracking-widest mb-8 backdrop-blur-md">
                <span className="w-2 h-2 rounded-full bg-indigo-400 mr-2 animate-pulse"></span>
                Live Preview v2.0
            </div>
            
            <h1 className="text-6xl md:text-8xl font-extrabold mb-8 tracking-tighter leading-[1] text-white">
              Talk freely.<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-fuchsia-400 to-indigo-400 animate-gradient-x">
                Securely. Instantly.
              </span>
            </h1>
            
            <p className="text-lg md:text-xl text-gray-400 mb-12 max-w-2xl mx-auto font-light leading-relaxed">
              The open-source communication platform powered by Supabase and WebRTC. No middlemen, just pure peer-to-peer connection.
            </p>
            
            <div className="flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-4">
              <button 
                  onClick={onGetStarted}
                  className="w-full sm:w-auto px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-lg transition shadow-lg shadow-indigo-600/25 flex items-center justify-center"
              >
                  Launch App
                  <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
              </button>
              <button 
                  onClick={() => window.open('https://github.com', '_blank')}
                  className="w-full sm:w-auto px-8 py-4 glass-button text-white rounded-xl font-bold text-lg transition hover:bg-white/5 flex items-center justify-center"
              >
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
                  GitHub
              </button>
            </div>
        </div>

        {/* Dynamic Cards Grid */}
        <div className="mt-24 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-6xl animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
            
            {/* Card 1 */}
            <div className="glass-panel p-8 rounded-3xl border border-white/5 hover:border-indigo-500/50 transition duration-300 group">
                <div className="w-12 h-12 bg-indigo-500/20 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                    <svg className="w-6 h-6 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                </div>
                <h3 className="text-xl font-bold mb-2">Realtime Sync</h3>
                <p className="text-gray-400 text-sm leading-relaxed">
                    Powered by Supabase's PostgreSQL database. Messages sync instantly across all devices.
                </p>
            </div>

             {/* Card 2 */}
             <div className="glass-panel p-8 rounded-3xl border border-white/5 hover:border-fuchsia-500/50 transition duration-300 group">
                <div className="w-12 h-12 bg-fuchsia-500/20 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                    <svg className="w-6 h-6 text-fuchsia-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                </div>
                <h3 className="text-xl font-bold mb-2">Secure Signaling</h3>
                <p className="text-gray-400 text-sm leading-relaxed">
                    WebRTC signaling handshake happens over encrypted WebSocket channels.
                </p>
            </div>

             {/* Card 3 */}
             <div className="glass-panel p-8 rounded-3xl border border-white/5 hover:border-cyan-500/50 transition duration-300 group md:col-span-2 lg:col-span-1">
                <div className="w-12 h-12 bg-cyan-500/20 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                    <svg className="w-6 h-6 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </div>
                <h3 className="text-xl font-bold mb-2">P2P Architecture</h3>
                <p className="text-gray-400 text-sm leading-relaxed">
                    Traffic goes directly between clients. Low latency, high privacy, zero server storage of voice data.
                </p>
            </div>
        </div>
      </main>

      <footer className="border-t border-white/5 py-8 mt-20 relative z-10 bg-black/40 backdrop-blur-md">
          <div className="container mx-auto px-6 flex justify-between items-center text-xs text-gray-500">
             <p>© 2024 MasterVoice Inc.</p>
             <div className="flex space-x-6">
                <a href="#" className="hover:text-white transition">Privacy</a>
                <a href="#" className="hover:text-white transition">Terms</a>
             </div>
          </div>
      </footer>
    </div>
  );
};