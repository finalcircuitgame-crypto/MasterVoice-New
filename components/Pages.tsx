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
    // Basic helper to adjust lightness.
    // In a real app, use HSL. Here we use a simplified approach or just CSS manipulation
    // for this demo, we'll try to guess shades or just return the base for all (not ideal)
    // Better approach: Use CSS variables on the root and manipulate HSL.
    // Since we don't have a library, we will rely on a simple Hex -> HSL -> Hex logic.
    
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
    // 50: L~95, 500: Base L, 900: L~20
    const shadeMap = {
        50: 0.95, 100: 0.9, 200: 0.8, 300: 0.7, 400: 0.6,
        500: l, // Base
        600: l * 0.85, 700: l * 0.7, 800: l * 0.55, 900: l * 0.4, 950: l * 0.25
    };

    const palette: any = {};
    for (const [key, val] of Object.entries(shadeMap)) {
        // If key < 500, we interpolate between base L and 1.0
        // If key > 500, we interpolate between base L and 0.0
        let newL = val;
        // Adjust logic to be relative to input lightness for better results?
        // Simple override:
        if (key === '500') newL = l;
        else if (parseInt(key) < 500) {
             // Lighter
             newL = l + (1 - l) * (1 - (parseInt(key)/500)); 
             // Correction for 50 being almost white
             if(parseInt(key) === 50) newL = 0.97;
        } else {
             // Darker
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
        // Apply immediately
        const root = document.documentElement;
        Object.entries(palette).forEach(([key, value]) => {
            root.style.setProperty(`--theme-${key}`, value as string);
        });
        
        // Persist
        localStorage.setItem('mv_theme_name', 'custom');
        localStorage.setItem('mv_theme_custom', JSON.stringify(palette));
        
        onNavigate?.('/settings');
    };

    return (
        <PageLayout title="Theme Editor" onBack={onBack}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                <div>
                    <label className="block text-sm font-bold text-gray-400 mb-2 uppercase tracking-wide">Pick Base Color</label>
                    <div className="flex gap-4 items-center mb-8">
                        <input 
                            type="color" 
                            value={baseColor} 
                            onChange={(e) => setBaseColor(e.target.value)} 
                            className="w-16 h-16 rounded-xl cursor-pointer bg-transparent border-0 p-0"
                        />
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

                {/* Preview */}
                <div className="relative">
                    <h3 className="text-lg font-bold text-white mb-4">Live Preview</h3>
                    <div className="bg-[#060609] border border-white/10 rounded-3xl p-6 shadow-2xl relative overflow-hidden h-[500px] flex flex-col">
                        
                        {/* Fake Header */}
                        <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/5" style={{ borderColor: 'var(--theme-900)' }}>
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold" style={{ background: `linear-gradient(to right, ${palette[500]}, ${palette[700]})` }}>
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
                                <div className="p-3 rounded-2xl rounded-br-sm text-sm text-white max-w-[80%] shadow-lg" style={{ background: `linear-gradient(135deg, ${palette[600]}, ${palette[500]})` }}>
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
                            <button className="absolute right-2 top-2 p-1.5 rounded-full text-white transition hover:scale-110" style={{ backgroundColor: palette[500] }}>
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
        // SECURITY FIX: Whitelist allowed tiers
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

    // Check for verification redirect
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const verified = params.get('verified') === 'true';
        const rawTier = params.get('tier');
        const allowedTiers = ['free', 'pro', 'elite'];
        
        // SECURITY FIX: Whitelist allowed tiers before generation
        const tier = allowedTiers.includes(rawTier || '') ? rawTier : 'free';

        if (verified && tier && !hasAutoGenerated.current) {
            hasAutoGenerated.current = true;
            setSelectedTier(tier as any);
            generateKeyInternal(tier as any);
            // Clean URL
            window.history.replaceState({}, '', window.location.pathname);
        }
    }, []);

    const generateKeyInternal = (tier: string) => {
        // Double check just in case called directly
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

export const MauLimitPage: React.FC<PageProps> = ({ onBack, onNavigate }) => {
    return (
        <PageLayout title="Understanding MAU Limits" onBack={onBack} wide={true}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                <div className="space-y-6">
                    <p className="text-xl text-white font-medium">
                        Why does the Pro Plan limit Monthly Active Users?
                    </p>
                    <p className="text-gray-400 leading-relaxed">
                        Unlike standard REST APIs where costs are based on simple request counts, 
                        MasterVoice Pro enables <strong>TURN Relay</strong> functionality for 
                        firewall traversal.
                    </p>
                    <div className="p-6 bg-white/5 rounded-2xl border border-white/10">
                        <h4 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                            <svg className="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                            The Bandwidth Cost
                        </h4>
                        <p className="text-sm text-gray-400 mb-4">
                            When two users cannot connect directly (P2P) due to corporate firewalls or symmetric NATs, 
                            all their video and audio traffic is routed through our TURN servers.
                        </p>
                        <ul className="text-sm text-gray-400 space-y-2 list-disc pl-4">
                            <li>A single 1-hour HD video call consumes ~1.5 GB of data.</li>
                            <li>If 10,000 users each make one call, that's 15 Terabytes of relay bandwidth.</li>
                            <li>Relay servers require high-performance networking and CPU to maintain low latency.</li>
                        </ul>
                    </div>
                </div>
                
                <div className="relative">
                    <div className="absolute inset-0 bg-indigo-500/10 blur-3xl rounded-full"></div>
                    <div className="relative bg-[#0a0a0f] border border-white/10 p-8 rounded-3xl">
                        <h3 className="text-xl font-bold text-white mb-6">Cost Breakdown Visualization</h3>
                        
                        <div className="space-y-6">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-full bg-gray-800 flex items-center justify-center font-bold">Free</div>
                                <div className="flex-1">
                                    <div className="h-2 bg-gray-800 rounded-full w-full">
                                        <div className="h-full bg-gray-600 rounded-full w-[10%]"></div>
                                    </div>
                                    <p className="text-xs text-gray-500 mt-1">P2P Only (No Server Cost)</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-full bg-indigo-900 flex items-center justify-center font-bold text-indigo-400">Pro</div>
                                <div className="flex-1">
                                    <div className="h-2 bg-gray-800 rounded-full w-full">
                                        <div className="h-full bg-indigo-500 rounded-full w-[60%]"></div>
                                    </div>
                                    <p className="text-xs text-gray-500 mt-1">10k MAU Cap (Standard TURN)</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-full bg-amber-900 flex items-center justify-center font-bold text-amber-400">Elite</div>
                                <div className="flex-1">
                                    <div className="h-2 bg-gray-800 rounded-full w-full relative overflow-hidden">
                                        <div className="absolute inset-0 bg-gradient-to-r from-amber-500 to-orange-600 animate-pulse"></div>
                                    </div>
                                    <p className="text-xs text-gray-500 mt-1">Unlimited / Custom Volume</p>
                                </div>
                            </div>
                        </div>

                        <div className="mt-8 pt-6 border-t border-white/10">
                            <button onClick={() => onNavigate?.('/contact')} className="w-full py-3 bg-white text-black font-bold rounded-xl hover:bg-gray-200 transition">
                                Contact Sales for High Volume
                            </button>
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
        "Troubleshooting & FAQ",
        "React Hooks"
    ];

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
                                <li><strong>Heartbeat:</strong> Automatic ping/pong every 30s.</li>
                                <li><strong>Presence:</strong> Realtime online status synchronization.</li>
                            </ul>
                        </div>
                    )}
                </div>
            </div>
        </PageLayout>
    );
};

