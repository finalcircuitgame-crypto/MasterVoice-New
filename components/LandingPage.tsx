import React, { useEffect, useState } from 'react';

interface LandingPageProps {
  onGetStarted: () => void;
  onLogin: () => void;
}

const MockChat = () => {
  const [messages, setMessages] = useState<{ id: number; text: string; isMe: boolean }[]>([
    { id: 1, text: "Hey! Have you tried MasterVoice yet?", isMe: false },
  ]);

  useEffect(() => {
    const sequence = [
      { id: 2, text: "Just signed up. The P2P audio is crystal clear!", isMe: true, delay: 1500 },
      { id: 3, text: "I know right? No servers, just pure speed.", isMe: false, delay: 3500 },
      { id: 4, text: "Let's hop on a call 📞", isMe: true, delay: 5500 },
    ];

    let timeouts: NodeJS.Timeout[] = [];

    sequence.forEach((msg) => {
      const timeout = setTimeout(() => {
        setMessages((prev) => [...prev, { id: msg.id, text: msg.text, isMe: msg.isMe }]);
      }, msg.delay);
      timeouts.push(timeout);
    });

    return () => timeouts.forEach(clearTimeout);
  }, []);

  return (
    <div className="relative w-full max-w-sm mx-auto perspective-1000">
      <div className="glass-panel rounded-3xl p-4 transform rotate-y-[-10deg] rotate-x-[5deg] transition-transform duration-500 hover:rotate-0 shadow-2xl border border-white/10 animate-float-delayed">
        
        {/* Mock Header */}
        <div className="flex items-center space-x-3 mb-6 border-b border-white/5 pb-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-green-400 to-emerald-600 flex items-center justify-center text-xs font-bold">
            A
          </div>
          <div>
            <div className="text-sm font-bold">Alex (Online)</div>
            <div className="text-[10px] text-green-400">Connected via WebRTC</div>
          </div>
        </div>

        {/* Mock Messages */}
        <div className="space-y-3 font-sans text-sm h-[200px] overflow-hidden">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.isMe ? 'justify-end' : 'justify-start'} animate-fade-in-up`}>
              <div
                className={`max-w-[80%] px-4 py-2 rounded-2xl ${
                  msg.isMe
                    ? 'bg-indigo-600 text-white rounded-br-none'
                    : 'bg-white/10 text-gray-200 rounded-bl-none'
                }`}
              >
                {msg.text}
              </div>
            </div>
          ))}
          {messages.length === 1 && (
             <div className="flex items-center space-x-1 ml-2 mt-2">
                <div className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce"></div>
                <div className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                <div className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
             </div>
          )}
        </div>

        {/* Mock Input */}
        <div className="mt-4 pt-3 border-t border-white/5 flex space-x-2">
            <div className="h-8 bg-white/5 rounded-full flex-1"></div>
            <div className="h-8 w-8 bg-indigo-600 rounded-full"></div>
        </div>
      </div>
      
      {/* Decorative blobs behind phone */}
      <div className="absolute -z-10 top-[-20%] right-[-20%] w-40 h-40 bg-fuchsia-500/30 rounded-full blur-[50px] animate-pulse-glow"></div>
      <div className="absolute -z-10 bottom-[-10%] left-[-10%] w-40 h-40 bg-indigo-500/30 rounded-full blur-[50px] animate-pulse-glow" style={{animationDelay: '1.5s'}}></div>
    </div>
  );
};

export const LandingPage: React.FC<LandingPageProps> = ({ onGetStarted, onLogin }) => {
  return (
    <div className="min-h-screen bg-[#030014] text-white overflow-hidden relative selection:bg-indigo-500 selection:text-white font-['Outfit']">
      
      {/* Global Background Effects */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[20%] w-[50vw] h-[50vw] bg-indigo-600/20 rounded-full blur-[120px] animate-pulse-glow" />
        <div className="absolute bottom-[-10%] right-[10%] w-[40vw] h-[40vw] bg-fuchsia-600/20 rounded-full blur-[120px] animate-pulse-glow" style={{ animationDelay: '2s' }} />
        {/* Noise Texture */}
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
        {/* Grid Line Overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:100px_100px] [mask-image:radial-gradient(ellipse_at_center,black,transparent_70%)]"></div>
      </div>

      {/* Navbar */}
      <nav className="relative z-50 container mx-auto px-6 py-6 flex justify-between items-center">
        <div className="flex items-center space-x-3 cursor-pointer group">
          <div className="relative w-10 h-10 flex items-center justify-center">
             <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500 to-fuchsia-500 rounded-xl rotate-6 group-hover:rotate-12 transition-transform opacity-80 blur-[2px]"></div>
             <div className="relative w-full h-full bg-black/50 backdrop-blur-md border border-white/10 rounded-xl flex items-center justify-center shadow-lg">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                </svg>
             </div>
          </div>
          <span className="text-xl font-bold tracking-tight text-white group-hover:text-indigo-300 transition-colors">
            MasterVoice
          </span>
        </div>
        <div className="flex items-center space-x-6">
          <button 
            onClick={onLogin}
            className="hidden md:block text-sm font-semibold text-gray-300 hover:text-white transition-colors tracking-wide"
          >
            LOG IN
          </button>
          <button 
            onClick={onGetStarted}
            className="px-6 py-2.5 bg-white text-black hover:bg-gray-100 rounded-full font-bold text-sm transition shadow-[0_0_20px_-5px_rgba(255,255,255,0.4)] hover:shadow-[0_0_25px_-5px_rgba(255,255,255,0.6)] transform hover:-translate-y-0.5"
          >
            GET STARTED
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="relative z-10 container mx-auto px-6 pt-16 md:pt-24 pb-32">
        <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
            
            {/* Left Content */}
            <div className="flex-1 text-center lg:text-left animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
                <div className="inline-flex items-center px-4 py-1.5 rounded-full border border-indigo-500/30 bg-indigo-500/10 text-indigo-300 text-xs font-bold uppercase tracking-widest mb-8 backdrop-blur-md shadow-lg shadow-indigo-900/20">
                    <span className="w-2 h-2 rounded-full bg-indigo-400 mr-2 animate-pulse"></span>
                    Live Preview v2.0
                </div>
                
                <h1 className="text-5xl md:text-7xl lg:text-8xl font-extrabold mb-8 tracking-tighter leading-[1.1] text-white">
                  Talk freely.<br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-indigo-400 animate-gradient-x bg-[length:200%_auto]">
                    Securely. Instantly.
                  </span>
                </h1>
                
                <p className="text-lg md:text-xl text-gray-400 mb-10 max-w-2xl mx-auto lg:mx-0 font-light leading-relaxed">
                  Experience the next generation of communication. Peer-to-peer encrypted voice and messaging, powered by Supabase and WebRTC. No middlemen, no limits.
                </p>
                
                <div className="flex flex-col sm:flex-row justify-center lg:justify-start items-center space-y-4 sm:space-y-0 sm:space-x-4">
                  <button 
                      onClick={onGetStarted}
                      className="w-full sm:w-auto px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-bold text-lg transition-all duration-300 shadow-lg shadow-indigo-600/30 hover:shadow-indigo-600/50 hover:-translate-y-1 flex items-center justify-center"
                  >
                      Launch App
                      <svg className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                  </button>
                  <button 
                      onClick={() => window.open('https://github.com', '_blank')}
                      className="w-full sm:w-auto px-8 py-4 glass-button text-white rounded-2xl font-bold text-lg transition hover:bg-white/10 flex items-center justify-center hover:-translate-y-1"
                  >
                      <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
                      GitHub
                  </button>
                </div>
            </div>

            {/* Right Graphic - 3D Mockup */}
            <div className="flex-1 w-full max-w-md lg:max-w-full flex justify-center lg:justify-end animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
                <MockChat />
            </div>
        </div>

        {/* Feature Grid */}
        <div className="mt-32 grid grid-cols-1 md:grid-cols-3 gap-8 w-full animate-fade-in-up" style={{ animationDelay: '0.6s' }}>
            {[
                {
                    title: "Realtime Sync",
                    desc: "Instant message delivery across all devices using Supabase Realtime.",
                    icon: (
                        <svg className="w-6 h-6 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                    ),
                    color: "bg-indigo-500/20",
                    border: "hover:border-indigo-500/50"
                },
                {
                    title: "Secure Signaling",
                    desc: "Encrypted WebSocket channels establish your P2P connections securely.",
                    icon: (
                        <svg className="w-6 h-6 text-fuchsia-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                    ),
                    color: "bg-fuchsia-500/20",
                    border: "hover:border-fuchsia-500/50"
                },
                {
                    title: "P2P Voice",
                    desc: "High-quality WebRTC audio streaming directly between peers.",
                    icon: (
                        <svg className="w-6 h-6 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
                    ),
                    color: "bg-cyan-500/20",
                    border: "hover:border-cyan-500/50"
                }
            ].map((feature, idx) => (
                <div key={idx} className={`glass-panel p-8 rounded-3xl border border-white/5 ${feature.border} transition duration-300 group hover:-translate-y-1`}>
                    <div className={`w-14 h-14 ${feature.color} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                        {feature.icon}
                    </div>
                    <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                    <p className="text-gray-400 text-sm leading-relaxed">
                        {feature.desc}
                    </p>
                </div>
            ))}
        </div>
      </main>

      <footer className="border-t border-white/5 py-8 mt-20 relative z-10 bg-black/40 backdrop-blur-md">
          <div className="container mx-auto px-6 flex flex-col md:flex-row justify-between items-center text-xs text-gray-500 gap-4">
             <p>© 2024 MasterVoice Inc. All rights reserved.</p>
             <div className="flex space-x-6">
                <a href="#" className="hover:text-white transition">Privacy Policy</a>
                <a href="#" className="hover:text-white transition">Terms of Service</a>
                <a href="#" className="hover:text-white transition">Contact</a>
             </div>
          </div>
      </footer>
    </div>
  );
};
