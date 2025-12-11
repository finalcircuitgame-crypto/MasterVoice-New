
import React, { useState } from 'react';
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

// ... existing PlanPage, PrivacyPolicy, etc. (kept minimal for brevity if not changed, but must include exports)
export const PlansPage: React.FC<PageProps> = ({ onBack }) => {
    // ... same as before
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
                    onAction={() => {}}
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
