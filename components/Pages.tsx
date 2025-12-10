import React from 'react';
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

    <div className={`relative z-10 container mx-auto px-6 py-12 ${wide ? 'max-w-6xl' : 'max-w-4xl'}`}>
      <button 
        onClick={onBack} 
        className="group flex items-center text-gray-400 hover:text-white transition mb-8"
      >
        <div className="p-2 rounded-full bg-white/5 group-hover:bg-white/10 mr-3 transition">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        </div>
        <span className="text-sm font-semibold tracking-wide">BACK TO HOME</span>
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

export const PlansPage: React.FC<PageProps> = ({ onBack }) => {
    // Basic check for URL params to potentially highlight a plan (optional enhancement)
    const params = new URLSearchParams(window.location.search);
    const highlightedPlan = params.get('plan');

    return (
        <PageLayout title="Plans & Pricing" onBack={onBack} wide={true}>
            <div className="text-center max-w-2xl mx-auto mb-16">
                <p className="text-xl text-gray-400">Choose the perfect plan for your communication needs. From secure personal chat to enterprise-grade collaboration.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20 not-prose">
                <PricingCard 
                    title="Personal"
                    price="Free"
                    features={[
                        "Unlimited Text Messages", 
                        "Unlimited P2P Voice Calls", 
                        "Unlimited Message History", 
                        "3 Active Devices", 
                        "Community Support"
                    ]}
                    cta="Get Started Free"
                    onAction={onBack} // Redirects to login/register logic via router usually, simplified here
                />
                <PricingCard 
                    title="Pro"
                    price="$8"
                    recommended={true}
                    features={[
                        "Everything in Personal", 
                        "Group Voice Calls (Unlimited)", 
                        "Ultra HD Lossless Audio", 
                        "Unlimited Active Devices", 
                        "Priority Relay Network", 
                        "Custom Themes"
                    ]}
                    cta="Start Pro Trial"
                    onAction={() => window.location.href = '/conversations?trial=true&plan=pro'} // Direct nav for now as PlansPage might be accessed directly
                />
                <PricingCard 
                    title="Team"
                    price="$20"
                    features={["Everything in Pro", "Admin Dashboard", "Team Analytics", "SSO Integration", "Data Export API", "24/7 Dedicated Support"]}
                    cta="Contact Sales"
                    onAction={() => window.location.href = 'mailto:sales@mastervoice.com'}
                />
            </div>

            <h2 className="text-3xl font-bold mb-8 text-white text-center">Feature Comparison</h2>
            <div className="overflow-x-auto rounded-3xl border border-white/10 not-prose">
                  <table className="w-full text-left border-collapse min-w-[600px]">
                      <thead>
                          <tr className="bg-white/5">
                              <th className="p-6 text-sm font-bold text-gray-400 uppercase w-1/3">Feature</th>
                              <th className="p-6 text-white font-bold text-lg w-1/5">Personal</th>
                              <th className="p-6 text-indigo-400 font-bold text-lg w-1/5">Pro</th>
                              <th className="p-6 text-fuchsia-400 font-bold text-lg w-1/5">Team</th>
                          </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5 text-sm">
                          <tr>
                              <td className="p-6 font-medium text-gray-300">Message History</td>
                              <td className="p-6 text-white font-bold">Unlimited</td>
                              <td className="p-6 text-white">Unlimited</td>
                              <td className="p-6 text-white">Unlimited / Custom</td>
                          </tr>
                          <tr>
                              <td className="p-6 font-medium text-gray-300">Voice Quality</td>
                              <td className="p-6 text-gray-400">Standard (32kHz)</td>
                              <td className="p-6 text-white">Ultra HD (96kHz)</td>
                              <td className="p-6 text-white">Ultra HD / Lossless</td>
                          </tr>
                          <tr>
                              <td className="p-6 font-medium text-gray-300">Group Calls</td>
                              <td className="p-6 text-gray-400">1-on-1 Only</td>
                              <td className="p-6 text-white">Unlimited Size</td>
                              <td className="p-6 text-white">Unlimited</td>
                          </tr>
                          <tr>
                              <td className="p-6 font-medium text-gray-300">Active Devices</td>
                              <td className="p-6 text-white font-bold">3 Devices</td>
                              <td className="p-6 text-white">Unlimited</td>
                              <td className="p-6 text-white">Unlimited</td>
                          </tr>
                          <tr>
                              <td className="p-6 font-medium text-gray-300">Support</td>
                              <td className="p-6 text-gray-400">Community</td>
                              <td className="p-6 text-white">Priority Email</td>
                              <td className="p-6 text-white">24/7 Dedicated Agent</td>
                          </tr>
                      </tbody>
                  </table>
              </div>
        </PageLayout>
    );
}

