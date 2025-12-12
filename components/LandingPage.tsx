import React, { useState } from 'react';

// --- Components ---

// Reusing your PricingCard with slight sizing adjustments for the chat view
export const PricingCard = ({ title, price, features, recommended = false, cta = "Get Started", onAction }: any) => (
    <div className={`p-6 rounded-2xl border flex flex-col h-full relative transition-all duration-300 group ${recommended ? 'bg-indigo-900/20 border-indigo-500/50 shadow-lg' : 'bg-[#0a0a10] border-white/5 hover:border-white/20'}`}>
        {recommended && <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-indigo-600 rounded-full text-[10px] font-bold uppercase text-white tracking-wider">Recommended</div>}
        <h3 className="text-lg font-bold mb-1 text-gray-300">{title}</h3>
        <div className="flex items-baseline gap-1 mb-4"><span className="text-3xl font-bold text-white">{price}</span></div>
        <ul className="space-y-3 flex-1 mb-6">
            {features.map((f: string, i: number) => (
                <li key={i} className="text-xs text-gray-400 flex gap-2 items-center">
                    <div className={`w-4 h-4 rounded-full flex items-center justify-center text-[8px] ${recommended ? 'bg-indigo-500 text-white' : 'bg-white/10 text-gray-400'}`}>✓</div>
                    {f}
                </li>
            ))}
        </ul>
        <button onClick={onAction} className={`w-full py-3 rounded-lg text-sm font-bold transition-all active:scale-95 ${recommended ? 'bg-indigo-600 text-white hover:bg-indigo-500' : 'bg-white/5 text-white hover:bg-white/10'}`}>{cta}</button>
    </div>
);

// A component to simulate a User Message in the chat stream
const ChatMessage = ({ avatar, name, time, children, isSystem = false }: any) => (
    <div className={`flex gap-4 p-4 md:px-8 hover:bg-white/[0.02] transition-colors group ${isSystem ? 'border-l-2 border-indigo-500 bg-indigo-500/5' : ''}`}>
        <div className="flex-shrink-0 mt-1">
            {avatar || <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-gray-700 to-gray-600 flex items-center justify-center text-sm font-bold">U</div>}
        </div>
        <div className="flex-1 min-w-0">
            <div className="flex items-baseline gap-2 mb-1">
                <span className={`${isSystem ? 'text-indigo-400' : 'text-white'} font-bold hover:underline cursor-pointer`}>{name}</span>
                <span className="text-[10px] text-gray-500">{time}</span>
                {isSystem && <span className="bg-indigo-500 text-white text-[9px] px-1.5 rounded uppercase font-bold">BOT</span>}
            </div>
            <div className="text-gray-300 leading-relaxed overflow-hidden">
                {children}
            </div>
        </div>
    </div>
);

interface LandingPageProps {
    onNavigate: (page: string) => void;
    isAuthenticated: boolean;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onNavigate, isAuthenticated }) => {
    const [activeSnippet, setActiveSnippet] = useState<'setup' | 'chat' | 'voice'>('setup');
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const snippets = {
        setup: `import { MasterVoice } from 'mastervoice-sdk';

// Initialize with Supabase
const client = new MasterVoice({
  apiKey: process.env.MV_API_KEY,
  supabaseUrl: 'https://xyz.supabase.co'
});`,
        chat: `const channel = client.chat.subscribe('room_1');

// Send encrypted message
await channel.send({
  content: 'Hello World',
  encrypted: true
});`,
        voice: `// Start HD Voice Call
const call = await client.call.start(recipientId, {
  audio: true,
  bandwidth: 'high',
  iceTransportPolicy: 'relay'
});`
    };

    const renderSnippet = (code: string) => {
        return code.split('\n').map((line, i) => {
            const html = line
                .replace(/&/g, '&amp;')
                .replace(/import|const|new|await|from/g, '<span class="text-purple-400">$&</span>')
                .replace(/'[^']*'/g, '<span class="text-green-400">$&</span>')
                .replace(/\/\/.*/g, '<span class="text-gray-500">$&</span>')
                .replace(/MasterVoice/g, '<span class="text-yellow-400">$&</span>');

            return (
                <div key={i} className="table-row">
                    <span className="table-cell text-right pr-4 text-gray-700 select-none w-8">{i + 1}</span>
                    <span className="table-cell" dangerouslySetInnerHTML={{ __html: html }} />
                </div>
            );
        });
    };

    const MasterVoiceAvatar = (
        <div className="w-10 h-10 bg-gradient-to-tr from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center font-bold text-white shadow-lg shadow-indigo-500/20">M</div>
    );

    return (
        <div className="flex h-screen bg-[#0e0e11] text-white font-['Outfit'] overflow-hidden selection:bg-indigo-500/30">
            
            {/* --- LEFT SIDEBAR (Navigation) --- */}
            <div className={`fixed inset-y-0 left-0 z-50 w-72 bg-[#050508] border-r border-white/5 flex flex-col transition-transform duration-300 md:relative md:translate-x-0 ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                {/* Server Header */}
                <div className="h-14 px-4 border-b border-white/5 flex items-center justify-between hover:bg-white/5 transition cursor-pointer">
                    <span className="font-bold truncate">MasterVoice HQ</span>
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                </div>

                {/* Sidebar Scroll */}
                <div className="flex-1 overflow-y-auto py-4 px-2 custom-scrollbar">
                    
                    {/* Section 1 */}
                    <div className="mb-6">
                        <h3 className="px-2 mb-2 text-xs font-bold text-gray-500 uppercase hover:text-gray-300 cursor-pointer flex items-center gap-1">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                            Information
                        </h3>
                        <div className="space-y-0.5">
                            <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth'})} className="w-full px-2 py-1.5 rounded text-left text-gray-400 hover:text-gray-100 hover:bg-white/5 flex items-center gap-2 group">
                                <span className="text-gray-600 text-lg group-hover:text-gray-400">#</span> welcome
                            </button>
                            <button onClick={() => onNavigate('/docs')} className="w-full px-2 py-1.5 rounded text-left text-gray-400 hover:text-gray-100 hover:bg-white/5 flex items-center gap-2 group">
                                <span className="text-gray-600 text-lg group-hover:text-gray-400">#</span> documentation
                            </button>
                            <button onClick={() => onNavigate('/changelog')} className="w-full px-2 py-1.5 rounded text-left text-gray-400 hover:text-gray-100 hover:bg-white/5 flex items-center gap-2 group">
                                <span className="text-gray-600 text-lg group-hover:text-gray-400">#</span> changelog
                                <span className="ml-auto text-[10px] bg-indigo-500/20 text-indigo-400 px-1.5 rounded">NEW</span>
                            </button>
                        </div>
                    </div>

                    {/* Section 2 */}
                    <div className="mb-6">
                        <h3 className="px-2 mb-2 text-xs font-bold text-gray-500 uppercase hover:text-gray-300 cursor-pointer flex items-center gap-1">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                            Product
                        </h3>
                        <div className="space-y-0.5">
                            <button className="w-full px-2 py-1.5 rounded text-left text-gray-400 hover:text-gray-100 hover:bg-white/5 flex items-center gap-2 group bg-white/5">
                                <span className="text-gray-600 text-lg group-hover:text-gray-400">#</span> sdk-preview
                            </button>
                            <button className="w-full px-2 py-1.5 rounded text-left text-gray-400 hover:text-gray-100 hover:bg-white/5 flex items-center gap-2 group">
                                <span className="text-gray-600 text-lg group-hover:text-gray-400">#</span> pricing
                            </button>
                        </div>
                    </div>
                </div>

                {/* User Info / Auth Bottom Bar */}
                <div className="p-2 bg-[#020205] border-t border-white/5">
                    {isAuthenticated ? (
                        <div className="flex items-center gap-2 p-2 rounded hover:bg-white/5 cursor-pointer">
                            <div className="w-8 h-8 rounded-full bg-green-500"></div>
                            <div className="text-xs">
                                <div className="font-bold">CurrentUser</div>
                                <div className="text-gray-500">Online</div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-2">
                            <button onClick={() => onNavigate('/login')} className="w-full py-2 bg-white/5 hover:bg-white/10 text-xs font-bold rounded text-white transition">Sign In</button>
                            <button onClick={() => onNavigate('/register')} className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-xs font-bold rounded text-white transition">Get Started</button>
                        </div>
                    )}
                </div>
            </div>

            {/* --- MAIN CHAT AREA --- */}
            <div className="flex-1 flex flex-col min-w-0 bg-[#0e0e11] relative">
                {/* Background Noise overlay for the main area only */}
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 pointer-events-none mix-blend-overlay z-0"></div>

                {/* Chat Header */}
                <div className="h-14 px-4 border-b border-white/5 flex items-center justify-between bg-[#0e0e11] z-10 shadow-sm">
                    <div className="flex items-center gap-3">
                        <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden text-gray-400">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
                        </button>
                        <div className="flex items-center gap-2 text-gray-200">
                            <span className="text-2xl text-gray-500 font-light">#</span>
                            <span className="font-bold">sdk-preview</span>
                        </div>
                        <div className="hidden sm:block w-px h-6 bg-white/10 mx-2"></div>
                        <span className="hidden sm:block text-xs text-gray-400 truncate">The complete SDK for adding WebRTC voice, video, and encrypted chat.</span>
                    </div>
                    
                    {/* Header Icons */}
                    <div className="flex items-center gap-4 text-gray-400">
                         <div className="hidden md:flex -space-x-2">
                            <div className="w-6 h-6 rounded-full border-2 border-[#0e0e11] bg-blue-500"></div>
                            <div className="w-6 h-6 rounded-full border-2 border-[#0e0e11] bg-purple-500"></div>
                            <div className="w-6 h-6 rounded-full border-2 border-[#0e0e11] bg-gray-600 flex items-center justify-center text-[8px] font-bold text-white">+42</div>
                        </div>
                        <svg className="w-5 h-5 hover:text-white cursor-pointer" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                        <svg className="w-5 h-5 hover:text-white cursor-pointer" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    </div>
                </div>

                {/* Messages Stream */}
                <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col pb-4 z-0">
                    
                    {/* Welcome Spacer */}
                    <div className="mt-auto pt-10"></div>

                    {/* Message 1: Hero */}
                    <ChatMessage avatar={MasterVoiceAvatar} name="MasterVoice" time="Today at 9:41 AM" isSystem={true}>
                        <h1 className="text-3xl md:text-5xl font-bold mt-1 mb-4 text-white">
                            Build <span className="text-indigo-400">Real-Time</span> Apps in Minutes.
                        </h1>
                        <p className="text-gray-300 max-w-2xl text-lg mb-6">
                            Hey developers! 👋 <br/>
                            We've abstracted the hard parts of WebRTC. Stop wrestling with STUN servers and signaling logic.
                        </p>
                        <div className="flex gap-3">
                             <button onClick={() => onNavigate('/api_key')} className="px-6 py-2 bg-indigo-600 text-white font-bold rounded hover:bg-indigo-500 transition shadow-lg shadow-indigo-500/20">
                                Get API Key
                            </button>
                            <button onClick={() => onNavigate('/docs')} className="px-6 py-2 bg-white/10 text-white font-bold rounded hover:bg-white/20 transition">
                                Read Docs
                            </button>
                        </div>
                    </ChatMessage>

                    {/* Message 2: THE SDK SECTION (Embedded like a code snippet share) */}
                    <ChatMessage avatar={MasterVoiceAvatar} name="MasterVoice" time="Today at 9:42 AM" isSystem={true}>
                        <p className="mb-3 text-sm text-gray-400">Here is how simple the integration looks. You can copy this straight into your project:</p>
                        
                        {/* IDE Container */}
                        <div className="rounded-lg overflow-hidden bg-[#0a0a10] border border-white/10 max-w-3xl shadow-2xl">
                             {/* Tabs/File Header */}
                             <div className="flex items-center justify-between px-4 py-2 bg-white/5 border-b border-white/5">
                                <div className="flex items-center gap-4">
                                    <div className="flex gap-1.5">
                                        <div className="w-2.5 h-2.5 rounded-full bg-red-500/50"></div>
                                        <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/50"></div>
                                        <div className="w-2.5 h-2.5 rounded-full bg-green-500/50"></div>
                                    </div>
                                    <div className="flex">
                                        {Object.keys(snippets).map((key) => (
                                            <button
                                                key={key}
                                                onClick={() => setActiveSnippet(key as any)}
                                                className={`px-3 py-1 text-xs font-mono rounded-md transition-colors mr-1 ${activeSnippet === key ? 'bg-indigo-500/20 text-indigo-300' : 'text-gray-500 hover:text-gray-300'}`}
                                            >
                                                {key}.ts
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <button className="text-xs text-gray-500 hover:text-white flex items-center gap-1">
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                                    Copy
                                </button>
                            </div>

                            {/* Code Area */}
                            <div className="p-4 overflow-x-auto bg-[#08080c]">
                                <pre className="font-mono text-sm leading-relaxed">
                                    <code className="text-gray-300">
                                        {renderSnippet(snippets[activeSnippet])}
                                    </code>
                                </pre>
                            </div>
                            <div className="bg-indigo-900/10 text-indigo-300 text-[10px] px-4 py-1 border-t border-white/5 flex justify-between">
                                <span>TypeScript 4.8</span>
                                <span>Ln 1, Col 1</span>
                            </div>
                        </div>
                    </ChatMessage>

                     {/* Message 3: Features Grid */}
                     <ChatMessage avatar={MasterVoiceAvatar} name="MasterVoice" time="Today at 9:45 AM" isSystem={true}>
                        <p className="mb-4">We've handled the infrastructure so you don't have to.</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-5xl">
                             <div className="p-4 bg-white/5 rounded-xl border border-white/5">
                                <div className="text-indigo-400 mb-2 font-bold flex items-center gap-2">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                                    End-to-End Encrypted
                                </div>
                                <p className="text-xs text-gray-400">Messages and calls are encrypted peer-to-peer. We can't see your data.</p>
                             </div>
                             <div className="p-4 bg-white/5 rounded-xl border border-white/5">
                                <div className="text-purple-400 mb-2 font-bold flex items-center gap-2">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                                    Low Latency TURN
                                </div>
                                <p className="text-xs text-gray-400">Intelligent relay routing ensures &lt; 100ms latency globally.</p>
                             </div>
                             <div className="p-4 bg-white/5 rounded-xl border border-white/5">
                                <div className="text-green-400 mb-2 font-bold flex items-center gap-2">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                                    Scalable Groups
                                </div>
                                <p className="text-xs text-gray-400">Built-in support for group chats, roles, and presence.</p>
                             </div>
                        </div>
                    </ChatMessage>

                    {/* Divider Date */}
                    <div className="relative py-4">
                        <div className="absolute inset-0 flex items-center" aria-hidden="true">
                            <div className="w-full border-t border-white/5"></div>
                        </div>
                        <div className="relative flex justify-center">
                            <span className="bg-[#0e0e11] px-2 text-[10px] text-gray-500 uppercase font-bold tracking-wider">New Unreads</span>
                        </div>
                    </div>

                    {/* Message 4: Pricing */}
                    <ChatMessage avatar={MasterVoiceAvatar} name="MasterVoice" time="Just now" isSystem={true}>
                         <p className="mb-4">Ready to start? Here are the current plans:</p>
                         <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 max-w-4xl">
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
                                features={["TURN Relay", "10,000 MAU", "Email Support", "99.9% Uptime"]}
                                cta="Get API Key"
                                onAction={() => onNavigate('/api_key')}
                            />
                             <PricingCard
                                title="Enterprise"
                                price="Custom"
                                features={["Global Premium Relay", "Unlimited MAU", "24/7 Phone Support"]}
                                cta="Contact Sales"
                                onAction={() => onNavigate('/contact')}
                            />
                         </div>
                    </ChatMessage>

                    {/* Spacer for bottom input */}
                    <div className="h-10"></div>
                </div>

                {/* Input Area (Fake) */}
                <div className="p-4 bg-[#0e0e11] z-10">
                    <div className="bg-[#1e1e24] rounded-lg p-2 flex items-center gap-4 border border-white/5">
                        <button className="text-gray-400 hover:text-white p-2 bg-white/5 rounded-full">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                        </button>
                        <input 
                            type="text" 
                            placeholder="Message #sdk-preview" 
                            className="bg-transparent text-white w-full focus:outline-none text-sm placeholder-gray-500"
                            disabled
                        />
                         <div className="flex items-center gap-2 pr-2">
                             <svg className="w-5 h-5 text-gray-400 cursor-pointer hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};