import React, { useEffect, useState, useRef } from 'react';

interface LandingPageProps {
  onGetStarted: () => void;
  onLogin: () => void;
}

// --- Interactive Mock Chat Component ---
const InteractiveChat = () => {
  const [messages, setMessages] = useState<{ id: number; text: string; isMe: boolean }[]>([
    { id: 1, text: "Hey! Welcome to MasterVoice. 👋", isMe: false },
    { id: 2, text: "This demo is live. Try typing something below!", isMe: false },
  ]);
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const newMsg = { id: Date.now(), text: inputText, isMe: true };
    setMessages(prev => [...prev, newMsg]);
    setInputText("");
    setIsTyping(true);

    // Simulate generic AI/Peer reply
    setTimeout(() => {
      const replies = [
        "That's the power of WebRTC! 🚀",
        "Zero latency, crystal clear audio.",
        "Secure by default. No middlemen.",
        "I can hear you loud and clear!",
        "Supabase makes this realtime magic happen."
      ];
      const randomReply = replies[Math.floor(Math.random() * replies.length)];
      
      setMessages(prev => [...prev, { id: Date.now() + 1, text: randomReply, isMe: false }]);
      setIsTyping(false);
    }, 1500);
  };

  return (
    <div className="relative w-full max-w-sm mx-auto perspective-1000 group">
      <div className="glass-panel rounded-[2.5rem] p-4 transform transition-all duration-700 md:rotate-y-[-12deg] md:rotate-x-[5deg] md:group-hover:rotate-0 shadow-2xl border border-white/10 h-[600px] flex flex-col bg-black/40">
        
        {/* Notch/Header */}
        <div className="flex items-center space-x-3 mb-4 px-2 pt-2 border-b border-white/5 pb-4">
          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-green-400 to-emerald-600 flex items-center justify-center text-sm font-bold shadow-lg shadow-green-500/20">
            A
          </div>
          <div>
            <div className="text-sm font-bold text-white">Alex</div>
            <div className="flex items-center space-x-1.5">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                </span>
                <span className="text-[10px] text-green-400 font-medium tracking-wide">Encrypted P2P</span>
            </div>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto space-y-4 px-2 pr-1 custom-scrollbar scroll-smooth">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.isMe ? 'justify-end' : 'justify-start'} animate-fade-in-up`}>
              <div
                className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed shadow-sm ${
                  msg.isMe
                    ? 'bg-indigo-600 text-white rounded-br-none'
                    : 'bg-white/10 text-gray-200 rounded-bl-none border border-white/5'
                }`}
              >
                {msg.text}
              </div>
            </div>
          ))}
          {isTyping && (
             <div className="flex items-center space-x-1 ml-2 mt-2 bg-white/5 w-12 h-8 rounded-full rounded-bl-none justify-center">
                <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
             </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <form onSubmit={handleSend} className="mt-4 pt-3 border-t border-white/5 flex space-x-2 relative z-20">
            <input 
                type="text" 
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 bg-white/5 border border-white/10 rounded-full px-4 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:bg-white/10 focus:border-indigo-500/50 transition-all"
            />
            <button 
                type="submit"
                className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center text-white hover:bg-indigo-500 transition shadow-lg shadow-indigo-600/20"
            >
                <svg className="w-4 h-4 ml-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M12 5l7 7-7 7" /></svg>
            </button>
        </form>
      </div>
      
      {/* Decorative blobs behind phone */}
      <div className="absolute -z-10 top-[10%] right-[-10%] w-64 h-64 bg-fuchsia-500/20 rounded-full blur-[80px] animate-pulse-glow"></div>
      <div className="absolute -z-10 bottom-[10%] left-[-20%] w-64 h-64 bg-indigo-500/20 rounded-full blur-[80px] animate-pulse-glow" style={{animationDelay: '1.5s'}}></div>
    </div>
  );
};

export const LandingPage: React.FC<LandingPageProps> = ({ onGetStarted, onLogin }) => {
  return (
    <div className="min-h-screen bg-[#030014] text-white overflow-hidden relative selection:bg-indigo-500 selection:text-white font-['Outfit']">
      
      {/* Global Background Effects */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[20%] w-[50vw] h-[50vw] bg-indigo-600/10 rounded-full blur-[120px] animate-pulse-glow" />
        <div className="absolute bottom-[-10%] right-[10%] w-[40vw] h-[40vw] bg-fuchsia-600/10 rounded-full blur-[120px] animate-pulse-glow" style={{ animationDelay: '2s' }} />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:60px_60px] [mask-image:radial-gradient(ellipse_at_center,black,transparent_80%)]"></div>
      </div>

      {/* Navbar */}
      <nav className="relative z-50 container mx-auto px-6 py-6 flex justify-between items-center backdrop-blur-sm sticky top-0 bg-[#030014]/50 border-b border-white/5">
        <div className="flex items-center space-x-3 cursor-pointer group">
          <div className="relative w-10 h-10 flex items-center justify-center">
             <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500 to-fuchsia-500 rounded-xl rotate-6 group-hover:rotate-12 transition-transform opacity-80 blur-[2px]"></div>
             <div className="relative w-full h-full bg-black/80 backdrop-blur-md border border-white/10 rounded-xl flex items-center justify-center shadow-lg">
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
      <main className="relative z-10 container mx-auto px-6 pt-16 md:pt-24 pb-20">
        <div className="flex flex-col lg:flex-row items-center gap-16 lg:gap-24">
            
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
                      className="w-full sm:w-auto px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-bold text-lg transition-all duration-300 shadow-lg shadow-indigo-600/30 hover:shadow-indigo-600/50 hover:-translate-y-1 flex items-center justify-center group"
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

            {/* Right Graphic - Interactive Mockup */}
            <div className="flex-1 w-full max-w-md lg:max-w-full flex justify-center lg:justify-end animate-fade-in-up relative" style={{ animationDelay: '0.4s' }}>
                <InteractiveChat />
                {/* Floating Labels */}
                <div className="absolute top-10 -right-4 bg-white/10 backdrop-blur-md border border-white/20 p-3 rounded-xl shadow-xl animate-float hidden lg:block">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                    <span className="text-xs font-mono">Status: Connected</span>
                  </div>
                </div>
                <div className="absolute bottom-20 -left-10 bg-white/10 backdrop-blur-md border border-white/20 p-3 rounded-xl shadow-xl animate-float-delayed hidden lg:block">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono">Latency: 24ms</span>
                  </div>
                </div>
            </div>
        </div>
      </main>

      {/* Tech Stack Strip */}
      <div className="relative z-10 border-y border-white/5 bg-black/30 backdrop-blur-sm py-10 overflow-hidden">
        <div className="container mx-auto px-6">
          <p className="text-center text-sm text-gray-500 uppercase tracking-widest mb-6">Powered by modern infrastructure</p>
          <div className="flex flex-wrap justify-center gap-8 md:gap-16 items-center opacity-50 grayscale hover:grayscale-0 transition-all duration-500">
             {/* Simple text representations for demo, replace with SVGs in prod */}
             <span className="text-xl font-bold flex items-center gap-2"><div className="w-6 h-6 bg-green-500 rounded-md"></div>Supabase</span>
             <span className="text-xl font-bold flex items-center gap-2"><div className="w-6 h-6 bg-blue-500 rounded-full"></div>WebRTC</span>
             <span className="text-xl font-bold flex items-center gap-2"><div className="w-6 h-6 bg-cyan-400 rounded-lg"></div>React 19</span>
             <span className="text-xl font-bold flex items-center gap-2"><div className="w-6 h-6 bg-sky-500 rounded-sm"></div>Tailwind</span>
          </div>
        </div>
      </div>

      {/* Deep Dive Section 1 */}
      <section className="relative z-10 container mx-auto px-6 py-24 md:py-32">
        <div className="flex flex-col md:flex-row items-center gap-16">
          <div className="flex-1 order-2 md:order-1">
             <div className="w-full aspect-square max-w-md mx-auto relative group">
                <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/20 to-purple-500/20 rounded-full blur-3xl group-hover:blur-[100px] transition-all duration-700"></div>
                <div className="relative h-full w-full glass-panel rounded-3xl border border-white/10 flex items-center justify-center p-8 overflow-hidden">
                   {/* Abstract representation of encryption */}
                   <div className="grid grid-cols-2 gap-4 w-full h-full opacity-50">
                      {[...Array(4)].map((_, i) => (
                        <div key={i} className="bg-white/5 rounded-2xl animate-pulse" style={{animationDelay: `${i * 0.5}s`}}></div>
                      ))}
                   </div>
                   <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-24 h-24 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl shadow-2xl flex items-center justify-center">
                        <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                      </div>
                   </div>
                </div>
             </div>
          </div>
          <div className="flex-1 order-1 md:order-2">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">End-to-End Privacy</h2>
            <p className="text-gray-400 text-lg leading-relaxed mb-8">
              We don't store your voice calls. In fact, we <span className="text-white font-semibold">can't</span>. 
              MasterVoice connects you directly to your peer using ephemeral WebRTC channels. 
              Your data flows from your device to theirs, skipping our servers entirely.
            </p>
            <ul className="space-y-4">
              {["No call recording", "Direct P2P Audio Streaming", "Ephemeral signaling data"].map((item, i) => (
                <li key={i} className="flex items-center text-gray-300">
                  <svg className="w-5 h-5 text-green-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Feature Grid */}
      <section className="relative z-10 bg-white/5 border-y border-white/5 py-24">
        <div className="container mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-6">Everything you need to connect</h2>
            <p className="text-gray-400">Built for developers and privacy enthusiasts who demand quality and speed.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
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
                    title: "HD Voice",
                    desc: "High-fidelity Opus codec audio streaming at low latency.",
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
        </div>
      </section>

      {/* Testimonials */}
      <section className="relative z-10 container mx-auto px-6 py-24">
        <h2 className="text-3xl font-bold text-center mb-16">Trusted by developers</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            { q: "Finally, a voice app that doesn't track me.", u: "Sarah J.", r: "Security Researcher" },
            { q: "The audio quality beats standard cellular calls.", u: "David K.", r: "Remote Worker" },
            { q: "Integration with Supabase is seamless.", u: "Elena R.", r: "Frontend Dev" }
          ].map((t, i) => (
            <div key={i} className="glass-panel p-6 rounded-2xl hover:bg-white/5 transition border border-white/5">
               <div className="flex text-yellow-500 mb-4">★★★★★</div>
               <p className="text-gray-300 mb-6">"{t.q}"</p>
               <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-700 to-gray-600"></div>
                  <div>
                    <div className="text-sm font-bold text-white">{t.u}</div>
                    <div className="text-xs text-gray-500">{t.r}</div>
                  </div>
               </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 container mx-auto px-6 pb-24">
         <div className="glass-panel rounded-3xl p-12 md:p-20 text-center relative overflow-hidden border border-indigo-500/30">
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-indigo-900/40 to-fuchsia-900/40 z-0"></div>
            <div className="relative z-10">
               <h2 className="text-4xl md:text-5xl font-bold mb-6">Ready to talk?</h2>
               <p className="text-xl text-gray-300 mb-10 max-w-xl mx-auto">Join thousands of users experiencing the future of secure communication today.</p>
               <button 
                onClick={onGetStarted}
                className="px-10 py-5 bg-white text-black hover:bg-gray-200 rounded-full font-bold text-lg transition shadow-2xl hover:scale-105"
               >
                Get Started for Free
               </button>
            </div>
         </div>
      </section>

      <footer className="border-t border-white/5 py-12 relative z-10 bg-black/40 backdrop-blur-md">
          <div className="container mx-auto px-6 flex flex-col md:flex-row justify-between items-center text-xs text-gray-500 gap-4">
             <div className="flex items-center gap-2 mb-4 md:mb-0">
               <span className="text-white font-bold text-lg">MasterVoice</span>
               <span>© 2024</span>
             </div>
             <div className="flex space-x-8">
                <a href="#" className="hover:text-white transition">Privacy Policy</a>
                <a href="#" className="hover:text-white transition">Terms of Service</a>
                <a href="#" className="hover:text-white transition">Contact Support</a>
                <a href="#" className="hover:text-white transition">Twitter</a>
             </div>
          </div>
      </footer>
    </div>
  );
};