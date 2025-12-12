
import React, { useState, useEffect } from 'react';
import { PricingCard } from './LandingPage';

interface PageProps {
  onBack: () => void;
}

const PageLayout: React.FC<{ title: string; children: React.ReactNode; onBack: () => void; wide?: boolean }> = ({ title, children, onBack, wide }) => (
  <div className="min-h-screen bg-[#030014] text-white overflow-y-auto animate-slide-up relative font-['Outfit']">
    {/* Background Effects */}
    <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
       <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-indigo-600/10 rounded-full blur-[100px]" />
       <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
    </div>

    <div className={`relative z-10 container mx-auto px-6 py-12 ${wide ? 'max-w-7xl' : 'max-w-4xl'}`}>
      <button 
        onClick={onBack} 
        className="group flex items-center text-gray-400 hover:text-white transition mb-8"
      >
        <div className="p-2 rounded-full bg-white/5 group-hover:bg-white/10 mr-3 transition">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        </div>
        <span className="text-sm font-semibold tracking-wide">BACK</span>
      </button>

      <div className={`glass-panel p-8 md:p-12 rounded-3xl border border-white/10 ${wide ? 'bg-[#050510]/80' : ''}`}>
        <h1 className="text-4xl md:text-5xl font-bold mb-8 bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">{title}</h1>
        <div className="prose prose-invert prose-lg max-w-none text-gray-300">
            {children}
        </div>
      </div>
    </div>
  </div>
);

