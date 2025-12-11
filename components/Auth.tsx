import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

interface AuthProps {
  mode: 'signin' | 'signup';
  onBack: () => void;
  onSwitchMode: () => void;
}

export const Auth: React.FC<AuthProps> = ({ mode, onBack, onSwitchMode }) => {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authStep, setAuthStep] = useState<'credentials' | 'verify'>('credentials');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setAuthStep('credentials');
    setError(null);
  }, [mode]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return; // Prevent double submit
    
    setLoading(true);
    setError(null);
    
    try {
      if (mode === 'signup') {
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        
        if (data.session) {
            // SUCCESS: Auto-logged in after sign-up
            window.location.href = '/conversations'; 
          return;
        }
        
        // Must verify
        setAuthStep('verify');
        setLoading(false); // Stop loading before showing verify step
      } else { // mode === 'signin'
        // FIX #1: Capture the data object to check for success/session
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
  console.log(error)
             // Handle unconfirmed email case
             if (error.message.includes("Email not confirmed")) {
                 await supabase.auth.resend({
                     type: 'signup',
                     email: email,
                 });
                 setAuthStep('verify');
                 setError("Your email is not verified. We've sent you a new code.");
                 setLoading(false);
                 return;
             }
             throw error;
        }
        
        // FIX #2: If successful, we have a session. Redirect.
        if (data.session) {
            window.location.href = '/conversations';
            return; // Prevent execution of finally block
        }
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      // Only runs on error or transition to verify. Successful sign-in/up returns above.
      setLoading(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    
    setLoading(true);
    setError(null);
    try {
        const { data, error } = await supabase.auth.verifyOtp({ // FIX: Capture data here too
            email,
            token: otp,
            type: 'signup'
        });
        if (error) throw error;
        
        // FIX #3: Redirect on successful verification (which creates a session)
        if (data.session) {
            window.location.href = '/conversations';
            return; // Prevent execution of finally block
        }
    } catch (err: any) {
        setError(err.message);
    } finally {
        // Only runs on error if success returns early
        setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#030014] flex flex-col items-center justify-center p-4 relative overflow-hidden font-['Outfit'] animate-slide-up">
      
      {/* Background Effects */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-indigo-600/20 rounded-full blur-[100px] animate-pulse-glow" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40vw] h-[40vw] bg-fuchsia-600/20 rounded-full blur-[100px] animate-pulse-glow" style={{ animationDelay: '2s' }} />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
      </div>

      {/* Back Button */}
      <div className="absolute top-6 left-6 z-50">
          <button 
            onClick={onBack} 
            className="flex items-center text-gray-400 hover:text-white transition group bg-black/20 p-2 rounded-full backdrop-blur-sm border border-white/5"
          >
              <svg className="w-5 h-5 mr-1 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
              <span className="text-sm font-medium pr-2">Back</span>
          </button>
      </div>

      {/* Main Container */}
      <div className="w-full max-w-md glass-panel p-8 md:p-10 rounded-[2rem] relative z-10 border border-white/10 shadow-2xl">
        
        {authStep === 'credentials' ? (
          <>
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-500 to-fuchsia-500 mb-6 shadow-lg shadow-indigo-500/20">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 4 00-8 0v4h8z" />
                </svg>
              </div>
              <h1 className="text-3xl font-bold text-white mb-3 tracking-tight">
                {mode === 'signin' ? 'Welcome Back' : 'Join MasterVoice'}
              </h1>
              <p className="text-gray-400 text-sm">
                {mode === 'signin' ? 'Enter your credentials to access your secure chats.' : 'Start your secure P2P journey today.'}
              </p>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/50 text-red-200 p-4 rounded-xl mb-6 text-sm backdrop-blur-md animate-fade-in-up">
                {error}
              </div>
            )}

            <form onSubmit={handleAuth} className="space-y-5">
              <div className="space-y-1">
                <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider ml-1">Email Address</label>
                <input
                  type="email"
                  className="w-full bg-black/20 border border-white/10 rounded-xl p-3.5 text-white placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all duration-300 hover:bg-black/30 focus:bg-black/40"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider ml-1">Password</label>
                <input
                  type="password"
                  className="w-full bg-black/20 border border-white/10 rounded-xl p-3.5 text-white placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all duration-300 hover:bg-black/30 focus:bg-black/40"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-gradient-to-r from-indigo-600 to-fuchsia-600 hover:from-indigo-500 hover:to-fuchsia-500 text-white font-bold rounded-xl transition-all duration-300 transform hover:scale-[1.02] active:scale-95 shadow-lg shadow-indigo-600/25 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 mt-2"
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                  </span>
                ) : (
                  mode === 'signin' ? 'Sign In' : 'Create Account'
                )}
              </button>
            </form>

            <div className="mt-8 pt-6 border-t border-white/5 text-center">
              <p className="text-gray-400 text-sm">
                {mode === 'signin' ? "Don't have an account?" : 'Already have an account?'}
                <button
                  onClick={onSwitchMode}
                  className="ml-2 text-indigo-400 hover:text-indigo-300 font-semibold transition-colors hover:underline decoration-2 underline-offset-4"
                >
                  {mode === 'signin' ? 'Sign Up' : 'Log In'}
                </button>
              </p>
            </div>
          </>
        ) : (
          // Verification Step UI
          <div className="animate-fade-in-up">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-green-500/20 border border-green-500/30 mb-4 text-green-400 animate-pulse">
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Check your inbox</h2>
              <p className="text-gray-400 text-sm">
                We've sent a verification code to <br/> <span className="text-indigo-300 font-medium">{email}</span>
              </p>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/50 text-red-200 p-3 rounded-xl mb-6 text-sm backdrop-blur-md">
                {error}
              </div>
            )}

            <form onSubmit={handleVerify} className="space-y-6">
              <div className="space-y-2">
                <label className="block text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Enter 6-digit Code</label>
                <input
                  type="text"
                  className="w-full bg-black/20 border border-white/10 rounded-xl p-4 text-center text-2xl tracking-[0.5em] font-mono text-white placeholder-gray-600 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                  placeholder="000000"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ''))}
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-xl transition-all duration-300 transform hover:scale-[1.02] shadow-lg shadow-emerald-600/25"
              >
                {loading ? 'Verifying...' : 'Verify Email'}
              </button>
            </form>

            <button
               onClick={() => setAuthStep('credentials')}
               className="w-full mt-6 text-sm text-gray-500 hover:text-gray-300 transition-colors"
            >
               &larr; Back to details
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Auth;