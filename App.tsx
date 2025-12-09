import React, { useEffect, useState, useRef } from 'react';
import { supabase } from './supabaseClient';
import { UserProfile } from './types';
import { Auth } from './components/Auth';
import { ChatList } from './components/ChatList';
import { ChatWindow } from './components/ChatWindow';
import { LandingPage } from './components/LandingPage';
import { PrivacyPolicy, TermsOfService, ContactSupport, PlansPage, NotFoundPage } from './components/Pages';
import { useRouter } from './hooks/useRouter';

const App: React.FC = () => {
  const [session, setSession] = useState<any>(null);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const [showTrialNotification, setShowTrialNotification] = useState(false);
  const [showFamilyNotification, setShowFamilyNotification] = useState(false);
  
  // Ref to prevent duplicate welcome toasts
  const hasWelcomedRef = useRef(false);
  
  const { path, navigate } = useRouter();

  // Presence logic
  useEffect(() => {
    if (!currentUser) return;

    const channel = supabase.channel('global_presence', {
      config: {
        presence: {
          key: currentUser.id,
        },
      },
    });

    channel
      .on('presence', { event: 'sync' }, () => {
        const newState = channel.presenceState();
        const onlineIds = new Set<string>();
        Object.keys(newState).forEach(id => onlineIds.add(id));
        setOnlineUsers(onlineIds);
      })
      .on('presence', { event: 'join' }, ({ key }) => {
        setOnlineUsers(prev => new Set(prev).add(key));
      })
      .on('presence', { event: 'leave' }, ({ key }) => {
        setOnlineUsers(prev => {
            const next = new Set(prev);
            next.delete(key);
            return next;
        });
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            online_at: new Date().toISOString(),
          });
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUser?.id]);

  useEffect(() => {
    // Helper to set user with Family logic
    const setupUser = (sessionUser: any) => {
        const userProfile: UserProfile = {
            id: sessionUser.id,
            email: sessionUser.email || 'No Email',
            // FAMILY FEATURE LOGIC:
            // Since the user is signing up/logging in "today" (during this promo),
            // we grant them family status automatically.
            is_family: true, 
        };
        setCurrentUser(userProfile);
        
        // Show notification once per session load using ref to prevent spam
        if (userProfile.is_family && !hasWelcomedRef.current) {
             setShowFamilyNotification(true);
             hasWelcomedRef.current = true;
             setTimeout(() => setShowFamilyNotification(false), 6000);
        }
    };

    // Check active session safely
    const initSession = async () => {
        try {
            const { data, error } = await supabase.auth.getSession();
            if (error) throw error;
            
            setSession(data.session);
            if (data.session?.user) {
                setupUser(data.session.user);
                if (['/login', '/register'].includes(window.location.pathname)) {
                    navigate('/conversations');
                }
            }
        } catch (err: any) {
            console.error("Session init error:", err.message);
            // Handle Invalid Refresh Token specifically
            if (err.message?.includes("Refresh Token") || err.message?.includes("refresh_token")) {
                await supabase.auth.signOut();
                setSession(null);
                setCurrentUser(null);
                navigate('/login');
            }
        }
    };

    initSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      if (session?.user) {
          setupUser(session.user);
          // Only redirect from auth pages
          if (['/login', '/register'].includes(window.location.pathname)) {
             navigate('/conversations');
          }
      } else {
          setCurrentUser(null);
          setSelectedUser(null);
          setOnlineUsers(new Set());
          hasWelcomedRef.current = false; // Reset welcome ref on logout
          
          // If on protected route, kick to login
          if (window.location.pathname === '/conversations') {
            navigate('/login');
          }
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  // Check for trial params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (path === '/conversations' && params.get('trial') === 'true' && params.get('plan') === 'pro') {
        setShowTrialNotification(true);
        // Clear params after 5 seconds or immediately to clean URL? 
        // For now just auto-hide notification
        const timer = setTimeout(() => setShowTrialNotification(false), 5000);
        return () => clearTimeout(timer);
    }
  }, [path]);

  // Simple Router Switch
  const renderView = () => {
      // Protected App Route
      if (path === '/conversations') {
          if (!session || !currentUser) {
            return <div className="h-screen w-screen bg-[#030014] flex items-center justify-center text-white font-['Outfit']">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                    <p className="animate-pulse">Connecting to secure network...</p>
                </div>
            </div>;
          }

          return (
            <div className="flex h-screen w-screen bg-gray-900 overflow-hidden animate-fade-in-up relative font-['Outfit']">
              
              {/* Notifications Layer */}
              <div className="absolute top-6 left-1/2 -translate-x-1/2 z-[100] flex flex-col items-center gap-3 w-full max-w-md px-4 pointer-events-none">
                  
                  {/* Trial Notification Toast */}
                  {showTrialNotification && (
                      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-message-enter pointer-events-auto border border-white/10 backdrop-blur-md">
                          <svg className="w-5 h-5 text-indigo-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                          <span className="font-semibold text-sm">Pro Trial Activated! Enjoy HD Voice.</span>
                          <button onClick={() => setShowTrialNotification(false)} className="hover:bg-white/20 rounded-full p-1"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
                      </div>
                  )}

                  {/* Family Notification Toast */}
                  {showFamilyNotification && (
                      <div className="bg-[#1a1a1a]/90 text-white px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-message-enter pointer-events-auto border border-amber-500/30 backdrop-blur-md">
                          <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-500">
                             <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
                          </div>
                          <div className="flex flex-col">
                              <span className="font-bold text-sm text-amber-400">Welcome to the Family!</span>
                              <span className="text-xs text-gray-400">You've unlocked exclusive Family features.</span>
                          </div>
                          <button onClick={() => setShowFamilyNotification(false)} className="hover:bg-white/10 rounded-full p-1 ml-2"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
                      </div>
                  )}
              </div>

              <div className={`flex-none w-full md:w-80 h-full ${selectedUser ? 'hidden md:block' : 'block'}`}>
                <ChatList 
                    currentUser={currentUser} 
                    onSelectUser={setSelectedUser} 
                    onlineUsers={onlineUsers}
                />
              </div>
              <div className={`flex-1 h-full flex flex-col relative ${!selectedUser ? 'hidden md:flex' : 'flex'}`}>
                {selectedUser ? (
                    <>
                        <div className="md:hidden bg-[#0a0a0f] p-4 border-b border-white/5 flex items-center gap-2">
                            <button onClick={() => setSelectedUser(null)} className="text-gray-400 hover:text-white p-2 rounded-full hover:bg-white/10 transition">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                            </button>
                            <span className="font-bold text-white">Back to chats</span>
                        </div>
                        <ChatWindow 
                            currentUser={currentUser} 
                            recipient={selectedUser} 
                            onlineUsers={onlineUsers}
                        />
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-gray-500 bg-[#030014] relative overflow-hidden">
                        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none mix-blend-overlay"></div>
                        <div className="w-24 h-24 bg-gradient-to-tr from-indigo-500/20 to-fuchsia-500/20 rounded-[2rem] flex items-center justify-center mb-6 animate-float relative z-10 border border-white/5 shadow-2xl">
                            <svg className="w-10 h-10 text-indigo-400 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                            </svg>
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">Your Space is Ready</h3>
                        <p className="max-w-xs text-center text-gray-400">Select a family member or friend from the sidebar to start a secure conversation.</p>
                    </div>
                )}
              </div>
            </div>
          );
      }

      // Public Routes
      switch (path) {
          case '/login':
              return (
                  <Auth 
                    mode="signin" 
                    onBack={() => navigate('/')} 
                    onSwitchMode={() => navigate('/register')}
                  />
              );
          case '/register':
              return (
                  <Auth 
                    mode="signup" 
                    onBack={() => navigate('/')} 
                    onSwitchMode={() => navigate('/login')}
                  />
              );
          case '/privacy':
              return <PrivacyPolicy onBack={() => navigate('/')} />;
          case '/terms':
              return <TermsOfService onBack={() => navigate('/')} />;
          case '/contact':
              return <ContactSupport onBack={() => navigate('/')} />;
          case '/plans/show-more':
              return <PlansPage onBack={() => navigate('/')} />;
          case '/':
              return <LandingPage onNavigate={navigate} isAuthenticated={!!currentUser} />;
          default:
              return <NotFoundPage onBack={() => navigate('/')} />;
      }
  };

  return renderView();
};

export default App;