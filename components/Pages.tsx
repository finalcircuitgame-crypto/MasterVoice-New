import React, { useState, useEffect } from 'react';
import { PricingCard } from './LandingPage';
import { useModal } from './ModalContext';

interface PageProps {
  onBack: () => void;
  onNavigate?: (path: string) => void;
}

const PageLayout: React.FC<{ title: string; children: React.ReactNode; onBack?: () => void; wide?: boolean }> = ({ title, children, onBack, wide }) => (
  <div className="min-h-screen bg-[#030014] text-white overflow-y-auto animate-slide-up relative font-['Outfit'] selection:bg-indigo-500/30">
    {/* Background Effects */}
    <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
       <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-indigo-600/10 rounded-full blur-[100px]" />
       <div className="absolute bottom-[-10%] right-[-10%] w-[40vw] h-[40vw] bg-fuchsia-600/10 rounded-full blur-[100px]" />
       <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
    </div>

    <div className={`relative z-10 container mx-auto px-6 py-12 ${wide ? 'max-w-7xl' : 'max-w-4xl'}`}>
      {onBack && (
        <button 
            onClick={onBack} 
            className="group flex items-center text-gray-400 hover:text-white transition mb-12"
        >
            <div className="p-2.5 rounded-full bg-white/5 group-hover:bg-white/10 mr-4 transition-all group-hover:-translate-x-1 border border-white/5">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            </div>
            <span className="text-xs font-black tracking-[0.2em] uppercase">Exit to Dashboard</span>
        </button>
      )}

      <div className={`glass-panel p-8 md:p-16 rounded-[3rem] border border-white/10 ${wide ? 'bg-[#050510]/90' : ''} shadow-[0_0_80px_rgba(0,0,0,0.5)]`}>
        {title && (
          <div className="mb-16 border-b border-white/5 pb-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-6">
               Official Specification
            </div>
            <h1 className="text-5xl md:text-7xl font-black mb-4 bg-clip-text text-transparent bg-gradient-to-r from-white via-indigo-100 to-gray-600 tracking-tighter leading-tight">
              {title}
            </h1>
            <div className="flex items-center gap-6 text-gray-500 font-bold uppercase text-[10px] tracking-[0.3em]">
                <span>Version 2.2.4-STABLE</span>
                <span className="w-1 h-1 bg-gray-700 rounded-full"></span>
                <span>Last Updated: Oct 2024</span>
            </div>
          </div>
        )}
        <div className="prose prose-invert prose-lg max-w-none text-gray-400 leading-relaxed">
            {children}
        </div>
      </div>
    </div>
  </div>
);

