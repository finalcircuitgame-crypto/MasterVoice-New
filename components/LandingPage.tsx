import React, { useEffect, useState } from 'react';

interface LandingPageProps {
  onNavigate: (page: string) => void;
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

const TechBadge = ({ color, name }: { color: string; name: string }) => (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${color} bg-opacity-10 border border-opacity-20`}>
        {name}
    </span>
);

const SectionHeading = ({ title, subtitle }: { title: string; subtitle: string }) => (
    <div className="text-center mb-16 space-y-4">
        <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-white">{title}</h2>
        <p className="text-gray-400 max-w-2xl mx-auto text-lg">{subtitle}</p>
    </div>
);

const InteractiveChat = ({ mobile = false }: { mobile?: boolean }) => {
  const [messages, setMessages] = useState<{ id: number; text: string; isMe: boolean }[]>([
    { id: 1, text: "Hey! Did you see the new chat update?", isMe: false },
    { id: 2, text: "Yeah, the sync is instant now.", isMe: true },
  ]);
  
  useEffect(() => {
    const interval = setInterval(() => {
        setMessages(prev => {
            if (prev.length > 5) return [{ id: 1, text: "Hey! Did you see the new chat update?", isMe: false }];
            const newMsg = prev.length % 2 === 0 
                ? { id: Date.now(), text: "And voice calls are still P2P?", isMe: false }
                : { id: Date.now(), text: "Exactly. Best of both worlds.", isMe: true };
            return [...prev, newMsg];
        })
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className={`relative w-full ${mobile ? 'h-[350px]' : 'h-[500px]'} overflow-hidden`}>
       <div className={`glass-panel w-full h-full rounded-[2rem] p-4 flex flex-col bg-black/40 ${mobile ? 'border-none shadow-none' : 'border border-white/10 shadow-2xl'}`}>
           <div className="flex-1 space-y-3 overflow-hidden p-2">
               {messages.map((m) => (
                   <div key={m.id} className={`flex ${m.isMe ? 'justify-end' : 'justify-start'} animate-fade-in-up`}>
                       <div className={`max-w-[80%] px-4 py-2 rounded-2xl text-sm ${m.isMe ? 'bg-indigo-600 text-white' : 'bg-white/10 text-gray-200'}`}>
                           {m.text}
                       </div>
                   </div>
               ))}
           </div>
           <div className="mt-2 h-10 bg-white/5 rounded-full w-full flex items-center px-4">
               <div className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-pulse"></div>
           </div>
       </div>
    </div>
  );
};

// --- Desktop Landing Page ---
const DesktopLanding: React.FC<LandingPageProps> = ({ onNavigate }) => {
  return (
    <div className="min-h-screen bg-[#030014] text-white font-['Outfit'] overflow-x-hidden selection:bg-indigo-500">
      
      {/* --- Navbar --- */}
      <nav className="w-full fixed top-0 z-50 bg-[#030014]/80 backdrop-blur-md border-b border-white/5 h-20 flex items-center">
         <div className="w-full max-w-[1400px] mx-auto px-8 flex justify-between items-center">
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => onNavigate('/')}>
                <div className="w-10 h-10 bg-gradient-to-tr from-indigo-500 to-fuchsia-500 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                </div>
                <span className="text-xl font-bold tracking-tight">MasterVoice</span>
            </div>
            <div className="flex items-center gap-8">
                <button onClick={() => onNavigate('/login')} className="text-white hover:text-indigo-300 transition text-sm font-bold">LOG IN</button>
                <button onClick={() => onNavigate('/register')} className="px-6 py-2.5 bg-white text-black hover:bg-gray-100 rounded-lg font-bold text-sm transition transform hover:-translate-y-0.5 shadow-lg shadow-white/10">GET STARTED</button>
            </div>
         </div>
      </nav>

      {/* --- Section 1: Hero --- */}
      <div className="pt-32 pb-32 px-8 w-full max-w-[1400px] mx-auto flex items-center gap-20 relative">
          <div className="flex-1 space-y-8 animate-fade-in-up z-10">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-indigo-300 text-sm font-mono">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                  </span>
                  v2.0 Public Beta
              </div>
              <h1 className="text-7xl font-extrabold leading-[1.1] tracking-tight">
                  The future of <br/>
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-indigo-400">secure communication.</span>
              </h1>
              <p className="text-xl text-gray-400 max-w-2xl leading-relaxed">
                  Seamlessly sync text messages across devices while enjoying crystal-clear P2P voice calls. The best of both worlds.
              </p>
              <div className="flex gap-4 pt-4">
                  <button onClick={() => onNavigate('/register')} className="px-8 py-4 bg-indigo-600 hover:bg-indigo-500 rounded-2xl font-bold text-lg shadow-lg shadow-indigo-600/25 transition-all hover:scale-105">Start Chatting</button>
                  <button onClick={() => onNavigate('/login')} className="px-8 py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl font-bold text-lg transition-all">Log In</button>
              </div>
          </div>
          <div className="flex-1 relative h-[700px] flex items-center justify-center perspective-1000 z-10">
              <div className="relative w-[380px] h-[680px] bg-black rounded-[3rem] border-4 border-gray-800 shadow-2xl transform rotate-y-[-12deg] rotate-x-[5deg] hover:rotate-0 transition-transform duration-700 overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-full bg-[#0c0c0c] flex flex-col">
                      <div className="h-24 bg-gradient-to-b from-gray-900 to-transparent p-6 flex items-end">
                          <div className="w-full flex justify-between items-center">
                              <span className="font-bold text-lg">Alex</span>
                              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                          </div>
                      </div>
                      <div className="flex-1 p-4"><InteractiveChat /></div>
                  </div>
              </div>
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-600/20 blur-[120px] rounded-full pointer-events-none"></div>
          </div>
      </div>

      {/* --- Section 2: Features Bento Grid --- */}
      <div className="py-24 bg-[#050510]">
          <div className="max-w-[1400px] mx-auto px-8">
              <SectionHeading title="Complete Communication Suite" subtitle="More than just a walkie-talkie. A full-featured modern chat app." />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Large Card */}
                  <div className="md:col-span-2 bg-white/5 border border-white/5 rounded-3xl p-10 relative overflow-hidden group hover:bg-white/10 transition-colors">
                      <div className="relative z-10">
                          <h3 className="text-2xl font-bold mb-4">Hybrid Architecture</h3>
                          <p className="text-gray-400 max-w-md">We use encrypted cloud storage for your text history so you never miss a message, but switch to direct Peer-to-Peer connections for voice calls to ensure zero-latency privacy.</p>
                      </div>
                      <div className="absolute right-[-50px] top-10 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl group-hover:bg-indigo-500/30 transition-colors"></div>
                  </div>
                  {/* Tall Card */}
                  <div className="md:row-span-2 bg-gradient-to-b from-indigo-900/20 to-transparent border border-white/5 rounded-3xl p-10 flex flex-col justify-end group">
                      <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-indigo-600/30 group-hover:scale-110 transition-transform">
                          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                      </div>
                      <h3 className="text-2xl font-bold mb-4">Instant Messaging</h3>
                      <p className="text-gray-400">Send text, emojis, and updates instantly. Your chats are always ready when you are.</p>
                  </div>
                  {/* Small Card 1 */}
                  <div className="bg-white/5 border border-white/5 rounded-3xl p-8 hover:border-indigo-500/50 transition-colors">
                      <h3 className="text-xl font-bold mb-2">Cloud Sync</h3>
                      <p className="text-gray-400 text-sm">Access your message history from any device.</p>
                  </div>
                  {/* Small Card 2 */}
                  <div className="bg-white/5 border border-white/5 rounded-3xl p-8 hover:border-fuchsia-500/50 transition-colors">
                      <h3 className="text-xl font-bold mb-2">HD Voice</h3>
                      <p className="text-gray-400 text-sm">Switch to voice instantly with one tap.</p>
                  </div>
              </div>
          </div>
      </div>

      {/* --- Section 3: Technical Deep Dive --- */}
      <div className="py-32 relative overflow-hidden">
          <div className="absolute inset-0 bg-indigo-900/5 -skew-y-3 transform origin-left"></div>
          <div className="max-w-[1400px] mx-auto px-8 relative z-10">
              <div className="flex items-center gap-16">
                  <div className="flex-1">
                      <h2 className="text-4xl font-bold mb-6">Seamless Technology</h2>
                      <div className="space-y-8">
                          {[
                              { step: "01", title: "Real-time Database", desc: "Messages are delivered instantly via WebSocket and stored securely." },
                              { step: "02", title: "Smart Signaling", desc: "When you call, we upgrade the connection to P2P automatically." },
                              { step: "03", title: "Direct Stream", desc: "Audio flows directly between devices, bypassing the cloud entirely." }
                          ].map((item, i) => (
                              <div key={i} className="flex gap-6 group">
                                  <div className="text-5xl font-bold text-white/10 group-hover:text-indigo-500/50 transition-colors">{item.step}</div>
                                  <div>
                                      <h3 className="text-xl font-bold mb-2">{item.title}</h3>
                                      <p className="text-gray-400">{item.desc}</p>
                                  </div>
                              </div>
                          ))}
                      </div>
                  </div>
                  <div className="flex-1 h-[400px] bg-black/40 rounded-3xl border border-white/10 p-8 flex items-center justify-center relative">
                      {/* Diagram representation */}
                      <div className="absolute w-32 h-32 bg-blue-500 rounded-full blur-[80px] top-10 left-10 opacity-50"></div>
                      <div className="absolute w-32 h-32 bg-purple-500 rounded-full blur-[80px] bottom-10 right-10 opacity-50"></div>
                      <div className="flex justify-between w-full max-w-sm items-center relative z-10">
                           <div className="flex flex-col items-center gap-2">
                               <div className="w-16 h-16 bg-gray-800 rounded-full border-2 border-indigo-500 flex items-center justify-center"><span className="font-bold">A</span></div>
                               <span className="text-sm text-gray-400">User A</span>
                           </div>
                           <div className="flex-1 flex flex-col gap-2 mx-4">
                                <div className="h-1 bg-gray-700 w-full rounded-full relative">
                                     <div className="absolute inset-0 bg-indigo-500/50 w-1/2 animate-pulse"></div>
                                </div>
                                <div className="text-[10px] text-center text-gray-400">Secure Cloud Msg</div>
                                <div className="h-1 bg-gradient-to-r from-indigo-500 to-purple-500 w-full rounded-full"></div>
                                <div className="text-[10px] text-center text-gray-400">Direct P2P Voice</div>
                           </div>
                           <div className="flex flex-col items-center gap-2">
                               <div className="w-16 h-16 bg-gray-800 rounded-full border-2 border-purple-500 flex items-center justify-center"><span className="font-bold">B</span></div>
                               <span className="text-sm text-gray-400">User B</span>
                           </div>
                      </div>
                  </div>
              </div>
          </div>
      </div>

      {/* --- Section 4: Comparison --- */}
      <div className="py-24 bg-[#050510]">
          <div className="max-w-[1000px] mx-auto px-8">
              <SectionHeading title="The Modern Standard" subtitle="See why users are switching." />
              <div className="overflow-hidden rounded-3xl border border-white/10">
                  <table className="w-full text-left border-collapse">
                      <thead>
                          <tr className="bg-white/5">
                              <th className="p-6 text-sm font-bold text-gray-400 uppercase">Feature</th>
                              <th className="p-6 text-indigo-400 font-bold text-xl">MasterVoice</th>
                              <th className="p-6 text-gray-500 font-medium">Others</th>
                          </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                          <tr>
                              <td className="p-6 font-medium">Message History</td>
                              <td className="p-6 text-green-400">Secure Cloud Sync</td>
                              <td className="p-6 text-gray-400">Often Missing in P2P</td>
                          </tr>
                          <tr>
                              <td className="p-6 font-medium">Voice Privacy</td>
                              <td className="p-6 text-green-400">Direct P2P (No Logging)</td>
                              <td className="p-6 text-gray-400">Server Recorded</td>
                          </tr>
                          <tr>
                              <td className="p-6 font-medium">Audio Quality</td>
                              <td className="p-6">48kHz Opus</td>
                              <td className="p-6 text-gray-400">Compressed</td>
                          </tr>
                          <tr>
                              <td className="p-6 font-medium">Cost</td>
                              <td className="p-6">Free & Open Source</td>
                              <td className="p-6 text-gray-400">Data Selling / Ads</td>
                          </tr>
                      </tbody>
                  </table>
              </div>
          </div>
      </div>

      {/* --- Section 5: FAQ --- */}
      <div className="py-24">
           <div className="max-w-[800px] mx-auto px-8">
               <SectionHeading title="Frequently Asked Questions" subtitle="Everything you need to know." />
               <div className="space-y-4">
                   {[
                       { q: "Is this just for voice calls?", a: "No! MasterVoice is a fully featured chat application. You can send text messages to your friends anytime, and they will receive them instantly or when they come online." },
                       { q: "Is it really free?", a: "Yes. The core P2P technology is extremely cost-effective, allowing us to offer the service for free." },
                       { q: "Can I use it on mobile?", a: "Absolutely. MasterVoice works in any modern mobile browser (Chrome, Safari, Firefox) without installing an app." },
                       { q: "What is Supabase used for?", a: "We use Supabase for secure authentication and to store your chat history so you can access it from any device." }
                   ].map((faq, i) => (
                       <details key={i} className="group bg-white/5 rounded-2xl border border-white/5 open:bg-white/10 transition-colors">
                           <summary className="p-6 font-bold cursor-pointer flex justify-between items-center list-none select-none">
                               {faq.q}
                               <span className="transform group-open:rotate-180 transition-transform">▼</span>
                           </summary>
                           <div className="px-6 pb-6 text-gray-400 leading-relaxed">
                               {faq.a}
                           </div>
                       </details>
                   ))}
               </div>
           </div>
      </div>

      {/* --- Section 6: Footer CTA --- */}
      <div className="py-32 px-8 text-center bg-gradient-to-t from-indigo-900/40 to-transparent">
          <h2 className="text-5xl font-bold mb-8">Ready to connect?</h2>
          <button onClick={() => onNavigate('/register')} className="px-10 py-5 bg-white text-black text-xl font-bold rounded-full hover:scale-105 transition-transform shadow-[0_0_40px_rgba(255,255,255,0.3)]">
              Get Started for Free
          </button>
      </div>

      <div className="w-full border-t border-white/5 py-12 px-8 bg-black">
          <div className="flex justify-between items-center text-gray-600 text-sm">
              <p>&copy; 2025 MasterVoice Inc.</p>
              <div className="flex gap-6">
                  <button onClick={() => onNavigate('/privacy')} className="hover:text-white">Privacy</button>
                  <button onClick={() => onNavigate('/terms')} className="hover:text-white">Terms</button>
                  <button onClick={() => onNavigate('/contact')} className="hover:text-white">Contact</button>
              </div>
          </div>
      </div>
    </div>
  );
};

// --- Mobile Landing Page ---
const MobileLanding: React.FC<LandingPageProps> = ({ onNavigate }) => {
  return (
    <div className="min-h-screen bg-[#050505] text-white font-['Outfit'] overflow-hidden relative pb-20">
        
        {/* --- Header --- */}
        <div className="flex justify-between items-center p-6 sticky top-0 z-50 bg-[#050505]/80 backdrop-blur-md">
            <div className="font-bold text-xl tracking-tighter flex items-center gap-2">
                <div className="w-6 h-6 bg-indigo-600 rounded-lg"></div>
                MasterVoice
            </div>
            <button onClick={() => onNavigate('/login')} className="text-sm font-semibold text-gray-300 px-4 py-2 bg-white/5 rounded-full">Log In</button>
        </div>

        {/* --- Section 1: Hero --- */}
        <div className="px-6 pt-6 pb-12 flex flex-col relative z-10 border-b border-white/5">
            <div className="mb-8 animate-fade-in-up">
                <h1 className="text-5xl font-bold leading-none mb-4 tracking-tighter">
                    Chat <br/> <span className="text-indigo-500">Freely.</span> <br/>
                    Speak <span className="text-purple-500">Safely.</span>
                </h1>
                <p className="text-gray-400 text-lg leading-snug">
                    The ultimate secure chat and voice app for the web. No downloads required.
                </p>
            </div>
            <div className="w-full aspect-[4/5] bg-gray-900/50 rounded-3xl border border-white/10 relative overflow-hidden mb-8 animate-float shadow-2xl">
                <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/10 to-purple-500/10"></div>
                <div className="p-6 h-full flex flex-col justify-end">
                    <InteractiveChat mobile={true} />
                </div>
            </div>
            <button onClick={() => onNavigate('/register')} className="w-full py-4 bg-white text-black rounded-2xl font-bold text-lg shadow-xl active:scale-95 transition-transform">
                Get Started
            </button>
        </div>

        {/* --- Section 2: Features Cards --- */}
        <div className="px-6 py-16 space-y-6">
            <h2 className="text-3xl font-bold mb-8">Why MasterVoice?</h2>
            
            <div className="p-8 rounded-3xl bg-indigo-600 text-white relative overflow-hidden">
                <div className="relative z-10">
                    <h3 className="text-2xl font-bold mb-2">Instant Chat</h3>
                    <p className="opacity-80">Message your friends instantly with a familiar, modern interface.</p>
                </div>
                <div className="absolute -right-5 -bottom-5 text-9xl opacity-10 rotate-12">💬</div>
            </div>

            <div className="p-8 rounded-3xl bg-[#111] border border-white/10">
                <h3 className="text-2xl font-bold mb-2 text-indigo-400">Private Voice</h3>
                <p className="text-gray-400">Direct P2P voice calls that no server can record.</p>
            </div>

            <div className="p-8 rounded-3xl bg-[#111] border border-white/10">
                <h3 className="text-2xl font-bold mb-2 text-purple-400">Always Free</h3>
                <p className="text-gray-400">Open source and community driven. No premium paywalls.</p>
            </div>
        </div>

        {/* --- Section 3: How it Works Stepper --- */}
        <div className="px-6 py-16 bg-[#0a0a0a]">
            <h2 className="text-3xl font-bold mb-10">How it works</h2>
            <div className="space-y-0 pl-4 border-l-2 border-white/10">
                {[
                    { t: "Create Account", d: "Sign up instantly with just an email." },
                    { t: "Start Chatting", d: "Send text messages to any user on the platform." },
                    { t: "Call P2P", d: "One tap upgrades you to a secure voice call." }
                ].map((step, i) => (
                    <div key={i} className="relative pl-8 pb-10 last:pb-0">
                        <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-indigo-500 border-4 border-black"></div>
                        <h4 className="text-xl font-bold">{step.t}</h4>
                        <p className="text-gray-500 mt-1">{step.d}</p>
                    </div>
                ))}
            </div>
        </div>

        {/* --- Section 4: FAQ Mobile --- */}
        <div className="px-6 py-16">
            <h2 className="text-3xl font-bold mb-8">FAQ</h2>
            <div className="space-y-4">
                <div className="bg-white/5 p-6 rounded-2xl">
                    <h4 className="font-bold mb-2">Is it secure?</h4>
                    <p className="text-sm text-gray-400">Yes. Chats are secure and voice is encrypted P2P.</p>
                </div>
                <div className="bg-white/5 p-6 rounded-2xl">
                    <h4 className="font-bold mb-2">Do I need an app?</h4>
                    <p className="text-sm text-gray-400">No. It works right in your browser on iOS and Android.</p>
                </div>
            </div>
        </div>

        {/* --- Section 5: Mobile Footer --- */}
        <div className="px-6 pt-10 pb-20 text-center border-t border-white/5">
             <button onClick={() => onNavigate('/register')} className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold text-lg mb-8 shadow-lg shadow-indigo-600/30">
                Join Now
            </button>
            <div className="grid grid-cols-3 gap-2 text-center text-xs text-gray-500">
                <span onClick={() => onNavigate('/privacy')}>Privacy Policy</span>
                <span onClick={() => onNavigate('/terms')}>Terms of Service</span>
                <span onClick={() => onNavigate('/contact')}>Contact Support</span>
            </div>
            <p className="text-gray-700 text-[10px] mt-8">&copy; 2025 MasterVoice Inc.</p>
        </div>
    </div>
  );
};

export const LandingPage: React.FC<LandingPageProps> = (props) => {
  const [width] = useWindowSize();
  const isMobile = width < 768; // Tailwind md breakpoint

  return isMobile ? <MobileLanding {...props} /> : <DesktopLanding {...props} />;
};