import React, { useState, useEffect } from 'react';
import { PricingCard } from './LandingPage';

interface PageProps {
  onBack: () => void;
  onNavigate?: (path: string) => void;
}

const PageLayout: React.FC<{ title: string; children: React.ReactNode; onBack?: () => void; wide?: boolean }> = ({ title, children, onBack, wide }) => (
  <div className="min-h-screen bg-[#030014] text-white overflow-y-auto animate-slide-up relative font-['Outfit']">
    {/* Background Effects */}
    <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
       <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-indigo-600/10 rounded-full blur-[100px]" />
       <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
    </div>

    <div className={`relative z-10 container mx-auto px-6 py-12 ${wide ? 'max-w-7xl' : 'max-w-4xl'}`}>
      {onBack && (
        <button 
            onClick={onBack} 
            className="group flex items-center text-gray-400 hover:text-white transition mb-8"
        >
            <div className="p-2 rounded-full bg-white/5 group-hover:bg-white/10 mr-3 transition">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            </div>
            <span className="text-sm font-semibold tracking-wide uppercase">Return to Application</span>
        </button>
      )}

      <div className={`glass-panel p-8 md:p-12 rounded-[2.5rem] border border-white/10 ${wide ? 'bg-[#050510]/80' : ''}`}>
        {title && (
          <div className="mb-12 border-b border-white/5 pb-8">
            <h1 className="text-4xl md:text-6xl font-black mb-4 bg-clip-text text-transparent bg-gradient-to-r from-white via-indigo-200 to-gray-500 tracking-tighter">
              {title}
            </h1>
            <p className="text-gray-500 font-medium tracking-widest uppercase text-xs">Technical Manual & SDK Specification v2.2.0</p>
          </div>
        )}
        <div className="prose prose-invert prose-lg max-w-none text-gray-300">
            {children}
        </div>
      </div>
    </div>
  </div>
);

// --- Theme Editor Helper ---
const generateShades = (hex: string) => {
    const hexToRgb = (hex: string) => {
        const bigint = parseInt(hex.slice(1), 16);
        return [(bigint >> 16) & 255, (bigint >> 8) & 255, bigint & 255];
    };

    const rgbToHsl = (r: number, g: number, b: number) => {
        r /= 255, g /= 255, b /= 255;
        const max = Math.max(r, g, b), min = Math.min(r, g, b);
        let h = 0, s, l = (max + min) / 2;
        if (max === min) { h = s = 0; } else {
            const d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
            switch (max) {
                case r: h = (g - b) / d + (g < b ? 6 : 0); break;
                case g: h = (b - r) / d + 2; break;
                case b: h = (r - g) / d + 4; break;
            }
            h /= 6;
        }
        return [h, s, l];
    };

    const hslToRgb = (h: number, s: number, l: number) => {
        let r, g, b;
        if (s === 0) { r = g = b = l; } else {
            const hue2rgb = (p: number, q: number, t: number) => {
                if (t < 0) t += 1;
                if (t > 1) t -= 1;
                if (t < 1/6) return p + (q - p) * 6 * t;
                if (t < 1/2) return q;
                if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
                return p;
            };
            const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
            const p = 2 * l - q;
            r = hue2rgb(p, q, h + 1/3);
            g = hue2rgb(p, q, h);
            b = hue2rgb(p, q, h - 1/3);
        }
        const toHex = (x: number) => {
            const hex = Math.round(x * 255).toString(16);
            return hex.length === 1 ? '0' + hex : hex;
        };
        return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
    };

    const [r, g, b] = hexToRgb(hex);
    const [h, s, l] = rgbToHsl(r, g, b);

    const shadeMap = {
        50: 0.95, 100: 0.9, 200: 0.8, 300: 0.7, 400: 0.6,
        500: l, 
        600: l * 0.85, 700: l * 0.7, 800: l * 0.55, 900: l * 0.4, 950: l * 0.25
    };

    const palette: any = {};
    for (const [key, val] of Object.entries(shadeMap)) {
        let newL = val;
        if (key === '500') newL = l;
        else if (parseInt(key) < 500) {
             newL = l + (1 - l) * (1 - (parseInt(key)/500)); 
             if(parseInt(key) === 50) newL = 0.97;
        } else {
             newL = l * (1 - ((parseInt(key) - 500) / 550));
        }
        palette[key] = hslToRgb(h, s, Math.max(0, Math.min(1, newL)));
    }
    return palette;
};