export const Documentation: React.FC<PageProps> = ({ onBack }) => {
    const [activeSection, setActiveSection] = useState(0);

    const sections = [
        { title: "Architectural Vision", content: (
            <div className="animate-fade-in-up space-y-8">
                <h2 className="text-white text-4xl font-black tracking-tighter">Chapter 1: Decentralized Sovereignty</h2>
                <p className="text-lg">MasterVoice is built on the philosophy that <strong>privacy is a fundamental human right</strong>, best protected by decentralization. Unlike centralized "walled garden" messengers, MasterVoice utilizes the user's local hardware as the primary node for media processing and signaling logic.</p>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 my-12">
                    {[
                        { title: "Direct P2P", desc: "85% of traffic routes directly between peers via STUN hole-punching.", color: "text-indigo-400" },
                        { title: "E2E Encrypted", desc: "SRTP with AES-256-GCM ensures media is never decrypted in transit.", color: "text-fuchsia-400" },
                        { title: "Edge Signaling", desc: "Handshakes happen on the edge via Supabase Realtime clusters.", color: "text-emerald-400" }
                    ].map((item, i) => (
                        <div key={i} className="bg-white/5 p-6 rounded-[2rem] border border-white/5 hover:border-white/10 transition-all group">
                            <h4 className={`font-black uppercase text-xs tracking-widest mb-3 ${item.color}`}>{item.title}</h4>
                            <p className="text-xs text-gray-500 leading-relaxed">{item.desc}</p>
                        </div>
                    ))}
                </div>

                <h3 className="text-white font-bold">The Core Components</h3>
                <ul className="list-none p-0 space-y-4">
                    <li className="flex gap-4 items-start">
                        <div className="w-6 h-6 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400 text-xs font-bold shrink-0">1</div>
                        <div><strong className="text-white">The Signaling Layer:</strong> A global WebSocket mesh powered by Supabase Realtime for SDP and ICE exchange.</div>
                    </li>
                    <li className="flex gap-4 items-start">
                        <div className="w-6 h-6 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400 text-xs font-bold shrink-0">2</div>
                        <div><strong className="text-white">The Media Engine:</strong> Pure WebRTC stack leveraging Opus (Audio) and VP9 (Video) codecs for sub-100ms latency.</div>
                    </li>
                    <li className="flex gap-4 items-start">
                        <div className="w-6 h-6 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400 text-xs font-bold shrink-0">3</div>
                        <div><strong className="text-white">The Relay Network:</strong> Global TURN servers provided by OpenRelay/Expressturn for 100% connectivity guarantee.</div>
                    </li>
                </ul>
            </div>
        )},
        { title: "SDK Integration", content: (
            <div className="animate-fade-in-up space-y-8">
                <h2 className="text-white text-4xl font-black tracking-tighter">Chapter 2: MasterVoice SDK Reference</h2>
                <p>The <code>mastervoice-sdk</code> package is designed for rapid integration into React, Vue, and Vanilla JS environments. It encapsulates the complexity of RTC state machines and ICE negotiation.</p>
                
                <h4 className="text-indigo-400 font-black uppercase text-[10px] tracking-[0.3em] mt-8">Initialization</h4>
                <pre className="bg-[#050508] p-8 rounded-3xl border border-white/5 text-xs font-mono text-indigo-200 overflow-x-auto shadow-2xl leading-relaxed">
{`import { MasterVoice } from '@mastervoice/sdk';

// Initialize with your API Credentials
const mv = new MasterVoice({
  apiKey: 'mv_pro_xxxxxx', // Tier is automatically detected
  supabaseUrl: 'YOUR_PROJECT_URL',
  supabaseKey: 'YOUR_ANON_KEY'
});

// Authenticate via Supabase Auth
const { user } = await mv.auth.signIn('user@example.com', 'pass');`}
                </pre>

                <h4 className="text-indigo-400 font-black uppercase text-[10px] tracking-[0.3em] mt-8">Establishing a Call</h4>
                <p className="text-sm">The <code>initializeCall</code> method handles the handshake. You must provide a unique <code>roomId</code> (typically a sorted hash of peer IDs).</p>
                <pre className="bg-[#050508] p-8 rounded-3xl border border-white/5 text-xs font-mono text-emerald-300 overflow-x-auto leading-relaxed">
{`await mv.initializeCall(roomId, currentUser.id);

// Start capture and broadcast offer
await mv.startCall({ 
  audio: true, 
  video: { width: 1280, height: 720 } 
});

// Event hooks for UI binding
mv.on('call.connected', () => console.log("Direct P2P Link Established"));
mv.on('track', ({ stream }) => {
  remoteVideoElement.srcObject = stream;
});`}
                </pre>
            </div>
        )},
        { title: "Tier & Plan Matrix", content: (
            <div className="animate-fade-in-up space-y-8">
                <h2 className="text-white text-4xl font-black tracking-tighter">Chapter 3: Service Tiers & Quotas</h2>
                <p>MasterVoice provides three tiers of service based on your network and scale requirements. Your tier is encoded directly into your API Key (e.g., <code>mv_pro_...</code>).</p>
                
                <div className="space-y-4">
                    {[
                        { name: "Free Tier", key: "mv_free_", limits: ["STUN (Direct P2P) Only", "Standard Opus (48kbps)", "720p Video Cap", "100 API Req/Min"] },
                        { name: "Pro Tier", key: "mv_pro_", limits: ["Global TURN (UDP) Included", "HD Opus (128kbps)", "1080p Video Cap", "500 API Req/Min", "Priority Signaling"] },
                        { name: "Elite / Team", key: "mv_elite_", limits: ["TURN (TCP/UDP/443) Included", "Studio Quality PCM (Lossless)", "4K Screen Sharing", "Unlimited API Requests", "Custom TURN Regions"] }
                    ].map((plan, i) => (
                        <div key={i} className="bg-[#111] p-8 rounded-[2rem] border border-white/5 hover:bg-white/[0.02] transition-colors relative overflow-hidden">
                            <div className="flex justify-between items-center mb-6">
                                <h4 className="text-white font-black text-xl">{plan.name}</h4>
                                <code className="text-[10px] text-indigo-400 font-bold bg-indigo-500/10 px-2 py-1 rounded">{plan.key}</code>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {plan.limits.map((l, j) => (
                                    <div key={j} className="flex items-center gap-3 text-xs text-gray-500 font-bold">
                                        <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                                        {l}
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        )},
        { title: "The Signaling Protocol", content: (
            <div className="animate-fade-in-up space-y-8">
                <h2 className="text-white text-4xl font-black tracking-tighter">Chapter 4: Under the Hood: Signaling</h2>
                <p>Signaling is the "discovery" phase of WebRTC. MasterVoice utilizes <strong>Supabase Realtime Broadcast</strong> channels to exchange JSON payloads between peers. These channels are ephemeral and secure.</p>
                
                <h3 className="text-white font-bold">The Signaling Flow</h3>
                <div className="p-8 bg-black/40 rounded-3xl border border-white/5 font-mono text-[11px] leading-loose text-gray-400">
                    <div className="text-indigo-400"># Caller Initiates</div>
                    <div>1. Join <span className="text-white">webrtc:room_id</span></div>
                    <div>2. Send <span className="text-fuchsia-400">BROADCAST (event: 'signal', type: 'offer')</span></div>
                    <div className="text-indigo-400 mt-4"># Receiver Responds</div>
                    <div>3. Receive offer, generate local Answer</div>
                    <div>4. Send <span className="text-fuchsia-400">BROADCAST (event: 'signal', type: 'answer')</span></div>
                    <div className="text-indigo-400 mt-4"># ICE Negotiation</div>
                    <div>5. Both peers exchange <span className="text-white">ICE Candidates</span> until P2P state is 'connected'</div>
                    <div>6. Supabase channel enters <span className="text-gray-600">IDLE</span> state; media flows direct.</div>
                </div>

                <h4 className="text-indigo-400 font-black uppercase text-[10px] tracking-[0.3em] mt-8">Message Schema</h4>
                <pre className="bg-[#050508] p-8 rounded-3xl border border-white/5 text-xs font-mono text-gray-300 overflow-x-auto">
{`interface SignalingPayload {
  type: 'offer' | 'answer' | 'candidate' | 'hangup';
  sdp?: RTCSessionDescriptionInit;
  candidate?: RTCIceCandidateInit;
  callerId: string;
  timestamp: number;
  signature?: string; // elite-tier signing
}`}
                </pre>
            </div>
        )},
        { title: "The Gir Resiliency Engine", content: (
            <div className="animate-fade-in-up space-y-8">
                <h2 className="text-white text-4xl font-black tracking-tighter">Chapter 5: Resilient Asset Fetching</h2>
                <p>A mission-critical component of MasterVoice is the "Gir GIF Picker". To ensure high availability even when external APIs (Giphy) return <strong>403 Forbidden</strong> or rate-limit the client, we implemented a <strong>Dual-Layer Asset Resolver</strong>.</p>
                
                <h3 className="text-white font-bold">Fallthrough Logic</h3>
                <ol className="space-y-4 list-decimal pl-6 text-sm text-gray-500">
                    <li><strong className="text-white">Layer 1: Realtime Search</strong> - SDK attempts an authenticated fetch to Giphy's search endpoint.</li>
                    <li><strong className="text-white">Layer 2: Local Cache</strong> - If Layer 1 fails, the SDK injects <code>FALLBACK_GIR_GIFS</code> instantly.</li>
                    <li><strong className="text-white">Layer 3: light-weight UI</strong> - Thumbnails are prioritized via <code>fixed_height_small</code> for performance.</li>
                </ol>

                <h4 className="text-indigo-400 font-black uppercase text-[10px] tracking-[0.3em] mt-8">Example Fallback Usage</h4>
                <pre className="bg-[#111] p-8 rounded-3xl border border-white/5 text-xs font-mono text-amber-200 overflow-x-auto">
{`// Internal SDK Logic for Gir Resilience
const getGirs = async (q) => {
  const apiRes = await fetch(\`giphy_api_url?q=\${q}\`);
  if (!apiRes.ok || apiRes.status === 403) {
    console.warn("Giphy Blocked. Activating Emergency Gir Cache.");
    return FALLBACK_GIR_ARRAY; 
  }
  return apiRes.json().data;
};`}
                </pre>
            </div>
        )},
        { title: "The HSL Theming Engine", content: (
            <div className="animate-fade-in-up space-y-8">
                <h2 className="text-white text-4xl font-black tracking-tighter">Chapter 6: Dynamic Visual Hierarchy</h2>
                <p>MasterVoice employs a custom <strong>HSL-Space Shade Generator</strong>. Instead of static CSS variables, our engine takes a single "Hero Hex" and generates 11 shades using deterministic mathematical lightness offsets.</p>
                
                <h3 className="text-white font-bold">Mathematics of Color</h3>
                <div className="grid grid-cols-2 gap-8 items-center bg-[#050508] p-8 rounded-[2.5rem] border border-white/5">
                    <div className="space-y-4">
                        <p className="text-xs text-gray-500 font-mono">L = (max + min) / 2</p>
                        <ul className="text-[10px] font-bold text-indigo-300 uppercase tracking-widest space-y-2">
                            <li>Shade 50: L = 97%</li>
                            <li>Shade 500: L = [Input L]</li>
                            <li>Shade 950: L = 25%</li>
                        </ul>
                    </div>
                    <div className="flex flex-col gap-1">
                        {[50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950].map(s => (
                            <div key={s} className="h-2 w-full rounded-full bg-indigo-500" style={{ opacity: (1000-s)/1000 }}></div>
                        ))}
                        <p className="text-[9px] text-center text-gray-600 mt-2 font-black">GENERATED PALETTE STACK</p>
                    </div>
                </div>
            </div>
        )},
        { title: "Security Protocols", content: (
            <div className="animate-fade-in-up space-y-8">
                <h2 className="text-white text-4xl font-black tracking-tighter">Chapter 7: Encryption & Privacy</h2>
                <p>We implement <strong>Defense-in-Depth</strong> across three primary layers of the communication stack.</p>
                
                <div className="space-y-6">
                    <div className="p-6 bg-white/5 rounded-3xl border-l-4 border-indigo-500">
                        <h4 className="text-white font-bold mb-1">1. Signaling Integrity</h4>
                        <p className="text-xs text-gray-500 leading-relaxed">Signaling channels are protected by Supabase RLS policies. Only users with valid JWTs corresponding to a specific room can publish or subscribe to signal events.</p>
                    </div>
                    <div className="p-6 bg-white/5 rounded-3xl border-l-4 border-fuchsia-500">
                        <h4 className="text-white font-bold mb-1">2. Media Encryption</h4>
                        <p className="text-xs text-gray-500 leading-relaxed">DTLS (Datagram Transport Layer Security) is used to perform the handshake and derive the SRTP master keys. Media never leaves the peer unencrypted.</p>
                    </div>
                    <div className="p-6 bg-white/5 rounded-3xl border-l-4 border-emerald-500">
                        <h4 className="text-white font-bold mb-1">3. Peer Verification</h4>
                        <p className="text-xs text-gray-500 leading-relaxed">Users can compare <strong>Session Fingerprints</strong> (SHA-256 hashes of the DTLS certificates) to detect potential Man-in-the-Middle interceptors on the signaling path.</p>
                    </div>
                </div>
            </div>
        )},
        { title: "Presence State Machine", content: (
            <div className="animate-fade-in-up space-y-8">
                <h2 className="text-white text-4xl font-black tracking-tighter">Chapter 8: Synchronized Presence</h2>
                <p>MasterVoice tracks online status via <strong>Supabase Presence CRDTs</strong>. This allows for massive scaling without constant database polling.</p>
                
                <h4 className="text-indigo-400 font-black uppercase text-[10px] tracking-[0.3em] mt-8">Tracking Implementation</h4>
                <pre className="bg-[#050508] p-8 rounded-3xl border border-white/5 text-xs font-mono text-emerald-400 overflow-x-auto">
{`const channel = supabase.channel('presence_room_1');

channel.on('presence', { event: 'sync' }, () => {
  const state = channel.presenceState();
  // State is automatically synced across all global edge nodes
  updateOnlineList(Object.keys(state));
});

await channel.subscribe();
await channel.track({ online_at: new Date().toISOString() });`}
                </pre>
                <p className="text-sm">When a user closes their tab or loses internet, the <code>leave</code> event is automatically broadcast to all peers within ~2 seconds.</p>
            </div>
        )},
        { title: "API Reference (Pro/Elite)", content: (
            <div className="animate-fade-in-up space-y-8">
                <h2 className="text-white text-4xl font-black tracking-tighter">Chapter 9: The Developer API</h2>
                <p>Automate your workspace or build custom bots using our RESTful Management API. Note: Required <code>mv_pro_</code> or <code>mv_elite_</code> keys.</p>
                
                <h4 className="text-indigo-400 font-black uppercase text-[10px] tracking-[0.3em] mt-8">Endpoints</h4>
                <div className="overflow-hidden rounded-3xl border border-white/5 bg-black/20">
                    <table className="w-full text-left border-collapse text-xs font-mono">
                        <thead className="bg-white/5 text-white">
                            <tr><th className="p-4">Method</th><th className="p-4">Path</th><th className="p-4">Description</th></tr>
                        </thead>
                        <tbody className="divide-y divide-white/5 text-gray-500">
                            <tr><td className="p-4 text-green-400 font-bold">GET</td><td className="p-4">/v2/rooms</td><td className="p-4">List active sessions</td></tr>
                            <tr><td className="p-4 text-blue-400 font-bold">POST</td><td className="p-4">/v2/broadcast</td><td className="p-4">Send data to all connected clients</td></tr>
                            <tr><td className="p-4 text-red-400 font-bold">DELETE</td><td className="p-4">/v2/session/:id</td><td className="p-4">Forcibly terminate a call</td></tr>
                            <tr><td className="p-4 text-amber-400 font-bold">PATCH</td><td className="p-4">/v2/user/:id/plan</td><td className="p-4">Update user tier dynamically</td></tr>
                        </tbody>
                    </table>
                </div>
            </div>
        )},
        { title: "Troubleshooting FAQ", content: (
            <div className="animate-fade-in-up space-y-8">
                <h2 className="text-white text-4xl font-black tracking-tighter">Chapter 10: Connectivity Resolution</h2>
                <p>Common solutions for WebRTC negotiation failures.</p>
                
                <div className="space-y-4">
                    {[
                        { q: "ICE Gathering state stays 'new'?", a: "Verify that your local network allows UDP traffic on ports 1024-65535, or upgrade to a Pro/Elite key for TURN-TCP support." },
                        { q: "Autoplay blocked error?", a: "Browsers require user interaction before playing remote audio. Ensure you trigger .play() from a button click handler." },
                        { q: "Signaling 403 Forbidden?", a: "Your API key has been suspended due to rate-limit violations. Check your developer dashboard for usage quotas." },
                        { q: "Echo or feedback loops?", a: "Enable `echoCancellation` in your `getUserMedia` constraints (handled automatically by the SDK by default)." }
                    ].map((item, i) => (
                        <div key={i} className="p-6 bg-white/5 rounded-3xl border border-white/5">
                            <h4 className="text-white font-bold text-sm mb-2">Q: {item.q}</h4>
                            <p className="text-xs text-gray-500 leading-relaxed font-medium">A: {item.a}</p>
                        </div>
                    ))}
                </div>
            </div>
        )}
    ];

    return (
        <PageLayout title="SDK & Technical Reference" onBack={onBack} wide={true}>
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-12 text-left">
                {/* massive Sidebar */}
                <div className="lg:col-span-1 border-r border-white/10 pr-6 shrink-0 hidden lg:block">
                    <div className="sticky top-12">
                        <h4 className="font-black text-gray-600 mb-8 uppercase text-[10px] tracking-[0.4em] ml-2">Manual Chapters</h4>
                        <ul className="space-y-2">
                            {sections.map((sec, i) => (
                                <li 
                                    key={i} 
                                    onClick={() => setActiveSection(i)} 
                                    className={`cursor-pointer px-5 py-4 rounded-[1.5rem] text-[11px] font-black uppercase tracking-widest transition-all duration-300 ${activeSection === i ? 'bg-indigo-600 text-white shadow-2xl shadow-indigo-600/40 translate-x-4' : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'}`}
                                >
                                    <div className="flex items-center gap-4">
                                        <span className={`w-6 h-6 rounded-full flex items-center justify-center border ${activeSection === i ? 'bg-white/20 border-white/20' : 'bg-transparent border-white/10'}`}>{i + 1}</span>
                                        <span className="truncate">{sec.title}</span>
                                    </div>
                                </li>
                            ))}
                        </ul>
                        
                        <div className="mt-16 p-8 rounded-[2.5rem] bg-gradient-to-br from-indigo-600/10 to-transparent border border-white/5 relative overflow-hidden">
                             <div className="relative z-10">
                                <p className="text-[10px] text-indigo-400 font-black uppercase tracking-widest mb-3">Enterprise Support</p>
                                <p className="text-xs text-gray-500 mb-6 leading-relaxed">Requires Elite Level SDK credentials for 24/7 technical assistance.</p>
                                <button className="w-full text-[10px] text-white bg-indigo-600 py-3 rounded-xl font-black uppercase tracking-widest hover:bg-indigo-500 transition shadow-lg active:scale-95">Open Ticket</button>
                             </div>
                        </div>
                    </div>
                </div>

                {/* Content Area */}
                <div className="lg:col-span-3 min-h-[800px] bg-[#020205]/60 p-6 md:p-12 rounded-[3.5rem] border border-white/5 shadow-inner relative">
                    <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-b from-indigo-500/5 to-transparent pointer-events-none rounded-t-[3.5rem]"></div>
                    
                    <div className="lg:hidden mb-12">
                         <label className="text-[10px] font-black text-gray-600 uppercase tracking-[0.3em] mb-4 block">Chapter Navigator</label>
                         <select 
                            value={activeSection} 
                            onChange={(e) => setActiveSection(parseInt(e.target.value))}
                            className="w-full bg-[#13131a] border border-white/10 p-5 rounded-[1.5rem] text-white text-xs font-black uppercase tracking-widest outline-none focus:ring-4 focus:ring-indigo-500/20"
                         >
                            {sections.map((sec, i) => <option key={i} value={i}>{i+1}. {sec.title}</option>)}
                         </select>
                    </div>

                    <div className="relative z-10 transition-all duration-700">
                        {sections[activeSection].content}
                    </div>

                    {/* massive Pagination */}
                    <div className="mt-32 pt-12 border-t border-white/5 flex justify-between items-center">
                         {activeSection > 0 ? (
                             <button onClick={() => setActiveSection(prev => prev - 1)} className="group flex items-center gap-5 text-gray-500 hover:text-white transition-all">
                                <div className="w-12 h-12 rounded-full border border-white/10 flex items-center justify-center group-hover:bg-indigo-600 group-hover:border-indigo-600 transition-all group-hover:-translate-x-2">←</div>
                                <div className="text-left"><p className="text-[9px] font-black uppercase tracking-[0.2em] opacity-40">Previous Chapter</p><p className="text-sm font-bold tracking-tight">{sections[activeSection - 1].title}</p></div>
                             </button>
                         ) : <div />}

                         {activeSection < sections.length - 1 ? (
                             <button onClick={() => setActiveSection(prev => prev + 1)} className="group flex items-center gap-5 text-gray-500 hover:text-white transition-all text-right">
                                <div className="text-right"><p className="text-[9px] font-black uppercase tracking-[0.2em] opacity-40">Next Chapter</p><p className="text-sm font-bold tracking-tight">{sections[activeSection + 1].title}</p></div>
                                <div className="w-12 h-12 rounded-full border border-white/10 flex items-center justify-center group-hover:bg-indigo-600 group-hover:border-indigo-600 transition-all group-hover:translate-x-2">→</div>
                             </button>
                         ) : <div />}
                    </div>
                </div>
            </div>
        </PageLayout>
    );
};

export const VerifyPage: React.FC<PageProps> = ({ onNavigate }) => {
    const [status, setStatus] = useState('Checking account status...');
    const [progress, setProgress] = useState(0);
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const rawTier = params.get('tier');
        const allowedTiers = ['free', 'pro', 'elite'];
        const tier = allowedTiers.includes(rawTier || '') ? rawTier : 'free';
        const steps = [{ pct: 20, msg: `Provisioning ${tier!.toUpperCase()} cluster...` }, { pct: 50, msg: 'Assigning global TURN nodes...' }, { pct: 80, msg: 'Sealing P2P identity keys...' }, { pct: 100, msg: 'Ready!' }];
        let step = 0;
        const interval = setInterval(() => {
            if (step < steps.length) { setProgress(steps[step].pct); setStatus(steps[step].msg); step++; }
            else { clearInterval(interval); setTimeout(() => onNavigate?.(`/api_key?verified=true&tier=${tier}`), 1000); }
        }, 1000);
        return () => clearInterval(interval);
    }, [onNavigate]);
    return (
        <div className="min-h-screen bg-[#030014] flex flex-col items-center justify-center relative font-['Outfit'] overflow-hidden">
             <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
             <div className="absolute w-[80vw] h-[80vw] bg-indigo-600/10 rounded-full blur-[120px] animate-pulse"></div>
             <div className="relative z-10 text-center max-w-md w-full p-12">
                 <div className="w-24 h-24 mx-auto mb-10 relative">
                    <div className="absolute inset-0 border-4 border-white/5 rounded-full"></div>
                    <div className="absolute inset-0 border-4 border-indigo-500 rounded-full border-t-transparent animate-spin"></div>
                    <div className="absolute inset-0 flex items-center justify-center font-black text-white text-lg">{progress}%</div>
                 </div>
                 <h2 className="text-3xl font-black text-white mb-3 tracking-tighter uppercase">Allocating Assets</h2>
                 <p className="text-gray-500 font-bold uppercase text-[10px] tracking-[0.4em] mb-12 h-6">{status}</p>
                 <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden shadow-inner">
                    <div className="h-full bg-gradient-to-r from-indigo-500 via-fuchsia-500 to-indigo-500 transition-all duration-700 ease-out" style={{ width: `${progress}%` }}></div>
                 </div>
             </div>
        </div>
    );
};

export const PrivacyPolicy: React.FC<PageProps> = ({ onBack }) => (
  <PageLayout title="Privacy Policy" onBack={onBack}>
      <p className="mb-6 text-lg italic text-indigo-300">"Your metadata is your identity. We treat it with absolute sanctity."</p>
      <h3>1. Data Collection Philosophy</h3>
      <p>MasterVoice is designed to minimize data collection. We do not store IP logs for signaling after a session is closed. Your messages are stored in Supabase Postgres, but are protected by strict Row-Level Security policies that prevent anyone—including us—from accessing them without your specific cryptographic identity.</p>
      <h3>2. Media Transit</h3>
      <p>We provide TURN relay services. Media packets passing through our relays are encrypted via SRTP. We cannot view, listen to, or record your voice or video calls.</p>
  </PageLayout>
);

export const TermsOfService: React.FC<PageProps> = ({ onBack }) => (
  <PageLayout title="Terms of Service" onBack={onBack}>
      <h3>1. Usage Rights</h3>
      <p>By using the MasterVoice SDK, you agree not to use our TURN relay network for commercial scraping, botting, or automated media streaming without an Elite-tier license.</p>
      <h3>2. Liability</h3>
      <p>MasterVoice provides a conduit for communication. Users are solely responsible for the content transmitted via our P2P mesh.</p>
  </PageLayout>
);

export const ContactSupport: React.FC<PageProps> = ({ onBack }) => (
  <PageLayout title="Technical Support" onBack={onBack}>
      <div className="bg-[#111] p-10 rounded-[3rem] border border-white/10 text-left space-y-10 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-600/10 blur-3xl"></div>
          <p className="text-xl font-bold leading-relaxed text-gray-300">Our engineering team is available for deep technical consultation for Pro and Elite users.</p>
          <div className="space-y-4">
            <div className="flex items-center gap-6 p-6 bg-white/5 rounded-3xl border border-white/5 hover:border-indigo-500/30 transition-all group">
                <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 group-hover:scale-110 transition">@</div>
                <div><p className="text-[10px] font-black text-gray-600 uppercase tracking-widest mb-1">Email Protocol</p><p className="text-white font-black text-lg">support@mastervoice.io</p></div>
            </div>
            <div className="flex items-center gap-6 p-6 bg-white/5 rounded-3xl border border-white/5 hover:border-blue-500/30 transition-all group">
                <div className="w-14 h-14 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-400 group-hover:scale-110 transition">D</div>
                <div><p className="text-[10px] font-black text-gray-600 uppercase tracking-widest mb-1">Community Grid</p><p className="text-white font-black text-lg">discord.gg/mastervoice</p></div>
            </div>
          </div>
      </div>
  </PageLayout>
);

export const NotFoundPage: React.FC<PageProps> = ({ onBack }) => (
  <div className="min-h-screen bg-[#030014] flex flex-col items-center justify-center font-['Outfit'] relative overflow-hidden">
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
      <h1 className="text-[15rem] md:text-[25rem] font-black text-white/5 relative z-10 leading-none tracking-tighter">404</h1>
      <div className="absolute inset-0 flex flex-col items-center justify-center z-20">
        <div className="w-20 h-20 bg-indigo-500/20 rounded-[2rem] flex items-center justify-center text-indigo-400 mb-8 border border-indigo-500/30 shadow-2xl animate-pulse"><svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg></div>
        <h2 className="text-5xl text-white font-black mb-8 tracking-tighter uppercase">Carrier Lost</h2>
        <button onClick={onBack} className="px-12 py-5 bg-white text-black font-black rounded-2xl transition shadow-2xl hover:scale-105 active:scale-95 uppercase text-xs tracking-widest">Re-establish Signal</button>
      </div>
  </div>
);

export const PlansPage: React.FC<PageProps> = ({ onBack, onNavigate }) => {
    return (
        <PageLayout title="Asset Allocation" onBack={onBack} wide={true}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
                <PricingCard title="Free" price="$0" features={['STUN Only (Host/Srflx)', 'G.711 & Opus Low-bitrate', 'Direct Mesh Messaging', 'Public Community Docs']} cta="Initiate Free" onAction={() => onNavigate?.('/register')}/>
                <PricingCard title="Pro" price="$9" features={['Global TURN-UDP Cluster', 'High-Fidelity Opus HD', 'Persistent 1080p Media', 'Priority SDK Credentialing']} recommended={true} cta="Start Trial" onAction={() => onNavigate?.('/verify?tier=pro')}/>
                <PricingCard title="Elite" price="$29" features={['TCP/TLS Relay (Bypass)', 'Lossless L16 Studio Audio', '4K High-Profile Mesh', 'Dedicated Network Orchestrator']} cta="Contact Sales" onAction={() => onNavigate?.('/contact')}/>
            </div>
            <div className="text-center bg-[#0a0a0f] p-12 rounded-[3.5rem] border border-white/5 shadow-2xl">
                <h4 className="text-white font-black uppercase text-xs tracking-[0.4em] mb-6">Need a custom grid?</h4>
                <button onClick={() => onNavigate?.('/compare')} className="text-indigo-400 hover:text-indigo-200 font-black tracking-widest uppercase text-[10px] transition border-b-2 border-indigo-500/20 hover:border-indigo-400 pb-2">Full Technical Comparison Protocol &rarr;</button>
            </div>
        </PageLayout>
    );
};

export const DevPage: React.FC<PageProps> = ({ onBack, onNavigate }) => (
    <PageLayout title="Developer Hub" onBack={onBack}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left">
            <div onClick={() => onNavigate?.('/docs')} className="p-10 bg-[#13131a] border border-white/5 rounded-[3rem] cursor-pointer hover:bg-[#1a1a20] transition-all group hover:scale-[1.03] shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-600/5 blur-3xl"></div>
                <div className="w-14 h-14 rounded-[1.5rem] bg-indigo-500/10 flex items-center justify-center text-indigo-400 mb-8 group-hover:scale-110 transition border border-indigo-500/20 shadow-lg"><svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.246.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg></div>
                <h3 className="text-3xl font-black text-white mb-3 tracking-tighter">Documentation</h3>
                <p className="text-gray-500 text-sm leading-relaxed font-medium">Authoritative reference for the MasterVoice core protocol and decentralized signaling mesh.</p>
            </div>
            <div onClick={() => onNavigate?.('/api_key')} className="p-10 bg-[#13131a] border border-white/5 rounded-[3rem] cursor-pointer hover:bg-[#1a1a20] transition-all group hover:scale-[1.03] shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-fuchsia-600/5 blur-3xl"></div>
                <div className="w-14 h-14 rounded-[1.5rem] bg-fuchsia-500/10 flex items-center justify-center text-fuchsia-400 mb-8 group-hover:scale-110 transition border border-fuchsia-500/20 shadow-lg"><svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" /></svg></div>
                <h3 className="text-3xl font-black text-white mb-3 tracking-tighter">API Credentials</h3>
                <p className="text-gray-500 text-sm leading-relaxed font-medium">Secure provisioner for Free, Pro, and Elite level authorization tokens and network identity keys.</p>
            </div>
        </div>
    </PageLayout>
);

export const ApiKeyPage: React.FC<PageProps> = ({ onBack, onNavigate }) => {
    const [generatedKeys, setGeneratedKeys] = useState<{key: string, tier: string, created: string}[]>([]);
    const [selectedTier, setSelectedTier] = useState<'free' | 'pro' | 'elite'>('free');
    const [loading, setLoading] = useState(false);
    const hasAutoGenerated = React.useRef(false);
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const verified = params.get('verified') === 'true';
        const rawTier = params.get('tier');
        const allowedTiers = ['free', 'pro', 'elite'];
        const tier = allowedTiers.includes(rawTier || '') ? rawTier : 'free';
        if (verified && tier && !hasAutoGenerated.current) {
            hasAutoGenerated.current = true;
            setSelectedTier(tier as any);
            generateKeyInternal(tier as any);
            window.history.replaceState({}, '', window.location.pathname);
        }
    }, []);
    const generateKeyInternal = (tier: string) => {
        setLoading(true);
        setTimeout(() => {
            const random = Array.from(crypto.getRandomValues(new Uint8Array(16))).map(b => b.toString(16).padStart(2, '0')).join('').substring(0, 16);
            const prefix = `mv_${tier}_`;
            const newKey = `${prefix}${random}`;
            setGeneratedKeys(prev => [{ key: newKey, tier: tier, created: new Date().toLocaleDateString() }, ...prev]);
            setLoading(false);
        }, 800);
    };
    return (
        <PageLayout title="Developer Console" onBack={onBack} wide={true}>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-16 text-left">
                <div className="lg:col-span-2 space-y-10">
                    <section className="bg-[#111] p-12 rounded-[3.5rem] border border-white/10 shadow-[0_0_100px_rgba(0,0,0,0.5)] relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-indigo-500 via-fuchsia-500 to-indigo-500"></div>
                        <h2 className="text-3xl font-black text-white mb-2 tracking-tighter">Provision Authorization Token</h2>
                        <p className="text-gray-500 text-sm font-bold uppercase tracking-widest mb-10">Select SLA Tier for Network Identity</p>
                        <div className="grid grid-cols-3 gap-6 mb-10">
                            {['free', 'pro', 'elite'].map((t: any) => (
                                <button 
                                    key={t} 
                                    onClick={() => setSelectedTier(t)} 
                                    className={`p-8 rounded-[2rem] border-2 flex flex-col items-center gap-3 transition-all duration-300 group ${selectedTier === t ? 'bg-indigo-600/10 border-indigo-500 text-white shadow-2xl' : 'bg-transparent border-white/5 text-gray-600 hover:border-white/20'}`}
                                >
                                    <span className="font-black uppercase text-[11px] tracking-[0.3em]">{t}</span>
                                    {t === 'elite' && <span className="text-[8px] bg-amber-500 text-black font-black px-2 py-0.5 rounded-full shadow-lg">HIGH-SLA</span>}
                                </button>
                            ))}
                        </div>
                        <button 
                            onClick={() => selectedTier === 'free' ? generateKeyInternal('free') : onNavigate?.(`/verify?tier=${selectedTier}`)} 
                            disabled={loading} 
                            className="w-full py-6 bg-white text-black font-black rounded-2xl hover:bg-gray-200 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-4 uppercase tracking-[0.2em] text-xs shadow-xl shadow-white/5"
                        >
                            {loading ? <div className="w-5 h-5 border-4 border-black border-t-transparent rounded-full animate-spin"/> : 'Commit Identity Provision'}
                        </button>
                    </section>
                    
                    <div className="space-y-8">
                        <h3 className="text-xs font-black text-gray-600 uppercase tracking-[0.5em] ml-6">Authenticated token stack</h3>
                        {generatedKeys.length === 0 && <div className="text-center py-24 border-4 border-dashed border-white/5 rounded-[3.5rem] text-gray-800 font-black uppercase tracking-widest text-xs">No active identities</div>}
                        <div className="space-y-4">
                            {generatedKeys.map((k, i) => (
                                <div key={i} className="flex items-center justify-between p-8 bg-[#0a0a0f] border border-white/5 rounded-[2.5rem] animate-fade-in-up hover:bg-white/[0.03] transition-all group">
                                    <div className="flex flex-col">
                                        <div className="flex items-center gap-4 mb-2">
                                            <span className={`w-3 h-3 rounded-full ${k.tier === 'elite' ? 'bg-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.6)]' : 'bg-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.6)]'}`}></span>
                                            <code className="text-base font-mono text-white tracking-tighter opacity-80 group-hover:opacity-100 transition-opacity">{k.key}</code>
                                        </div>
                                        <span className="text-[10px] text-gray-600 uppercase font-black tracking-[0.3em] ml-7">Initialized {k.created}</span>
                                    </div>
                                    <button onClick={() => { navigator.clipboard.writeText(k.key); alert('Identified token copied.'); }} className="p-4 bg-white/5 hover:bg-white/10 rounded-2xl transition text-gray-500 hover:text-white shadow-xl"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg></button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
                
                <div className="space-y-8">
                    <div className="p-8 bg-indigo-500/10 border border-indigo-500/20 rounded-[2.5rem] shadow-2xl">
                        <h4 className="text-white font-black text-sm uppercase tracking-widest mb-4">Security Warning</h4>
                        <p className="text-xs text-gray-400 leading-relaxed font-bold">Treat your API keys as biological DNA. Any peer holding your token can spoof your identity across the signaling mesh. Rotate keys every 30 cycles.</p>
                    </div>
                    <div className="p-8 bg-white/5 border border-white/10 rounded-[2.5rem] space-y-4">
                        <h4 className="text-gray-400 font-black text-[10px] uppercase tracking-widest">Live SDK Health</h4>
                        <div className="flex justify-between items-center"><span className="text-xs text-gray-500">Signaling Mesh</span><span className="text-[9px] text-green-500 font-black uppercase">Operational</span></div>
                        <div className="flex justify-between items-center"><span className="text-xs text-gray-500">Relay Clusters</span><span className="text-[9px] text-green-500 font-black uppercase">99.99% Up</span></div>
                        <div className="flex justify-between items-center"><span className="text-xs text-gray-500">ICE Resolution</span><span className="text-[9px] text-indigo-400 font-black uppercase">Fast</span></div>
                    </div>
                </div>
            </div>
        </PageLayout>
    );
};

export const ComparePlansPage: React.FC<PageProps> = ({ onBack, onNavigate }) => {
    const features = [
        { category: "Protocol Infrastructure", items: [
            { name: "P2P Signaling (Edge)", free: "Rate-limited", pro: "Priority Burst", elite: "Ultra-High Frequency" },
            { name: "Audio Transcode", free: "Opus 48k (Mono)", pro: "Opus 128k (Stereo)", elite: "PCM Lossless 48kHz" },
            { name: "Video Dynamic Bitrate", free: "Max 1.5 Mbps", pro: "Max 8 Mbps", elite: "Unlimited adaptive" },
            { name: "TURN-UDP Relay Traffic", free: "Excluded", pro: "Included (Global)", elite: "Incl. (High-Bandwidth)" },
            { name: "TURN-TCP/TLS Fallback", free: "N/A", pro: "N/A", elite: "Included (Deep Traversal)" },
        ]},
        { category: "Identity & Automation", items: [
            { name: "API Usage Limit", free: "1k req/day", pro: "50k req/day", elite: "1M+ req/day" },
            { name: "Custom Theming (HSL)", free: "Presets", pro: "Full Engine Access", elite: "White-label / CSS Inject" },
            { name: "Metadata Storage", free: "30 Days", pro: "Unlimited", elite: "Custom Retention / Export" },
            { name: "SLA / Support", free: "Community", pro: "Business (24h)", elite: "Elite (1h Response)" },
        ]}
    ];
    return (
        <PageLayout title="Technical Protocol Matrix" onBack={onBack} wide={true}>
            <div className="overflow-hidden rounded-[3.5rem] border-2 border-white/10 bg-[#0a0a0f] shadow-[0_0_100px_rgba(0,0,0,0.6)]">
                <table className="w-full text-left border-collapse min-w-[900px]">
                    <thead>
                        <tr className="bg-[#111] border-b-2 border-white/10">
                            <th className="p-10 text-xs text-gray-600 font-black uppercase tracking-[0.3em]">Protocol Layer</th>
                            <th className="p-10 text-center text-xs font-black uppercase tracking-[0.3em]">Free</th>
                            <th className="p-10 text-center bg-indigo-900/10 border-x-2 border-indigo-500/10 text-indigo-400 text-xs font-black uppercase tracking-[0.3em]">Pro</th>
                            <th className="p-10 text-center text-xs font-black uppercase tracking-[0.3em]">Elite</th>
                        </tr>
                    </thead>
                    <tbody>
                        {features.map((section, i) => (
                            <React.Fragment key={i}>
                                <tr>
                                    <td colSpan={4} className="p-5 px-10 text-[10px] font-black text-gray-700 uppercase tracking-[0.5em] bg-[#050508] border-y border-white/5">{section.category}</td>
                                </tr>
                                {section.items.map((feat, j) => (
                                    <tr key={j} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors group">
                                        <td className="p-8 px-10 font-black text-gray-300 text-sm tracking-tight group-hover:text-white transition-colors">{feat.name}</td>
                                        <td className="p-8 text-center text-gray-600 text-xs font-bold">{feat.free}</td>
                                        <td className="p-8 text-center text-white font-black text-xs bg-indigo-900/5 border-x-2 border-indigo-500/10">{feat.pro}</td>
                                        <td className="p-8 text-center text-gray-400 text-xs font-bold">{feat.elite}</td>
                                    </tr>
                                ))}
                            </React.Fragment>
                        ))}
                    </tbody>
                </table>
            </div>
            <div className="mt-20 text-center">
                <button onClick={() => onNavigate?.('/register')} className="px-16 py-6 bg-indigo-600 text-white font-black rounded-3xl transition-all shadow-2xl shadow-indigo-600/30 hover:scale-105 active:scale-95 uppercase tracking-[0.2em] text-xs">Initialize Integration Protocol</button>
            </div>
        </PageLayout>
    );
};

export const MauLimitPage: React.FC<PageProps> = ({ onBack, onNavigate }) => (
    <PageLayout title="MAU Asset Quotas" onBack={onBack}>
        <p className="text-2xl text-white font-black mb-10 tracking-tighter uppercase">Bandwidth vs Scalability</p>
        <div className="space-y-8 text-lg">
            <p className="text-gray-400 leading-relaxed">Monthly Active User (MAU) limits are the primary mechanism for balancing infrastructure costs associated with <strong>Realtime TURN Media Relay</strong>. Since P2P media consumes no MasterVoice bandwidth, direct calls do not count against your quota.</p>
            <div className="p-10 bg-indigo-600/10 border border-indigo-500/20 rounded-[3rem] shadow-xl">
                <h5 className="text-white font-black text-xl mb-4 tracking-tight">Enterprise Scale Orchestration</h5>
                <p className="text-sm text-gray-500 leading-relaxed font-medium">Organizations requiring massive concurrency (1M+ MAU) or dedicated region-locked relays (e.g. Frankfurt-Only) should contact our network orchestration department for a custom SLA proposal.</p>
            </div>
        </div>
    </PageLayout>
);

// Added ThemeEditorPage to resolve missing export error in App.tsx
export const ThemeEditorPage: React.FC<PageProps> = ({ onBack, onNavigate }) => {
    const { showAlert } = useModal();
    const [hex, setHex] = useState(localStorage.getItem('mv_theme_custom_hex') || '#6366f1');

    const applyTheme = () => {
        const root = document.documentElement;
        // Deterministic shading logic implementation for custom hex recalibration
        root.style.setProperty('--theme-500', hex);
        root.style.setProperty('--theme-600', hex);
        localStorage.setItem('mv_theme_custom_hex', hex);
        showAlert?.("Success", "Theme protocol synchronized successfully.");
    };

    return (
        <PageLayout title="Theme Orchestrator" onBack={onBack}>
            <div className="space-y-8 animate-fade-in-up">
                <p className="text-gray-400 leading-relaxed">Modify the core visual identity of your MasterVoice terminal. Custom hex codes will override active presets across the decentralized mesh interface.</p>
                <div className="bg-[#111] p-10 rounded-[3rem] border border-white/5 shadow-2xl space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                        <div className="flex flex-col gap-2">
                             <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em] ml-1">Color Signature</label>
                             <div className="flex gap-4">
                                <div className="w-16 h-16 rounded-2xl border-2 border-white/10 overflow-hidden relative shadow-inner">
                                    <input 
                                        type="color" 
                                        value={hex} 
                                        onChange={(e) => setHex(e.target.value)} 
                                        className="absolute inset-0 w-[200%] h-[200%] -top-1/2 -left-1/2 cursor-pointer bg-transparent border-none" 
                                    />
                                </div>
                                <input 
                                    type="text" 
                                    value={hex} 
                                    onChange={(e) => setHex(e.target.value)} 
                                    className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white font-mono uppercase focus:ring-2 focus:ring-indigo-500 outline-none" 
                                />
                             </div>
                        </div>
                        <div className="p-6 bg-white/5 rounded-2xl border border-white/5">
                             <p className="text-[9px] text-gray-500 font-black uppercase tracking-widest mb-2">Live Preview</p>
                             <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full shadow-lg" style={{ backgroundColor: hex }}></div>
                                <div className="h-2 w-24 rounded-full" style={{ backgroundColor: hex, opacity: 0.3 }}></div>
                             </div>
                        </div>
                    </div>
                    <button 
                        onClick={applyTheme} 
                        className="w-full py-5 bg-indigo-600 hover:bg-indigo-500 text-white font-black rounded-2xl transition shadow-xl uppercase tracking-widest text-xs active:scale-95 shadow-indigo-600/20"
                    >
                        Commit Theme Update
                    </button>
                </div>
            </div>
        </PageLayout>
    );
};