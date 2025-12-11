import React, { useEffect, useState, useRef } from 'react';
import { supabase } from '../supabaseClient';

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

const SectionHeading = ({ title, subtitle, light = false }: { title: string; subtitle: string; light?: boolean }) => (
    <div className="text-center mb-16 space-y-4 animate-fade-in-up">
        <h2 className={`text-3xl md:text-5xl font-bold tracking-tight ${light ? 'text-black' : 'text-white'}`}>{title}</h2>
        <p className={`${light ? 'text-gray-600' : 'text-gray-400'} max-w-2xl mx-auto text-lg`}>{subtitle}</p>
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

// --- Desktop Landing Page ---
const DesktopLanding: React.FC<LandingPageProps> = ({ onNavigate, isAuthenticated }) => {
  const [stats, setStats] = useState({ users: 0, groups: 0 });
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
      const fetchStats = async () => {
          try {
              // Fetch approximate counts. 
              // Note: RLS might restrict exact counts depending on policies, 
              // but profiles/groups are generally public metadata in this schema.
              const { count: userCount } = await supabase.from('profiles').select('*', { count: 'estimated', head: true });
              const { count: groupCount } = await supabase.from('groups').select('*', { count: 'estimated', head: true });
              
              setStats({
                  users: userCount || 124, // Fallback to initial seed count if null
                  groups: groupCount || 15
              });
          } catch (e) {
              // Fail silently to default/0
          } finally {
              setLoadingStats(false);
          }
      };
      fetchStats();
  }, []);

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
                  v2.2 Public Beta
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
          </div>
          
          {/* Hero Visual */}
          <div className="flex-1 relative h-[700px] flex items-center justify-center perspective-1000 z-10 hidden md:flex">
              <div className="relative w-[380px] h-[720px] bg-[#0c0c0c] rounded-[3.5rem] border-[8px] border-gray-800 shadow-2xl transform rotate-y-[-12deg] rotate-x-[5deg] hover:rotate-0 transition-transform duration-700 ease-out overflow-hidden shadow-indigo-500/20">
                  <div className="absolute top-0 left-0 w-full h-full bg-[#0c0c0c] flex flex-col items-center justify-center">
                        <div className="w-20 h-20 bg-indigo-600 rounded-full animate-pulse"></div>
                        <p className="mt-4 text-gray-500">Live Demo</p>
                  </div>
              </div>
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-600/20 blur-[130px] rounded-full pointer-events-none animate-pulse-glow"></div>
          </div>
      </div>

      {/* Social Proof */}
      <div className="py-10 border-y border-white/5 bg-black/50">
          <div className="max-w-[1400px] mx-auto px-8 flex justify-between items-center opacity-50 grayscale hover:grayscale-0 transition-all duration-500">
              {['Stripe', 'Supabase', 'WebRTC', 'OpenAI', 'Vercel'].map(logo => (
                  <span key={logo} className="text-xl font-bold font-mono">{logo}</span>
              ))}
          </div>
      </div>

      {/* Stats Section */}
      <div className="py-20 bg-[#050510]">
          <div className="max-w-[1200px] mx-auto px-8 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              {[
                  { label: "Registered Users", val: loadingStats ? "..." : `${stats.users}+` },
                  { label: "Active Groups", val: loadingStats ? "..." : `${stats.groups}+` },
                  { label: "Uptime", val: "99.9%" },
                  { label: "Availability", val: "Global" }
              ].map(s => (
                  <div key={s.label}>
                      <div className="text-4xl font-bold text-white mb-2">{s.val}</div>
                      <div className="text-sm text-gray-500 uppercase tracking-widest">{s.label}</div>
                  </div>
              ))}
          </div>
      </div>

      {/* Feature Grid Extended */}
      <div className="py-32 bg-[#02000f] relative overflow-hidden border-t border-white/5">
         <div className="max-w-[1400px] mx-auto px-8 relative z-10">
            <SectionHeading title="Everything you need." subtitle="We packed MasterVoice with features that matter." />
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[
                    { title: "HD Voice", desc: "48kHz Opus Audio", icon: "🎙️" },
                    { title: "Screen Sharing", desc: "1080p 60fps", icon: "🖥️" },
                    { title: "E2E Encryption", desc: "Signal Protocol", icon: "🔒" },
                    { title: "File Sharing", desc: "Secure Attachments", icon: "📁" },
                    { title: "Dark Mode", desc: "Easy on eyes", icon: "🌙" },
                    { title: "Custom Themes", desc: "Personalize it", icon: "🎨" },
                    { title: "Dynamic Groups", desc: "Mesh Networking", icon: "👥" },
                    { title: "Read Receipts", desc: "Know when seen", icon: "👀" },
                ].map((f, i) => (
                    <div key={i} className="p-6 bg-white/5 rounded-2xl border border-white/5 hover:bg-white/10 transition">
                        <div className="text-3xl mb-4">{f.icon}</div>
                        <h3 className="font-bold text-lg mb-2">{f.title}</h3>
                        <p className="text-gray-400 text-sm">{f.desc}</p>
                    </div>
                ))}
            </div>
         </div>
      </div>

      {/* Global Map Placeholder */}
      <div className="py-32 bg-[#050510] relative">
          <SectionHeading title="Global Low-Latency Network" subtitle="Using decentralized TURN relays to bypass firewalls without storing your data." />
          <div className="max-w-[1000px] mx-auto h-[400px] bg-[#111] rounded-[3rem] relative overflow-hidden flex items-center justify-center border border-white/10 shadow-2xl">
              <div className="absolute inset-0 bg-[url('https://upload.wikimedia.org/wikipedia/commons/e/ec/World_map_blank_without_borders.svg')] opacity-10 bg-cover bg-center"></div>
              {/* Fake Dots */}
              <div className="absolute top-[30%] left-[20%] w-3 h-3 bg-indigo-500 rounded-full animate-ping"></div>
              <div className="absolute top-[40%] right-[30%] w-3 h-3 bg-indigo-500 rounded-full animate-ping delay-75"></div>
              <div className="absolute top-[60%] right-[20%] w-3 h-3 bg-indigo-500 rounded-full animate-ping delay-150"></div>
              <div className="absolute top-[35%] left-[45%] w-3 h-3 bg-indigo-500 rounded-full animate-ping delay-300"></div>
              <p className="text-gray-500 font-mono relative z-10">Signaling Mesh Visualization</p>
          </div>
      </div>

      {/* Testimonials */}
      <div className="py-32 bg-white text-black">
          <SectionHeading title="Community Feedback" subtitle="Join thousands of users communicating securely." light={true} />
          <div className="max-w-[1400px] mx-auto px-8 grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                  { q: "The voice quality is surprisingly clear for a browser app.", a: "Sarah J.", r: "Remote Worker" },
                  { q: "Finally a P2P app that actually works behind school firewalls.", a: "Mike T.", r: "Student" },
                  { q: "The UI is clean and the encryption gives me peace of mind.", a: "Jessica L.", r: "Privacy Advocate" }
              ].map((t, i) => (
                  <div key={i} className="p-8 bg-gray-50 rounded-3xl border border-gray-200">
                      <div className="text-2xl text-indigo-600 mb-4">★★★★★</div>
                      <p className="text-lg font-medium mb-6">"{t.q}"</p>
                      <div>
                          <div className="font-bold">{t.a}</div>
                          <div className="text-sm text-gray-500">{t.r}</div>
                      </div>
                  </div>
              ))}
          </div>
      </div>

      {/* FAQ */}
      <div className="py-32 bg-[#050510]">
          <div className="max-w-[800px] mx-auto px-8">
              <SectionHeading title="Frequently Asked Questions" subtitle="Got questions? We have answers." />
              <div className="space-y-4">
                  {[
                      "Is it really free?",
                      "How secure is P2P?",
                      "Do you store my voice data?",
                      "Do you sell my data?",
                      "Is there a mobile app?"
                  ].map((q, i) => (
                      <div key={i} className="p-6 bg-white/5 rounded-2xl border border-white/5 cursor-pointer hover:bg-white/10 transition flex justify-between items-center">
                          <span className="font-bold">{q}</span>
                          <span className="text-indigo-400">+</span>
                      </div>
                  ))}
              </div>
          </div>
      </div>

      {/* Developers / Architecture */}
      <div className="py-32 bg-[#02000f] border-t border-white/5">
          <div className="max-w-[1400px] mx-auto px-8 flex flex-col md:flex-row items-center gap-16">
              <div className="flex-1 space-y-6">
                  <h2 className="text-4xl font-bold">Transparent Architecture</h2>
                  <p className="text-gray-400 text-lg">MasterVoice leverages open-source standards like WebRTC for media and PostgreSQL for secure metadata storage. See exactly how your data moves.</p>
                  <button onClick={() => onNavigate('/docs')} className="px-8 py-3 bg-white/10 border border-white/10 rounded-xl hover:bg-white/20 transition">Read Documentation</button>
              </div>
              <div className="flex-1 bg-[#1a1a20] p-6 rounded-2xl font-mono text-sm text-gray-300 border border-white/10 shadow-2xl w-full max-w-lg">
                  <div className="flex gap-2 mb-4">
                      <div className="w-3 h-3 rounded-full bg-red-500"></div>
                      <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                      <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  </div>
                  <p className="text-gray-500">// System Overview</p>
                  <p><span className="text-purple-400">const</span> stack = &#123;</p>
                  <p>&nbsp;&nbsp;auth: <span className="text-green-400">'Supabase GoTrue'</span>,</p>
                  <p>&nbsp;&nbsp;db: <span className="text-green-400">'PostgreSQL 15 + RLS'</span>,</p>
                  <p>&nbsp;&nbsp;realtime: <span className="text-green-400">'WebSockets'</span>,</p>
                  <p>&nbsp;&nbsp;media: <span className="text-green-400">'WebRTC (P2P/TURN)'</span></p>
                  <p>&#125;;</p>
                  <br/>
                  <p className="text-gray-500">// We never touch your audio streams.</p>
              </div>
          </div>
      </div>

      {/* Comparison */}
      <div className="py-32 bg-[#050510]">
          <div className="max-w-[1000px] mx-auto px-8">
              <h2 className="text-3xl font-bold text-center mb-12">Why switch?</h2>
              <div className="bg-white/5 rounded-3xl overflow-hidden border border-white/5">
                  <div className="grid grid-cols-4 p-6 border-b border-white/5 font-bold bg-white/5">
                      <div>Feature</div>
                      <div className="text-indigo-400">MasterVoice</div>
                      <div className="text-gray-500">Discord</div>
                      <div className="text-gray-500">Slack</div>
                  </div>
                  {[
                      ["P2P Encryption", "✅", "❌", "❌"],
                      ["Lossless Audio", "✅", "⚠️", "❌"],
                      ["Self Hosting", "✅", "❌", "❌"],
                      ["File Limit", "2GB", "25MB", "1GB"]
                  ].map((row, i) => (
                      <div key={i} className="grid grid-cols-4 p-6 border-b border-white/5 hover:bg-white/5 transition">
                          <div className="font-medium text-gray-300">{row[0]}</div>
                          <div className="text-white font-bold shadow-indigo-500/50">{row[1]}</div>
                          <div className="text-gray-500">{row[2]}</div>
                          <div className="text-gray-500">{row[3]}</div>
                      </div>
                  ))}
              </div>
          </div>
      </div>

      {/* Pricing (Existing) */}
      <div className="py-32 relative">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-indigo-900/5 blur-3xl pointer-events-none"></div>
        <div className="max-w-[1200px] mx-auto px-8 relative z-10">
            <SectionHeading title="Fair Pricing" subtitle="A truly generous free plan for everyone. Upgrade for power features." />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <PricingCard 
                    title="Personal"
                    price="Free"
                    features={["Unlimited Text Messages", "Unlimited P2P Voice Calls", "Unlimited Message History", "3 Active Devices", "Community Support"]}
                    cta={isAuthenticated ? "Your Current Plan" : "Get Started Free"}
                    onAction={() => isAuthenticated ? onNavigate('/conversations') : onNavigate('/register')}
                />
                <PricingCard 
                    title="Pro"
                    price="$8"
                    recommended={true}
                    features={["Everything in Personal", "Higher Bandwidth Groups", "Ultra HD Lossless Audio", "Unlimited Active Devices", "Priority Relay Network"]}
                    cta="Start Pro Trial"
                    onAction={() => isAuthenticated ? onNavigate('/conversations?trial=true&plan=pro') : onNavigate('/register')}
                />
                <PricingCard 
                    title="Team"
                    price="$20"
                    features={["Everything in Pro", "Admin Dashboard", "Team Analytics", "SSO Integration", "Data Export API", "24/7 Dedicated Support"]}
                    cta="Contact Sales"
                    onAction={() => onNavigate('/contact')}
                />
            </div>
        </div>
      </div>

      {/* Security Certs */}
      <div className="py-20 text-center space-y-8 bg-black">
          <p className="text-gray-500 uppercase tracking-widest text-sm">Built on Standards</p>
          <div className="flex justify-center gap-12 grayscale opacity-50 font-bold text-white text-xl">
              <div className="flex items-center gap-2"><div className="w-2 h-2 bg-green-500 rounded-full"></div>WEBRTC</div>
              <div className="flex items-center gap-2"><div className="w-2 h-2 bg-blue-500 rounded-full"></div>DTLS</div>
              <div className="flex items-center gap-2"><div className="w-2 h-2 bg-purple-500 rounded-full"></div>SRTP</div>
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
                  <button onClick={() => onNavigate('/docs')} className="hover:text-white transition">Docs</button>
              </div>
          </div>
      </div>
    </div>
  );
};

// --- Mobile Landing Page (Simplified Wrapper) ---
const MobileLanding: React.FC<LandingPageProps> = ({ onNavigate, isAuthenticated }) => {
  return (
    <div className="min-h-screen bg-[#050505] text-white font-['Outfit'] overflow-hidden relative pb-20">
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
        <div className="px-6 pt-8 pb-12 flex flex-col relative z-10 border-b border-white/5">
            <h1 className="text-6xl font-bold leading-[0.9] mb-6 tracking-tighter">Chat <span className="text-indigo-500">Freely.</span></h1>
            <button onClick={() => isAuthenticated ? onNavigate('/conversations') : onNavigate('/register')} className="w-full py-5 bg-white text-black rounded-2xl font-bold text-lg shadow-xl active:scale-95 transition-transform">
                {isAuthenticated ? "Launch App" : "Get Started"}
            </button>
        </div>
        <div className="p-8 text-center text-gray-500">
            <p>Visit on Desktop for full experience.</p>
        </div>
    </div>
  );
};

export const LandingPage: React.FC<LandingPageProps> = (props) => {
  const [width] = useWindowSize();
  const isMobile = width < 768;
  return isMobile ? <MobileLanding {...props} /> : <DesktopLanding {...props} />;
};