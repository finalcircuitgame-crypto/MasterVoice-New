
import React, { useState } from 'react';

// PricingCard is exported for use in Pages.tsx
export const PricingCard = ({ title, price, features, recommended = false, cta = "Get Started", onAction }: any) => (
  <div className={`p-8 rounded-[2rem] border flex flex-col h-full relative transition-all duration-500 hover:-translate-y-2 group ${recommended ? 'bg-gradient-to-b from-indigo-900/40 to-[#050510] border-indigo-500/50 shadow-2xl z-10 scale-105' : 'bg-white/5 border-white/5 hover:border-white/20'}`}>
    {recommended && <div className="absolute -top-5 left-1/2 -translate-x-1/2 px-6 py-2 bg-indigo-600 rounded-full text-xs font-bold uppercase shadow-lg text-white tracking-wider">Recommended</div>}
    <h3 className="text-xl font-bold mb-2 text-gray-300 group-hover:text-white transition-colors">{title}</h3>
    <div className="flex items-baseline gap-1 mb-6"><span className="text-4xl font-bold text-white">{price}</span></div>
    <ul className="space-y-4 flex-1 mb-8">
        {features.map((f:string, i:number) => (
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
                        <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="hover:text-white transition">App</button>
                        <button onClick={() => window.scrollTo({ top: 800, behavior: 'smooth' })} className="hover:text-white transition">Features</button>
                        <button onClick={() => onNavigate('/plans/show-more')} className="hover:text-white transition">Pricing</button>
                        <button onClick={() => document.getElementById('developers')?.scrollIntoView({ behavior: 'smooth' })} className="text-indigo-400 hover:text-indigo-300 transition font-bold">Developers</button>
                    </div>
                    <div className="flex items-center gap-4">
                        {isAuthenticated ? (
                            <button onClick={() => onNavigate('/conversations')} className="px-6 py-2.5 bg-white text-black font-bold rounded-lg hover:bg-gray-200 transition shadow-lg shadow-white/10">
                                Open Chat
                            </button>
                        ) : (
                            <>
                                <button onClick={() => onNavigate('/login')} className="hidden md:block text-sm font-bold text-gray-300 hover:text-white transition">Sign In</button>
                                <button onClick={() => onNavigate('/register')} className="px-6 py-2.5 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-500 transition shadow-lg shadow-indigo-500/20">
                                    Join Free
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </nav>

            {/* Hero Section - CONSUMER FOCUSED */}
            <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 px-6 z-10 overflow-hidden">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[80vw] h-[500px] bg-indigo-600/20 rounded-[100%] blur-[120px] pointer-events-none"></div>
                
                <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                    <div className="animate-fade-in-up">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-bold text-indigo-300 mb-6">
                            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                            Secure P2P Messaging
                        </div>
                        <h1 className="text-5xl md:text-7xl font-bold leading-tight mb-6 bg-clip-text text-transparent bg-gradient-to-b from-white to-gray-400">
                            Connect Instantly.<br />
                            <span className="text-indigo-500">Securely.</span>
                        </h1>
                        <p className="text-lg text-gray-400 mb-8 max-w-lg leading-relaxed">
                            Experience crystal clear voice, HD video, and encrypted chats. No ads, no tracking, just connection.
                        </p>
                        <div className="flex flex-wrap gap-4">
                            <button onClick={() => onNavigate(isAuthenticated ? '/conversations' : '/register')} className="px-8 py-4 bg-white text-black font-bold rounded-xl hover:bg-gray-200 transition flex items-center gap-2 shadow-xl shadow-white/10">
                                Launch Web App
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                            </button>
                            <button onClick={() => onNavigate('/plans/show-more')} className="px-8 py-4 bg-white/5 text-white font-bold rounded-xl border border-white/10 hover:bg-white/10 transition">
                                View Plans
                            </button>
                        </div>
                    </div>

                    {/* Chat App Mockup */}
                    <div className="relative animate-float-delayed lg:ml-auto w-full max-w-md">
                        <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-[2rem] blur opacity-30"></div>
                        <div className="relative bg-[#0c0c10] border border-white/10 rounded-[2rem] overflow-hidden shadow-2xl flex flex-col aspect-[4/5] md:aspect-[3/4]">
                            {/* Mock Header */}
                            <div className="h-16 bg-[#111116] border-b border-white/5 flex items-center px-6 justify-between shrink-0">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 relative">
                                        <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-[#111116]"></div>
                                    </div>
                                    <div>
                                        <div className="h-3 w-24 bg-white/20 rounded mb-1.5"></div>
                                        <div className="h-2 w-16 bg-white/10 rounded"></div>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <div className="w-8 h-8 rounded-full bg-white/5"></div>
                                    <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs shadow-lg shadow-indigo-500/20">📞</div>
                                </div>
                            </div>
                            
                            {/* Mock Messages */}
                            <div className="flex-1 p-6 space-y-6 overflow-hidden relative">
                                <div className="absolute inset-0 bg-gradient-to-t from-[#0c0c10] to-transparent h-20 top-auto bottom-0 pointer-events-none"></div>
                                
                                <div className="flex gap-3 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
                                    <div className="w-8 h-8 rounded-full bg-gray-700 shrink-0 mt-auto"></div>
                                    <div className="bg-white/10 p-4 rounded-2xl rounded-bl-none text-xs text-gray-300 max-w-[80%] leading-relaxed">
                                        Hey! Have you tried the new voice features yet? The latency is insane! 🎙️
                                    </div>
                                </div>

                                <div className="flex gap-3 flex-row-reverse animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
                                    <div className="bg-indigo-600 p-4 rounded-2xl rounded-br-none text-xs text-white max-w-[80%] leading-relaxed shadow-lg shadow-indigo-500/10">
                                        Yeah! Just hopped off a call. It feels like we're in the same room. Super crisp audio.
                                    </div>
                                </div>

                                <div className="flex gap-3 animate-fade-in-up" style={{ animationDelay: '0.5s' }}>
                                    <div className="w-8 h-8 rounded-full bg-gray-700 shrink-0 mt-auto"></div>
                                    <div className="bg-white/10 p-4 rounded-2xl rounded-bl-none text-xs text-gray-300 max-w-[80%] leading-relaxed">
                                        And it's all end-to-end encrypted? Even the video? 🔒
                                    </div>
                                </div>

                                <div className="flex gap-3 flex-row-reverse animate-fade-in-up" style={{ animationDelay: '0.7s' }}>
                                    <div className="bg-indigo-600 p-4 rounded-2xl rounded-br-none text-xs text-white max-w-[80%] leading-relaxed shadow-lg shadow-indigo-500/10">
                                        100%. WebRTC P2P encryption by default.
                                    </div>
                                </div>
                            </div>

                            {/* Mock Input */}
                            <div className="p-4 bg-[#111116] border-t border-white/5 shrink-0">
                                <div className="h-12 bg-white/5 rounded-full w-full flex items-center px-4 justify-between border border-white/5">
                                    <div className="h-2 w-32 bg-white/10 rounded"></div>
                                    <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M12 5l7 7-7 7" /></svg>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="py-24 bg-[#05050a] relative z-10 border-t border-white/5">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-5xl font-bold mb-4">Chat. Talk. Connect.</h2>
                        <p className="text-gray-400 max-w-2xl mx-auto">Everything you need to stay close to your team, friends, and family.</p>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="p-8 bg-white/5 rounded-3xl border border-white/5 hover:border-indigo-500/50 transition-colors group">
                            <div className="w-12 h-12 bg-indigo-500/20 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                <svg className="w-6 h-6 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                            </div>
                            <h3 className="text-xl font-bold mb-2">Private by Default</h3>
                            <p className="text-gray-400 text-sm leading-relaxed">Your conversations are yours. End-to-end encryption ensures only you and the recipient can read them.</p>
                        </div>
                        <div className="p-8 bg-white/5 rounded-3xl border border-white/5 hover:border-purple-500/50 transition-colors group">
                            <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
                            </div>
                            <h3 className="text-xl font-bold mb-2">HD Voice & Video</h3>
                            <p className="text-gray-400 text-sm leading-relaxed">Low-latency audio engine powered by WebRTC. Experience conversations as if you're in the same room.</p>
                        </div>
                        <div className="p-8 bg-white/5 rounded-3xl border border-white/5 hover:border-green-500/50 transition-colors group">
                            <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                            </div>
                            <h3 className="text-xl font-bold mb-2">Groups & Communities</h3>
                            <p className="text-gray-400 text-sm leading-relaxed">Create spaces for your team or friends. Share files, media, and screens instantly.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Developer Section - THE SPECIFIC SECTION */}
            <section id="developers" className="py-32 relative bg-[#020205] border-t border-white/10 overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 mix-blend-overlay"></div>
                <div className="absolute top-0 right-0 w-[50vw] h-[50vw] bg-indigo-900/10 rounded-full blur-[120px] pointer-events-none"></div>

                <div className="max-w-7xl mx-auto px-6 relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                    <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-xs font-bold text-indigo-400 mb-6">
                             For Developers
                        </div>
                        <h2 className="text-4xl md:text-5xl font-bold mb-6">Powered by the <br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">MasterVoice SDK</span></h2>
                        <p className="text-xl text-gray-400 mb-8 leading-relaxed">
                            Want to build this exact experience into your own application? Our SDK handles the complex signaling, ICE negotiation, and state management for you.
                        </p>
                        <div className="flex flex-wrap gap-4">
                            <button onClick={() => onNavigate('/dev')} className="px-8 py-4 bg-white text-black font-bold rounded-xl hover:bg-gray-200 transition">
                                Developer Console
                            </button>
                            <button onClick={() => onNavigate('/docs')} className="px-8 py-4 bg-transparent border border-white/20 text-white font-bold rounded-xl hover:bg-white/5 transition">
                                Read Documentation
                            </button>
                        </div>
                        
                        <div className="mt-12 grid grid-cols-2 gap-6">
                            <div>
                                <h4 className="font-bold text-white mb-1">5 Minute Setup</h4>
                                <p className="text-sm text-gray-500">Drop-in React hooks and components.</p>
                            </div>
                            <div>
                                <h4 className="font-bold text-white mb-1">Global Low Latency</h4>
                                <p className="text-sm text-gray-500">Premium TURN relay network included.</p>
                            </div>
                        </div>
                    </div>

                    {/* Floating IDE (Moved Here) */}
                    <div className="relative">
                        <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl blur opacity-20"></div>
                        <div className="relative bg-[#0d0d12] border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
                            {/* Window Title Bar */}
                            <div className="flex items-center justify-between px-4 py-3 bg-white/5 border-b border-white/5">
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
                                    <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
                                    <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
                                </div>
                                <div className="text-xs text-gray-500 font-mono">sdk_example.ts</div>
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
                            <div className="p-6 overflow-x-auto min-h-[300px]">
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

            {/* Pricing CTA */}
            <section className="py-24 px-6 border-t border-white/5">
                <div className="max-w-4xl mx-auto text-center">
                    <h2 className="text-3xl font-bold mb-6">Ready to get started?</h2>
                    <p className="text-gray-400 mb-8">Join thousands of users communicating securely today.</p>
                    <div className="flex justify-center gap-4">
                        <button onClick={() => onNavigate('/register')} className="px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition shadow-lg shadow-indigo-600/20">Sign Up Free</button>
                        <button onClick={() => onNavigate('/plans/show-more')} className="px-8 py-4 bg-white/5 hover:bg-white/10 text-white font-bold rounded-xl border border-white/10 transition">Compare Plans</button>
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
                            <li><button onClick={() => onNavigate('/conversations')} className="hover:text-white">Web App</button></li>
                            <li><button className="hover:text-white">Desktop (Coming Soon)</button></li>
                            <li><button onClick={() => onNavigate('/plans/show-more')} className="hover:text-white">Pricing</button></li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="font-bold mb-4">Developers</h4>
                        <ul className="space-y-2 text-sm text-gray-400">
                            <li><button onClick={() => onNavigate('/docs')} className="hover:text-white">Documentation</button></li>
                            <li><button onClick={() => onNavigate('/api_key')} className="hover:text-white">API Keys</button></li>
                            <li><button onClick={() => onNavigate('/dev')} className="hover:text-white">SDK</button></li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="font-bold mb-4">Company</h4>
                        <ul className="space-y-2 text-sm text-gray-400">
                            <li><button className="hover:text-white">About</button></li>
                            <li><button onClick={() => onNavigate('/contact')} className="hover:text-white">Contact</button></li>
                            <li><button onClick={() => onNavigate('/privacy')} className="hover:text-white">Privacy</button></li>
                        </ul>
                    </div>
                </div>
            </footer>
        </div>
    );
};
