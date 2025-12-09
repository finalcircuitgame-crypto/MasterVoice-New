import React from 'react';

interface PageProps {
  onBack: () => void;
}

const PageLayout: React.FC<{ title: string; children: React.ReactNode; onBack: () => void }> = ({ title, children, onBack }) => (
  <div className="min-h-screen bg-[#030014] text-white overflow-y-auto animate-slide-up relative font-['Outfit']">
    {/* Background Effects */}
    <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
       <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-indigo-600/10 rounded-full blur-[100px]" />
       <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
    </div>

    <div className="relative z-10 container mx-auto px-6 py-12 max-w-4xl">
      <button 
        onClick={onBack} 
        className="group flex items-center text-gray-400 hover:text-white transition mb-8"
      >
        <div className="p-2 rounded-full bg-white/5 group-hover:bg-white/10 mr-3 transition">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        </div>
        <span className="text-sm font-semibold tracking-wide">BACK TO HOME</span>
      </button>

      <div className="glass-panel p-8 md:p-12 rounded-3xl border border-white/10">
        <h1 className="text-4xl md:text-5xl font-bold mb-8 bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">{title}</h1>
        <div className="prose prose-invert prose-lg max-w-none text-gray-300">
            {children}
        </div>
      </div>
    </div>
  </div>
);

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
