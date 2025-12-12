
import React, { useEffect, useState, useRef } from 'react';
import { supabase } from '../supabaseClient';

// Keep PricingCard for PlansPage usage
export const PricingCard = ({ title, price, features, recommended = false, cta = "Get Started", onAction }: any) => (
  <div className={`p-8 rounded-[2rem] border flex flex-col h-full relative transition-all duration-500 hover:-translate-y-2 ${recommended ? 'bg-gradient-to-b from-indigo-900/40 to-[#050510] border-indigo-500/50 shadow-2xl z-10 scale-105' : 'bg-white/5 border-white/5 hover:border-white/20'}`}>
    {recommended && <div className="absolute -top-5 left-1/2 -translate-x-1/2 px-6 py-2 bg-indigo-600 rounded-full text-xs font-bold uppercase shadow-lg text-white">Recommended</div>}
    <h3 className="text-xl font-bold mb-2 text-gray-300">{title}</h3>
    <div className="flex items-baseline gap-1 mb-6"><span className="text-4xl font-bold text-white">{price}</span></div>
    <ul className="space-y-4 flex-1 mb-8">{features.map((f:string, i:number) => <li key={i} className="text-sm text-gray-400 flex gap-2"><span>✓</span> {f}</li>)}</ul>
    <button onClick={onAction} className={`w-full py-4 rounded-xl font-bold ${recommended ? 'bg-white text-black' : 'bg-white/5 text-white'}`}>{cta}</button>
  </div>
);

