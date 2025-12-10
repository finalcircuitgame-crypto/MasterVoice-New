import React, { useEffect, useState, useRef } from 'react';

interface LandingPageProps {
  onNavigate: (page: string) => void;
  isAuthenticated: boolean;
}

// --- Hook to detect screen size for conditional rendering ---
function useWindowSize() {
  const [size, setSize] = useState([window.innerWidth, window.innerHeight]);
  useEffect(() => {
    const handleResize = () => setSize([window.innerWidth, window.innerHeight]);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  return size;
}

// --- Shared Components ---

const SectionHeading = ({ title, subtitle }: { title: string; subtitle: string }) => (
    <div className="text-center mb-16 space-y-4 animate-fade-in-up">
        <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-white">{title}</h2>
        <p className="text-gray-400 max-w-2xl mx-auto text-lg">{subtitle}</p>
    </div>
);

// Exporting so Pages.tsx can use it
export const PricingCard = ({ 
    title, 
    price, 
    features, 
    recommended = false,
    cta = "Get Started",
    onAction
}: { 
    title: string; 
    price: string; 
    features: string[]; 
    recommended?: boolean;
    cta?: string;
    onAction: () => void;
}) => (
  <div className={`p-8 rounded-[2rem] border flex flex-col h-full relative transition-all duration-500 hover:-translate-y-2 ${recommended ? 'bg-gradient-to-b from-indigo-900/40 to-[#050510] border-indigo-500/50 shadow-2xl shadow-indigo-500/20 z-10 scale-105' : 'bg-white/5 border-white/5 hover:border-white/20 hover:bg-white/10'}`}>
    {recommended && (
        <div className="absolute -top-5 left-1/2 -translate-x-1/2 px-6 py-2 bg-gradient-to-r from-indigo-500 to-fuchsia-500 rounded-full text-xs font-bold uppercase tracking-wider shadow-lg shadow-indigo-500/40 text-white animate-pulse-glow">
            Most Popular
        </div>
    )}
    <h3 className={`text-xl font-bold mb-2 ${recommended ? 'text-indigo-300' : 'text-gray-300'}`}>{title}</h3>
    <div className="flex items-baseline gap-1 mb-6">
        <span className="text-4xl font-bold text-white">{price}</span>
        {price !== 'Free' && <span className="text-lg text-gray-500 font-normal">/mo</span>}
    </div>
    <div className="h-px w-full bg-white/5 mb-8"></div>
    <ul className="space-y-4 flex-1 mb-8">
        {features.map((f, i) => (
            <li key={i} className="flex items-start gap-3 text-sm text-gray-300">
                <div className={`mt-0.5 w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${recommended ? 'bg-indigo-500/20 text-indigo-400' : 'bg-gray-800 text-gray-500'}`}>
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                </div>
                <span className="leading-tight">{f}</span>
            </li>
        ))}
    </ul>
    <button 
        onClick={onAction}
        className={`w-full py-4 rounded-xl font-bold transition-all active:scale-95 ${recommended ? 'bg-white text-black hover:bg-gray-200 shadow-lg shadow-white/10' : 'bg-white/5 hover:bg-white/10 text-white border border-white/5'}`}
    >
        {cta}
    </button>
  </div>
);

const CHAT_SCRIPT = [
    { id: 1, text: "Hey! Did you check out MasterVoice yet?", isMe: false },
    { id: 2, text: "Yeah, just signed up. The UI is sick! 🎨", isMe: true },
    { id: 3, text: "Right? And the voice quality is crystal clear.", isMe: false },
    { id: 4, text: "Is it really P2P? No server lag?", isMe: true },
    { id: 5, text: "Zero latency. Direct connection. 🚀", isMe: false },
    { id: 6, text: "That's a game changer for privacy.", isMe: true },
    { id: 7, text: "Exactly. No one listening in.", isMe: false },
    { id: 8, text: "I'm migrating the team over today.", isMe: true },
];

const InteractiveChat = ({ mobile = false }: { mobile?: boolean }) => {
  const [messages, setMessages] = useState<any[]>([CHAT_SCRIPT[0]]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let timeout: NodeJS.Timeout;

    const advanceChat = () => {
      setMessages((prev) => {
        if (prev.length < CHAT_SCRIPT.length) {
          // Add next message
          timeout = setTimeout(advanceChat, 2000 + Math.random() * 1000); // Random delay 2-3s
          return [...prev, CHAT_SCRIPT[prev.length]];
        } else {
          // Reset after long pause
          timeout = setTimeout(() => {
            setMessages([CHAT_SCRIPT[0]]);
            timeout = setTimeout(advanceChat, 2500);
          }, 8000); // Pause 8s at end before restart
          return prev;
        }
      });
    };

    timeout = setTimeout(advanceChat, 2500);

    return () => clearTimeout(timeout);
  }, []);

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
        scrollRef.current.scrollTo({
            top: scrollRef.current.scrollHeight,
            behavior: 'smooth'
        });
    }
  }, [messages]);

  return (
    <div className={`relative w-full ${mobile ? 'h-[400px]' : 'h-[500px]'} overflow-hidden`}>
       <div className={`glass-panel w-full h-full rounded-[2.5rem] p-4 flex flex-col bg-black/60 backdrop-blur-xl ${mobile ? 'border-none shadow-none' : 'border border-white/10 shadow-2xl'}`}>
           {/* Fake Header */}
           <div className="flex items-center gap-3 px-2 pb-4 border-b border-white/5 mb-2">
               <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-fuchsia-500 flex items-center justify-center text-xs font-bold shadow-lg">JS</div>
               <div className="flex flex-col">
                   <span className="text-sm font-bold text-white">Jane Smith</span>
                   <span className="text-[10px] text-green-400 font-medium flex items-center gap-1">
                       <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                       Online
                   </span>
               </div>
               <div className="ml-auto flex gap-2 text-gray-400">
                   <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
               </div>
           </div>

           <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto p-2 no-scrollbar">
               {messages.map((m) => (
                   <div key={m.id} className={`flex ${m.isMe ? 'justify-end' : 'justify-start'} animate-message-enter`}>
                       <div className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-sm shadow-md leading-relaxed ${
                           m.isMe 
                           ? 'bg-gradient-to-br from-indigo-600 to-violet-600 text-white rounded-br-sm' 
                           : 'bg-white/10 text-gray-200 border border-white/5 rounded-bl-sm'
                       }`}>
                           {m.text}
                       </div>
                   </div>
               ))}
               {messages.length < CHAT_SCRIPT.length && (
                   <div className="flex justify-start animate-fade-in-up">
                       <div className="bg-white/5 rounded-2xl rounded-bl-sm px-4 py-3 flex space-x-1 items-center border border-white/5">
                            <div className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-typing-bounce"></div>
                            <div className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-typing-bounce" style={{ animationDelay: '0.15s' }}></div>
                            <div className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-typing-bounce" style={{ animationDelay: '0.3s' }}></div>
                       </div>
                   </div>
               )}
           </div>

           {/* Fake Input */}
           <div className="mt-3 bg-white/5 rounded-full p-1.5 pr-2 flex items-center border border-white/5">
               <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-gray-400 mr-2">
                   <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
               </div>
               <div className="flex-1 h-2 bg-transparent">
                    {/* Placeholder line */}
               </div>
               <div className="p-2 bg-indigo-600 rounded-full text-white">
                   <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>
               </div>
           </div>
       </div>
    </div>
  );
};

// --- Desktop Landing Page ---
const DesktopLanding: React.FC<LandingPageProps> = ({ onNavigate, isAuthenticated }) => {
  return (
    <div className="min-h-screen bg-[#030014] text-white font-['Outfit'] overflow-x-hidden selection:bg-indigo-500 relative">
      
      {/* Navbar */}
      <nav className="w-full fixed top-0 z-50 bg-[#030014]/70 backdrop-blur-xl border-b border-white/5 h-20 flex items-center transition-all duration-300">
         <div className="w-full max-w-[1400px] mx-auto px-8 flex justify-between items-center">
            <div className="flex items-center gap-3 cursor-pointer group" onClick={() => onNavigate('/')}>
                <div className="w-10 h-10 bg-gradient-to-tr from-indigo-500 to-fuchsia-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20 group-hover:rotate-12 transition-transform duration-300">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                </div>
                <span className="text-xl font-bold tracking-tight group-hover:text-indigo-200 transition-colors">MasterVoice</span>
            </div>
            <div className="flex items-center gap-8">
                {isAuthenticated ? (
                  <button onClick={() => onNavigate('/conversations')} className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-bold text-sm transition transform hover:-translate-y-0.5 shadow-lg shadow-indigo-600/20">
                    OPEN APP
                  </button>
                ) : (
                  <>
                    <button onClick={() => onNavigate('/login')} className="text-gray-300 hover:text-white transition text-sm font-bold tracking-wide">LOG IN</button>
                    <button onClick={() => onNavigate('/register')} className="px-6 py-2.5 bg-white text-black hover:bg-gray-200 rounded-lg font-bold text-sm transition transform hover:-translate-y-0.5 shadow-lg shadow-white/10">GET STARTED</button>
                  </>
                )}
            </div>
         </div>
      </nav>

      {/* Hero Section */}
      <div className="pt-40 pb-32 px-8 w-full max-w-[1400px] mx-auto flex items-center gap-20 relative">
          <div className="flex-1 space-y-8 animate-fade-in-up z-10">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-indigo-300 text-sm font-mono backdrop-blur-md">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                  </span>
                  v2.0 Public Beta
              </div>
              <h1 className="text-7xl md:text-8xl font-extrabold leading-[1] tracking-tighter">
                  Speak <br/>
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-indigo-400 animate-gradient-x">Freely.</span>
              </h1>
              <p className="text-xl text-gray-400 max-w-2xl leading-relaxed font-light">
                  Seamlessly sync text messages across devices while enjoying crystal-clear P2P voice calls. <br/>
                  <span className="text-white font-medium">Zero logs. Zero latency. Total privacy.</span>
              </p>
              <div className="flex gap-4 pt-6">
                  {isAuthenticated ? (
                    <button onClick={() => onNavigate('/conversations')} className="px-10 py-4 bg-indigo-600 hover:bg-indigo-500 rounded-2xl font-bold text-lg shadow-xl shadow-indigo-600/25 transition-all hover:scale-105 active:scale-95 flex items-center gap-2">
                      Launch Web App <span className="text-xl">→</span>
                    </button>
                  ) : (
                    <>
                      <button onClick={() => onNavigate('/register')} className="px-10 py-4 bg-indigo-600 hover:bg-indigo-500 rounded-2xl font-bold text-lg shadow-xl shadow-indigo-600/25 transition-all hover:scale-105 active:scale-95">Start Chatting</button>
                      <button onClick={() => onNavigate('/login')} className="px-10 py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl font-bold text-lg transition-all hover:scale-105 active:scale-95 backdrop-blur-md">Log In</button>
                    </>
                  )}
              </div>
              
              <div className="flex items-center gap-6 pt-4 text-sm text-gray-500">
                  <div className="flex items-center gap-2">
                      <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                      No Credit Card
                  </div>
                  <div className="flex items-center gap-2">
                      <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                      Open Source
                  </div>
              </div>
          </div>
          
          {/* Hero Visual */}
          <div className="flex-1 relative h-[700px] flex items-center justify-center perspective-1000 z-10 hidden md:flex">
              <div className="relative w-[380px] h-[720px] bg-[#0c0c0c] rounded-[3.5rem] border-[8px] border-gray-800 shadow-2xl transform rotate-y-[-12deg] rotate-x-[5deg] hover:rotate-0 transition-transform duration-700 ease-out overflow-hidden shadow-indigo-500/20">
                  <div className="absolute top-0 left-0 w-full h-full bg-[#0c0c0c] flex flex-col">
                      {/* Notch */}
                      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-7 bg-black rounded-b-2xl z-20"></div>
                      
                      <div className="h-28 bg-gradient-to-b from-[#1a1a2e] to-[#0c0c0c] p-6 pt-12 flex items-end relative z-10 border-b border-white/5">
                          <div className="w-full flex justify-between items-center">
                              <span className="font-bold text-xl text-white">MasterVoice</span>
                              <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center">
                                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                              </div>
                          </div>
                      </div>
                      <div className="flex-1 relative bg-[#0c0c0c]">
                           <InteractiveChat mobile={true} />
                           {/* Gradient fade at bottom */}
                           <div className="absolute bottom-0 left-0 w-full h-24 bg-gradient-to-t from-[#0c0c0c] to-transparent pointer-events-none z-20"></div>
                      </div>
                      <div className="h-20 bg-[#0c0c0c] border-t border-white/5 flex items-center justify-around px-6 relative z-30">
                           <div className="w-6 h-6 text-indigo-500"><svg fill="currentColor" viewBox="0 0 20 20"><path d="M2 5a2 2 0 012-2h7a2 2 0 012 2v4a2 2 0 01-2 2H9l-3 3v-3H4a2 2 0 01-2-2V5z" /><path d="M15 7v2a4 4 0 01-4 4H9.828l-1.766 1.767c.28.149.599.233.938.233h2l3 3v-3h2a2 2 0 012-2V9a2 2 0 01-2-2h-1z" /></svg></div>
                           <div className="w-6 h-6 text-gray-600"><svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg></div>
                           <div className="w-6 h-6 text-gray-600"><svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg></div>
                      </div>
                  </div>
              </div>
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-600/20 blur-[130px] rounded-full pointer-events-none animate-pulse-glow"></div>
          </div>
      </div>

      {/* Trusted By Strip */}
      <div className="w-full border-y border-white/5 bg-white/[0.02] py-10">
          <div className="max-w-[1400px] mx-auto px-8 flex flex-col md:flex-row items-center justify-between gap-8 opacity-60 grayscale hover:grayscale-0 transition-all duration-500">
              <span className="text-sm font-bold tracking-widest uppercase text-gray-500">Trusted by teams at</span>
              <div className="flex gap-12 items-center flex-wrap justify-center">
                  {/* Fake Logos using simple text for demo */}
                  <span className="text-xl font-bold font-mono">ACME Corp</span>
                  <span className="text-xl font-bold italic">GlobalTech</span>
                  <span className="text-xl font-bold tracking-tighter">Nebula</span>
                  <span className="text-xl font-bold font-serif">Vertex</span>
                  <span className="text-xl font-bold">Starlight</span>
              </div>
          </div>
      </div>

      {/* Features Bento Grid */}
      <div className="py-32 bg-[#050510] relative overflow-hidden">
          <div className="max-w-[1400px] mx-auto px-8 relative z-10">
              <SectionHeading title="Complete Communication Suite" subtitle="More than just a walkie-talkie. A full-featured modern chat app." />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Large Card */}
                  <div className="md:col-span-2 bg-white/5 border border-white/5 rounded-[2.5rem] p-10 relative overflow-hidden group hover:bg-white/10 transition-colors duration-500">
                      <div className="relative z-10">
                          <h3 className="text-3xl font-bold mb-4">Hybrid Architecture</h3>
                          <p className="text-gray-300 max-w-lg text-lg leading-relaxed">We use encrypted cloud storage for your text history so you never miss a message, but switch to direct Peer-to-Peer connections for voice calls.</p>
                      </div>
                      <div className="absolute right-[-20%] bottom-[-50%] w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-3xl group-hover:bg-indigo-500/20 transition-colors duration-500"></div>
                  </div>
                  {/* Tall Card */}
                  <div className="md:row-span-2 bg-gradient-to-b from-[#0f0f1a] to-[#050510] border border-white/5 rounded-[2.5rem] p-10 flex flex-col justify-end group hover:border-indigo-500/30 transition-all duration-500">
                      <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center mb-auto shadow-lg shadow-indigo-600/30 group-hover:scale-110 transition-transform duration-300">
                          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                      </div>
                      <h3 className="text-2xl font-bold mb-4">Instant Messaging</h3>
                      <p className="text-gray-400 leading-relaxed">Send text, emojis, and updates instantly. Your chats are always ready when you are, with realtime typing indicators and read receipts.</p>
                  </div>
                  {/* Small Card 1 */}
                  <div className="bg-white/5 border border-white/5 rounded-[2.5rem] p-10 hover:border-indigo-500/50 transition-colors duration-300">
                      <h3 className="text-xl font-bold mb-3">Cloud Sync</h3>
                      <p className="text-gray-400">Access your message history from any device, anywhere.</p>
                  </div>
                  {/* Small Card 2 */}
                  <div className="bg-white/5 border border-white/5 rounded-[2.5rem] p-10 hover:border-fuchsia-500/50 transition-colors duration-300">
                      <h3 className="text-xl font-bold mb-3">HD Voice</h3>
                      <p className="text-gray-400">Switch to voice instantly with one tap. 48kHz Opus Audio.</p>
                  </div>
              </div>
          </div>
      </div>

      {/* Pricing */}
      <div className="py-32 relative">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-indigo-900/5 blur-3xl pointer-events-none"></div>
        <div className="max-w-[1200px] mx-auto px-8 relative z-10">
            <SectionHeading title="Simple Pricing" subtitle="Start for free, upgrade when you need more power." />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <PricingCard 
                    title="Personal"
                    price="Free"
                    features={["Unlimited Text Messages", "1-on-1 P2P Voice Calls", "30-Day Message History", "1 Active Device", "Community Support"]}
                    cta={isAuthenticated ? "Your Current Plan" : "Get Started Free"}
                    onAction={() => isAuthenticated ? onNavigate('/conversations') : onNavigate('/register')}
                />
                <PricingCard 
                    title="Pro"
                    price="$8"
                    recommended={true}
                    features={["Everything in Free", "Unlimited Message History", "Group Voice Calls (5 Users)", "HD Audio Quality", "3 Active Devices", "Priority Relay Servers"]}
                    cta="Start Pro Trial"
                    onAction={() => isAuthenticated ? onNavigate('/conversations?trial=true&plan=pro') : onNavigate('/register')}
                />
                <PricingCard 
                    title="Team"
                    price="$20"
                    features={["Everything in Pro", "Unlimited Group Size", "Admin Dashboard", "Team Analytics", "Custom Retention Policy", "24/7 Dedicated Support"]}
                    cta="Contact Sales"
                    onAction={() => onNavigate('/contact')}
                />
            </div>
        </div>
      </div>

      {/* Footer CTA */}
      <div className="py-32 px-8 text-center bg-gradient-to-t from-indigo-900/40 to-transparent">
          <h2 className="text-5xl md:text-6xl font-bold mb-8 tracking-tight">Ready to connect?</h2>
          <button onClick={() => isAuthenticated ? onNavigate('/conversations') : onNavigate('/register')} className="px-12 py-6 bg-white text-black text-xl font-bold rounded-full hover:scale-105 transition-transform shadow-[0_0_50px_rgba(255,255,255,0.3)]">
              {isAuthenticated ? "Launch App" : "Get Started for Free"}
          </button>
      </div>

      <div className="w-full border-t border-white/5 py-12 px-8 bg-black">
          <div className="max-w-[1400px] mx-auto flex flex-col md:flex-row justify-between items-center text-gray-600 text-sm gap-4">
              <p>&copy; 2025 MasterVoice Inc.</p>
              <div className="flex gap-8">
                  <button onClick={() => onNavigate('/privacy')} className="hover:text-white transition">Privacy</button>
                  <button onClick={() => onNavigate('/terms')} className="hover:text-white transition">Terms</button>
                  <button onClick={() => onNavigate('/contact')} className="hover:text-white transition">Contact</button>
                  <a href="#" className="hover:text-white transition">Twitter</a>
                  <a href="#" className="hover:text-white transition">GitHub</a>
              </div>
          </div>
      </div>
    </div>
  );
};

// --- Mobile Landing Page ---
const MobileLanding: React.FC<LandingPageProps> = ({ onNavigate, isAuthenticated }) => {
  return (
    <div className="min-h-screen bg-[#050505] text-white font-['Outfit'] overflow-hidden relative pb-20">
        
        {/* Header */}
        <div className="flex justify-between items-center p-6 sticky top-0 z-50 bg-[#050505]/80 backdrop-blur-md border-b border-white/5">
            <div className="font-bold text-xl tracking-tighter flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center shadow-lg">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                </div>
                MasterVoice
            </div>
            {isAuthenticated ? (
               <button onClick={() => onNavigate('/conversations')} className="text-xs font-bold text-white px-4 py-2 bg-indigo-600 rounded-full shadow-lg shadow-indigo-500/20">OPEN</button>
            ) : (
               <button onClick={() => onNavigate('/login')} className="text-xs font-bold text-gray-300 px-4 py-2 bg-white/5 rounded-full border border-white/10">LOG IN</button>
            )}
        </div>

        {/* Hero */}
        <div className="px-6 pt-8 pb-12 flex flex-col relative z-10 border-b border-white/5">
            <div className="mb-8 animate-fade-in-up">
                <h1 className="text-6xl font-bold leading-[0.9] mb-6 tracking-tighter">
                    Chat <br/> <span className="text-indigo-500">Freely.</span> <br/>
                    Speak <span className="text-purple-500">Safely.</span>
                </h1>
                <p className="text-gray-400 text-lg leading-snug font-light">
                    The ultimate secure chat and voice app for the web. No downloads required.
                </p>
            </div>
            <div className="w-full h-[450px] bg-gray-900/50 rounded-[2.5rem] border border-white/10 relative overflow-hidden mb-8 animate-float shadow-2xl">
                <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/10 to-purple-500/10"></div>
                <div className="p-4 h-full flex flex-col justify-end">
                    <InteractiveChat mobile={true} />
                </div>
            </div>
            <button onClick={() => isAuthenticated ? onNavigate('/conversations') : onNavigate('/register')} className="w-full py-5 bg-white text-black rounded-2xl font-bold text-lg shadow-xl active:scale-95 transition-transform">
                {isAuthenticated ? "Launch App" : "Get Started"}
            </button>
        </div>

        {/* Features */}
        <div className="px-6 py-16 space-y-6">
            <h2 className="text-3xl font-bold mb-8 tracking-tight">Why MasterVoice?</h2>
            
            <div className="p-8 rounded-[2rem] bg-indigo-600 text-white relative overflow-hidden shadow-lg shadow-indigo-900/50">
                <div className="relative z-10">
                    <h3 className="text-2xl font-bold mb-2">Instant Chat</h3>
                    <p className="opacity-90 leading-relaxed">Message your friends instantly with a familiar, modern interface.</p>
                </div>
                <div className="absolute -right-5 -bottom-5 text-9xl opacity-10 rotate-12">💬</div>
            </div>

            <div className="p-8 rounded-[2rem] bg-[#111] border border-white/10">
                <h3 className="text-2xl font-bold mb-2 text-indigo-400">Private Voice</h3>
                <p className="text-gray-400 leading-relaxed">Direct P2P voice calls that no server can record. Crystal clear audio.</p>
            </div>

            <div className="p-8 rounded-[2rem] bg-[#111] border border-white/10">
                <h3 className="text-2xl font-bold mb-2 text-purple-400">Always Free</h3>
                <p className="text-gray-400 leading-relaxed">Open source and community driven. No premium paywalls for core features.</p>
            </div>
        </div>

        {/* Pricing */}
        <div className="px-6 py-16 bg-[#0a0a0a]">
            <h2 className="text-3xl font-bold mb-10 tracking-tight">Simple Pricing</h2>
            <div className="space-y-6">
                 <PricingCard 
                    title="Personal"
                    price="Free"
                    features={["Unlimited Chats", "P2P Voice", "30-Day History"]}
                    cta={isAuthenticated ? "Current Plan" : "Sign Up Free"}
                    onAction={() => isAuthenticated ? onNavigate('/conversations') : onNavigate('/register')}
                />
                <PricingCard 
                    title="Pro"
                    price="$8"
                    recommended={true}
                    features={["Unlimited History", "Group Calls", "HD Audio"]}
                    cta="Try Pro"
                    onAction={() => isAuthenticated ? onNavigate('/conversations?trial=true&plan=pro') : onNavigate('/register')}
                />
            </div>
        </div>

        {/* Footer */}
        <div className="px-6 pt-10 pb-20 text-center border-t border-white/5 bg-black">
             <button onClick={() => isAuthenticated ? onNavigate('/conversations') : onNavigate('/register')} className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-bold text-lg mb-10 shadow-lg shadow-indigo-600/30">
                {isAuthenticated ? "Launch App" : "Join Now"}
            </button>
            <div className="flex flex-wrap justify-center gap-6 text-xs text-gray-500 font-medium uppercase tracking-wide">
                <span onClick={() => onNavigate('/privacy')}>Privacy</span>
                <span onClick={() => onNavigate('/terms')}>Terms</span>
                <span onClick={() => onNavigate('/contact')}>Support</span>
            </div>
            <p className="text-gray-800 text-[10px] mt-8">&copy; 2025 MasterVoice Inc.</p>
        </div>
    </div>
  );
};

export const LandingPage: React.FC<LandingPageProps> = (props) => {
  const [width] = useWindowSize();
  const isMobile = width < 768;

  return isMobile ? <MobileLanding {...props} /> : <DesktopLanding {...props} />;
};