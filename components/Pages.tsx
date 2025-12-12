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

    // Generate Tailwind-like shades
    const shadeMap = {
        50: 0.95, 100: 0.9, 200: 0.8, 300: 0.7, 400: 0.6,
        500: l, // Base
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
    const [gradientStart, setGradientStart] = useState('#6366f1');
    const [gradientEnd, setGradientEnd] = useState('#a855f7');
    const [palette, setPalette] = useState<any>({});
    const [customGradient, setCustomGradient] = useState('');

    useEffect(() => {
        setPalette(generateShades(baseColor));
    }, [baseColor]);

    useEffect(() => {
        setCustomGradient(`linear-gradient(135deg, ${gradientStart}, ${gradientEnd})`);
    }, [gradientStart, gradientEnd]);

    const handleSave = () => {
        const root = document.documentElement;
        Object.entries(palette).forEach(([key, value]) => {
            root.style.setProperty(`--theme-${key}`, value as string);
        });
        
        root.style.setProperty('--theme-gradient', customGradient);
        
        localStorage.setItem('mv_theme_name', 'custom');
        localStorage.setItem('mv_theme_custom', JSON.stringify(palette));
        localStorage.setItem('mv_theme_gradient', customGradient);
        
        onNavigate?.('/settings');
    };

    return (
        <PageLayout title="Theme Editor" onBack={onBack}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                <div className="space-y-8">
                    {/* Base Color Section */}
                    <div>
                        <label className="block text-sm font-bold text-gray-400 mb-2 uppercase tracking-wide">Base Color (Solid)</label>
                        <div className="flex gap-4 items-center">
                            <input 
                                type="color" 
                                value={baseColor} 
                                onChange={(e) => setBaseColor(e.target.value)} 
                                className="w-16 h-16 rounded-xl cursor-pointer bg-transparent border-0 p-0"
                            />
                            <div className="text-xl font-mono text-white">{baseColor}</div>
                        </div>
                    </div>

                    {/* Gradient Section */}
                    <div className="bg-white/5 p-6 rounded-2xl border border-white/5">
                         <label className="block text-sm font-bold text-gray-400 mb-4 uppercase tracking-wide">Custom Gradient</label>
                         <div className="grid grid-cols-2 gap-4">
                             <div>
                                 <span className="text-xs text-gray-500 mb-1 block">Start Color</span>
                                 <div className="flex gap-3 items-center">
                                    <input 
                                        type="color" 
                                        value={gradientStart} 
                                        onChange={(e) => setGradientStart(e.target.value)} 
                                        className="w-10 h-10 rounded-lg cursor-pointer bg-transparent border-0 p-0"
                                    />
                                    <span className="text-xs font-mono">{gradientStart}</span>
                                 </div>
                             </div>
                             <div>
                                 <span className="text-xs text-gray-500 mb-1 block">End Color</span>
                                 <div className="flex gap-3 items-center">
                                    <input 
                                        type="color" 
                                        value={gradientEnd} 
                                        onChange={(e) => setGradientEnd(e.target.value)} 
                                        className="w-10 h-10 rounded-lg cursor-pointer bg-transparent border-0 p-0"
                                    />
                                    <span className="text-xs font-mono">{gradientEnd}</span>
                                 </div>
                             </div>
                         </div>
                         <div 
                             className="mt-4 h-12 w-full rounded-xl shadow-lg border border-white/10 flex items-center justify-center text-sm font-bold text-white text-shadow"
                             style={{ background: customGradient }}
                         >
                             Gradient Preview
                         </div>
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
                        <button onClick={() => { setBaseColor('#6366f1'); setGradientStart('#6366f1'); setGradientEnd('#a855f7'); }} className="px-8 py-3 bg-white/10 text-white font-bold rounded-xl hover:bg-white/20 transition">Reset</button>
                    </div>
                </div>

                {/* Preview */}
                <div className="relative">
                    <h3 className="text-lg font-bold text-white mb-4">Live Preview</h3>
                    <div className="bg-[#060609] border border-white/10 rounded-3xl p-6 shadow-2xl relative overflow-hidden h-[500px] flex flex-col">
                        
                        {/* Fake Header */}
                        <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/5" style={{ borderColor: 'var(--theme-900)' }}>
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold" style={{ background: customGradient }}>
                                    A
                                </div>
                                <div>
                                    <div className="font-bold text-white">Alice</div>
                                    <div className="text-xs font-bold" style={{ color: palette[400] }}>Online</div>
                                </div>
                            </div>
                            <div className="p-2 rounded-full text-white" style={{ backgroundColor: palette[600] }}>
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                            </div>
                        </div>

                        {/* Messages */}
                        <div className="space-y-4 flex-1">
                            <div className="flex justify-start">
                                <div className="bg-[#1a1a20] p-3 rounded-2xl rounded-bl-sm text-sm text-gray-300 max-w-[80%] border border-white/5">
                                    Hey! How do you like the new theme?
                                </div>
                            </div>
                            <div className="flex justify-end">
                                <div className="p-3 rounded-2xl rounded-br-sm text-sm text-white max-w-[80%] shadow-lg" style={{ background: customGradient }}>
                                    It looks amazing! The generated shades are perfect.
                                </div>
                            </div>
                            <div className="flex justify-start">
                                <div className="bg-[#1a1a20] p-3 rounded-2xl rounded-bl-sm text-sm text-gray-300 max-w-[80%] border border-white/5">
                                    Glad you like it! 🔥
                                </div>
                            </div>
                        </div>

                        {/* Input */}
                        <div className="mt-4 relative">
                            <input 
                                type="text" 
                                placeholder="Type a message..." 
                                className="w-full bg-[#1a1a20] border border-white/10 rounded-full py-3 px-4 text-sm text-white focus:outline-none focus:ring-2"
                                style={{ '--tw-ring-color': palette[500] } as any}
                            />
                            <button className="absolute right-2 top-2 p-1.5 rounded-full text-white transition hover:scale-110" style={{ background: customGradient }}>
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                            </button>
                        </div>

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
        
        const steps = [
            { pct: 20, msg: `Verifying ${tier!.toUpperCase()} eligibility...` },
            { pct: 50, msg: 'Checking billing information...' },
            { pct: 80, msg: 'Allocating TURN relay servers...' },
            { pct: 100, msg: 'Verification Complete!' }
        ];

        let step = 0;
        const interval = setInterval(() => {
            if (step < steps.length) {
                setProgress(steps[step].pct);
                setStatus(steps[step].msg);
                step++;
            } else {
                clearInterval(interval);
                setTimeout(() => {
                    onNavigate?.(`/api_key?verified=true&tier=${tier}`);
                }, 800);
            }
        }, 800);

        return () => clearInterval(interval);
    }, [onNavigate]);

    return (
        <div className="min-h-screen bg-[#030014] flex flex-col items-center justify-center relative font-['Outfit']">
             <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
             
             <div className="relative z-10 text-center max-w-md w-full p-8">
                 <div className="w-20 h-20 mx-auto mb-8 relative">
                     <div className="absolute inset-0 border-4 border-indigo-900 rounded-full"></div>
                     <div className="absolute inset-0 border-4 border-indigo-500 rounded-full border-t-transparent animate-spin"></div>
                     <div className="absolute inset-0 flex items-center justify-center font-bold text-indigo-400 text-xs">
                         {progress}%
                     </div>
                 </div>
                 
                 <h2 className="text-2xl font-bold text-white mb-2">Please Wait</h2>
                 <p className="text-indigo-300 animate-pulse mb-8 h-6">{status}</p>

                 <div className="h-1 w-full bg-gray-800 rounded-full overflow-hidden">
                     <div 
                        className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-500 ease-out" 
                        style={{ width: `${progress}%` }}
                     ></div>
                 </div>
             </div>
        </div>
    );
}

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
        const allowedTiers = ['free', 'pro', 'elite'];
        const safeTier = allowedTiers.includes(tier) ? tier : 'free';

        setLoading(true);
        setTimeout(() => {
            const random = Array.from(crypto.getRandomValues(new Uint8Array(16))).map(b => b.toString(16).padStart(2, '0')).join('').substring(0, 16);
            const prefix = `mv_${safeTier}_`;
            const newKey = `${prefix}${random}`;
            
            setGeneratedKeys(prev => [{
                key: newKey,
                tier: safeTier,
                created: new Date().toLocaleDateString()
            }, ...prev]);
            setLoading(false);
        }, 600);
    };

    const handleGenerateClick = () => {
        if (selectedTier !== 'free') {
            onNavigate?.(`/verify?tier=${selectedTier}`);
            return;
        }
        generateKeyInternal(selectedTier);
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
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
                                    <span className="text-[10px] uppercase tracking-wider">Standard Relay</span>
                                </button>
                                <button 
                                    onClick={() => setSelectedTier('pro')}
                                    className={`p-4 rounded-xl border flex flex-col items-center gap-2 transition-all ${selectedTier === 'pro' ? 'bg-white/10 border-indigo-500 text-white shadow-[0_0_20px_rgba(99,102,241,0.3)]' : 'bg-transparent border-white/10 text-gray-500 hover:border-white/30'}`}
                                >
                                    <span className="font-bold">Pro</span>
                                    <span className="text-[10px] uppercase tracking-wider">Turbo Mesh</span>
                                </button>
                                <button 
                                    onClick={() => setSelectedTier('elite')}
                                    className={`p-4 rounded-xl border flex flex-col items-center gap-2 transition-all ${selectedTier === 'elite' ? 'bg-gradient-to-br from-amber-500/20 to-orange-600/20 border-amber-500 text-amber-200 shadow-[0_0_20px_rgba(245,158,11,0.3)]' : 'bg-transparent border-white/10 text-gray-500 hover:border-white/30'}`}
                                >
                                    <span className="font-bold">Elite</span>
                                    <span className="text-[10px] uppercase tracking-wider">Global + SLA</span>
                                </button>
                            </div>

                            <button 
                                onClick={handleGenerateClick} 
                                disabled={loading}
                                className="w-full py-4 bg-white text-black font-bold rounded-xl hover:bg-gray-200 transition active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {loading ? <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin"/> : <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" /></svg>}
                                <span>{selectedTier === 'free' ? 'Generate Secret Key' : `Verify & Generate ${selectedTier} Key`}</span>
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
                                <div className="h-2 bg-gray-800 rounded-full overflow-hidden mb-1">
                                    <div className="h-full bg-indigo-500 w-[12%]"></div>
                                </div>
                                <button 
                                    onClick={() => onNavigate?.('/mau-limit')}
                                    className="text-[10px] text-gray-500 hover:text-white underline transition"
                                >
                                    Why is this limited?
                                </button>
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

export const PrivacyPolicy: React.FC<PageProps> = ({ onBack }) => (
    <PageLayout title="Privacy Policy" onBack={onBack}>
        <h3>1. Data Collection</h3>
        <p>We collect minimal data required to establish peer-to-peer connections. Messages are end-to-end encrypted and are not stored on our servers once delivered.</p>
        <h3>2. Usage</h3>
        <p>Data is used solely for service delivery and improvement. We do not sell your data.</p>
        <h3>3. Encryption</h3>
        <p>All calls and messages use industry-standard encryption protocols (DTLS/SRTP for WebRTC, AES-256 for messages).</p>
    </PageLayout>
);

export const TermsOfService: React.FC<PageProps> = ({ onBack }) => (
    <PageLayout title="Terms of Service" onBack={onBack}>
        <h3>1. Acceptance</h3>
        <p>By using MasterVoice, you agree to these terms.</p>
        <h3>2. Conduct</h3>
        <p>You may not use the service for illegal activities or harassment.</p>
        <h3>3. Liability</h3>
        <p>MasterVoice is provided "as is" without warranties.</p>
    </PageLayout>
);

export const ContactSupport: React.FC<PageProps> = ({ onBack }) => (
    <PageLayout title="Contact Support" onBack={onBack}>
        <p>Need help? Reach out to our team.</p>
        <div className="mt-8">
            <p className="font-bold text-white">Email</p>
            <p className="text-indigo-400">support@mastervoice.dev</p>
        </div>
        <div className="mt-4">
            <p className="font-bold text-white">Discord</p>
            <p className="text-indigo-400">Join our community server</p>
        </div>
    </PageLayout>
);

export const NotFoundPage: React.FC<PageProps> = ({ onBack }) => (
    <div className="min-h-screen bg-[#030014] flex flex-col items-center justify-center text-center p-6 font-['Outfit']">
        <h1 className="text-9xl font-bold text-gray-800">404</h1>
        <h2 className="text-3xl font-bold text-white mt-4">Page Not Found</h2>
        <p className="text-gray-400 mt-2 mb-8">The coordinate you are looking for does not exist in this mesh.</p>
        <button onClick={onBack} className="px-8 py-3 bg-white text-black font-bold rounded-xl hover:bg-gray-200 transition">Go Home</button>
    </div>
);

export const PlansPage: React.FC<PageProps> = ({ onBack, onNavigate }) => (
    <div className="min-h-screen bg-[#030014] overflow-y-auto font-['Outfit'] pt-24 pb-12">
        <div className="fixed top-6 left-6 z-50">
             <button onClick={onBack} className="flex items-center text-gray-400 hover:text-white transition bg-black/50 p-2 rounded-full backdrop-blur-md border border-white/10">
                 <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
             </button>
        </div>
        <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-16">
                <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">Choose your frequency</h1>
                <p className="text-gray-400 text-lg">Scalable plans for individuals and teams.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                <PricingCard 
                    title="Free" 
                    price="$0" 
                    features={['Unlimited Calls (Relay Included)', 'HD Voice & Video', 'Unlimited Groups', 'Screen Sharing', '30 Day Cloud History']} 
                    cta="Start Free"
                    onAction={() => onNavigate?.('/register')}
                />
                <PricingCard 
                    title="Pro" 
                    price="$9" 
                    features={['4K Ultra HD Video', 'Lossless Audio Mode', 'Priority Global Mesh', 'Permanent History', 'AI Noise Cancellation']} 
                    recommended={true}
                    cta="Get Pro"
                    onAction={() => onNavigate?.('/register?plan=pro')}
                />
                <PricingCard 
                    title="Team" 
                    price="$29" 
                    features={['Admin Dashboard', 'SSO Integration', 'Custom Retention', 'Dedicated Support', '99.9% SLA']} 
                    cta="Contact Sales"
                    onAction={() => onNavigate?.('/contact')}
                />
            </div>
            
            <div className="mt-16 text-center">
                <button onClick={() => onNavigate?.('/compare')} className="text-indigo-400 hover:text-white font-bold underline decoration-2 underline-offset-4">Compare all features &rarr;</button>
            </div>
        </div>
    </div>
);

export const ComparePlansPage: React.FC<PageProps> = ({ onBack }) => (
    <PageLayout title="Compare Plans" onBack={onBack} wide={true}>
        <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
                <thead>
                    <tr className="border-b border-white/10">
                        <th className="p-4 text-gray-400 font-medium">Feature</th>
                        <th className="p-4 text-white font-bold">Free</th>
                        <th className="p-4 text-indigo-400 font-bold">Pro</th>
                        <th className="p-4 text-white font-bold">Team</th>
                    </tr>
                </thead>
                <tbody className="text-sm">
                    <tr className="border-b border-white/5"><td className="p-4 text-gray-300">P2P & Relay Calls</td><td className="p-4 text-white">Unlimited</td><td className="p-4 text-white">Unlimited</td><td className="p-4 text-white">Unlimited</td></tr>
                    <tr className="border-b border-white/5"><td className="p-4 text-gray-300">Quality</td><td className="p-4 text-gray-400">HD 1080p</td><td className="p-4 text-white font-bold">4K Ready</td><td className="p-4 text-white font-bold">4K Ready</td></tr>
                    <tr className="border-b border-white/5"><td className="p-4 text-gray-300">Group Size</td><td className="p-4 text-gray-400">Unlimited</td><td className="p-4 text-white">Unlimited</td><td className="p-4 text-white">Unlimited</td></tr>
                    <tr className="border-b border-white/5"><td className="p-4 text-gray-300">Storage</td><td className="p-4 text-gray-400">5 GB</td><td className="p-4 text-white">100 GB</td><td className="p-4 text-white">1 TB</td></tr>
                    <tr className="border-b border-white/5"><td className="p-4 text-gray-300">Support</td><td className="p-4 text-gray-400">Community</td><td className="p-4 text-white">Priority Email</td><td className="p-4 text-white">Dedicated Agent</td></tr>
                </tbody>
            </table>
        </div>
    </PageLayout>
);

export const Documentation: React.FC<PageProps> = ({ onBack }) => (
    <PageLayout title="Documentation" onBack={onBack} wide={true}>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="md:col-span-1 border-r border-white/10 pr-4 space-y-2">
                <button className="text-indigo-400 font-bold block text-left w-full">Getting Started</button>
                <button className="text-gray-500 hover:text-white block text-left w-full">Authentication</button>
                <button className="text-gray-500 hover:text-white block text-left w-full">WebRTC Basics</button>
                <button className="text-gray-500 hover:text-white block text-left w-full">Signaling</button>
                <button className="text-gray-500 hover:text-white block text-left w-full">Error Handling</button>
            </div>
            <div className="md:col-span-3">
                <h2 className="text-2xl font-bold mb-4">Quick Start</h2>
                <p className="mb-4">Install the MasterVoice SDK to get started.</p>
                <pre className="bg-black/50 p-4 rounded-xl border border-white/10 font-mono text-sm mb-6">
                    <code>npm install @mastervoice/sdk</code>
                </pre>
                <p className="mb-4">Initialize the client with your API Key.</p>
                <pre className="bg-black/50 p-4 rounded-xl border border-white/10 font-mono text-sm">
                    <code>{`import { MasterVoice } from '@mastervoice/sdk';

const client = new MasterVoice({
  apiKey: 'mv_free_...'
});`}</code>
                </pre>
            </div>
        </div>
    </PageLayout>
);

export const DevPage: React.FC<PageProps> = ({ onNavigate, onBack }) => (
    <PageLayout title="Developer Console" onBack={onBack}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div onClick={() => onNavigate?.('/api_key')} className="p-6 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition cursor-pointer group">
                <h3 className="text-xl font-bold text-white mb-2 group-hover:text-indigo-400">API Keys</h3>
                <p className="text-gray-400 text-sm">Manage your API keys, view quotas, and monitor usage.</p>
            </div>
            <div onClick={() => onNavigate?.('/docs')} className="p-6 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition cursor-pointer group">
                <h3 className="text-xl font-bold text-white mb-2 group-hover:text-indigo-400">Documentation</h3>
                <p className="text-gray-400 text-sm">Read the guides, API references, and SDK documentation.</p>
            </div>
            <div className="p-6 bg-white/5 border border-white/10 rounded-2xl opacity-50 cursor-not-allowed">
                <h3 className="text-xl font-bold text-white mb-2">Webhooks (Coming Soon)</h3>
                <p className="text-gray-400 text-sm">Real-time event notifications for your server.</p>
            </div>
            <div className="p-6 bg-white/5 border border-white/10 rounded-2xl opacity-50 cursor-not-allowed">
                <h3 className="text-xl font-bold text-white mb-2">Analytics (Coming Soon)</h3>
                <p className="text-gray-400 text-sm">Deep insights into call quality and user engagement.</p>
            </div>
        </div>
    </PageLayout>
);

export const MauLimitPage: React.FC<PageProps> = ({ onBack }) => (
    <PageLayout title="MAU Limits Explained" onBack={onBack}>
        <p>To ensure fair usage and system stability, we limit the number of Monthly Active Users (MAU) for each API key tier.</p>
        <ul className="list-disc pl-5 space-y-2 mt-4 text-gray-300">
            <li><strong>Free Tier:</strong> 10k MAU. Suitable for hobby projects and small startups.</li>
            <li><strong>Pro Tier:</strong> 100k MAU. Designed for growing businesses.</li>
            <li><strong>Elite Tier:</strong> Unlimited MAU. For enterprise-scale applications.</li>
        </ul>
        <p className="mt-6">If you exceed your limit, new connections may be throttled until the next billing cycle or until you upgrade your plan.</p>
    </PageLayout>
);