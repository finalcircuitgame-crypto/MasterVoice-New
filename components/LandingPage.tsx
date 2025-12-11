
import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';

interface LandingPageProps {
  onNavigate: (page: string) => void;
  isAuthenticated: boolean;
}

function useWindowSize() {
  const [size, setSize] = useState([window.innerWidth, window.innerHeight]);
  useEffect(() => {
    const handleResize = () => setSize([window.innerWidth, window.innerHeight]);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  return size;
}

export const PricingCard = ({ title, price, features, recommended = false, cta = "Get Started", onAction }: any) => (
  <div className={`p-8 rounded-[2rem] border flex flex-col h-full relative transition-all duration-500 hover:-translate-y-2 ${recommended ? 'bg-gradient-to-b from-indigo-900/40 to-[#050510] border-indigo-500/50 shadow-2xl z-10 scale-105' : 'bg-white/5 border-white/5 hover:border-white/20'}`}>
    {recommended && <div className="absolute -top-5 left-1/2 -translate-x-1/2 px-6 py-2 bg-indigo-600 rounded-full text-xs font-bold uppercase shadow-lg text-white">Recommended</div>}
    <h3 className="text-xl font-bold mb-2 text-gray-300">{title}</h3>
    <div className="flex items-baseline gap-1 mb-6"><span className="text-4xl font-bold text-white">{price}</span></div>
    <ul className="space-y-4 flex-1 mb-8">{features.map((f:string, i:number) => <li key={i} className="text-sm text-gray-400 flex gap-2"><span>✓</span> {f}</li>)}</ul>
    <button onClick={onAction} className={`w-full py-4 rounded-xl font-bold ${recommended ? 'bg-white text-black' : 'bg-white/5 text-white'}`}>{cta}</button>
  </div>
);

const DesktopLanding: React.FC<LandingPageProps> = ({ onNavigate, isAuthenticated }) => {
  return (
    <div className="min-h-screen bg-[#030014] text-white font-['Outfit'] overflow-x-hidden selection:bg-indigo-500 relative">
      <nav className="w-full fixed top-0 z-50 bg-[#030014]/70 backdrop-blur-xl border-b border-white/5 h-20 flex items-center">
         <div className="w-full max-w-[1400px] mx-auto px-8 flex justify-between items-center">
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => onNavigate('/')}>
                <span className="text-xl font-bold tracking-tight">MasterVoice <span className="text-xs font-normal text-gray-500 bg-white/10 px-2 py-0.5 rounded ml-2">SDK v2.2</span></span>
            </div>
            <div className="flex items-center gap-8">
                <button onClick={() => onNavigate('/docs')} className="text-gray-400 hover:text-white transition text-sm font-bold">Documentation</button>
                <button onClick={() => window.open('https://github.com', '_blank')} className="text-gray-400 hover:text-white transition text-sm font-bold">GitHub</button>
                {isAuthenticated ? (
                  <button onClick={() => onNavigate('/conversations')} className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-bold text-sm">Open App</button>
                ) : (
                  <button onClick={() => onNavigate('/login')} className="text-white hover:text-indigo-400 transition text-sm font-bold">Log In</button>
                )}
            </div>
         </div>
      </nav>

      <div className="pt-40 pb-32 px-8 w-full max-w-[1400px] mx-auto flex flex-col md:flex-row items-center gap-20">
          <div className="flex-1 space-y-8 z-10">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-bold uppercase tracking-wider">
                  Open Source WebRTC
              </div>
              <h1 className="text-6xl md:text-7xl font-bold leading-tight tracking-tighter">
                  Build Secure <br/>
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">Voice & Video</span>
              </h1>
              <p className="text-xl text-gray-400 max-w-2xl leading-relaxed">
                  A production-ready React SDK for P2P communication. <br/>
                  Self-hostable. Encrypted. No vendor lock-in.
              </p>
              <div className="flex gap-4 pt-4">
                  <button onClick={() => onNavigate('/register')} className="px-8 py-4 bg-white text-black rounded-xl font-bold text-lg hover:bg-gray-200 transition">Get Started</button>
                  <button onClick={() => onNavigate('/docs')} className="px-8 py-4 bg-white/5 border border-white/10 text-white rounded-xl font-bold text-lg hover:bg-white/10 transition font-mono">npm i mastervoice-sdk</button>
              </div>
          </div>
          <div className="flex-1 relative hidden md:block">
              <div className="bg-[#0c0c0c] rounded-2xl border border-white/10 p-6 shadow-2xl transform rotate-3 hover:rotate-0 transition duration-500">
                  <pre className="font-mono text-xs text-gray-400 overflow-x-auto">
{`import { useWebRTC } from 'mastervoice-sdk';

const App = () => {
  const { startCall, remoteStream } = useWebRTC(roomId);

  return (
    <video 
      srcObject={remoteStream} 
      autoPlay 
    />
  );
}`}
                  </pre>
              </div>
          </div>
      </div>

      <div className="py-20 border-t border-white/5 bg-[#050505]">
          <div className="max-w-[1400px] mx-auto px-8 grid grid-cols-1 md:grid-cols-3 gap-12">
              <div className="p-6 rounded-2xl bg-white/5 border border-white/5">
                  <div className="text-3xl mb-4">🔓</div>
                  <h3 className="text-xl font-bold mb-2">Open Source</h3>
                  <p className="text-gray-400 text-sm">Full access to the signaling server and client code. Host it yourself or use our cloud.</p>
              </div>
              <div className="p-6 rounded-2xl bg-white/5 border border-white/5">
                  <div className="text-3xl mb-4">🛡️</div>
                  <h3 className="text-xl font-bold mb-2">E2E Encrypted</h3>
                  <p className="text-gray-400 text-sm">WebRTC guarantees peer-to-peer encryption. Your media never touches our servers.</p>
              </div>
              <div className="p-6 rounded-2xl bg-white/5 border border-white/5">
                  <div className="text-3xl mb-4">⚡</div>
                  <h3 className="text-xl font-bold mb-2">Low Latency</h3>
                  <p className="text-gray-400 text-sm">Optimized SDP negotiation and direct mesh networking for sub-100ms latency.</p>
              </div>
          </div>
      </div>

      <div className="w-full border-t border-white/5 py-12 px-8 bg-black text-center text-gray-600 text-sm">
          <p>&copy; 2025 MasterVoice Open Source Project.</p>
      </div>
    </div>
  );
};

const MobileLanding: React.FC<LandingPageProps> = ({ onNavigate }) => (
    <div className="min-h-screen bg-black text-white p-6 flex flex-col justify-center text-center">
        <h1 className="text-4xl font-bold mb-4">MasterVoice SDK</h1>
        <p className="text-gray-400 mb-8">The open source WebRTC standard.</p>
        <button onClick={() => onNavigate('/docs')} className="bg-indigo-600 px-6 py-3 rounded-xl font-bold mb-4">Read Docs</button>
        <button onClick={() => onNavigate('/login')} className="bg-white/10 px-6 py-3 rounded-xl font-bold">Login to Demo</button>
    </div>
);

export const LandingPage: React.FC<LandingPageProps> = (props) => {
  const [width] = useWindowSize();
  return width < 768 ? <MobileLanding {...props} /> : <DesktopLanding {...props} />;
};