export const PrivacyPolicy: React.FC<PageProps> = ({ onBack }) => (
  <PageLayout title="Privacy Policy" onBack={onBack}>
    <p>Last updated: January 2025</p>
    <h3>1. Introduction</h3>
    <p>Welcome to MasterVoice. We respect your privacy and are committed to protecting your personal data. This privacy policy will inform you as to how we look after your personal data when you visit our website and tell you about your privacy rights and how the law protects you.</p>
    <h3>2. The Data We Collect</h3>
    <p>Because MasterVoice relies on Peer-to-Peer (P2P) technology, we minimize data collection:</p>
    <ul>
        <li><strong>Account Data:</strong> Email address and password (stored securely via Supabase Auth).</li>
        <li><strong>Usage Data:</strong> Minimal metadata about when you log in.</li>
    </ul>
    <h3>3. Audio & Message Data</h3>
    <p>We do not store your audio streams. Voice calls are established directly between peers using WebRTC. Text messages are stored in our encrypted database to facilitate offline delivery but are accessible only to the sender and recipient via Row Level Security (RLS) policies.</p>
  </PageLayout>
);

export const TermsOfService: React.FC<PageProps> = ({ onBack }) => (
  <PageLayout title="Terms of Service" onBack={onBack}>
    <p>Last updated: January 2025</p>
    <h3>1. Agreement to Terms</h3>
    <p>By accessing or using MasterVoice, you agree to be bound by these Terms of Service. If you do not agree to these terms, you may not access the service.</p>
    <h3>2. Use of Service</h3>
    <p>You agree to use MasterVoice only for lawful purposes. You are responsible for all activity that occurs under your account.</p>
    <h3>3. User Conduct</h3>
    <p>You agree not to use the service to harass, abuse, or harm another person. We reserve the right to terminate accounts that violate these standards.</p>
    <h3>4. Disclaimer</h3>
    <p>The service is provided "AS IS" and "AS AVAILABLE" without warranties of any kind.</p>
  </PageLayout>
);

export const ContactSupport: React.FC<PageProps> = ({ onBack }) => (
  <PageLayout title="Contact Support" onBack={onBack}>
    <p className="mb-8">Have a question or need assistance? Fill out the form below and our team will get back to you within 24 hours.</p>
    
    <form className="space-y-6 max-w-xl" onSubmit={(e) => { e.preventDefault(); alert('Message sent!'); }}>
        <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Your Email</label>
            <input type="email" className="w-full bg-black/20 border border-white/10 rounded-xl p-4 text-white focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="you@example.com" />
        </div>
        <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Subject</label>
            <input type="text" className="w-full bg-black/20 border border-white/10 rounded-xl p-4 text-white focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="How can we help?" />
        </div>
        <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Message</label>
            <textarea className="w-full bg-black/20 border border-white/10 rounded-xl p-4 text-white focus:ring-2 focus:ring-indigo-500 outline-none h-32" placeholder="Tell us more..."></textarea>
        </div>
        <button type="submit" className="px-8 py-3 bg-indigo-600 hover:bg-indigo-500 rounded-xl font-bold transition shadow-lg shadow-indigo-600/20">Send Message</button>
    </form>
  </PageLayout>
);

export const NotFoundPage: React.FC<PageProps> = ({ onBack }) => (
  <div className="min-h-screen bg-[#030014] text-white flex flex-col items-center justify-center p-6 relative overflow-hidden font-['Outfit']">
    {/* Background Elements */}
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80vw] h-[80vw] bg-indigo-900/10 rounded-full blur-[120px] pointer-events-none"></div>
    <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
    
    <div className="relative z-10 text-center animate-fade-in-up">
        <div className="text-[10rem] font-bold leading-none bg-clip-text text-transparent bg-gradient-to-b from-indigo-500 to-transparent opacity-50 select-none">
            404
        </div>
        <h1 className="text-4xl md:text-5xl font-bold mb-4">Lost in Space?</h1>
        <p className="text-gray-400 text-lg mb-8 max-w-md mx-auto">
            The destination you are looking for doesn't exist or has been moved to another galaxy.
        </p>
        
        <button 
            onClick={onBack}
            className="px-8 py-4 bg-white text-black rounded-full font-bold text-lg hover:scale-105 transition-transform shadow-[0_0_40px_rgba(255,255,255,0.2)]"
        >
            Return to Base
        </button>
    </div>
  </div>
);