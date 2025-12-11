import React, { useEffect, useState, useRef } from 'react';
import { supabase } from './supabaseClient';
import { UserProfile, CallState } from './types';
import { Auth } from './components/Auth';
import { ChatList } from './components/ChatList';
import { ChatWindow } from './components/ChatWindow';
import { Settings } from './components/Settings';
import { LandingPage } from './components/LandingPage';
import { PrivacyPolicy, TermsOfService, ContactSupport, PlansPage, NotFoundPage } from './components/Pages';
import { useRouter } from './hooks/useRouter';
import { useWebRTC } from './hooks/useWebRTC';
import { VoiceCallOverlay } from './components/VoiceCallOverlay';

const App: React.FC = () => {
  const [session, setSession] = useState<any>(null);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const [showTrialNotification, setShowTrialNotification] = useState(false);
  const [showFamilyNotification, setShowFamilyNotification] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  
  // Call Navigation Guard
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);

  // Refs to prevent loops and duplicate toasts
  const hasWelcomedRef = useRef(false);
  const lastUserIdRef = useRef<string | null>(null);
  
  const { path, navigate, query } = useRouter();
  
  // Create a ref for navigate to use in effects safely
  const navigateRef = useRef(navigate);
  useEffect(() => { navigateRef.current = navigate; }, [navigate]);

  // Resize Listener
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // --- HOISTED WEBRTC LOGIC ---
  const roomId = (currentUser && selectedUser) 
    ? [currentUser.id, selectedUser.id].sort().join('_') 
    : null;

  const { 
    callState, 
    remoteStream, 
    startCall, 
    endCall, 
    answerCall, 
    toggleMute, 
    isMuted,
    rtcStats,
    setInputGain,
    inputGain
  } = useWebRTC(roomId, currentUser?.id || '');

  // Detect navigation to Landing Page while in call
  useEffect(() => {
      if (path === '/' && callState !== CallState.IDLE) {
          setShowLeaveConfirm(true);
      } else {
          setShowLeaveConfirm(false);
      }
  }, [path, callState]);

  // Presence logic
  useEffect(() => {
    if (!currentUser) return;

    const presenceChannel = supabase.channel('global_presence', {
      config: { presence: { key: currentUser.id } },
    });

    presenceChannel
      .on('presence', { event: 'sync' }, () => {
        const newState = presenceChannel.presenceState();
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
          await presenceChannel.track({
            online_at: new Date().toISOString(),
          });
        }
      });

    return () => {
      supabase.removeChannel(presenceChannel);
    };
  }, [currentUser?.id]);

  // Auth & User Setup Logic
  useEffect(() => {
    const setupUser = async (sessionUser: any) => {
        // CRITICAL: Prevent processing the same user multiple times to stop infinite loops
        if (lastUserIdRef.current === sessionUser.id) {
            return;
        }
        lastUserIdRef.current = sessionUser.id;

        let isFamily = false;
        
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('is_family')
                .eq('id', sessionUser.id)
                .single();
            
            if (data && !error) {
                isFamily = data.is_family || false;
            }
        } catch (e) {
            console.error("Error fetching profile:", e);
        }

        const userProfile: UserProfile = {
            id: sessionUser.id,
            email: sessionUser.email || 'No Email',
            is_family: isFamily, 
        };
        
        setCurrentUser(userProfile);
        
        if (userProfile.is_family && !hasWelcomedRef.current) {
             setShowFamilyNotification(true);
             hasWelcomedRef.current = true;
             setTimeout(() => setShowFamilyNotification(false), 6000);
        }
    };

    const initSession = async () => {
        try {
            const { data, error } = await supabase.auth.getSession();
            if (error) throw error;
            
            setSession(data.session);
            if (data.session?.user) {
                await setupUser(data.session.user);
                // Redirect if on auth pages
                if (['/login', '/register'].includes(window.location.pathname)) {
                    navigateRef.current('/conversations');
                }
            }
        } catch (err: any) {
            console.error("Session init error:", err.message);
            if (err.message?.includes("Refresh Token") || err.message?.includes("refresh_token")) {
                await supabase.auth.signOut();
                setSession(null);
                setCurrentUser(null);
                lastUserIdRef.current = null;
                navigateRef.current('/login');
            }
        }
    };

    initSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      // console.log("Auth State Change:", event);
      setSession(session);
      
      if (session?.user) {
          await setupUser(session.user);
          if (['/login', '/register'].includes(window.location.pathname)) {
             navigateRef.current('/conversations');
          }
      } else if (event === 'SIGNED_OUT') {
          setCurrentUser(null);
          setSelectedUser(null);
          setOnlineUsers(new Set());
          hasWelcomedRef.current = false;
          lastUserIdRef.current = null;
          
          if (['/conversations', '/settings'].includes(window.location.pathname)) {
            navigateRef.current('/login');
          }
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Handle URL-based Chat Selection (Deep Linking)
  useEffect(() => {
    if (!currentUser) return;
    
    const userIdParam = query.get('userId');
    
    if (userIdParam) {
        if (!selectedUser || selectedUser.id !== userIdParam) {
            const fetchUser = async () => {
                const { data, error } = await supabase.from('profiles').select('*').eq('id', userIdParam).single();
                if (data && !error) {
                    setSelectedUser(data);
                }
            };
            fetchUser();
        }
    } else {
        if (selectedUser) {
            setSelectedUser(null);
        }
    }
  }, [query, currentUser, selectedUser]);

  // Check for trial params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (path === '/conversations' && params.get('trial') === 'true' && params.get('plan') === 'pro') {
        setShowTrialNotification(true);
        const timer = setTimeout(() => setShowTrialNotification(false), 5000);
        return () => clearTimeout(timer);
    }
  }, [path]);

  const handleSelectUser = (user: UserProfile) => {
      navigate(`/conversations?userId=${user.id}`);
  };

  const handleOpenSettings = () => {
      navigate('/settings');
  };

  const isSettingsOpen = path === '/settings';
  const showChatInterface = (path === '/conversations' || isSettingsOpen) && session && currentUser;

  const renderPublicView = () => {
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
              if (showChatInterface) return null; 
              return <NotFoundPage onBack={() => navigate('/')} />;
      }
  };

  if (!showChatInterface) {
      return (
          <>
            {renderPublicView()}
            {/* Landing Page Leave Confirmation Modal */}
            {showLeaveConfirm && (
                <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/80 backdrop-blur-md p-6 animate-fade-in">
                    <div className="bg-[#1a1a20] w-full max-w-sm rounded-3xl p-8 border border-white/10 shadow-2xl animate-scale-in text-center">
                        <div className="w-16 h-16 rounded-full bg-indigo-500/20 flex items-center justify-center mx-auto mb-6 text-indigo-400">
                             <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-2">Call in Progress</h2>
                        <p className="text-gray-400 mb-8">Do you want to end your current call or continue chatting?</p>
                        
                        <div className="flex flex-col gap-3">
                            <button 
                                onClick={() => { 
                                    navigate('/conversations'); 
                                    setShowLeaveConfirm(false); 
                                }} 
                                className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition"
                            >
                                Continue Call
                            </button>
                            <button 
                                onClick={() => { 
                                    endCall(); 
                                    setShowLeaveConfirm(false); 
                                }} 
                                className="w-full py-4 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-red-400 font-bold rounded-xl transition"
                            >
                                End Call & Leave
                            </button>
                        </div>
                    </div>
                </div>
            )}
            <VoiceCallOverlay 
                callState={callState} 
                remoteStream={remoteStream} 
                onEndCall={endCall} 
                onAnswer={answerCall} 
                toggleMute={toggleMute}
                isMuted={isMuted}
                recipient={selectedUser || undefined}
                rtcStats={rtcStats}
                setInputGain={setInputGain}
                inputGain={inputGain}
            />
          </>
      );
  }

  return (
    <div className="relative h-screen w-screen bg-[#030014] overflow-hidden">
        
        {/* Main Chat Interface */}
        <div className={`absolute inset-0 flex transition-all duration-500 ease-in-out ${isSettingsOpen ? 'scale-[0.98] opacity-30 pointer-events-none blur-sm' : 'opacity-100 scale-100'}`}>
            
              {/* Notifications Layer */}
              <div className="absolute top-6 left-1/2 -translate-x-1/2 z-[100] flex flex-col items-center gap-3 w-full max-w-md px-4 pointer-events-none">
                  {showTrialNotification && (
                      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-message-enter pointer-events-auto border border-white/10 backdrop-blur-md">
                          <svg className="w-5 h-5 text-indigo-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                          <span className="font-semibold text-sm">Pro Trial Activated! Enjoy HD Voice.</span>
                          <button onClick={() => setShowTrialNotification(false)} className="hover:bg-white/20 rounded-full p-1"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
                      </div>
                  )}

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

              {/* Chat List Column */}
              {(!isMobile || !selectedUser) && (
                  <div className={`flex-none w-full md:w-80 h-full ${selectedUser ? 'hidden md:block' : 'block'}`}>
                    <ChatList 
                        currentUser={currentUser!} 
                        onSelectUser={handleSelectUser} 
                        onlineUsers={onlineUsers}
                        onOpenSettings={handleOpenSettings}
                    />
                  </div>
              )}

              {/* Chat Window Column */}
              <div className={`flex-1 h-full flex flex-col relative ${!selectedUser ? 'hidden md:flex' : 'flex'}`}>
                {selectedUser && !isSettingsOpen ? (
                    <>
                        <div className="md:hidden bg-[#060609] p-4 pt-4 border-b border-white/5 flex items-center gap-3">
                            <button 
                                onClick={() => {
                                    setSelectedUser(null);
                                    navigate('/conversations');
                                }} 
                                className="text-gray-400 hover:text-white p-2 -ml-2 rounded-full hover:bg-white/10 transition"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                            </button>
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center text-xs font-bold text-white">
                                    {selectedUser.email[0].toUpperCase()}
                                </div>
                                <span className="font-bold text-white">{selectedUser.email.split('@')[0]}</span>
                            </div>
                        </div>
                        <ChatWindow 
                            key={selectedUser.id}
                            currentUser={currentUser!} 
                            recipient={selectedUser} 
                            onlineUsers={onlineUsers}
                            // Call props hoisted from useWebRTC
                            channel={null} // Signaling is now internal to App/useWebRTC, not passed down
                            callState={callState}
                            onStartCall={startCall}
                            onAnswerCall={answerCall}
                            onEndCall={endCall}
                        />
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-gray-500 bg-[#030014] relative overflow-hidden">
                        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none mix-blend-overlay"></div>
                        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none"></div>
                        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-fuchsia-500/10 rounded-full blur-[100px] pointer-events-none"></div>
                        <div className="w-24 h-24 bg-gradient-to-tr from-indigo-500/20 to-fuchsia-500/20 rounded-[2rem] flex items-center justify-center mb-6 animate-float relative z-10 border border-white/5 shadow-2xl backdrop-blur-sm">
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

        {/* Settings Overlay Layer */}
        {isSettingsOpen && (
             <div className="absolute inset-0 z-50 flex items-center justify-center animate-slide-up bg-black/50 backdrop-blur-sm">
                 <div className="w-full h-full md:max-w-2xl md:h-[90vh] md:rounded-[2rem] bg-[#060609] overflow-hidden shadow-2xl relative">
                    <Settings currentUser={currentUser!} onBack={() => navigate('/conversations')} />
                 </div>
             </div>
        )}

        {/* Voice Call Overlay */}
        <VoiceCallOverlay 
            callState={callState} 
            remoteStream={remoteStream} 
            onEndCall={endCall} 
            onAnswer={answerCall} 
            toggleMute={toggleMute}
            isMuted={isMuted}
            recipient={selectedUser || undefined}
            rtcStats={rtcStats}
            setInputGain={setInputGain}
            inputGain={inputGain}
        />
    </div>
  );
};

export default App;