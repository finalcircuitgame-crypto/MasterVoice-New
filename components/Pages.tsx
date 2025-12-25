import React, { useState, useEffect } from 'react';
import { PricingCard } from './LandingPage';
import { useModal } from './ModalContext';
import { useMasterVoice, TelemetryData } from '../sdk';

interface PageProps {
  onBack: () => void;
  onNavigate?: (path: string) => void;
}

const PageLayout: React.FC<{ title: string; children: React.ReactNode; onBack?: () => void; wide?: boolean }> = ({ title, children, onBack, wide }) => (
  <div className="min-h-screen bg-[#030014] text-white overflow-y-auto animate-slide-up relative font-['Outfit'] selection:bg-indigo-500/30">
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
                <span>Version 2.5.1-LATEST</span>
                <span className="w-1 h-1 bg-gray-700 rounded-full"></span>
                <span>Last Updated: Dec 2025</span>
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

const CodeBlock: React.FC<{ code: string; language?: string; title?: string }> = ({ code, title }) => (
  <div className="my-8 rounded-3xl overflow-hidden border border-white/10 bg-[#050508] shadow-2xl group">
    {title && (
      <div className="px-6 py-3 border-b border-white/5 bg-white/5 flex justify-between items-center">
        <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400">{title}</span>
        <div className="flex gap-1.5">
          <div className="w-2 h-2 rounded-full bg-red-500/50"></div>
          <div className="w-2 h-2 rounded-full bg-yellow-500/50"></div>
          <div className="w-2 h-2 rounded-full bg-green-500/50"></div>
        </div>
      </div>
    )}
    <div className="p-8 overflow-x-auto">
      <pre className="text-xs md:text-sm font-mono leading-relaxed text-indigo-200">
        <code>{code.trim()}</code>
      </pre>
    </div>
  </div>
);

export const TelemetryPage: React.FC<PageProps> = ({ onBack }) => {
    const mv = useMasterVoice();
    const [data, setData] = useState<TelemetryData[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const refresh = async () => {
        setLoading(true);
        setError(null);
        try {
            const stats = await mv.fetchTelemetry();
            setData(stats);
        } catch (e: any) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { refresh(); }, []);

    return (
        <PageLayout title="Global NOC Dashboard" onBack={onBack} wide={true}>
            <div className="flex justify-between items-center mb-8">
                <p className="text-gray-500 font-bold uppercase text-[10px] tracking-widest">Real-time Network Operations Center - ELITE Tier</p>
                <button onClick={refresh} disabled={loading} className="px-4 py-2 bg-indigo-600 rounded-lg text-xs font-bold hover:bg-indigo-500 transition disabled:opacity-50">
                    {loading ? 'Refreshing Signal...' : 'Force Refresh'}
                </button>
            </div>

            {error ? (
                <div className="bg-red-500/10 border border-red-500/20 p-12 rounded-[2.5rem] text-center">
                    <h3 className="text-xl font-bold text-red-400 mb-2">Access Restriced</h3>
                    <p className="text-sm text-gray-500">{error}</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {data.map((node, i) => (
                        <div key={i} className="bg-[#111] p-6 rounded-[2rem] border border-white/5 relative overflow-hidden group hover:border-indigo-500/30 transition-all">
                            <div className="absolute top-0 right-0 w-16 h-16 bg-indigo-500/5 blur-2xl"></div>
                            <h4 className="text-xs font-black text-gray-500 uppercase tracking-widest mb-4 flex items-center justify-between">
                                {node.region}
                                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                            </h4>
                            <div className="space-y-4">
                                <div>
                                    <p className="text-[10px] text-gray-600 font-bold uppercase mb-1">Latency (RTT)</p>
                                    <p className="text-2xl font-black text-white">{node.rtt}ms</p>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-[9px] text-gray-600 font-bold uppercase mb-0.5">Jitter</p>
                                        <p className="text-sm font-bold text-indigo-400">{node.jitter}ms</p>
                                    </div>
                                    <div>
                                        <p className="text-[9px] text-gray-600 font-bold uppercase mb-0.5">Loss</p>
                                        <p className="text-sm font-bold text-fuchsia-400">{node.packetLoss}%</p>
                                    </div>
                                </div>
                                <div className="pt-4 border-t border-white/5">
                                    <div className="flex justify-between text-[9px] font-bold uppercase mb-1">
                                        <span className="text-gray-500">Node Load</span>
                                        <span className="text-white">{node.load}%</span>
                                    </div>
                                    <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                                        <div className="h-full bg-indigo-500" style={{ width: `${node.load}%` }}></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </PageLayout>
    );
};

export const Documentation: React.FC<PageProps> = ({ onBack }) => {
    const [activeSection, setActiveSection] = useState(0);

    const sections = [
        { title: "Sovereign Messaging", content: (
            <div className="animate-fade-in-up space-y-8">
                <h2 className="text-white text-4xl font-black tracking-tighter">01. Digital Sovereignty</h2>
                <p>MasterVoice is built on the philosophy that <strong>privacy is a fundamental human right</strong>. Unlike "black box" messengers, our platform uses your local hardware as the primary node for media processing. By the end of 2025, our goal is to move 99% of computation to the edge.</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-12">
                    <div className="p-8 bg-white/5 rounded-[2.5rem] border border-white/5">
                        <h4 className="text-white font-bold mb-4">True P2P</h4>
                        <p className="text-sm text-gray-500">Your voice packets travel directly between devices. No middle-man, no server lag, no eavesdropping.</p>
                    </div>
                    <div className="p-8 bg-white/5 rounded-[2.5rem] border border-white/5">
                        <h4 className="text-white font-bold mb-4">AES-GCM</h4>
                        <p className="text-sm text-gray-500">Every byte is encrypted using the industry gold standard, ensuring cryptographic integrity.</p>
                    </div>
                </div>
            </div>
        )},
        { title: "System Architecture", content: (
            <div className="animate-fade-in-up space-y-8">
                <h2 className="text-white text-4xl font-black tracking-tighter">02. High-Level Architecture</h2>
                <p>The MasterVoice ecosystem consists of three distinct layers working in perfect harmony to deliver sub-100ms latency communication.</p>
                <ul className="space-y-4 text-sm">
                    <li><strong className="text-indigo-400">Layer 1: The Signaling Mesh</strong> - Ephemeral WebSocket clusters that facilitate the initial handshake between peers.</li>
                    <li><strong className="text-fuchsia-400">Layer 2: The Media Fabric</strong> - The WebRTC pipeline responsible for audio/video capture, encoding (Opus/VP9), and transport.</li>
                    <li><strong className="text-emerald-400">Layer 3: The Persistence Vault</strong> - Supabase Postgres for storing your message history with military-grade RLS protection.</li>
                </ul>
            </div>
        )},
        { title: "SDK Rapid Setup", content: (
            <div className="animate-fade-in-up space-y-8">
                <h2 className="text-white text-4xl font-black tracking-tighter">03. Rapid SDK Bootstrapping</h2>
                <p>Integrate professional communication into your app in under 60 seconds. The SDK handles the complex RTC state machines so you don't have to.</p>
                <CodeBlock 
                    title="initialize.js"
                    code={`
import { MasterVoice } from '@mastervoice/sdk';

const mv = new MasterVoice({
  apiKey: 'mv_pro_xxxxxxx',
  supabaseUrl: '...',
  supabaseKey: '...'
});

console.log('MasterVoice Protocol Active.');
                    `}
                />
            </div>
        )},
        { title: "RESTful Telemetry", content: (
            <div className="animate-fade-in-up space-y-8">
                <h2 className="text-white text-4xl font-black tracking-tighter">25. /v2/telemetry Reference</h2>
                <p>Elite-tier users can pull real-time health metrics for the entire global relay grid. This is essential for enterprise-grade NOC dashboards.</p>
                <CodeBlock 
                    title="fetch_telemetry.ts"
                    code={`
// Authenticate with Elite Key
const mv = new MasterVoice({ apiKey: 'mv_elite_...' });

// Fetch real-time health across all regions
const stats = await mv.fetchTelemetry();

stats.forEach(node => {
  console.log(\`Node \${node.region}: \${node.rtt}ms RTT, \${node.packetLoss}% loss\`);
});
                    `}
                />
            </div>
        )},
        { title: "SFU v3.0 Roadmap", content: (
            <div className="animate-fade-in-up space-y-8">
                <h2 className="text-white text-4xl font-black tracking-tighter">30. The Road to 10,000 Peers</h2>
                <p>Our next evolution is the <strong>Bifrost SFU</strong>. It will allow massive 10,000-user group calls with sub-250ms latency by early 2026.</p>
            </div>
        )}
    ];

    return (
        <PageLayout title="SDK & Technical Reference" onBack={onBack} wide={true}>
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-12 text-left">
                <div className="lg:col-span-1 border-r border-white/10 pr-6 shrink-0 hidden lg:block max-h-[70vh] overflow-y-auto no-scrollbar sticky top-12">
                    <h4 className="font-black text-gray-600 mb-8 uppercase text-[10px] tracking-[0.4em] ml-2">Manual Chapters</h4>
                    <ul className="space-y-1">
                        {sections.map((sec, i) => (
                            <li 
                                key={i} 
                                onClick={() => setActiveSection(i)} 
                                className={`cursor-pointer px-4 py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all duration-300 ${activeSection === i ? 'bg-indigo-600 text-white shadow-2xl shadow-indigo-600/40' : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'}`}
                            >
                                <div className="flex items-center gap-3">
                                    <span className={`w-5 h-5 rounded-full flex items-center justify-center border text-[9px] ${activeSection === i ? 'bg-white/20 border-white/20' : 'bg-transparent border-white/10'}`}>{i + 1}</span>
                                    <span className="truncate">{sec.title}</span>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>

                <div className="lg:col-span-3 min-h-[800px] bg-[#020205]/60 p-6 md:p-12 rounded-[3.5rem] border border-white/5 shadow-inner relative">
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

                    <div className="mt-32 pt-12 border-t border-white/5 flex justify-between items-center">
                         {activeSection > 0 ? (
                             <button onClick={() => setActiveSection(prev => prev - 1)} className="group flex items-center gap-5 text-gray-500 hover:text-white transition-all">
                                <div className="w-12 h-12 rounded-full border border-white/10 flex items-center justify-center group-hover:bg-indigo-600 group-hover:border-indigo-600 transition-all group-hover:-translate-x-2">←</div>
                                <div className="text-left"><p className="text-[9px] font-black uppercase tracking-[0.2em] opacity-40">Previous</p><p className="text-sm font-bold tracking-tight">{sections[activeSection - 1].title}</p></div>
                             </button>
                         ) : <div />}

                         {activeSection < sections.length - 1 ? (
                             <button onClick={() => setActiveSection(prev => prev + 1)} className="group flex items-center gap-5 text-gray-500 hover:text-white transition-all text-right">
                                <div className="text-right"><p className="text-[9px] font-black uppercase tracking-[0.2em] opacity-40">Next</p><p className="text-sm font-bold tracking-tight">{sections[activeSection + 1].title}</p></div>
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
                <p className="text-gray-500 text-sm leading-relaxed font-medium">Secure provisioner for authorization tokens and network identity keys.</p>
            </div>
            <div onClick={() => onNavigate?.('/telemetry')} className="p-10 bg-[#13131a] border border-white/5 rounded-[3rem] cursor-pointer hover:bg-[#1a1a20] transition-all group hover:scale-[1.03] shadow-2xl relative overflow-hidden md:col-span-2">
                <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/5 blur-3xl"></div>
                <div className="w-14 h-14 rounded-[1.5rem] bg-green-500/10 flex items-center justify-center text-green-400 mb-8 group-hover:scale-110 transition border border-green-500/20 shadow-lg"><svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg></div>
                <h3 className="text-3xl font-black text-white mb-3 tracking-tighter uppercase">NOC Telemetry</h3>
                <p className="text-gray-500 text-sm leading-relaxed font-medium">Restricted /v2/telemetry endpoint dashboard. Real-time RTT and packet loss analysis for Elite users.</p>
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
                        <p className="text-xs text-gray-400 leading-relaxed font-bold">Treat your API keys as biological DNA. Rotate keys every 30 cycles.</p>
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
        ] }
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
            <p className="text-gray-400 leading-relaxed">Monthly Active User (MAU) limits are the primary mechanism for balancing infrastructure costs associated with <strong>Realtime TURN Media Relay</strong>.</p>
            <div className="p-10 bg-indigo-600/10 border border-indigo-500/20 rounded-[3rem] shadow-xl">
                <h5 className="text-white font-black text-xl mb-4 tracking-tight">Enterprise Scale Orchestration</h5>
                <p className="text-sm text-gray-500 leading-relaxed font-medium">Organizations requiring massive concurrency (1M+ MAU) should contact our network orchestration department.</p>
            </div>
        </div>
    </PageLayout>
);

export const ThemeEditorPage: React.FC<PageProps> = ({ onBack, onNavigate }) => {
    const { showAlert } = useModal();
    const [hex, setHex] = useState(localStorage.getItem('mv_theme_custom_hex') || '#6366f1');

    const applyTheme = () => {
        const root = document.documentElement;
        root.style.setProperty('--theme-500', hex);
        root.style.setProperty('--theme-600', hex);
        localStorage.setItem('mv_theme_custom_hex', hex);
        showAlert?.("Success", "Theme protocol synchronized successfully.");
    };

    return (
        <PageLayout title="Theme Orchestrator" onBack={onBack}>
            <div className="space-y-8 animate-fade-in-up">
                <p className="text-gray-400 leading-relaxed">Modify the core visual identity of your MasterVoice terminal.</p>
                <div className="bg-[#111] p-10 rounded-[3rem] border border-white/5 shadow-2xl space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                        <div className="flex flex-col gap-2">
                             <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em] ml-1">Color Signature</label>
                             <div className="flex gap-4">
                                <div className="w-16 h-16 rounded-2xl border-2 border-white/10 overflow-hidden relative shadow-inner">
                                    <input type="color" value={hex} onChange={(e) => setHex(e.target.value)} className="absolute inset-0 w-[200%] h-[200%] -top-1/2 -left-1/2 cursor-pointer bg-transparent border-none" />
                                </div>
                                <input type="text" value={hex} onChange={(e) => setHex(e.target.value)} className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white font-mono uppercase focus:ring-2 focus:ring-indigo-500 outline-none" />
                             </div>
                        </div>
                    </div>
                    <button onClick={applyTheme} className="w-full py-5 bg-indigo-600 hover:bg-indigo-500 text-white font-black rounded-2xl transition shadow-xl uppercase tracking-widest text-xs active:scale-95 shadow-indigo-600/20">Commit Theme Update</button>
                </div>
            </div>
        </PageLayout>
    );
};