export const ThemeEditorPage: React.FC<PageProps> = ({ onBack, onNavigate }) => {
    const [baseColor, setBaseColor] = useState('#6366f1');
    const [palette, setPalette] = useState<any>({});

    useEffect(() => {
        setPalette(generateShades(baseColor));
    }, [baseColor]);

    const handleSave = () => {
        const root = document.documentElement;
        Object.entries(palette).forEach(([key, value]) => {
            root.style.setProperty(`--theme-${key}`, value as string);
        });
        localStorage.setItem('mv_theme_name', 'custom');
        localStorage.setItem('mv_theme_custom', JSON.stringify(palette));
        onNavigate?.('/settings');
    };

    return (
        <PageLayout title="Theme Editor" onBack={onBack}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 text-left">
                <div>
                    <label className="block text-sm font-bold text-gray-400 mb-2 uppercase tracking-wide">Pick Base Color</label>
                    <div className="flex gap-4 items-center mb-8">
                        <input type="color" value={baseColor} onChange={(e) => setBaseColor(e.target.value)} className="w-16 h-16 rounded-xl cursor-pointer bg-transparent border-0 p-0"/>
                        <div className="text-xl font-mono text-white">{baseColor}</div>
                    </div>
                    <h3 className="text-lg font-bold text-white mb-4 tracking-tighter">Generated Palette</h3>
                    <div className="space-y-2 mb-8">
                        {Object.entries(palette).map(([shade, color]: any) => (
                            <div key={shade} className="flex items-center gap-4">
                                <div className="w-12 h-8 rounded shadow-lg border border-white/10 transition-all hover:scale-110" style={{ backgroundColor: color }}></div>
                                <span className="text-sm font-mono text-gray-400 w-12">{shade}</span>
                                <span className="text-sm font-mono text-gray-500">{color}</span>
                            </div>
                        ))}
                    </div>
                    <div className="flex gap-4">
                        <button onClick={handleSave} className="px-8 py-3 bg-white text-black font-bold rounded-xl hover:bg-gray-200 transition shadow-lg shadow-white/5 active:scale-95">Save Theme</button>
                        <button onClick={() => setBaseColor('#6366f1')} className="px-8 py-3 bg-white/10 text-white font-bold rounded-xl hover:bg-white/20 transition active:scale-95">Reset</button>
                    </div>
                </div>
                <div className="relative">
                    <h3 className="text-lg font-bold text-white mb-4 tracking-tighter">Live Preview</h3>
                    <div className="bg-[#060609] border border-white/10 rounded-3xl p-6 shadow-2xl relative overflow-hidden h-[500px] flex flex-col">
                        <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/5" style={{ borderColor: 'var(--theme-900)' }}>
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold" style={{ background: `linear-gradient(to right, ${palette[500]}, ${palette[700]})` }}>A</div>
                                <div><div className="font-bold text-white">Alice</div><div className="text-xs font-bold" style={{ color: palette[400] }}>Online</div></div>
                            </div>
                        </div>
                        <div className="space-y-4 flex-1">
                            <div className="flex justify-start"><div className="bg-[#1a1a20] p-3 rounded-2xl rounded-bl-sm text-sm text-gray-300 max-w-[80%] border border-white/5 shadow-sm">Hey! Check out the new HSL shades.</div></div>
                            <div className="flex justify-end"><div className="p-3 rounded-2xl rounded-br-sm text-sm text-white max-w-[80%] shadow-lg transition-colors duration-500" style={{ background: `linear-gradient(135deg, ${palette[600]}, ${palette[500]})` }}>Looks absolutely stunning.</div></div>
                        </div>
                    </div>
                </div>
            </div>
        </PageLayout>
    );
};