interface LandingPageProps {
  onNavigate: (page: string) => void;
  isAuthenticated: boolean;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onNavigate, isAuthenticated }) => {
    const [messages, setMessages] = useState<any[]>([]);
    const [typing, setTyping] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    const initialMessages = [
        { id: 1, sender: 'sdk', type: 'text', content: "Hello! 👋 I'm MasterVoice SDK." },
        { id: 2, sender: 'sdk', type: 'text', content: "I help you build production-ready chat & voice apps with Supabase." },
        { id: 3, sender: 'user', type: 'text', content: "How do I get started?" },
        { id: 4, sender: 'sdk', type: 'code', content: "npm install mastervoice-sdk @supabase/supabase-js" },
        { id: 5, sender: 'sdk', type: 'text', content: "Here is how you make a call:" },
        { id: 6, sender: 'sdk', type: 'code', content: `const { startCall } = useWebRTC(roomId);\n\nreturn <button onClick={startCall}>📞 Call</button>;` },
        { id: 7, sender: 'sdk', type: 'actions', content: '' }
    ];

    useEffect(() => {
        let delay = 0;
        initialMessages.forEach((msg, index) => {
            delay += msg.sender === 'user' ? 1000 : 1500;
            if (msg.type === 'code') delay += 1000;
            
            setTimeout(() => {
                setTyping(true);
                setTimeout(() => {
                    setTyping(false);
                    setMessages(prev => [...prev, msg]);
                }, 800); // Typing duration
            }, delay);
        });
    }, []);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, typing]);

    return (
        <div className="flex h-screen w-screen bg-[#030014] text-white font-['Outfit'] overflow-hidden">
            {/* Sidebar (Simulated App Nav) */}
            <div className="w-20 md:w-64 bg-[#060609] border-r border-white/5 flex flex-col justify-between shrink-0 z-20">
                <div>
                    <div className="p-6 flex items-center gap-3">
                        <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center font-bold">M</div>
                        <span className="font-bold text-lg hidden md:block tracking-tight">MasterVoice</span>
                    </div>
                    
                    <div className="px-3 space-y-1">
                        <button className="w-full text-left px-3 py-2 rounded-xl bg-white/5 text-white text-sm font-medium flex items-center gap-3 transition">
                            <span className="text-lg">💬</span> <span className="hidden md:block">Overview</span>
                        </button>
                        <button onClick={() => onNavigate('/docs')} className="w-full text-left px-3 py-2 rounded-xl hover:bg-white/5 text-gray-400 hover:text-white transition text-sm font-medium flex items-center gap-3">
                            <span className="text-lg">📚</span> <span className="hidden md:block">Documentation</span>
                        </button>
                        <button onClick={() => onNavigate('/plans/show-more')} className="w-full text-left px-3 py-2 rounded-xl hover:bg-white/5 text-gray-400 hover:text-white transition text-sm font-medium flex items-center gap-3">
                            <span className="text-lg">💎</span> <span className="hidden md:block">Pricing</span>
                        </button>
                    </div>
                </div>

                <div className="p-4 border-t border-white/5">
                    {isAuthenticated ? (
                         <button onClick={() => onNavigate('/conversations')} className="w-full py-3 bg-green-600 hover:bg-green-500 rounded-xl font-bold text-sm transition shadow-lg shadow-green-900/20">
                             Launch App
                         </button>
                    ) : (
                         <button onClick={() => onNavigate('/login')} className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 rounded-xl font-bold text-sm transition shadow-lg shadow-indigo-900/20">
                             Sign In
                         </button>
                    )}
                </div>
            </div>

            {/* Main Chat Area */}
            <div className="flex-1 flex flex-col relative bg-[#030014]">
                 <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none mix-blend-overlay"></div>
                 
                 {/* Chat Header */}
                 <div className="h-16 border-b border-white/5 flex items-center justify-between px-6 bg-[#030014]/80 backdrop-blur-md z-10">
                     <div className="flex items-center gap-3">
                         <div className="relative">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-cyan-500 to-blue-600 p-0.5">
                                <div className="w-full h-full bg-black rounded-full flex items-center justify-center text-xs font-bold">SDK</div>
                            </div>
                            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-[#030014] rounded-full"></div>
                         </div>
                         <div>
                             <h2 className="font-bold text-sm">MasterVoice Bot</h2>
                             <p className="text-[10px] text-gray-400">Always online • v2.2.0</p>
                         </div>
                     </div>
                     <div className="flex gap-4 text-gray-500">
                         <svg className="w-5 h-5 cursor-pointer hover:text-white transition" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                         <svg className="w-5 h-5 cursor-pointer hover:text-white transition" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" /></svg>
                     </div>
                 </div>

                 {/* Messages Stream */}
                 <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar" ref={scrollRef}>
                     <div className="text-center text-xs text-gray-600 my-4">Today</div>
                     
                     {messages.map((msg, idx) => (
                         <div key={idx} className={`flex w-full ${msg.sender === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in-up`}>
                             <div className={`flex flex-col max-w-[85%] md:max-w-[60%] ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
                                 <div className={`px-5 py-3 rounded-2xl ${msg.sender === 'user' ? 'bg-indigo-600 text-white rounded-br-none' : 'bg-[#1a1a20] border border-white/10 text-gray-200 rounded-bl-none'}`}>
                                     {msg.type === 'code' ? (
                                         <pre className="font-mono text-xs bg-black/50 p-3 rounded-lg overflow-x-auto border border-white/5 text-green-400">
                                             {msg.content}
                                         </pre>
                                     ) : msg.type === 'actions' ? (
                                         <div className="flex flex-col gap-2">
                                             <p className="mb-2 text-sm font-medium">What would you like to do next?</p>
                                             <div className="flex flex-wrap gap-2">
                                                <button onClick={() => onNavigate('/docs')} className="px-4 py-2 bg-white text-black text-xs font-bold rounded-lg hover:bg-gray-200 transition">Read Docs</button>
                                                <button onClick={() => onNavigate('/register')} className="px-4 py-2 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-bold rounded-lg hover:bg-indigo-500/30 transition">Sign Up Free</button>
                                                <button onClick={() => onNavigate('/api_key')} className="px-4 py-2 bg-white/5 text-gray-300 border border-white/10 text-xs font-bold rounded-lg hover:bg-white/10 transition">Get API Key</button>
                                             </div>
                                         </div>
                                     ) : (
                                         <p className="text-sm leading-relaxed">{msg.content}</p>
                                     )}
                                 </div>
                                 <span className="text-[10px] text-gray-600 mt-1">{msg.sender === 'user' ? 'You' : 'Bot'} • Just now</span>
                             </div>
                         </div>
                     ))}

                     {typing && (
                         <div className="flex w-full justify-start animate-fade-in">
                             <div className="bg-[#1a1a20] border border-white/10 px-4 py-3 rounded-2xl rounded-bl-none flex gap-1">
                                 <div className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce"></div>
                                 <div className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce delay-75"></div>
                                 <div className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce delay-150"></div>
                             </div>
                         </div>
                     )}
                 </div>

                 {/* Input Area (Fake) */}
                 <div className="p-4 bg-[#030014]/80 backdrop-blur-md border-t border-white/5">
                     <div className="max-w-4xl mx-auto flex items-center gap-2 bg-[#13131a] border border-white/10 p-2 rounded-xl">
                         <button className="p-2 text-gray-500 hover:text-white transition"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg></button>
                         <input type="text" disabled placeholder="Type a message..." className="flex-1 bg-transparent border-none outline-none text-sm text-gray-400 cursor-not-allowed" />
                         <button className="p-2 bg-indigo-600 text-white rounded-lg opacity-50 cursor-not-allowed"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg></button>
                     </div>
                     <p className="text-center text-[10px] text-gray-600 mt-2">Powered by MasterVoice SDK</p>
                 </div>
            </div>
        </div>
    );
};