export const ApiKeyPage: React.FC<PageProps> = ({ onBack }) => {
    const [generatedKeys, setGeneratedKeys] = useState<{key: string, tier: string, created: string}[]>([]);
    const [selectedTier, setSelectedTier] = useState<'free' | 'pro' | 'elite'>('free');
    const [loading, setLoading] = useState(false);

    const generateKey = () => {
        setLoading(true);
        setTimeout(() => {
            const random = Array.from(crypto.getRandomValues(new Uint8Array(16))).map(b => b.toString(16).padStart(2, '0')).join('').substring(0, 16);
            const prefix = `mv_${selectedTier}_`;
            const newKey = `${prefix}${random}`;
            
            setGeneratedKeys(prev => [{
                key: newKey,
                tier: selectedTier,
                created: new Date().toLocaleDateString()
            }, ...prev]);
            setLoading(false);
        }, 600);
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        // Could show toast here
    };

    return (
        <PageLayout title="Developer Console" onBack={onBack} wide={true}>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                
                {/* Left Column: Generator */}
                <div className="lg:col-span-2 space-y-8">
                    <section className="bg-[#111] p-8 rounded-2xl border border-white/10 relative overflow-hidden">
                        <div className="relative z-10">
                            <h2 className="text-2xl font-bold text-white mb-2">Create New API Key</h2>
                            <p className="text-gray-400 mb-6 text-sm">Select a tier to generate a key with specific bandwidth and TURN relay capabilities.</p>
                            
                            <div className="grid grid-cols-3 gap-4 mb-8">
                                <button 
                                    onClick={() => setSelectedTier('free')}
                                    className={`p-4 rounded-xl border flex flex-col items-center gap-2 transition-all ${selectedTier === 'free' ? 'bg-white/10 border-indigo-500 text-white shadow-[0_0_20px_rgba(99,102,241,0.3)]' : 'bg-transparent border-white/10 text-gray-500 hover:border-white/30'}`}
                                >
                                    <span className="font-bold">Free</span>
                                    <span className="text-[10px] uppercase tracking-wider">P2P Only</span>
                                </button>
                                <button 
                                    onClick={() => setSelectedTier('pro')}
                                    className={`p-4 rounded-xl border flex flex-col items-center gap-2 transition-all ${selectedTier === 'pro' ? 'bg-white/10 border-indigo-500 text-white shadow-[0_0_20px_rgba(99,102,241,0.3)]' : 'bg-transparent border-white/10 text-gray-500 hover:border-white/30'}`}
                                >
                                    <span className="font-bold">Pro</span>
                                    <span className="text-[10px] uppercase tracking-wider">Standard TURN</span>
                                </button>
                                <button 
                                    onClick={() => setSelectedTier('elite')}
                                    className={`p-4 rounded-xl border flex flex-col items-center gap-2 transition-all ${selectedTier === 'elite' ? 'bg-gradient-to-br from-amber-500/20 to-orange-600/20 border-amber-500 text-amber-200 shadow-[0_0_20px_rgba(245,158,11,0.3)]' : 'bg-transparent border-white/10 text-gray-500 hover:border-white/30'}`}
                                >
                                    <span className="font-bold">Elite</span>
                                    <span className="text-[10px] uppercase tracking-wider">Global Relay</span>
                                </button>
                            </div>

                            <button 
                                onClick={generateKey} 
                                disabled={loading}
                                className="w-full py-4 bg-white text-black font-bold rounded-xl hover:bg-gray-200 transition active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {loading ? <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin"/> : <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" /></svg>}
                                <span>Generate Secret Key</span>
                            </button>
                        </div>
                    </section>

                    {/* Key List */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-bold text-gray-300">Active Keys</h3>
                        {generatedKeys.length === 0 && (
                            <div className="text-center py-12 border-2 border-dashed border-white/5 rounded-2xl">
                                <p className="text-gray-500 text-sm">No keys generated yet.</p>
                            </div>
                        )}
                        {generatedKeys.map((k, i) => (
                            <div key={i} className="flex items-center justify-between p-4 bg-[#0a0a0f] border border-white/10 rounded-xl animate-fade-in-up">
                                <div className="flex flex-col">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className={`w-2 h-2 rounded-full ${k.tier === 'elite' ? 'bg-amber-500' : k.tier === 'pro' ? 'bg-indigo-500' : 'bg-gray-500'}`}></span>
                                        <code className="text-sm font-mono text-white">{k.key}</code>
                                    </div>
                                    <span className="text-xs text-gray-500">Created {k.created} • {k.tier.toUpperCase()} Tier</span>
                                </div>
                                <button onClick={() => copyToClipboard(k.key)} className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" /></svg>
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Right Column: Stats */}
                <div className="lg:col-span-1">
                    <div className="bg-gradient-to-b from-[#1a1a20] to-[#0a0a0f] p-6 rounded-2xl border border-white/10 h-full">
                        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-6">Quota Usage</h3>
                        
                        <div className="space-y-6">
                            <div>
                                <div className="flex justify-between text-sm mb-2">
                                    <span className="text-white">Monthly Active Users</span>
                                    <span className="text-indigo-400">1,240 / 10k</span>
                                </div>
                                <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                                    <div className="h-full bg-indigo-500 w-[12%]"></div>
                                </div>
                            </div>

                            <div>
                                <div className="flex justify-between text-sm mb-2">
                                    <span className="text-white">TURN Bandwidth</span>
                                    <span className="text-indigo-400">45 GB / 100 GB</span>
                                </div>
                                <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                                    <div className="h-full bg-indigo-500 w-[45%]"></div>
                                </div>
                            </div>

                            <div className="pt-6 border-t border-white/5">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="p-3 bg-green-500/10 rounded-lg">
                                        <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-white">System Status</p>
                                        <p className="text-xs text-green-500">All Systems Operational</p>
                                    </div>
                                </div>
                                <button className="w-full py-2 bg-white/5 hover:bg-white/10 border border-white/5 rounded-lg text-xs font-bold text-gray-300">View Full Health Check</button>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </PageLayout>
    );
};

export const Documentation: React.FC<PageProps> = ({ onBack }) => {
    const [activeSection, setActiveSection] = useState(0);
    const [sdkPlan, setSdkPlan] = useState<'free' | 'pro' | 'elite'>('free');

    const sections = [
        "Introduction & Setup",
        "Authentication",
        "Session Management",
        "Realtime Messaging",
        "Group Management",
        "WebRTC Engine (Core)",
        "Voice & Audio Graph",
        "Video & Screen Share",
        "Events & Webhooks",
        "Troubleshooting & FAQ"
    ];

    const renderWebRTCConfig = () => {
        if (sdkPlan === 'free') {
            return `// ⚠️ Free Tier: STUN Only (P2P Mesh)
// High failure rate on corporate networks.
const config = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' }
  ],
  iceTransportPolicy: 'all'
};`;
        }
        if (sdkPlan === 'pro') {
            return `// ✅ Pro Tier: Standard TURN
// Reliable traversal, capped at 2Mbps.
const config = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { 
      urls: 'turn:us-east.mastervoice.dev:3478?transport=udp',
      username: 'pro_user_123',
      credential: 'generated_token_xyz'
    }
  ],
  bandwidth: '2048' // kbps limit
};`;
        }
        return `// 🚀 Elite Tier: Premium Global Relay
// Low latency, TCP fallback, unlimited bandwidth.
const config = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { 
      urls: 'turn:global-relay.mastervoice.dev:443?transport=tcp', // 443 bypasses firewalls
      username: 'elite_corp_001',
      credential: 'premium_token_abc'
    }
  ],
  videoConfig: {
    codec: 'VP9', // High efficiency
    bitrate: 'unlimited'
  }
};`;
    };

    return (
        <PageLayout title="MasterVoice SDK Reference" onBack={onBack} wide={true}>
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
                {/* Sidebar Navigation */}
                <div className="lg:col-span-1 border-r border-white/10 pr-6">
                    <h4 className="font-bold text-white mb-6 uppercase text-xs tracking-wider">SDK Modules</h4>
                    <ul className="space-y-1">
                        {sections.map((sec, i) => (
                            <li 
                                key={i} 
                                onClick={() => setActiveSection(i)}
                                className={`cursor-pointer px-4 py-3 rounded-xl text-sm font-medium transition-all ${activeSection === i ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                            >
                                {i + 1}. {sec}
                            </li>
                        ))}
                    </ul>
                    
                    <div className="mt-8 p-4 bg-indigo-500/10 rounded-xl border border-indigo-500/20">
                        <p className="text-xs text-indigo-300 font-bold mb-2">LATEST VERSION</p>
                        <p className="text-white font-mono text-sm">v2.2.0-beta</p>
                    </div>
                </div>

                {/* Content Area */}
                <div className="lg:col-span-3 min-h-[600px]">
                    {activeSection === 0 && (
                        <div className="animate-fade-in-up">
                            <h2 className="text-3xl font-bold text-white mb-4">1. Introduction & Setup</h2>
                            <p className="mb-6">The MasterVoice SDK provides a unified interface for Supabase Auth, Realtime database events, and WebRTC media handling. It abstracts the complexity of signaling and ICE negotiation.</p>
                            
                            <h3 className="text-xl font-bold text-white mb-2">Installation</h3>
                            <div className="bg-[#111] p-4 rounded-xl border border-white/10 mb-6 font-mono text-sm text-gray-300">
                                npm install @supabase/supabase-js mastervoice-sdk
                            </div>

                            <h3 className="text-xl font-bold text-white mb-2">Initialization</h3>
                            <pre className="bg-[#111] p-4 rounded-xl border border-white/10 overflow-x-auto text-sm text-gray-300">
{`import { MasterVoice } from 'mastervoice-sdk';

const client = new MasterVoice({
  apiKey: 'mv_pk_test_...',
  supabaseUrl: 'https://xyz.supabase.co',
  supabaseKey: 'eyJ...'
});`}
                            </pre>
                        </div>
                    )}

                    {activeSection === 1 && (
                        <div className="animate-fade-in-up">
                            <h2 className="text-3xl font-bold text-white mb-4">2. Authentication</h2>
                            <p className="mb-6">The SDK wraps Supabase GoTrue to provide session persistence and automatic token refreshing for WebSocket connections.</p>
                            <pre className="bg-[#111] p-4 rounded-xl border border-white/10 overflow-x-auto text-sm text-gray-300">
{`// Sign Up
const { user, error } = await client.auth.signUp({
  email: 'dev@example.com',
  password: 'secure-password'
});

// Sign In
const session = await client.auth.signInWithPassword({
  email: 'dev@example.com',
  password: 'secure-password'
});`}
                            </pre>
                        </div>
                    )}

                    {activeSection === 2 && (
                        <div className="animate-fade-in-up">
                            <h2 className="text-3xl font-bold text-white mb-4">3. Session Management</h2>
                            <p className="mb-6">Manage user presence and connection state.</p>
                            <ul className="list-disc pl-5 space-y-2 mb-6 text-gray-400">
                                <li><strong>Heartbeat:</strong> Automatically sends ping frames to keep the WebSocket open.</li>
                                <li><strong>Presence:</strong> Broadcasts online status to peers.</li>
                            </ul>
                            <pre className="bg-[#111] p-4 rounded-xl border border-white/10 overflow-x-auto text-sm text-gray-300">
{`// Listen to auth state changes
client.auth.onAuthStateChange((event, session) => {
  console.log('New state:', event);
});

// Get current user
const user = client.auth.user();`}
                            </pre>
                        </div>
                    )}

                    {activeSection === 3 && (
                        <div className="animate-fade-in-up">
                            <h2 className="text-3xl font-bold text-white mb-4">4. Realtime Messaging</h2>
                            <p className="mb-6">Send and receive end-to-end encrypted text messages via Supabase Realtime channels.</p>
                            <pre className="bg-[#111] p-4 rounded-xl border border-white/10 overflow-x-auto text-sm text-gray-300">
{`// Subscribe to a room
const channel = client.chat.subscribe('room_123');

// Send Message
await channel.send({
  content: 'Hello World',
  type: 'text/plain'
});

// Receive Message
channel.on('message', (msg) => {
  console.log('Received:', msg.content);
});`}
                            </pre>
                        </div>
                    )}

                    {activeSection === 4 && (
                        <div className="animate-fade-in-up">
                            <h2 className="text-3xl font-bold text-white mb-4">5. Group Management</h2>
                            <p className="mb-6">Create dynamic groups and manage memberships.</p>
                            <pre className="bg-[#111] p-4 rounded-xl border border-white/10 overflow-x-auto text-sm text-gray-300">
{`// Create Group
const group = await client.groups.create({ name: 'Developers' });

// Add Member
await client.groups.addMember(group.id, 'user_uuid_456');

// List Members
const members = await client.groups.getMembers(group.id);`}
                            </pre>
                        </div>
                    )}

                    {activeSection === 5 && (
                        <div className="animate-fade-in-up">
                            <h2 className="text-3xl font-bold text-white mb-4">6. WebRTC Engine</h2>
                            <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-xl mb-6">
                                <p className="text-amber-400 text-sm font-bold">⚠️ Bandwidth Throttling Active</p>
                                <p className="text-gray-400 text-sm mt-1">
                                    The SDK automatically configures ICE servers based on your API Key tier. Free tier keys are restricted to STUN (public) only.
                                </p>
                            </div>

                            {/* Plan Simulator */}
                            <div className="mb-8 bg-[#111] p-6 rounded-2xl border border-white/10">
                                <div className="flex gap-4 mb-4 border-b border-white/5 pb-4">
                                    <button onClick={() => setSdkPlan('free')} className={`px-4 py-2 rounded-lg text-sm font-bold transition ${sdkPlan === 'free' ? 'bg-gray-700 text-white' : 'text-gray-500 hover:text-white'}`}>Free SDK</button>
                                    <button onClick={() => setSdkPlan('pro')} className={`px-4 py-2 rounded-lg text-sm font-bold transition ${sdkPlan === 'pro' ? 'bg-indigo-600 text-white' : 'text-gray-500 hover:text-white'}`}>SDK Pro</button>
                                    <button onClick={() => setSdkPlan('elite')} className={`px-4 py-2 rounded-lg text-sm font-bold transition ${sdkPlan === 'elite' ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-black' : 'text-gray-500 hover:text-white'}`}>SDK Elite</button>
                                </div>
                                <p className="text-xs text-gray-500 uppercase tracking-widest mb-2">Generated Configuration</p>
                                <pre className="font-mono text-sm text-green-400 whitespace-pre-wrap">{renderWebRTCConfig()}</pre>
                            </div>

                            <p>To initialize the WebRTC engine with these settings:</p>
                            <pre className="bg-[#111] p-4 rounded-xl border border-white/10 overflow-x-auto text-sm text-gray-300 mt-2">
{`const rtc = client.webrtc.initialize(config);`}
                            </pre>
                        </div>
                    )}

                    {activeSection === 6 && (
                        <div className="animate-fade-in-up">
                            <h2 className="text-3xl font-bold text-white mb-4">7. Voice & Audio Graph</h2>
                            <p className="mb-6">The SDK creates an `AudioContext` graph for gain control and visualization.</p>
                            <pre className="bg-[#111] p-4 rounded-xl border border-white/10 overflow-x-auto text-sm text-gray-300">
{`// Start Call
await client.call.start(recipientId, { 
  audio: true, 
  video: false 
});

// Handle Incoming Stream
client.on('track', (track, stream) => {
  if (track.kind === 'audio') {
    const audio = new Audio();
    audio.srcObject = stream;
    audio.play();
  }
});`}
                            </pre>
                        </div>
                    )}

                    {activeSection === 7 && (
                        <div className="animate-fade-in-up">
                            <h2 className="text-3xl font-bold text-white mb-4">8. Video & Screen Share</h2>
                            <p className="mb-6">Handling multiple video tracks (Camera + Screen) simultaneously.</p>
                            <pre className="bg-[#111] p-4 rounded-xl border border-white/10 overflow-x-auto text-sm text-gray-300">
{`// Enable Camera
await client.call.enableVideo();

// Start Screen Share (Dual Stream)
await client.call.startScreenShare();

// The SDK automatically renegotiates the SDP offer 
// to include the second video track.`}
                            </pre>
                        </div>
                    )}

                    {activeSection === 8 && (
                        <div className="animate-fade-in-up">
                            <h2 className="text-3xl font-bold text-white mb-4">9. Events & Webhooks</h2>
                            <p className="mb-6">Listen to system events.</p>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-[#1a1a20] p-4 rounded-xl border border-white/5">
                                    <code className="text-indigo-400">call.incoming</code>
                                    <p className="text-xs text-gray-500 mt-1">Fired when an offer is received.</p>
                                </div>
                                <div className="bg-[#1a1a20] p-4 rounded-xl border border-white/5">
                                    <code className="text-indigo-400">call.connected</code>
                                    <p className="text-xs text-gray-500 mt-1">Fired when ICE connection is established.</p>
                                </div>
                                <div className="bg-[#1a1a20] p-4 rounded-xl border border-white/5">
                                    <code className="text-indigo-400">user.typing</code>
                                    <p className="text-xs text-gray-500 mt-1">Realtime typing indicator.</p>
                                </div>
                                <div className="bg-[#1a1a20] p-4 rounded-xl border border-white/5">
                                    <code className="text-indigo-400">error</code>
                                    <p className="text-xs text-gray-500 mt-1">Global error handler.</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeSection === 9 && (
                        <div className="animate-fade-in-up">
                            <h2 className="text-3xl font-bold text-white mb-4">10. Troubleshooting</h2>
                            
                            <div className="space-y-6">
                                <div className="bg-red-900/10 border border-red-500/20 p-6 rounded-xl">
                                    <h4 className="font-bold text-white mb-2">Issue: "View Members" only shows myself</h4>
                                    <p className="text-sm text-gray-300 mb-4">
                                        <strong>Cause:</strong> Row Level Security (RLS) policies in Supabase default to private. Authenticated users cannot see other profiles unless explicitly allowed.
                                    </p>
                                    <p className="text-sm text-gray-300 mb-2"><strong>Fix:</strong> Run the following SQL in your Supabase Editor:</p>
                                    <pre className="bg-black/50 p-3 rounded-lg text-xs font-mono text-green-400 overflow-x-auto">
{`create policy "Public profiles" 
on public.profiles for select 
using ( true );`}
                                    </pre>
                                </div>

                                <div className="bg-[#1a1a20] border border-white/10 p-6 rounded-xl">
                                    <h4 className="font-bold text-white mb-2">Issue: Connection Failed (ICE Error)</h4>
                                    <p className="text-sm text-gray-300">
                                        <strong>Cause:</strong> Symmetric NAT or Corporate Firewall blocking P2P.
                                        <br/>
                                        <strong>Fix:</strong> Upgrade to SDK Pro to enable TURN relay servers.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </PageLayout>
    );
}

// Update the export of PlansPage to include navigation props for the buttons
interface PlansPageProps extends PageProps {
  onNavigate?: (path: string) => void;
}

export const PlansPage: React.FC<PlansPageProps> = ({ onBack, onNavigate }) => {
    return (
        <PageLayout title="Plans & Pricing" onBack={onBack} wide={true}>
            <div className="text-center max-w-2xl mx-auto mb-16">
                <p className="text-xl text-gray-400">Transparent pricing for the SDK and managed cloud services.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20 not-prose">
                <PricingCard 
                    title="Developer"
                    price="Free"
                    features={["P2P Mesh (STUN)", "1,000 MAU", "Community Support"]}
                    cta="Start Building"
                    onAction={() => window.open('https://github.com/mastervoice', '_blank')}
                />
                <PricingCard 
                    title="Startup"
                    price="$49"
                    recommended={true}
                    features={["Standard TURN", "10,000 MAU", "Email Support", "99.9% SLA"]}
                    cta="Get API Key"
                    onAction={() => onNavigate?.('/api_key')}
                />
                <PricingCard 
                    title="Enterprise"
                    price="Custom"
                    features={["Global Premium Relay", "Unlimited MAU", "24/7 Phone Support", "On-premise Option"]}
                    cta="Contact Sales"
                    onAction={() => {}}
                />
            </div>
        </PageLayout>
    );
}

export const PrivacyPolicy: React.FC<PageProps> = ({ onBack }) => (
  <PageLayout title="Privacy Policy" onBack={onBack}><p>Standard privacy policy content...</p></PageLayout>
);
export const TermsOfService: React.FC<PageProps> = ({ onBack }) => (
  <PageLayout title="Terms of Service" onBack={onBack}><p>Standard terms content...</p></PageLayout>
);
export const ContactSupport: React.FC<PageProps> = ({ onBack }) => (
  <PageLayout title="Contact Support" onBack={onBack}><p>Support form...</p></PageLayout>
);
export const NotFoundPage: React.FC<PageProps> = ({ onBack }) => (
  <div className="min-h-screen flex items-center justify-center text-white"><button onClick={onBack}>Go Back</button></div>
);