export const Documentation: React.FC<PageProps> = ({ onBack }) => {
    const [activeSection, setActiveSection] = useState(0);

    const sections = [
        { title: "The MasterVoice Vision", content: (
            <div className="animate-fade-in-up space-y-6">
                <h2 className="text-white text-3xl font-black tracking-tighter">Chapter 1: Sovereignty in Communication</h2>
                <p>MasterVoice isn't just another chat app. It is a high-performance, decentralized communication suite built on the principle of <strong>Peer-to-Peer Sovereignty</strong>. Our mission is to move the heavy lifting of communication from central servers to the edge—your devices.</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-8">
                    <div className="bg-indigo-600/5 p-6 rounded-[2rem] border border-white/5 hover:border-indigo-500/20 transition-all group">
                        <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center mb-4 group-hover:scale-110 transition">
                            <svg className="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                        </div>
                        <h4 className="text-white font-bold mb-2">Zero Latency Direct</h4>
                        <p className="text-xs text-gray-500 leading-relaxed">By prioritizing STUN over TURN, we ensure that over 85% of calls route directly between users, bypassing server overhead entirely.</p>
                    </div>
                    <div className="bg-fuchsia-600/5 p-6 rounded-[2rem] border border-white/5 hover:border-fuchsia-500/20 transition-all group">
                        <div className="w-10 h-10 rounded-xl bg-fuchsia-500/10 flex items-center justify-center mb-4 group-hover:scale-110 transition">
                            <svg className="w-5 h-5 text-fuchsia-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                        </div>
                        <h4 className="text-white font-bold mb-2">Authenticated Integrity</h4>
                        <p className="text-xs text-gray-500 leading-relaxed">Every signaling packet is signed with Supabase JWTs, ensuring that your WebRTC handshake cannot be intercepted by unauthorized peers.</p>
                    </div>
                </div>
                
                <p>This technical guide serves as the authoritative reference for our SDK, the MasterVoice core architecture, and the resilient engines that power features like our "Giphy-to-Gir" fallback system.</p>
            </div>
        )},
        { title: "Supabase Realtime Signaling", content: (
            <div className="animate-fade-in-up space-y-6">
                <h2 className="text-white text-3xl font-black tracking-tighter">Chapter 2: The Signaling Handshake</h2>
                <p>WebRTC requires a "discovery" mechanism to swap network metadata. MasterVoice leverages <strong>Supabase Realtime Broadcast</strong> for this high-speed exchange. This allows for near-instant call initiation without a custom WebSocket server.</p>
                
                <h4 className="text-indigo-400 font-black uppercase text-[10px] tracking-widest mt-8">Signaling Lifecycle</h4>
                <pre className="bg-[#050508] p-6 rounded-2xl text-xs font-mono text-indigo-300 border border-white/5 overflow-x-auto leading-relaxed shadow-inner">
{`// 1. Peer A joins a unique room channel
const channel = supabase.channel('webrtc:room_123');

// 2. Peer A broadcasts an 'offer' with SDP metadata
channel.send({
  type: 'broadcast',
  event: 'signal',
  payload: { type: 'offer', sdp: myOffer, callerId: 'user_A' }
});

// 3. Peer B receives the broadcast and replies with an 'answer'
channel.on('broadcast', { event: 'signal' }, async ({ payload }) => {
  if (payload.type === 'offer') {
    await pc.setRemoteDescription(payload.sdp);
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    channel.send({ ...payload, type: 'answer', sdp: answer });
  }
});`}
                </pre>
                <p className="text-sm">This loop repeats for <strong>ICE Candidates</strong>, which are small packets containing potential network paths. Once a common path is found, the Supabase channel is only used for session control (Mute/Hangup), as the media begins flowing P2P.</p>
            </div>
        )},
        { title: "WebRTC Engine & Ice Config", content: (
            <div className="animate-fade-in-up space-y-6">
                <h2 className="text-white text-3xl font-black tracking-tighter">Chapter 3: Adaptive Connectivity</h2>
                <p>MasterVoice employs a multi-tiered ICE strategy to ensure connections succeed in even the most restrictive environments (corporate firewalls, hotel Wi-Fi, 4G NATs).</p>
                
                <h4 className="text-indigo-400 font-black uppercase text-[10px] tracking-widest mt-8">Connectivity Logic Matrix</h4>
                <div className="overflow-hidden rounded-2xl border border-white/5 bg-black/20">
                    <table className="w-full text-left border-collapse text-xs">
                        <thead className="bg-white/5">
                            <tr>
                                <th className="p-4 font-bold text-white">Scenario</th>
                                <th className="p-4 font-bold text-white">Mechanism</th>
                                <th className="p-4 font-bold text-white">Latency</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            <tr><td className="p-4">Direct (LAN)</td><td className="p-4 text-indigo-300 font-bold uppercase">Host Candidate</td><td className="p-4 text-green-400">&lt; 5ms</td></tr>
                            <tr><td className="p-4">NAT (Public)</td><td className="p-4 text-indigo-300 font-bold uppercase">STUN (Server Reflexive)</td><td className="p-4 text-green-400">10-50ms</td></tr>
                            <tr><td className="p-4">Symm NAT / Firewall</td><td className="p-4 text-fuchsia-300 font-bold uppercase">TURN (Relay UDP/TCP)</td><td className="p-4 text-amber-400">50-150ms</td></tr>
                        </tbody>
                    </table>
                </div>

                <h4 className="text-indigo-400 font-black uppercase text-[10px] tracking-widest mt-8">Tiered Constraints</h4>
                <p className="text-sm">We dynamically adjust <code>RTCRtpSender</code> parameters based on your account tier:</p>
                <ul className="list-disc pl-5 space-y-2 text-sm text-gray-400">
                    <li><strong>Free:</strong> Opus @ 48kbps, Max Resolution 720p.</li>
                    <li><strong>Pro/Elite:</strong> Studio-quality Opus @ 128kbps, VP9/H.264 High Profile, up to 4K @ 60fps.</li>
                </ul>
            </div>
        )},
        { title: "The 'Gir' Resiliency Engine", content: (
            <div className="animate-fade-in-up space-y-6">
                <h2 className="text-white text-3xl font-black tracking-tighter">Chapter 4: The GIF Failover Protocol</h2>
                <p>A mission-critical requirement for the MasterVoice community is the availability of "Gir" (Invader Zim) GIFs. To prevent downtime caused by Giphy API outages or 403 Forbidden errors (common with public API keys), we built a <strong>Resilient Fallback Engine</strong>.</p>
                
                <h4 className="text-indigo-400 font-black uppercase text-[10px] tracking-widest mt-8">The Dual-Path Strategy</h4>
                <div className="bg-[#050508] p-6 rounded-3xl border border-white/5 space-y-4">
                    <div className="flex gap-4">
                        <div className="w-1 bg-green-500 rounded-full h-12"></div>
                        <div>
                            <h5 className="text-white font-bold text-sm">Path A: Primary Giphy SDK</h5>
                            <p className="text-[11px] text-gray-500">Fetches real-time, trending, and searched GIFs from the Giphy global CDN.</p>
                        </div>
                    </div>
                    <div className="flex gap-4">
                        <div className="w-1 bg-amber-500 rounded-full h-12"></div>
                        <div>
                            <h5 className="text-white font-bold text-sm">Path B: Hardcoded Gir Cache</h5>
                            <p className="text-[11px] text-gray-500">Injected instantly if Path A returns any status code outside of 2xx.</p>
                        </div>
                    </div>
                </div>

                <pre className="bg-[#111] p-6 rounded-2xl text-xs font-mono text-amber-300 border border-white/5 overflow-x-auto shadow-inner mt-6">
{`const fetchGifs = async (query) => {
  try {
    const res = await fetch(\`https://api.giphy.com/v1/...\${query}\`);
    if (!res.ok) throw new Error("Forbidden");
    setGifs(await res.json());
  } catch (e) {
    console.warn("Using offline Gir cache...");
    setGifs(FALLBACK_GIR_GIFS.map(url => ({ 
      id: 'fallback', 
      images: { original: { url } } 
    })));
  }
};`}
                </pre>
            </div>
        )},
        { title: "Postgres Schema & RLS", content: (
            <div className="animate-fade-in-up space-y-6">
                <h2 className="text-white text-3xl font-black tracking-tighter">Chapter 5: Relational Sovereignty</h2>
                <p>Our data layer resides in Postgres, protected by <strong>Row-Level Security (RLS)</strong>. This ensures that even if our frontend code is compromised, the database enforces strict ownership rules.</p>
                
                <h4 className="text-indigo-400 font-black uppercase text-[10px] tracking-widest mt-8">Core Table Definition</h4>
                <pre className="bg-[#050508] p-6 rounded-2xl text-xs font-mono text-gray-300 border border-white/5 overflow-x-auto leading-relaxed shadow-inner">
{`CREATE TABLE public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid REFERENCES profiles(id) NOT NULL,
  receiver_id uuid REFERENCES profiles(id), -- NULL for Group Chats
  group_id uuid REFERENCES groups(id),       -- NULL for DMs
  content text NOT NULL,
  reactions jsonb DEFAULT '{}'::jsonb,
  created_at timestamp WITH TIME ZONE DEFAULT now()
);

-- RLS: Only sender or recipient can VIEW a DM
CREATE POLICY "View direct messages" ON messages
FOR SELECT USING (
  auth.uid() = sender_id OR auth.uid() = receiver_id
);`}
                </pre>
                <p className="text-sm">For Group Chats, the policy checks the <code>group_members</code> junction table using a <code>SECURITY DEFINER</code> function to avoid recursive policy loops.</p>
            </div>
        )},
        { title: "Dynamic HSL Theming Engine", content: (
            <div className="animate-fade-in-up space-y-6">
                <h2 className="text-white text-3xl font-black tracking-tighter">Chapter 6: The Palette Engine</h2>
                <p>MasterVoice doesn't use hardcoded colors. We use an <strong>HSL (Hue, Saturation, Lightness)</strong> interpolation engine that generates 11 distinct shades from a single HEX input.</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center py-6">
                    <div className="space-y-4">
                        <p className="text-sm italic text-gray-500">How it works:</p>
                        <ol className="list-decimal pl-5 text-xs text-gray-400 space-y-2">
                            <li>Convert HEX to RGB to HSL.</li>
                            <li>Lock Hue and Saturation for brand consistency.</li>
                            <li>Interpolate Lightness from 97% (shade 50) to 25% (shade 950).</li>
                            <li>Inject as CSS Variables into <code>:root</code>.</li>
                        </ol>
                    </div>
                    <div className="p-4 bg-black/40 rounded-2xl border border-white/5 space-y-2 font-mono text-[10px]">
                        <div className="flex justify-between"><span>--theme-500:</span> <span className="text-indigo-400">#6366f1</span></div>
                        <div className="flex justify-between"><span>--theme-950:</span> <span className="text-indigo-900">#1e1b4b</span></div>
                    </div>
                </div>
            </div>
        )},
        { title: "Security: SRTP & DTLS", content: (
            <div className="animate-fade-in-up space-y-6">
                <h2 className="text-white text-3xl font-black tracking-tighter">Chapter 7: Privacy by Design</h2>
                <p>MasterVoice uses a triple-layered security model to protect your metadata and your media.</p>
                
                <h4 className="text-indigo-400 font-black uppercase text-[10px] tracking-widest mt-8">The Security Stack</h4>
                <ul className="space-y-4">
                    <li className="flex gap-4 items-start">
                        <div className="p-2 bg-indigo-500/10 rounded-lg"><svg className="w-4 h-4 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg></div>
                        <div className="min-w-0 flex-1">
                            <h5 className="text-white font-bold text-xs">DTLS (Datagram Transport Layer Security)</h5>
                            <p className="text-[11px] text-gray-500">Used during the WebRTC handshake to authenticate peers and derive master keys for SRTP.</p>
                        </div>
                    </li>
                    <li className="flex gap-4 items-start">
                        <div className="p-2 bg-green-500/10 rounded-lg"><svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg></div>
                        <div className="min-w-0 flex-1">
                            <h5 className="text-white font-bold text-xs">SRTP (Secure Real-time Transport Protocol)</h5>
                            <p className="text-[11px] text-gray-500">Encrypts voice/video payloads with AES-GCM, ensuring that even TURN relay nodes cannot see your call content.</p>
                        </div>
                    </li>
                    <li className="flex gap-4 items-start">
                        <div className="p-2 bg-amber-500/10 rounded-lg"><svg className="w-4 h-4 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg></div>
                        <div className="min-w-0 flex-1">
                            <h5 className="text-white font-bold text-xs">Perfect Forward Secrecy</h5>
                            <p className="text-[11px] text-gray-500">Session keys are unique to every call. If one key is leaked, past and future calls remain secure.</p>
                        </div>
                    </li>
                </ul>
            </div>
        )},
        { title: "Presence State Machine", content: (
            <div className="animate-fade-in-up space-y-6">
                <h2 className="text-white text-3xl font-black tracking-tighter">Chapter 8: Real-time Presence</h2>
                <p>MasterVoice uses Supabase Presence to track who's online without hitting the database on every heartbeat. This uses <strong>CRDTs (Conflict-free Replicated Data Types)</strong> for eventual consistency.</p>
                
                <h4 className="text-indigo-400 font-black uppercase text-[10px] tracking-widest mt-8">The Lifecycle of a Peer</h4>
                <pre className="bg-[#050508] p-6 rounded-2xl text-xs font-mono text-green-300 border border-white/5 overflow-x-auto shadow-inner">
{`const presenceChannel = supabase.channel('global_presence', {
  config: { presence: { key: currentUser.id } }
});

presenceChannel
  .on('presence', { event: 'sync' }, () => {
    // Synchronize UI with the shared state
    const state = presenceChannel.presenceState();
    setOnlineUsers(new Set(Object.keys(state)));
  })
  .subscribe(async (status) => {
    if (status === 'SUBSCRIBED') {
      await presenceChannel.track({ 
        online_at: new Date().toISOString(),
        client: 'Web/React'
      });
    }
  });`}
                </pre>
            </div>
        )},
        { title: "Persistence & Restoration", content: (
            <div className="animate-fade-in-up space-y-6">
                <h2 className="text-white text-3xl font-black tracking-tighter">Chapter 9: The Recovery Protocol</h2>
                <p>Calls in MasterVoice are designed to survive accidental browser refreshes. We use a hybrid <strong>LocalStorage + Signaling</strong> restoration flow.</p>
                
                <h4 className="text-indigo-400 font-black uppercase text-[10px] tracking-widest mt-8">Restoration Logic</h4>
                <ol className="list-decimal pl-5 text-sm text-gray-400 space-y-4">
                    <li><strong>Checkpoint:</strong> On call start, call metadata is written to LocalStorage.</li>
                    <li><strong>Re-Hydration:</strong> On mount, <code>App.tsx</code> checks for existing call state.</li>
                    <li><strong>Signaling Sync:</strong> If found, the SDK attempts to reconnect to the signaling channel and sends a "rejoin" candidate to the peer.</li>
                </ol>
            </div>
        )},
        { title: "Roadmap & Future V3.0", content: (
            <div className="animate-fade-in-up space-y-6">
                <h2 className="text-white text-3xl font-black tracking-tighter">Epilogue: The Future</h2>
                <p>The MasterVoice journey is just beginning. Our v3.0 roadmap includes revolutionary features focused on scale and media quality.</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                        <span className="text-xs font-bold text-indigo-400">Q4 2024</span>
                        <h5 className="text-white font-bold text-sm mb-1">Decentralized Mesh Networking</h5>
                        <p className="text-[10px] text-gray-500 leading-relaxed">P2P Multi-party calls (3-5 users) without an SFU by leveraging bandwidth-optimized mesh topologies.</p>
                    </div>
                    <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                        <span className="text-xs font-bold text-fuchsia-400">Q1 2025</span>
                        <h5 className="text-white font-bold text-sm mb-1">MasterVoice SFU (Bifrost)</h5>
                        <p className="text-[10px] text-gray-500 leading-relaxed">A proprietary Selective Forwarding Unit for low-latency group calls with up to 100 participants.</p>
                    </div>
                </div>
            </div>
        )}
    ];

    return (
        <PageLayout title="SDK & Technical Reference" onBack={onBack} wide={true}>
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-12 text-left">
                {/* TOC Sidebar */}
                <div className="lg:col-span-1 border-r border-white/10 pr-6 shrink-0 hidden lg:block">
                    <div className="sticky top-12">
                        <h4 className="font-bold text-white mb-6 uppercase text-[10px] tracking-widest opacity-40">Documentation Chapters</h4>
                        <ul className="space-y-1">
                            {sections.map((sec, i) => (
                                <li 
                                    key={i} 
                                    onClick={() => setActiveSection(i)} 
                                    className={`cursor-pointer px-4 py-3 rounded-2xl text-xs font-bold transition-all ${activeSection === i ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-500/20 translate-x-2' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}
                                >
                                    <div className="flex items-center gap-3">
                                        <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] border ${activeSection === i ? 'bg-white/20 border-white/20' : 'bg-transparent border-white/10'}`}>{i + 1}</span>
                                        <span className="truncate">{sec.title}</span>
                                    </div>
                                </li>
                            ))}
                        </ul>
                        <div className="mt-12 p-6 rounded-3xl bg-indigo-500/10 border border-indigo-500/20 text-center">
                            <p className="text-[10px] text-indigo-300 font-bold mb-2">Need Help?</p>
                            <button className="text-[9px] text-white bg-indigo-600 px-4 py-2 rounded-xl font-bold hover:bg-indigo-500 transition shadow-lg">Contact SDK Support</button>
                        </div>
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="lg:col-span-3 min-h-[600px] bg-[#020205]/40 p-2 md:p-8 rounded-[2rem] border border-white/5 shadow-inner">
                    {/* Mobile Navigation Dropdown (Hidden on Desktop) */}
                    <div className="lg:hidden mb-8">
                         <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2 block">Jump to Chapter</label>
                         <select 
                            value={activeSection} 
                            onChange={(e) => setActiveSection(parseInt(e.target.value))}
                            className="w-full bg-[#13131a] border border-white/10 p-4 rounded-2xl text-white text-sm outline-none focus:ring-2 focus:ring-indigo-500/50"
                         >
                            {sections.map((sec, i) => <option key={i} value={i}>{i+1}. {sec.title}</option>)}
                         </select>
                    </div>

                    <div className="transition-all duration-500">
                        {sections[activeSection].content}
                    </div>

                    {/* Pagination */}
                    <div className="mt-20 pt-8 border-t border-white/5 flex justify-between items-center">
                         {activeSection > 0 ? (
                             <button onClick={() => setActiveSection(prev => prev - 1)} className="group flex items-center gap-3 text-gray-500 hover:text-white transition">
                                <div className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center group-hover:bg-white/5 transition">←</div>
                                <div className="text-left"><p className="text-[9px] font-bold uppercase tracking-widest opacity-50">Previous</p><p className="text-xs font-bold">{sections[activeSection - 1].title}</p></div>
                             </button>
                         ) : <div />}

                         {activeSection < sections.length - 1 ? (
                             <button onClick={() => setActiveSection(prev => prev + 1)} className="group flex items-center gap-3 text-gray-500 hover:text-white transition text-right">
                                <div className="text-right"><p className="text-[9px] font-bold uppercase tracking-widest opacity-50">Next</p><p className="text-xs font-bold">{sections[activeSection + 1].title}</p></div>
                                <div className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center group-hover:bg-white/5 transition">→</div>
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
        const steps = [{ pct: 20, msg: `Verifying ${tier!.toUpperCase()}...` }, { pct: 50, msg: 'Checking billing...' }, { pct: 80, msg: 'Allocating TURN nodes...' }, { pct: 100, msg: 'Ready!' }];
        let step = 0;
        const interval = setInterval(() => {
            if (step < steps.length) { setProgress(steps[step].pct); setStatus(steps[step].msg); step++; }
            else { clearInterval(interval); setTimeout(() => onNavigate?.(`/api_key?verified=true&tier=${tier}`), 800); }
        }, 800);
        return () => clearInterval(interval);
    }, [onNavigate]);
    return (
        <div className="min-h-screen bg-[#030014] flex flex-col items-center justify-center relative font-['Outfit']">
             <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
             <div className="relative z-10 text-center max-w-md w-full p-8">
                 <div className="w-20 h-20 mx-auto mb-8 relative"><div className="absolute inset-0 border-4 border-indigo-900 rounded-full"></div><div className="absolute inset-0 border-4 border-indigo-500 rounded-full border-t-transparent animate-spin"></div><div className="absolute inset-0 flex items-center justify-center font-bold text-indigo-400 text-xs">{progress}%</div></div>
                 <h2 className="text-2xl font-bold text-white mb-2">Please Wait</h2><p className="text-indigo-300 animate-pulse mb-8 h-6">{status}</p>
                 <div className="h-1 w-full bg-gray-800 rounded-full overflow-hidden shadow-inner"><div className="h-full bg-gradient-to-r from-indigo-500 to-fuchsia-500 transition-all duration-500 ease-out" style={{ width: `${progress}%` }}></div></div>
             </div>
        </div>
    );
};

export const PrivacyPolicy: React.FC<PageProps> = ({ onBack }) => (
  <PageLayout title="Privacy Policy" onBack={onBack}>
      <p className="mb-4">Effective Date: October 26, 2023</p>
      <h3>1. Introduction</h3>
      <p>MasterVoice is committed to absolute privacy. We do not track users, log IP addresses on signaling, or store call metadata longer than required for connectivity.</p>
  </PageLayout>
);

export const TermsOfService: React.FC<PageProps> = ({ onBack }) => (
  <PageLayout title="Terms of Service" onBack={onBack}>
      <h3>1. Fair Use</h3>
      <p>TURN relay bandwidth is provided for legitimate person-to-person communication. Commercial botting or scraping is strictly prohibited.</p>
  </PageLayout>
);

export const ContactSupport: React.FC<PageProps> = ({ onBack }) => (
  <PageLayout title="Contact Support" onBack={onBack}>
      <div className="bg-[#111] p-8 rounded-3xl border border-white/10 text-left space-y-6">
          <p className="text-lg">Need immediate assistance with the MasterVoice SDK or your account? Our team is available 24/7 for Pro and Elite users.</p>
          <div className="space-y-4">
            <div className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400">@</div>
                <div><p className="text-xs font-bold text-gray-500 uppercase">Email</p><p className="text-white font-bold">support@mastervoice.io</p></div>
            </div>
            <div className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400">D</div>
                <div><p className="text-xs font-bold text-gray-500 uppercase">Discord</p><p className="text-white font-bold">discord.gg/mastervoice</p></div>
            </div>
          </div>
      </div>
  </PageLayout>
);

export const NotFoundPage: React.FC<PageProps> = ({ onBack }) => (
  <div className="min-h-screen bg-[#030014] flex flex-col items-center justify-center font-['Outfit'] relative">
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
      <h1 className="text-[12rem] md:text-[18rem] font-black text-white/5 relative z-10 leading-none">404</h1>
      <div className="absolute inset-0 flex flex-col items-center justify-center z-20">
        <h2 className="text-4xl text-white font-black mb-6 tracking-tighter">Signal Lost</h2>
        <button onClick={onBack} className="px-10 py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-2xl transition shadow-2xl active:scale-95">Return to Safety</button>
      </div>
  </div>
);

export const PlansPage: React.FC<PageProps> = ({ onBack, onNavigate }) => {
    return (
        <PageLayout title="Connectivity Tiers" onBack={onBack} wide={true}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
                <PricingCard title="Free" price="$0" features={['P2P Direct Messaging', 'Encrypted Voice Calls', '720p Resolution', 'Community Support']} cta="Get Started" onAction={() => onNavigate?.('/register')}/>
                <PricingCard title="Pro" price="$9" features={['TURN Relay Network', 'HD 1080p Video', 'Group Chats (10 Users)', 'Priority SDK Access']} recommended={true} cta="Start Trial" onAction={() => onNavigate?.('/verify?tier=pro')}/>
                <PricingCard title="Team" price="$29" features={['Global Edge Mesh', '4K Ultra Video', 'Unlimited Group Size', 'Dedicated Key Mgmt']} cta="Contact Sales" onAction={() => onNavigate?.('/contact')}/>
            </div>
            <div className="text-center bg-[#111] p-8 rounded-[2rem] border border-white/5"><p className="text-gray-400 mb-4 font-medium">Looking for something more custom?</p><button onClick={() => onNavigate?.('/compare')} className="text-indigo-400 hover:text-indigo-300 font-black tracking-widest uppercase text-xs transition border-b-2 border-indigo-500/20 hover:border-indigo-500 pb-1">Compare technical specifications &rarr;</button></div>
        </PageLayout>
    );
};

export const DevPage: React.FC<PageProps> = ({ onBack, onNavigate }) => (
    <PageLayout title="Developer Hub" onBack={onBack}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
            <div onClick={() => onNavigate?.('/docs')} className="p-8 bg-[#13131a] border border-white/5 rounded-3xl cursor-pointer hover:bg-[#1a1a20] transition-all group hover:scale-[1.02] shadow-xl">
                <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 mb-6 group-hover:scale-110 transition"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.246.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg></div>
                <h3 className="text-2xl font-black text-white mb-2 tracking-tighter">Documentation</h3>
                <p className="text-gray-500 text-sm leading-relaxed">Read the full technical specification of the MasterVoice Protocol and SDK.</p>
            </div>
            <div onClick={() => onNavigate?.('/api_key')} className="p-8 bg-[#13131a] border border-white/5 rounded-3xl cursor-pointer hover:bg-[#1a1a20] transition-all group hover:scale-[1.02] shadow-xl">
                <div className="w-12 h-12 rounded-2xl bg-fuchsia-500/10 flex items-center justify-center text-fuchsia-400 mb-6 group-hover:scale-110 transition"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" /></svg></div>
                <h3 className="text-2xl font-black text-white mb-2 tracking-tighter">API Credentials</h3>
                <p className="text-gray-500 text-sm leading-relaxed">Manage your secure environment keys and view bandwidth usage quotas.</p>
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
        }, 600);
    };
    return (
        <PageLayout title="Developer Console" onBack={onBack} wide={true}>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 text-left">
                <div className="lg:col-span-2 space-y-8">
                    <section className="bg-[#111] p-10 rounded-[2.5rem] border border-white/5 shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-fuchsia-500 to-indigo-500"></div>
                        <h2 className="text-2xl font-black text-white mb-2 tracking-tighter">Provision New Key</h2>
                        <p className="text-gray-500 text-sm mb-8">Select your target SLA tier for key generation.</p>
                        <div className="grid grid-cols-3 gap-4 mb-8">
                            {['free', 'pro', 'elite'].map((t: any) => (
                                <button 
                                    key={t} 
                                    onClick={() => setSelectedTier(t)} 
                                    className={`p-6 rounded-2xl border flex flex-col items-center gap-2 transition-all group ${selectedTier === t ? 'bg-indigo-500/10 border-indigo-500 text-white shadow-xl' : 'bg-transparent border-white/5 text-gray-500 hover:border-white/20'}`}
                                >
                                    <span className="font-black uppercase text-[10px] tracking-[0.2em]">{t}</span>
                                    {t === 'elite' && <span className="text-[8px] bg-amber-500 text-black font-black px-1.5 rounded-full">SLA</span>}
                                </button>
                            ))}
                        </div>
                        <button 
                            onClick={() => selectedTier === 'free' ? generateKeyInternal('free') : onNavigate?.(`/verify?tier=${selectedTier}`)} 
                            disabled={loading} 
                            className="w-full py-5 bg-white text-black font-black rounded-2xl hover:bg-gray-200 transition active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3 uppercase tracking-widest text-xs"
                        >
                            {loading ? <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"/> : 'Generate Authorization Token'}
                        </button>
                    </section>
                    
                    <div className="space-y-6">
                        <h3 className="text-sm font-black text-gray-500 uppercase tracking-[0.2em] ml-2">Authenticated tokens</h3>
                        {generatedKeys.length === 0 && <div className="text-center py-20 border-4 border-dashed border-white/5 rounded-[2.5rem] text-gray-700 font-bold uppercase tracking-widest text-xs">No active tokens</div>}
                        <div className="space-y-3">
                            {generatedKeys.map((k, i) => (
                                <div key={i} className="flex items-center justify-between p-6 bg-[#0a0a0f] border border-white/5 rounded-2xl animate-fade-in-up hover:bg-white/5 transition-colors">
                                    <div className="flex flex-col">
                                        <div className="flex items-center gap-3 mb-1">
                                            <span className={`w-2.5 h-2.5 rounded-full ${k.tier === 'elite' ? 'bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]' : 'bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]'}`}></span>
                                            <code className="text-sm font-mono text-white tracking-tighter">{k.key}</code>
                                        </div>
                                        <span className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">Generated {k.created}</span>
                                    </div>
                                    <button onClick={() => { navigator.clipboard.writeText(k.key); alert('Copied!'); }} className="p-3 bg-white/5 hover:bg-white/10 rounded-xl transition text-gray-400 hover:text-white"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg></button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </PageLayout>
    );
};

export const ComparePlansPage: React.FC<PageProps> = ({ onBack, onNavigate }) => {
    const features = [
        { category: "Core Infrastructure", items: [
            { name: "P2P Signaling", free: "Standard", pro: "High Priority", team: "Ultra-Low Latency" },
            { name: "Voice Codec", free: "Opus (48kbps)", pro: "HD Opus (128kbps)", team: "Lossless PCM" },
            { name: "Video Bitrate", free: "2 Mbps", pro: "8 Mbps", team: "Unlimited (Mesh)" },
            { name: "TURN Relay Traffic", free: "None", pro: "Included", team: "High Bandwidth" },
        ]},
        { category: "Developer Control", items: [
            { name: "API Rate Limits", free: "100 req/min", pro: "500 req/min", team: "Custom (Unlimited)" },
            { name: "Custom Theming", free: "Presets Only", pro: "Full HSL Engine", team: "White-label + CSS" },
            { name: "Identity Management", free: "Supabase Only", pro: "SSO + Supabase", team: "Enterprise IdP" },
        ]}
    ];
    return (
        <PageLayout title="Technical Specs" onBack={onBack} wide={true}>
            <div className="overflow-hidden rounded-[2.5rem] border border-white/10 bg-[#0a0a0f] shadow-2xl">
                <table className="w-full text-left border-collapse min-w-[700px]">
                    <thead>
                        <tr className="bg-[#111] border-b border-white/10">
                            <th className="p-8 text-xs text-gray-500 font-black uppercase tracking-widest">Protocol Feature</th>
                            <th className="p-8 text-center text-xs font-black uppercase tracking-widest">Free</th>
                            <th className="p-8 text-center bg-indigo-900/10 border-x border-indigo-500/10 text-indigo-400 text-xs font-black uppercase tracking-widest">Pro</th>
                            <th className="p-8 text-center text-xs font-black uppercase tracking-widest">Team</th>
                        </tr>
                    </thead>
                    <tbody>
                        {features.map((section, i) => (
                            <React.Fragment key={i}>
                                <tr>
                                    <td colSpan={4} className="p-4 px-8 text-[10px] font-black text-gray-600 uppercase tracking-[0.3em] bg-[#050508] border-y border-white/5">{section.category}</td>
                                </tr>
                                {section.items.map((feat, j) => (
                                    <tr key={j} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                                        <td className="p-6 px-8 font-bold text-gray-300 text-sm tracking-tight">{feat.name}</td>
                                        <td className="p-6 text-center text-gray-500 text-xs">{feat.free}</td>
                                        <td className="p-6 text-center text-white font-bold text-xs bg-indigo-900/5 border-x border-indigo-500/10">{feat.pro}</td>
                                        <td className="p-6 text-center text-gray-300 text-xs">{feat.team}</td>
                                    </tr>
                                ))}
                            </React.Fragment>
                        ))}
                    </tbody>
                </table>
            </div>
            <div className="mt-12 text-center">
                <button onClick={() => onNavigate?.('/register')} className="px-10 py-5 bg-indigo-600 text-white font-black rounded-2xl transition shadow-xl shadow-indigo-600/20 active:scale-95 uppercase tracking-widest text-xs">Begin Integration</button>
            </div>
        </PageLayout>
    );
};

export const MauLimitPage: React.FC<PageProps> = ({ onBack, onNavigate }) => (
    <PageLayout title="MAU Quotas" onBack={onBack}>
        <p className="text-xl text-white font-bold mb-6 tracking-tighter">Bandwidth and Scale</p>
        <p className="text-gray-400 leading-relaxed mb-8">Monthly Active User (MAU) limits exist primarily to manage the high computational and bandwidth costs associated with <strong>Global TURN Relay traffic</strong>. Since media packets traversing our relay network incur real-time infrastructure costs, we allocate limits based on your connectivity tier.</p>
        <div className="p-8 bg-indigo-500/10 border border-indigo-500/20 rounded-3xl">
            <h5 className="text-white font-bold mb-2">Enterprise Scaling</h5>
            <p className="text-sm text-gray-500">For users requiring more than 10,000 MAU or custom region-locked relays, please contact our network orchestration team.</p>
        </div>
    </PageLayout>
);
