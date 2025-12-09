import React from 'react';

interface LandingPageProps {
  onGetStarted: () => void;
  onLogin: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onGetStarted, onLogin }) => {
  return (
    <div className="min-h-screen bg-gray-900 text-white font-sans selection:bg-blue-500 selection:text-white">
      {/* Navigation */}
      <nav className="container mx-auto px-6 py-6 flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-gradient-to-tr from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
          </div>
          <span className="text-xl font-bold tracking-tight">MasterVoice</span>
        </div>
        <button 
          onClick={onLogin}
          className="text-gray-300 hover:text-white transition font-medium"
        >
          Sign In
        </button>
      </nav>

      {/* Hero Section */}
      <main className="container mx-auto px-6 pt-20 pb-32 text-center">
        <div className="animate-fade-in-up">
            <h1 className="text-5xl md:text-7xl font-extrabold mb-8 tracking-tight leading-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500">
            Connect Beyond <br/> Boundaries
            </h1>
            <p className="text-xl text-gray-400 mb-10 max-w-2xl mx-auto leading-relaxed">
            Experience crystal-clear voice calls and real-time messaging with end-to-end security. 
            MasterVoice brings you closer to the people that matter.
            </p>
            <div className="flex flex-col md:flex-row justify-center items-center space-y-4 md:space-y-0 md:space-x-6">
            <button 
                onClick={onGetStarted}
                className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-full font-bold text-lg transition transform hover:scale-105 shadow-lg shadow-blue-500/25"
            >
                Get Started Free
            </button>
            <button 
                onClick={() => window.open('https://github.com', '_blank')}
                className="px-8 py-4 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-full font-bold text-lg transition border border-gray-700"
            >
                View on GitHub
            </button>
            </div>
        </div>

        {/* Features Preview */}
        <div className="mt-32 grid grid-cols-1 md:grid-cols-3 gap-12 text-left">
            <div className="p-8 bg-gray-800/50 rounded-2xl border border-gray-700/50 backdrop-blur-sm hover:bg-gray-800 transition">
                <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center mb-6">
                    <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                </div>
                <h3 className="text-xl font-bold mb-3">Lightning Fast</h3>
                <p className="text-gray-400">Powered by Supabase Realtime for instant message delivery and low-latency signaling.</p>
            </div>
            <div className="p-8 bg-gray-800/50 rounded-2xl border border-gray-700/50 backdrop-blur-sm hover:bg-gray-800 transition">
                <div className="w-12 h-12 bg-purple-500/10 rounded-xl flex items-center justify-center mb-6">
                    <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                </div>
                <h3 className="text-xl font-bold mb-3">Secure by Design</h3>
                <p className="text-gray-400">WebRTC peer-to-peer connection ensures your voice data flows directly between users.</p>
            </div>
            <div className="p-8 bg-gray-800/50 rounded-2xl border border-gray-700/50 backdrop-blur-sm hover:bg-gray-800 transition">
                <div className="w-12 h-12 bg-pink-500/10 rounded-xl flex items-center justify-center mb-6">
                    <svg className="w-6 h-6 text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                    </svg>
                </div>
                <h3 className="text-xl font-bold mb-3">Crystal Clear Audio</h3>
                <p className="text-gray-400">High-definition voice calling directly in your browser without any plugins.</p>
            </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-800 bg-gray-900 py-12">
          <div className="container mx-auto px-6 text-center text-gray-500">
              <p>&copy; {new Date().getFullYear()} MasterVoice. Built with React & Supabase.</p>
          </div>
      </footer>
    </div>
  );
};