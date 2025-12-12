
import React, { useState } from 'react';

// PricingCard is exported for use in Pages.tsx
export const PricingCard = ({ title, price, features, recommended = false, cta = "Get Started", onAction }: any) => (
    <div className={`p-8 rounded-[2rem] border flex flex-col h-full relative transition-all duration-500 hover:-translate-y-2 group ${recommended ? 'bg-gradient-to-b from-indigo-900/40 to-[#050510] border-indigo-500/50 shadow-2xl z-10 scale-105' : 'bg-white/5 border-white/5 hover:border-white/20'}`}>
        {recommended && <div className="absolute -top-5 left-1/2 -translate-x-1/2 px-6 py-2 bg-indigo-600 rounded-full text-xs font-bold uppercase shadow-lg text-white tracking-wider">Recommended</div>}
        <h3 className="text-xl font-bold mb-2 text-gray-300 group-hover:text-white transition-colors">{title}</h3>
        <div className="flex items-baseline gap-1 mb-6"><span className="text-4xl font-bold text-white">{price}</span></div>
        <ul className="space-y-4 flex-1 mb-8">
            {features.map((f: string, i: number) => (
                <li key={i} className="text-sm text-gray-400 flex gap-3 items-center">
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${recommended ? 'bg-indigo-500 text-white' : 'bg-white/10 text-gray-400'}`}>✓</div>
                    {f}
                </li>
            ))}
        </ul>
        <button onClick={onAction} className={`w-full py-4 rounded-xl font-bold transition-all active:scale-95 ${recommended ? 'bg-white text-black hover:bg-gray-200 shadow-[0_0_20px_rgba(255,255,255,0.3)]' : 'bg-white/5 text-white hover:bg-white/10'}`}>{cta}</button>
    </div>
);

interface LandingPageProps {
    onNavigate: (page: string) => void;
    isAuthenticated: boolean;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onNavigate, isAuthenticated }) => {
    const [activeSnippet, setActiveSnippet] = useState<'setup' | 'chat' | 'voice'>('setup');

    const snippets = {
        setup: `import { MasterVoice } from 'mastervoice-sdk';

// Initialize the client with Supabase
const client = new MasterVoice({
  apiKey: process.env.MV_API_KEY,
  supabaseUrl: 'https://xyz.supabase.co',
  supabaseKey: process.env.SUPABASE_KEY
});

// Ready to build! 🚀`,
        chat: `// Subscribe to a realtime channel
const channel = client.chat.subscribe('room_1');

// Send an encrypted message
await channel.send({
  content: 'Hello World',
  encrypted: true,
  priority: 'high'
});

// Listen for incoming messages
channel.on('message', (msg) => {
  console.log('New Message:', msg.content);
});`,
        voice: `// Start HD Voice Call with TURN Relay
const call = await client.call.start(recipientId, {
  audio: true,
  video: true,
  bandwidth: 'high', // Pro Tier feature
  iceTransportPolicy: 'relay'
});

call.on('connected', () => {
  console.log('Secure P2P connection established');
});`
    };

    const renderSnippet = (code: string) => {
        return code.split('\n').map((line, i) => {
            const html = line
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/import|const|new|await|from/g, '<span class="text-purple-400">$&</span>')
                .replace(/'[^']*'/g, '<span class="text-green-400">$&</span>')
                .replace(/\/\/.*/g, '<span class="text-gray-500">$&</span>')
                .replace(/MasterVoice/g, '<span class="text-yellow-400">$&</span>');

            return (
                <div key={i} className="table-row">
                    <span className="table-cell text-right pr-4 text-gray-700 select-none">{i + 1}</span>
                    <span className="table-cell" dangerouslySetInnerHTML={{ __html: html }} />
                </div>
            );
        });
    };

    return (
        <div className="min-h-screen bg-[#030014] text-white font-['Outfit'] overflow-x-hidden selection:bg-indigo-500/30">
            {/* Background Noise */}
            <div className="fixed inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none mix-blend-overlay z-0"></div>

            {/* Navbar */}
            <nav className="fixed top-0 w-full z-50 border-b border-white/5 bg-[#030014]/80 backdrop-blur-md">
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-tr from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center font-bold text-lg shadow-lg shadow-indigo-500/20">M</div>
                        <span className="font-bold text-xl tracking-tight">MasterVoice</span>
                    </div>
                    <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-400">
                        <button onClick={() => onNavigate('/docs')} className="hover:text-white transition">Documentation</button>
                        <button onClick={() => window.scrollTo({ top: 2000, behavior: 'smooth' })} className="hover:text-white transition">Pricing</button>
                        <button onClick={() => onNavigate('/contact')} className="hover:text-white transition">Support</button>
                    </div>
                    <div className="flex items-center gap-4">
                        {isAuthenticated ? (
                            <button onClick={() => onNavigate('/conversations')} className="px-6 py-2.5 bg-white text-black font-bold rounded-lg hover:bg-gray-200 transition shadow-lg shadow-white/10">
                                Open App
                            </button>
                        ) : (
                            <>
                                <button onClick={() => onNavigate('/login')} className="hidden md:block text-sm font-bold text-gray-300 hover:text-white transition">Sign In</button>
                                <button onClick={() => onNavigate('/register')} className="px-6 py-2.5 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-500 transition shadow-lg shadow-indigo-500/20">
                                    Get Started
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 px-6 z-10 overflow-hidden">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[80vw] h-[500px] bg-indigo-600/20 rounded-[100%] blur-[120px] pointer-events-none"></div>

                <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                    <div className="animate-fade-in-up">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-bold text-indigo-300 mb-6">
                            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                            v2.2.0 is now live
                        </div>
                        <h1 className="text-5xl md:text-7xl font-bold leading-tight mb-6 bg-clip-text text-transparent bg-gradient-to-b from-white to-gray-400">
                            Build <span className="text-indigo-500">Real-Time</span> Apps in Minutes.
                        </h1>
                        <p className="text-lg text-gray-400 mb-8 max-w-lg leading-relaxed">
                            The complete SDK for adding WebRTC voice, video, and encrypted chat to your Supabase project. No backend required.
                        </p>
                        <div className="flex flex-wrap gap-4">
                            <button onClick={() => onNavigate('/docs')} className="px-8 py-4 bg-white text-black font-bold rounded-xl hover:bg-gray-200 transition flex items-center gap-2">
                                Read the Docs
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                            </button>
                            <button onClick={() => onNavigate('/api_key')} className="px-8 py-4 bg-white/5 text-white font-bold rounded-xl border border-white/10 hover:bg-white/10 transition">
                                Get API Key
                            </button>
                        </div>
                        <div className="mt-12 flex items-center gap-8 opacity-60 grayscale hover:grayscale-0 transition-all duration-500">
                            {/* Tech Stack Logos (Simulated) */}
                            <div className="text-xl font-bold flex items-center gap-2"><div className="w-6 h-6 bg-green-500 rounded"></div> Supabase</div>
                            <div className="text-xl font-bold flex items-center gap-2"><div className="w-6 h-6 bg-blue-500 rounded"></div> React</div>
                            <div className="text-xl font-bold flex items-center gap-2"><div className="w-6 h-6 bg-orange-500 rounded"></div> WebRTC</div>
                        </div>
                    </div>

                    {/* Floating IDE */}
                    <div className="relative animate-float-delayed">
                        <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl blur opacity-30"></div>
                        <div className="relative bg-[#0d0d12] border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
                            {/* Window Title Bar */}
                            <div className="flex items-center justify-between px-4 py-3 bg-white/5 border-b border-white/5">
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
                                    <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
                                    <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
                                </div>
                                <div className="text-xs text-gray-500 font-mono">index.ts</div>
                                <div className="w-10"></div>
                            </div>

                            {/* Editor Tabs */}
                            <div className="flex border-b border-white/5">
                                {Object.keys(snippets).map((key) => (
                                    <button
                                        key={key}
                                        onClick={() => setActiveSnippet(key as any)}
                                        className={`px-6 py-2 text-xs font-mono border-r border-white/5 transition-colors ${activeSnippet === key ? 'bg-indigo-500/10 text-indigo-300 border-t-2 border-t-indigo-500' : 'text-gray-500 hover:text-gray-300'}`}
                                    >
                                        {key}.ts
                                    </button>
                                ))}
                            </div>

                            {/* Code Area */}
                            <div className="p-6 overflow-x-auto">
                                <pre className="font-mono text-sm leading-relaxed">
                                    <code className="text-gray-300">
                                        {renderSnippet(snippets[activeSnippet])}
                                    </code>
                                </pre>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Grid */}
            <section className="py-24 bg-[#05050a] relative z-10 border-t border-white/5">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-5xl font-bold mb-4">Everything you need.</h2>
                        <p className="text-gray-400 max-w-2xl mx-auto">Stop wrestling with STUN servers and signaling logic. We handle the heavy lifting.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="p-8 bg-white/5 rounded-3xl border border-white/5 hover:border-indigo-500/50 transition-colors group">
                            <div className="w-12 h-12 bg-indigo-500/20 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                <svg className="w-6 h-6 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                            </div>
                            <h3 className="text-xl font-bold mb-2">End-to-End Encrypted</h3>
                            <p className="text-gray-400 text-sm leading-relaxed">Messages and calls are encrypted peer-to-peer. We can't see your data even if we wanted to.</p>
                        </div>
                        <div className="p-8 bg-white/5 rounded-3xl border border-white/5 hover:border-purple-500/50 transition-colors group">
                            <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                            </div>
                            <div className="flex items-center gap-2 mb-2">
                                <h3 className="text-xl font-bold">Global Low Latency</h3>
                                <span className="text-[10px] bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded-full font-bold">PRO</span>
                            </div>
                            <p className="text-gray-400 text-sm leading-relaxed">
                                Intelligent TURN relay routing ensures &lt; 100ms latency even on restrictive corporate networks.
                            </p>
                        </div>
                        <div className="p-8 bg-white/5 rounded-3xl border border-white/5 hover:border-green-500/50 transition-colors group">
                            <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                            </div>
                            <h3 className="text-xl font-bold mb-2">Scalable Groups</h3>
                            <p className="text-gray-400 text-sm leading-relaxed">Built-in support for group chats, member management, and presence awareness.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Pricing Section */}
            <section className="py-24 relative z-10" id="pricing">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-5xl font-bold mb-4">Simple, Transparent Pricing</h2>
                        <p className="text-gray-400">Start for free, scale as you grow.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <PricingCard
                            title="Developer"
                            price="Free"
                            features={["P2P Mesh (STUN Only)", "1,000 MAU", "Community Support", "Basic Analytics"]}
                            cta="Start Building"
                            onAction={() => window.open('https://github.com/mastervoice', '_blank')}
                        />
                        <PricingCard
                            title="Startup"
                            price="$49"
                            recommended={true}
                            features={["Standard TURN Relay", "10,000 MAU", "Email Support", "99.9% Uptime SLA", "24hr Data Retention"]}
                            cta="Get API Key"
                            onAction={() => onNavigate('/api_key')}
                        />
                        <PricingCard
                            title="Enterprise"
                            price="Custom"
                            features={["Global Premium Relay", "Unlimited MAU", "24/7 Phone Support", "On-Premise Option", "SSO Integration"]}
                            cta="Contact Sales"
                            onAction={() => onNavigate('/contact')}
                        />
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="border-t border-white/5 py-12 bg-[#020205] relative z-10">
                <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8">
                    <div>
                        <div className="flex items-center gap-2 mb-6">
                            <div className="w-6 h-6 bg-indigo-600 rounded-lg flex items-center justify-center font-bold text-xs">M</div>
                            <span className="font-bold">MasterVoice</span>
                        </div>
                        <p className="text-xs text-gray-500">© 2024 MasterVoice Inc.</p>
                    </div>
                    <div>
                        <h4 className="font-bold mb-4">Product</h4>
                        <ul className="space-y-2 text-sm text-gray-400">
                            <li><button className="hover:text-white">Features</button></li>
                            <li><button className="hover:text-white">Pricing</button></li>
                            <li><button className="hover:text-white">SDK</button></li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="font-bold mb-4">Resources</h4>
                        <ul className="space-y-2 text-sm text-gray-400">
                            <li><button onClick={() => onNavigate('/docs')} className="hover:text-white">Documentation</button></li>
                            <li><button onClick={() => onNavigate('/api_key')} className="hover:text-white">API Keys</button></li>
                            <li><button className="hover:text-white">Status</button></li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="font-bold mb-4">Company</h4>
                        <ul className="space-y-2 text-sm text-gray-400">
                            <li><button className="hover:text-white">About</button></li>
                            <li><button className="hover:text-white">Blog</button></li>
                            <li><button onClick={() => onNavigate('/contact')} className="hover:text-white">Contact</button></li>
                        </ul>
                    </div>
                </div>
            </footer>
        </div>
    );
};