export const PrivacyPolicy: React.FC<PageProps> = ({ onBack }) => (
  <PageLayout title="Privacy Policy" onBack={onBack}>
      <p className="mb-4">Effective Date: October 26, 2023</p>
      <h3>1. Introduction</h3>
      <p>Welcome to MasterVoice. We are committed to protecting your privacy and ensuring you have a positive experience on our website and in using our products and services.</p>
      <h3>2. Data Collection</h3>
      <p>We do not collect personal data beyond what is required for authentication (email). All communication is peer-to-peer and encrypted.</p>
  </PageLayout>
);

export const TermsOfService: React.FC<PageProps> = ({ onBack }) => (
  <PageLayout title="Terms of Service" onBack={onBack}>
      <h3>1. Acceptance of Terms</h3>
      <p>By accessing and using MasterVoice, you accept and agree to be bound by the terms and provision of this agreement.</p>
      <h3>2. Use License</h3>
      <p>Permission is granted to temporarily download one copy of the materials (information or software) on MasterVoice's website for personal, non-commercial transitory viewing only.</p>
  </PageLayout>
);

export const ContactSupport: React.FC<PageProps> = ({ onBack }) => (
  <PageLayout title="Contact Support" onBack={onBack}>
      <p className="mb-6">Have questions or need help? Reach out to our team.</p>
      <div className="bg-[#111] p-6 rounded-xl border border-white/10">
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
                <PricingCard 
                    title="Free" 
                    price="$0" 
                    features={['P2P Calling', 'Unlimited Messages', 'Standard Quality', 'Community Support']} 
                    cta="Get Started"
                    onAction={() => onNavigate?.('/register')}
                />
                <PricingCard 
                    title="Pro" 
                    price="$9" 
                    features={['TURN Relay (Firewall Bypass)', 'HD Voice & Video', 'Group Calls (up to 10)', 'Priority Support']} 
                    recommended={true}
                    cta="Start Trial"
                    onAction={() => onNavigate?.('/verify?tier=pro')}
                />
                <PricingCard 
                    title="Team" 
                    price="$29" 
                    features={['Global Low Latency Network', '4K Screen Sharing', 'Unlimited Group Size', 'Dedicated Support']} 
                    cta="Contact Sales"
                    onAction={() => onNavigate?.('/contact')}
                />
            </div>

            <div className="text-center">
                <p className="text-gray-400 mb-4">Not sure which plan is right for you?</p>
                <button 
                    onClick={() => onNavigate?.('/compare')} 
                    className="text-indigo-400 hover:text-indigo-300 font-bold hover:underline transition"
                >
                    Compare all features &rarr;
                </button>
            </div>
        </PageLayout>
    );
};

