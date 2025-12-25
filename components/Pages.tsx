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
            <span className="text-sm font-semibold tracking-wide">BACK</span>
        </button>
      )}

      <div className={`glass-panel p-8 md:p-12 rounded-3xl border border-white/10 ${wide ? 'bg-[#050510]/80' : ''}`}>
        {title && <h1 className="text-4xl md:text-5xl font-bold mb-8 bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">{title}</h1>}
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
                    <h3 className="text-lg font-bold text-white mb-4">Generated Palette</h3>
                    <div className="space-y-2 mb-8">
                        {Object.entries(palette).map(([shade, color]: any) => (
                            <div key={shade} className="flex items-center gap-4">
                                <div className="w-12 h-8 rounded shadow-lg border border-white/10" style={{ backgroundColor: color }}></div>
                                <span className="text-sm font-mono text-gray-400 w-12">{shade}</span>
                                <span className="text-sm font-mono text-gray-500">{color}</span>
                            </div>
                        ))}
                    </div>
                    <div className="flex gap-4">
                        <button onClick={handleSave} className="px-8 py-3 bg-white text-black font-bold rounded-xl hover:bg-gray-200 transition">Save Theme</button>
                        <button onClick={() => setBaseColor('#6366f1')} className="px-8 py-3 bg-white/10 text-white font-bold rounded-xl hover:bg-white/20 transition">Reset</button>
                    </div>
                </div>
                <div className="relative">
                    <h3 className="text-lg font-bold text-white mb-4">Live Preview</h3>
                    <div className="bg-[#060609] border border-white/10 rounded-3xl p-6 shadow-2xl relative overflow-hidden h-[500px] flex flex-col">
                        <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/5" style={{ borderColor: 'var(--theme-900)' }}>
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold" style={{ background: `linear-gradient(to right, ${palette[500]}, ${palette[700]})` }}>A</div>
                                <div><div className="font-bold text-white">Alice</div><div className="text-xs font-bold" style={{ color: palette[400] }}>Online</div></div>
                            </div>
                        </div>
                        <div className="space-y-4 flex-1">
                            <div className="flex justify-start"><div className="bg-[#1a1a20] p-3 rounded-2xl rounded-bl-sm text-sm text-gray-300 max-w-[80%] border border-white/5">Hey! Check the theme.</div></div>
                            <div className="flex justify-end"><div className="p-3 rounded-2xl rounded-br-sm text-sm text-white max-w-[80%] shadow-lg" style={{ background: `linear-gradient(135deg, ${palette[600]}, ${palette[500]})` }}>Looks good!</div></div>
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
        { title: "Introduction", content: (
            <div className="animate-fade-in-up">
                <h2 className="text-white">The MasterVoice Protocol</h2>
                <p>MasterVoice is a high-performance, decentralized communication suite built on the principle of <strong>Peer-to-Peer Sovereignty</strong>. By combining Supabase's global edge infrastructure with WebRTC's real-time media engine, we provide an experience that is both private by default and globally performant.</p>
                <div className="grid grid-cols-2 gap-4 my-8">
                    <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                        <h4 className="text-indigo-400 mb-1">Decentralized</h4>
                        <p className="text-xs text-gray-500">Messages and calls route directly between peers whenever possible.</p>
                    </div>
                    <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                        <h4 className="text-indigo-400 mb-1">Encrypted</h4>
                        <p className="text-xs text-gray-500">Every byte of media is encrypted using SRTP (AES-GCM).</p>
                    </div>
                </div>
            </div>
        )},
        { title: "WebRTC Signaling", content: (
            <div className="animate-fade-in-up">
                <h2 className="text-white">The Handshake</h2>
                <p>Our signaling layer uses Supabase Realtime (WebSockets) to exchange ICE candidates and SDP offers. This allows peers to traverse firewalls without a central media server.</p>
                <pre className="bg-[#111] p-4 rounded-xl text-xs font-mono text-indigo-300 overflow-x-auto">
{`interface SignalingPayload {
  type: 'offer' | 'answer' | 'candidate' | 'hangup';
  sdp?: RTCSessionDescriptionInit;
  candidate?: RTCIceCandidateInit;
  callerId?: string;
}`}
                </pre>
                <p className="text-sm mt-4">Peers listen on <code>webrtc:room_id</code> broadcast channels. The initiator sends an <code>offer</code>, the recipient replies with an <code>answer</code>, and both exchange <code>candidate</code> objects until a P2P path is found.</p>
            </div>
        )},
        { title: "TURN Relay Architecture", content: (
            <div className="animate-fade-in-up">
                <h2 className="text-white">Universal Connectivity</h2>
                <p>Approximately 15% of users sit behind symmetric NATs or corporate firewalls that block P2P traffic. MasterVoice handles this via our <strong>Global TURN Relay Network</strong>.</p>
                <ul className="list-disc pl-5 space-y-2 text-sm">
                    <li><strong>Pro/Team Tier:</strong> Forced relay via <code>relay1.expressturn.com</code> ensures 100% call success rate.</li>
                    <li><strong>Latency:</strong> Our TURN nodes are positioned in Tier-1 data centers to maintain sub-50ms RTT.</li>
                    <li><strong>Fallback:</strong> Automatic transition from UDP to TCP (Port 443) if standard ports are blocked.</li>
                </ul>
            </div>
        )},
        { title: "Dynamic Theming", content: (
            <div className="animate-fade-in-up">
                <h2 className="text-white">HSL-Based Shade Engine</h2>
                <p>The MasterVoice theme engine doesn't just swap colors; it recalculates the entire visual hierarchy from a single HEX input.</p>
                <pre className="bg-[#111] p-4 rounded-xl text-xs font-mono text-gray-300 overflow-x-auto">
{`// Example of HSL generation for the '500' base shade:
const l = (max + min) / 2;
const shadeMap = {
  50: 0.97, // Lighter for backgrounds
  500: l,   // Original brand color
  950: 0.25 // Deep dark variant
};`}
                </pre>
                <p className="text-sm">These values are injected into <code>:root</code> as CSS variables (<code>--theme-500</code>), which Tailwind then maps to utility classes.</p>
            </div>
        )},
        { title: "GIF Cache & Giphy", content: (
            <div className="animate-fade-in-up">
                <h2 className="text-white">Resilient GIF Engine</h2>
                <p>To satisfy the high demand for "Gir" GIFs while handling potential API rate-limiting or 403 Forbidden errors, we implemented a dual-path engine.</p>
                <ol className="list-decimal pl-5 space-y-2 text-sm">
                    <li><strong>Primary:</strong> Dynamic search via Giphy SDK.</li>
                    <li><strong>Secondary (Fallback):</strong> If the API fails or is forbidden, a hardcoded <code>FALLBACK_GIR_GIFS</code> array is injected.</li>
                    <li><strong>Caching:</strong> High-resolution originals are loaded into a global lightbox for crystal-clear viewing.</li>
                </ol>
            </div>
        )},
        { title: "SDK Usage", content: (
            <div className="animate-fade-in-up">
                <h2 className="text-white">Developer API</h2>
                <p>Build your own interface on top of the MasterVoice core using our drop-in SDK.</p>
                <pre className="bg-[#111] p-4 rounded-xl text-xs font-mono text-green-400 overflow-x-auto">
{`import { MasterVoice } from 'mastervoice-sdk';

const mv = new MasterVoice({ apiKey: '...' });
await mv.initializeCall(roomId, userId);

mv.on('track', ({ stream }) => {
  videoElement.srcObject = stream;
});

await mv.startCall({ audio: true, video: true });`}
                </pre>
            </div>
        )},
        { title: "Security & Encryption", content: (
            <div className="animate-fade-in-up">
                <h2 className="text-white">Privacy is Math</h2>
                <p>MasterVoice employs a three-layer security model:</p>
                <ul className="list-disc pl-5 text-sm space-y-2">
                    <li><strong>Data-at-Rest:</strong> Supabase AES-256 for message persistence.</li>
                    <li><strong>Transport Layer:</strong> WSS (WebSocket Secure) for signaling.</li>
                    <li><strong>Media Layer:</strong> SRTP with DTLS handshake for all voice/video packets.</li>
                </ul>
                <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-xl mt-4">
                    <p className="text-xs text-amber-300 font-bold">PRO TIP:</p>
                    <p className="text-[10px] text-amber-200/70">Verify your session fingerprint with your contact to ensure no Man-in-the-Middle interceptors are present on the signaling path.</p>
                </div>
            </div>
        )}
    ];

    return (
        <PageLayout title="SDK & Technical Reference" onBack={onBack} wide={true}>
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-12 text-left">
                <div className="lg:col-span-1 border-r border-white/10 pr-6 shrink-0">
                    <h4 className="font-bold text-white mb-6 uppercase text-xs tracking-wider opacity-50">Chapters</h4>
                    <ul className="space-y-1">
                        {sections.map((sec, i) => (
                            <li key={i} onClick={() => setActiveSection(i)} className={`cursor-pointer px-4 py-3 rounded-xl text-sm font-bold transition-all ${activeSection === i ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}>
                                {i + 1}. {sec.title}
                            </li>
                        ))}
                    </ul>
                </div>
                <div className="lg:col-span-3 min-h-[500px]">
                    {sections[activeSection].content}
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
                 <div className="h-1 w-full bg-gray-800 rounded-full overflow-hidden"><div className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-500 ease-out" style={{ width: `${progress}%` }}></div></div>
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
      <div className="bg-[#111] p-6 rounded-xl border border-white/10 text-left">
          <p className="mb-2"><strong>Email:</strong> support@mastervoice.io</p>
          <p className="mb-2"><strong>Twitter:</strong> @MasterVoiceHQ</p>
          <p><strong>Discord:</strong> discord.gg/mastervoice</p>
      </div>
  </PageLayout>
);

export const NotFoundPage: React.FC<PageProps> = ({ onBack }) => (
  <div className="min-h-screen bg-[#030014] flex flex-col items-center justify-center font-['Outfit'] relative">
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
      <h1 className="text-9xl font-bold text-white/10 relative z-10">404</h1>
      <h2 className="text-2xl text-white font-bold mb-4 relative z-10">Page Not Found</h2>
      <button onClick={onBack} className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl transition relative z-10">Go Back Home</button>
  </div>
);

export const PlansPage: React.FC<PageProps> = ({ onBack, onNavigate }) => {
    return (
        <PageLayout title="Choose Your Plan" onBack={onBack} wide={true}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
                <PricingCard title="Free" price="$0" features={['P2P Calling', 'Unlimited Messages', 'Standard Quality', 'Community Support']} cta="Get Started" onAction={() => onNavigate?.('/register')}/>
                <PricingCard title="Pro" price="$9" features={['TURN Relay (Firewall Bypass)', 'HD Voice & Video', 'Group Calls (up to 10)', 'Priority Support']} recommended={true} cta="Start Trial" onAction={() => onNavigate?.('/verify?tier=pro')}/>
                <PricingCard title="Team" price="$29" features={['Global Low Latency Network', '4K Screen Sharing', 'Unlimited Group Size', 'Dedicated Support']} cta="Contact Sales" onAction={() => onNavigate?.('/contact')}/>
            </div>
            <div className="text-center"><p className="text-gray-400 mb-4">Need full feature breakdown?</p><button onClick={() => onNavigate?.('/compare')} className="text-indigo-400 hover:text-indigo-300 font-bold hover:underline transition">Compare all features &rarr;</button></div>
        </PageLayout>
    );
};

export const DevPage: React.FC<PageProps> = ({ onBack, onNavigate }) => (
    <PageLayout title="Developer Tools" onBack={onBack}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
            <div onClick={() => onNavigate?.('/docs')} className="p-6 bg-[#111] border border-white/10 rounded-2xl cursor-pointer hover:bg-[#1a1a20] transition group"><h3 className="text-xl font-bold text-white mb-2 group-hover:text-indigo-400">Documentation</h3><p className="text-gray-400 text-sm">Read the full SDK reference and integration guides.</p></div>
            <div onClick={() => onNavigate?.('/api_key')} className="p-6 bg-[#111] border border-white/10 rounded-2xl cursor-pointer hover:bg-[#1a1a20] transition group"><h3 className="text-xl font-bold text-white mb-2 group-hover:text-indigo-400">API Keys</h3><p className="text-gray-400 text-sm">Manage your secret keys and view usage quotas.</p></div>
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
                    <section className="bg-[#111] p-8 rounded-2xl border border-white/10"><h2 className="text-2xl font-bold text-white mb-2">Create New API Key</h2><div className="grid grid-cols-3 gap-4 mb-8">{['free', 'pro', 'elite'].map((t: any) => (<button key={t} onClick={() => setSelectedTier(t)} className={`p-4 rounded-xl border flex flex-col items-center gap-2 transition-all ${selectedTier === t ? 'bg-white/10 border-indigo-500 text-white shadow-[0_0_20px_rgba(99,102,241,0.3)]' : 'bg-transparent border-white/10 text-gray-500 hover:border-white/30'}`}><span className="font-bold uppercase text-[10px] tracking-widest">{t}</span></button>))}</div><button onClick={() => selectedTier === 'free' ? generateKeyInternal('free') : onNavigate?.(`/verify?tier=${selectedTier}`)} disabled={loading} className="w-full py-4 bg-white text-black font-bold rounded-xl hover:bg-gray-200 transition active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2">{loading ? <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin"/> : 'Generate Key'}</button></section>
                    <div className="space-y-4"><h3 className="text-lg font-bold text-gray-300">Active Keys</h3>{generatedKeys.length === 0 && <div className="text-center py-12 border-2 border-dashed border-white/5 rounded-2xl text-gray-500">No keys yet.</div>}{generatedKeys.map((k, i) => (<div key={i} className="flex items-center justify-between p-4 bg-[#0a0a0f] border border-white/10 rounded-xl animate-fade-in-up"><div className="flex flex-col"><div className="flex items-center gap-2 mb-1"><span className={`w-2 h-2 rounded-full ${k.tier === 'elite' ? 'bg-amber-500' : 'bg-indigo-500'}`}></span><code className="text-sm font-mono text-white">{k.key}</code></div><span className="text-xs text-gray-500">Created {k.created}</span></div></div>))}</div>
                </div>
            </div>
        </PageLayout>
    );
};

export const ComparePlansPage: React.FC<PageProps> = ({ onBack, onNavigate }) => {
    const features = [
        { category: "Core Experience", items: [
            { name: "P2P Messaging", free: "Unlimited", pro: "Unlimited", team: "Unlimited" },
            { name: "Voice Calls", free: "Standard Quality", pro: "HD Voice (Opus)", team: "Studio Lossless" },
            { name: "Video Resolution", free: "720p @ 30fps", pro: "1080p @ 60fps", team: "4K @ 60fps" },
        ]},
        { category: "Network & Security", items: [
            { name: "Encryption", free: "End-to-End (AES-256)", pro: "E2EE (AES-256)", team: "E2EE + HSM Key Mgmt" },
            { name: "Connection Mode", free: "P2P (STUN Only)", pro: "TURN Relay (UDP)", team: "Global Mesh (TCP/UDP)" },
        ]}
    ];
    return (
        <PageLayout title="Compare Plans" onBack={onBack} wide={true}>
            <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#0a0a0f]">
                <table className="w-full text-left border-collapse min-w-[600px]">
                    <thead><tr className="bg-[#111] border-b border-white/10"><th className="p-6 text-sm text-gray-400 font-medium">Feature</th><th className="p-6 text-center">Free</th><th className="p-6 text-center bg-indigo-900/10 border-x border-indigo-500/10 text-indigo-400">Pro</th><th className="p-6 text-center">Team</th></tr></thead>
                    <tbody>{features.map((section, i) => (<React.Fragment key={i}><tr><td colSpan={4} className="p-3 px-6 text-[10px] font-bold text-gray-500 uppercase tracking-widest bg-[#050508] border-y border-white/5">{section.category}</td></tr>{section.items.map((feat, j) => (<tr key={j} className="border-b border-white/5"><td className="p-4 px-6 font-medium text-gray-300">{feat.name}</td><td className="p-4 text-center text-gray-400 text-sm">{feat.free}</td><td className="p-4 text-center text-white font-medium text-sm bg-indigo-900/5 border-x border-indigo-500/10">{feat.pro}</td><td className="p-4 text-center text-gray-300 text-sm">{feat.team}</td></tr>))}</React.Fragment>))}</tbody>
                </table>
            </div>
            <div className="mt-12 text-center"><button onClick={() => onNavigate?.('/register')} className="px-8 py-3 bg-indigo-600 text-white font-bold rounded-xl transition shadow-lg shadow-indigo-600/20">Upgrade Now</button></div>
        </PageLayout>
    );
};

export const MauLimitPage: React.FC<PageProps> = ({ onBack, onNavigate }) => (
    <PageLayout title="MAU Limits" onBack={onBack}>
        <p className="text-xl text-white font-medium mb-6">Bandwidth and Scale</p>
        <p className="text-gray-400 leading-relaxed mb-8">Monthly Active User limits exist primarily to manage the high computational and bandwidth costs associated with <strong>TURN Relay traffic</strong>. For Enterprise users, these limits are fully customizable.</p>
    </PageLayout>
);
