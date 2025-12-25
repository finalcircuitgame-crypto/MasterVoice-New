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
  <div className="my-8 rounded-3xl overflow-hidden border border-white/10 bg-[#050508] shadow-2xl group text-left">
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

/**
 * Renders a raw JSON view to mimic the REST API endpoint.
 */
export const TelemetryApiResponse: React.FC = () => {
    const [json, setJson] = useState<string>('{}');
    const [status, setStatus] = useState(200);

    useEffect(() => {
        fetch('/v2/telemetry', { headers: { 'Authorization': 'mv_elite_preview_key' } })
            .then(res => { setStatus(res.status); return res.json(); })
            .then(data => setJson(JSON.stringify(data, null, 2)));
    }, []);

    return (
        <div className="min-h-screen bg-black text-green-500 font-mono p-10 text-sm overflow-auto">
            <div className="mb-4 opacity-50 border-b border-green-900 pb-4">
                HTTP/1.1 {status} OK<br/>
                Content-Type: application/json<br/>
                Server: MasterVoice-Edge/2.5.0
            </div>
            <pre>{json}</pre>
        </div>
    );
};

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
                <div className="flex gap-4">
                    <a href="/v2/telemetry" target="_blank" className="px-4 py-2 border border-white/10 rounded-lg text-xs font-bold hover:bg-white/5 transition text-gray-400">View Raw API</a>
                    <button onClick={refresh} disabled={loading} className="px-4 py-2 bg-indigo-600 rounded-lg text-xs font-bold hover:bg-indigo-500 transition disabled:opacity-50 shadow-lg shadow-indigo-600/20">
                        {loading ? 'Refreshing...' : 'Force Refresh'}
                    </button>
                </div>
            </div>

            {error ? (
                <div className="bg-red-500/10 border border-red-500/20 p-12 rounded-[2.5rem] text-center animate-fade-in-up">
                    <h3 className="text-xl font-bold text-red-400 mb-2 uppercase tracking-tighter">Access Restricted</h3>
                    <p className="text-sm text-gray-500 font-medium mb-6">{error}</p>
                    <button onClick={onBack} className="text-[10px] font-black uppercase text-white bg-red-600 px-6 py-3 rounded-xl shadow-xl active:scale-95">Upgrade Identity</button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-fade-in-up">
                    {data.map((node, i) => (
                        <div key={node.id} className="bg-[#111] p-8 rounded-[2.5rem] border border-white/5 relative overflow-hidden group hover:border-indigo-500/30 transition-all duration-500 hover:shadow-2xl">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            <h4 className="text-xs font-black text-gray-500 uppercase tracking-widest mb-6 flex items-center justify-between">
                                {node.region}
                                <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${node.status === 'operational' ? 'bg-green-500' : 'bg-red-500'}`}></span>
                            </h4>
                            <div className="space-y-6">
                                <div>
                                    <p className="text-[10px] text-gray-600 font-black uppercase mb-1 tracking-[0.2em]">Round Trip Time</p>
                                    <p className="text-4xl font-black text-white">{node.metrics.rtt}<span className="text-lg opacity-30 ml-1">ms</span></p>
                                </div>
                                <div className="grid grid-cols-2 gap-6">
                                    <div>
                                        <p className="text-[9px] text-gray-600 font-black uppercase mb-1 tracking-[0.1em]">Jitter</p>
                                        <p className="text-lg font-bold text-indigo-400">{node.metrics.jitter}ms</p>
                                    </div>
                                    <div>
                                        <p className="text-[9px] text-gray-600 font-black uppercase mb-1 tracking-[0.1em]">Loss</p>
                                        <p className="text-lg font-bold text-fuchsia-400">{(node.metrics.packet_loss * 100).toFixed(2)}%</p>
                                    </div>
                                </div>
                                <div className="pt-6 border-t border-white/5">
                                    <div className="flex justify-between text-[10px] font-black uppercase mb-2 tracking-widest">
                                        <span className="text-gray-500">Node Load</span>
                                        <span className="text-white">{node.metrics.cpu_load}%</span>
                                    </div>
                                    <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden shadow-inner">
                                        <div className="h-full bg-gradient-to-r from-indigo-500 to-fuchsia-500 transition-all duration-1000" style={{ width: `${node.metrics.cpu_load}%` }}></div>
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
        { title: "Digital Sovereignty", content: (
            <div className="animate-fade-in-up space-y-8">
                <h2 className="text-white text-4xl font-black tracking-tighter">01. Philosophy of Decoupling</h2>
                <p className="text-lg">MasterVoice is designed to <strong>decouple identity from infrastructure</strong>. In standard centralized apps, your messages are hostages of a specific database. In the MasterVoice Mesh, your messages are ephemeral signed payloads that exist only on the devices of the participants, with the cloud acting as a secure vault only when authorized.</p>
                <div className="p-8 bg-indigo-500/10 rounded-[2.5rem] border border-indigo-500/20">
                    <h4 className="text-white font-bold mb-4">Core Tenets</h4>
                    <ul className="text-sm space-y-2 text-gray-400">
                        <li><strong className="text-indigo-300">P2P Priority:</strong> Never use a server when a direct bridge is available.</li>
                        <li><strong className="text-indigo-300">Stateless Signaling:</strong> Handshakes should never leave a disk-trace.</li>
                        <li><strong className="text-indigo-300">Zero-Knowledge Storage:</strong> Encryption keys never leave the peer node.</li>
                    </ul>
                </div>
            </div>
        )},
        { title: "Architecture: The Mesh", content: (
            <div className="animate-fade-in-up space-y-8">
                <h2 className="text-white text-4xl font-black tracking-tighter">02. Network Architecture</h2>
                <p>We utilize a <strong>Three-Tier Network Mesh</strong> to ensure 99.99% connectivity across all network environments, including strict corporate firewalls.</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {[
                        { t: "Signaling Hub", d: "WebSocket mesh powered by Supabase for metadata exchange." },
                        { t: "P2P Mesh", d: "Direct SRTP/DTLS encrypted tunnels between client devices." },
                        { t: "Relay Cloud", d: "Global TURN grid for symmetric NAT traversal." }
                    ].map((item, i) => (
                        <div key={i} className="bg-white/5 p-6 rounded-3xl border border-white/5">
                            <h4 className="text-white font-bold text-xs uppercase mb-2">{item.t}</h4>
                            <p className="text-[11px] text-gray-500 leading-relaxed">{item.d}</p>
                        </div>
                    ))}
                </div>
            </div>
        )},
        { title: "SDK: Core Initialization", content: (
            <div className="animate-fade-in-up space-y-8">
                <h2 className="text-white text-4xl font-black tracking-tighter">03. Bootstrapping the Client</h2>
                <p>The SDK is a lightweight wrapper around the Browser's Native WebRTC API, optimized for high-performance React applications.</p>
                <CodeBlock 
                    title="mv_init.ts"
                    code={`
import { MasterVoice } from '@mastervoice/sdk';

const client = new MasterVoice({
  apiKey: 'mv_elite_1a2b3c...',
  supabaseUrl: '...',
  supabaseKey: '...'
});

// Detect Plan Features
if (client.plan === 'elite') {
  await client.enableHighBitrate(true);
}
                    `}
                />
            </div>
        )},
        { title: "Identity Fingerprints", content: (
            <div className="animate-fade-in-up space-y-8">
                <h2 className="text-white text-4xl font-black tracking-tighter">04. Peer Authentication</h2>
                <p>Authentication happens at the hardware level. Every session generates a unique ephemeral certificate used for DTLS handshaking.</p>
                <CodeBlock 
                    title="auth_check.js"
                    code={`
client.on('call.connected', ({ fingerprint }) => {
  // Verify this SHA-256 string verbally with your peer
  console.log('Session Secure:', fingerprint);
});
                    `}
                />
            </div>
        )},
        { title: "Signaling: SDP Lifecycle", content: (
            <div className="animate-fade-in-up space-y-8">
                <h2 className="text-white text-4xl font-black tracking-tighter">05. Signaling Handshake</h2>
                <p>Signaling involves the exchange of <strong>Session Description Protocol (SDP)</strong> objects. MasterVoice automates the Offer/Answer cycle.</p>
                <div className="bg-[#111] p-8 rounded-[2.5rem] border border-white/5 text-xs font-mono space-y-2">
                   <p className="text-indigo-400">1. Client A: Creates Offer</p>
                   <p className="text-indigo-400">2. Signaling: Broadcasts payload</p>
                   <p className="text-fuchsia-400">3. Client B: Sets Remote, Creates Answer</p>
                   <p className="text-green-400">4. Final: ICE Candidates exchanged</p>
                </div>
            </div>
        )},
        { title: "Media: Opus & VP9", content: (
            <div className="animate-fade-in-up space-y-8">
                <h2 className="text-white text-4xl font-black tracking-tighter">06. Codec Optimization</h2>
                <p>We prioritize <strong>Opus (Audio)</strong> and <strong>VP9 (Video)</strong> for their superior compression-to-latency ratios.</p>
                <ul className="text-sm space-y-2">
                    <li><strong className="text-white">Opus:</strong> Variable bitrate from 6kbps to 510kbps.</li>
                    <li><strong className="text-white">VP9:</strong> Up to 50% better compression than H.264.</li>
                </ul>
            </div>
        )},
        { title: "ICE States: Connecting", content: (
            <div className="animate-fade-in-up space-y-8">
                <h2 className="text-white text-4xl font-black tracking-tighter">07. Interactive Connectivity Establishment</h2>
                <p>The ICE state machine is the heartbeat of a WebRTC session. The SDK monitors these transitions for automatic reconnection.</p>
                <CodeBlock title="ice_monitor.ts" code={`
client.on('ice.state', (state) => {
  if (state === 'checking') showSpinner();
  if (state === 'failed') triggerIceRestart();
});
                `}/>
            </div>
        )},
        { title: "STUN: Hole Punching", content: (
            <div className="animate-fade-in-up space-y-8">
                <h2 className="text-white text-4xl font-black tracking-tighter">08. STUN Discovery</h2>
                <p>STUN (Session Traversal Utilities for NAT) allows peers to discover their public IP and port, facilitating "Hole Punching" through routers.</p>
            </div>
        )},
        { title: "TURN: Relays (Elite)", content: (
            <div className="animate-fade-in-up space-y-8">
                <h2 className="text-white text-4xl font-black tracking-tighter">09. TURN Protocol Fallback</h2>
                <p>When P2P is blocked by a Symmetric NAT, we route traffic through our global <strong>Relay Grid</strong> using TURN (Traversal Using Relays around NAT).</p>
                <CodeBlock title="turn_config.js" code={`
// Automatically provided by Elite credentials
const servers = await client.getRelayNodes();
console.log('Nearest Node:', servers[0].location); 
                `}/>
            </div>
        )},
        { title: "SCTP Data Channels", content: (
            <div className="animate-fade-in-up space-y-8">
                <h2 className="text-white text-4xl font-black tracking-tighter">10. Binary Data Channels</h2>
                <p>Non-media data like file transfers or real-time gaming state is sent via <strong>SCTP (Stream Control Transmission Protocol)</strong> over the same DTLS bridge.</p>
            </div>
        )},
        { title: "Audio: Jitter Buffers", content: (
            <div className="animate-fade-in-up space-y-8">
                <h2 className="text-white text-4xl font-black tracking-tighter">11. Adaptive Jitter Buffers</h2>
                <p>The MasterVoice audio engine dynamically adjusts the playback delay buffer to compensate for network jitter without causing robotic audio artifacts.</p>
            </div>
        )},
        { title: "Video: Dynamic Bitrate", content: (
            <div className="animate-fade-in-up space-y-8">
                <h2 className="text-white text-4xl font-black tracking-tighter">12. Bitrate Orchestration</h2>
                <p>The SDK monitors <code>bytesReceived</code> in real-time. If packet loss rises, it automatically signals the remote peer to reduce the VP9 encoder resolution.</p>
            </div>
        )},
        { title: "Presence: CRDT Mesh", content: (
            <div className="animate-fade-in-up space-y-8">
                <h2 className="text-white text-4xl font-black tracking-tighter">13. Real-time Presence Sync</h2>
                <p>Online status is managed via a <strong>Conflict-free Replicated Data Type (CRDT)</strong> implemented over Supabase Presence clusters.</p>
            </div>
        )},
        { title: "Persistence: Vault RLS", content: (
            <div className="animate-fade-in-up space-y-8">
                <h2 className="text-white text-4xl font-black tracking-tighter">14. Data Persistence Layer</h2>
                <p>Postgres acts as the long-term memory. Row-Level Security (RLS) ensures that query results are cryptographically scoped to your authenticated identity.</p>
            </div>
        )},
        { title: "The /v2/telemetry API", content: (
            <div className="animate-fade-in-up space-y-8">
                <h2 className="text-white text-4xl font-black tracking-tighter">15. Global Telemetry Endpoint</h2>
                <p>The <code>/v2/telemetry</code> endpoint provides deep visibility into the health of the global relay grid. It is required for professional NOC integrations.</p>
                <CodeBlock title="telemetry_fetch.ts" code={`
// Fetch from the Elite NOC API
const data = await client.fetchTelemetry();
const nyHealth = data.find(d => d.region === 'US-EAST-1');
console.log('NY Latency:', nyHealth.metrics.rtt);
                `}/>
            </div>
        )},
        { title: "Security: DTLS Handshake", content: (
            <div className="animate-fade-in-up space-y-8">
                <h2 className="text-white text-4xl font-black tracking-tighter">16. The DTLS Shield</h2>
                <p>Every bridge is secured using <strong>Datagram Transport Layer Security (DTLS)</strong>. This provides the encryption keys for the SRTP media stream.</p>
            </div>
        )},
        { title: "Security: SRTP Packets", content: (
            <div className="animate-fade-in-up space-y-8">
                <h2 className="text-white text-4xl font-black tracking-tighter">17. Secure Real-time Transport</h2>
                <p>Media packets are individually encrypted with <strong>AES-GCM 256-bit</strong>. Even if intercepted, the payload is cryptographically indecipherable.</p>
            </div>
        )},
        { title: "UI: HSL Shading Math", content: (
            <div className="animate-fade-in-up space-y-8">
                <h2 className="text-white text-4xl font-black tracking-tighter">18. Theming Mathematics</h2>
                <p>The theme engine takes a base HSL color and generates a deterministic 11-shade palette using linear lightness interpolation.</p>
                <CodeBlock title="shading.js" code={`
const generatePalette = (h, s, l) => {
  return [95, 80, 60, 50, 40, 20].map(targetL => \`hsl(\${h}, \${s}%, \${targetL}%)\`);
};
                `}/>
            </div>
        )},
        { title: "UI: Resilient Assets", content: (
            <div className="animate-fade-in-up space-y-8">
                <h2 className="text-white text-4xl font-black tracking-tighter">19. Asset Failover Logic</h2>
                <p>If external APIs (like Giphy) are down, our "Gir" resilient engine instantly falls back to embedded Base64 or local CDN cached assets.</p>
            </div>
        )},
        { title: "Screen: Desktop Sharing", content: (
            <div className="animate-fade-in-up space-y-8">
                <h2 className="text-white text-4xl font-black tracking-tighter">20. Presentation Mode</h2>
                <p>Elite users can transmit screen content at 60fps. The SDK optimizes the encoder for text legibility rather than motion fluidity during sharing.</p>
            </div>
        )},
        { title: "Mobile: Energy Tuning", content: (
            <div className="animate-fade-in-up space-y-8">
                <h2 className="text-white text-4xl font-black tracking-tighter">21. Mobile Network Resilience</h2>
                <p>The SDK detects battery-saving modes and automatically switches to <strong>H.264 Hardware Acceleration</strong> when VP9 is too CPU-intensive.</p>
            </div>
        )},
        { title: "Error: Code Reference", content: (
            <div className="animate-fade-in-up space-y-8">
                <h2 className="text-white text-4xl font-black tracking-tighter">22. SDK Error codes</h2>
                <ul className="text-xs font-mono space-y-2 text-gray-500">
                    <li><strong className="text-red-400">ERR_ICE_TIMEOUT:</strong> NAT Hole punching failed after 10s.</li>
                    <li><strong className="text-red-400">ERR_MEDIA_DENIED:</strong> User blocked Mic/Camera access.</li>
                    <li><strong className="text-red-400">ERR_PLAN_QUOTA:</strong> MAU limit reached for this API key.</li>
                </ul>
            </div>
        )},
        { title: "Scaling: Group SFUs", content: (
            <div className="animate-fade-in-up space-y-8">
                <h2 className="text-white text-4xl font-black tracking-tighter">23. Selective Forwarding</h2>
                <p>Our upcoming SFU update will allow 50+ participants in a single room by intelligently routing only the active speaker's video track.</p>
            </div>
        )},
        { title: "Billing: MAU Quotas", content: (
            <div className="animate-fade-in-up space-y-8">
                <h2 className="text-white text-4xl font-black tracking-tighter">24. Usage Metering</h2>
                <p>Usage is metered by <strong>Monthly Active Users (MAU)</strong>. An active user is any identity that initiates or answers at least one call in a 30-day window.</p>
            </div>
        )},
        { title: "Automation: Bots", content: (
            <div className="animate-fade-in-up space-y-8">
                <h2 className="text-white text-4xl font-black tracking-tighter">25. Robotic Integrations</h2>
                <p>Build headless bots using the <code>Node.js</code> port of the MasterVoice SDK, perfect for automated testing or recording sessions.</p>
            </div>
        )},
        { title: "Privacy: Zero-IP Logs", content: (
            <div className="animate-fade-in-up space-y-8">
                <h2 className="text-white text-4xl font-black tracking-tighter">26. Privacy Preservation</h2>
                <p>Signaling logs are scrubbed of IP addresses every 6 hours. Metadata is stored only for session recovery and never sold to third parties.</p>
            </div>
        )},
        { title: "Future: 2026 Roadmap", content: (
            <div className="animate-fade-in-up space-y-8">
                <h2 className="text-white text-4xl font-black tracking-tighter">27. The Road Ahead</h2>
                <p>Q1 2026 will see the release of <strong>Quantum-Resistant Identity Keys</strong> and the public beta of the Bifrost SFU.</p>
            </div>
        )},
        { title: "Compliance: GDPR/CCPA", content: (
            <div className="animate-fade-in-up space-y-8">
                <h2 className="text-white text-4xl font-black tracking-tighter">28. Legal Standard Shield</h2>
                <p>MasterVoice is fully compliant with EU and US data privacy laws. We provide a <code>DELETE /v2/identity</code> endpoint for total user erasure.</p>
            </div>
        )},
        { title: "Dev: Local Testing", content: (
            <div className="animate-fade-in-up space-y-8">
                <h2 className="text-white text-4xl font-black tracking-tighter">29. Developing Locally</h2>
                <p>You can use <code>localhost</code> without SSL, but production deployments <strong>require HTTPS</strong> for Browser Media API access.</p>
            </div>
        )},
        { title: "Contact: SLA Support", content: (
            <div className="animate-fade-in-up space-y-8">
                <h2 className="text-white text-4xl font-black tracking-tighter">30. Elite SLA Consultation</h2>
                <p>Elite customers receive a dedicated Slack channel and 1-hour response times for network-critical issues.</p>
            </div>
        )}
    ];

    return (
        <PageLayout title="Technical Specification" onBack={onBack} wide={true}>
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-12 text-left">
                {/* TOC Sidebar */}
                <div className="lg:col-span-1 border-r border-white/10 pr-6 shrink-0 hidden lg:block max-h-[70vh] overflow-y-auto no-scrollbar sticky top-12">
                    <h4 className="font-black text-gray-600 mb-8 uppercase text-[10px] tracking-[0.4em] ml-2">Manual Chapters</h4>
                    <ul className="space-y-1">
                        {sections.map((sec, i) => (
                            <li 
                                key={i} 
                                onClick={() => setActiveSection(i)} 
                                className={`cursor-pointer px-4 py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all duration-300 ${activeSection === i ? 'bg-indigo-600 text-white shadow-2xl shadow-indigo-600/40 translate-x-1' : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'}`}
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
                    <div className="lg:hidden mb-12 text-left">
                         <label className="text-[10px] font-black text-gray-600 uppercase tracking-[0.3em] mb-4 block ml-2">Chapter Navigator</label>
                         <select 
                            value={activeSection} 
                            onChange={(e) => setActiveSection(parseInt(e.target.value))}
                            className="w-full bg-[#13131a] border border-white/10 p-5 rounded-[1.5rem] text-white text-xs font-black uppercase tracking-widest outline-none focus:ring-4 focus:ring-indigo-500/20 appearance-none"
                         >
                            {sections.map((sec, i) => <option key={i} value={i}>{i+1}. {sec.title}</option>)}
                         </select>
                    </div>

                    <div className="relative z-10 transition-all duration-700 min-h-[500px]">
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
        <div className="min-h-screen bg-[#030014] flex flex-col items-center justify-center relative font-['Outfit'] overflow-hidden text-center">
             <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
             <div className="absolute w-[80vw] h-[80vw] bg-indigo-600/10 rounded-full blur-[120px] animate-pulse"></div>
             <div className="relative z-10 max-w-md w-full p-12">
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
  <div className="min-h-screen bg-[#030014] flex flex-col items-center justify-center font-['Outfit'] relative overflow-hidden text-center">
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
                    <section className="bg-[#111] p-12 rounded-[3.5rem] border border-white/10 shadow-[0_0_100px_rgba(0,0,0,0.5)] relative overflow-hidden text-left">
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
                    
                    <div className="space-y-8 text-left">
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
                
                <div className="space-y-8 text-left">
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
        <div className="space-y-8 text-lg text-left">
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
            <div className="space-y-8 animate-fade-in-up text-left">
                <p className="text-gray-400 leading-relaxed">Modify the core visual identity of your MasterVoice terminal.</p>
                <div className="bg-[#111] p-10 rounded-[3rem] border border-white/5 shadow-2xl space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                        <div className="flex flex-col gap-2">
                             <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em] ml-1">Color Signature</label>
                             <div className="flex gap-4">
                                <div className="w-16 h-16 rounded-2xl border-2 border-white/10 overflow-hidden relative shadow-inner">
                                    <input type="color" value={hex} onChange={(e) => setHex(e.target.value)} className="absolute inset-0 w-[200%] h-[200%] -top-1/2 -left-1/2 cursor-pointer bg-transparent border-none" />
                                </div>
                                <input type="text" value={hex} onChange={(e) => setHex(e.target.value)} className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white font-mono uppercase focus:ring-2 focus:ring-indigo-500 outline-none shadow-inner" />
                             </div>
                        </div>
                    </div>
                    <button onClick={applyTheme} className="w-full py-5 bg-indigo-600 hover:bg-indigo-500 text-white font-black rounded-2xl transition shadow-xl uppercase tracking-widest text-xs active:scale-95 shadow-indigo-600/20">Commit Theme Update</button>
                </div>
            </div>
        </PageLayout>
    );
};