export const DevPage: React.FC<PageProps> = ({ onBack, onNavigate }) => (
    <PageLayout title="Developer Tools" onBack={onBack}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div 
                onClick={() => onNavigate?.('/docs')}
                className="p-6 bg-[#111] border border-white/10 rounded-2xl cursor-pointer hover:bg-[#1a1a20] transition group"
            >
                <h3 className="text-xl font-bold text-white mb-2 group-hover:text-indigo-400">Documentation</h3>
                <p className="text-gray-400 text-sm">Read the full SDK reference and integration guides.</p>
            </div>
            <div 
                onClick={() => onNavigate?.('/api_key')}
                className="p-6 bg-[#111] border border-white/10 rounded-2xl cursor-pointer hover:bg-[#1a1a20] transition group"
            >
                <h3 className="text-xl font-bold text-white mb-2 group-hover:text-indigo-400">API Keys</h3>
                <p className="text-gray-400 text-sm">Manage your secret keys and view usage quotas.</p>
            </div>
        </div>
    </PageLayout>
);

export const ComparePlansPage: React.FC<PageProps> = ({ onBack, onNavigate }) => {
    const features = [
        { category: "Core Experience", items: [
            { name: "P2P Messaging", free: "Unlimited", pro: "Unlimited", team: "Unlimited" },
            { name: "Voice Calls", free: "Standard Quality", pro: "HD Voice (Opus)", team: "Studio Lossless" },
            { name: "Video Resolution", free: "720p @ 30fps", pro: "1080p @ 60fps", team: "4K @ 60fps" },
            { name: "Group Calls", free: "1-on-1 Only", pro: "Up to 10 Participants", team: "Unlimited" },
            { name: "Screen Sharing", free: "720p", pro: "1080p", team: "4K / Ultra-wide" },
        ]},
        { category: "Network & Security", items: [
            { name: "Encryption", free: "End-to-End (AES-256)", pro: "E2EE (AES-256)", team: "E2EE + HSM Key Mgmt" },
            { name: "Connection Mode", free: "P2P (STUN Only)", pro: "TURN Relay (UDP)", team: "Global Mesh (TCP/UDP)" },
            { name: "Firewall Traversal", free: "Basic", pro: "Advanced", team: "Enterprise Grade" },
            { name: "Reliability SLA", free: "Best Effort", pro: "99.9% Uptime", team: "99.99% Guaranteed" },
        ]},
        { category: "Developer & API", items: [
            { name: "API Rate Limit", free: "100 req/min", pro: "1,000 req/min", team: "Unlimited" },
            { name: "SDK Access", free: "Standard", pro: "Priority Access", team: "Full Source Code" },
            { name: "Support Level", free: "Community Forum", pro: "Priority Email", team: "Dedicated Slack Channel" },
        ]}
    ];

    return (
        <PageLayout title="Compare Plans" onBack={onBack} wide={true}>
            <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#0a0a0f]">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[800px]">
                        <thead>
                            <tr className="bg-[#111] border-b border-white/10">
                                <th className="p-6 text-sm text-gray-400 font-medium w-1/4">Feature</th>
                                <th className="p-6 text-center w-1/4">
                                    <div className="font-bold text-white text-lg">Free</div>
                                    <div className="text-xs text-gray-500 font-normal">$0/mo</div>
                                </th>
                                <th className="p-6 text-center w-1/4 bg-indigo-900/10 border-x border-indigo-500/10 relative">
                                    <div className="absolute top-0 left-1/2 -translate-x-1/2 bg-indigo-500 text-[9px] font-bold px-2 py-0.5 rounded-b text-white uppercase tracking-wider">Most Popular</div>
                                    <div className="font-bold text-indigo-400 text-lg">Pro</div>
                                    <div className="text-xs text-indigo-300/70 font-normal">$9/mo</div>
                                </th>
                                <th className="p-6 text-center w-1/4">
                                    <div className="font-bold text-amber-400 text-lg">Team</div>
                                    <div className="text-xs text-amber-500/70 font-normal">$29/mo</div>
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {features.map((section, i) => (
                                <React.Fragment key={i}>
                                    <tr>
                                        <td colSpan={4} className="p-3 px-6 text-[10px] font-bold text-gray-500 uppercase tracking-widest bg-[#050508] border-y border-white/5 sticky left-0">
                                            {section.category}
                                        </td>
                                    </tr>
                                    {section.items.map((feat, j) => (
                                        <tr key={j} className="group hover:bg-white/5 transition-colors border-b border-white/5 last:border-0">
                                            <td className="p-4 px-6 font-medium text-gray-300">{feat.name}</td>
                                            <td className="p-4 text-center text-gray-400 text-sm">{feat.free}</td>
                                            <td className="p-4 text-center text-white font-medium text-sm bg-indigo-900/5 border-x border-indigo-500/10 group-hover:bg-indigo-500/10 transition-colors">{feat.pro}</td>
                                            <td className="p-4 text-center text-gray-300 text-sm">{feat.team}</td>
                                        </tr>
                                    ))}
                                </React.Fragment>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="mt-12 grid grid-cols-1 md:grid-cols-4 gap-8 text-center items-center">
                <div className="hidden md:block"></div>
                <div>
                     <button onClick={() => onNavigate?.('/register')} className="w-full py-3 bg-white/5 hover:bg-white/10 text-white font-bold rounded-xl transition border border-white/10">Start Free</button>
                </div>
                <div>
                    <button onClick={() => onNavigate?.('/verify?tier=pro')} className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition shadow-lg shadow-indigo-600/20 transform hover:-translate-y-1">Get Pro</button>
                </div>
                <div>
                    <button onClick={() => onNavigate?.('/contact')} className="w-full py-3 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-bold rounded-xl transition shadow-lg shadow-amber-600/20">Contact Sales</button>
                </div>
            </div>
            
            <div className="mt-12 text-center border-t border-white/5 pt-8">
                <p className="text-gray-500 text-sm">Need a custom enterprise solution? <button onClick={() => onNavigate?.('/contact')} className="text-indigo-400 hover:text-white transition">Talk to us</button></p>
            </div>
        </PageLayout>
    );
}