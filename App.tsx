import React, { useEffect, useState, useRef, Suspense } from 'react';
import { supabase } from './supabaseClient';
import { UserProfile, CallState, Group } from './types';
import { Auth } from './components/Auth';
import { ChatList } from './components/ChatList';
import { ChatWindow } from './components/ChatWindow';
import { GroupWindow } from './components/GroupWindow';
import { LandingPage } from './components/LandingPage';
import { 
  PrivacyPolicy, 
  TermsOfService, 
  ContactSupport, 
  PlansPage, 
  ComparePlansPage, 
  NotFoundPage, 
  Documentation, 
  ApiKeyPage, 
  VerifyPage, 
  DevPage, 
  MauLimitPage, 
  ThemeEditorPage,
  TelemetryPage,
  TelemetryApiResponse
} from './components/Pages';
import { useRouter } from './hooks/useRouter';
import { useWebRTC } from './hooks/useWebRTC';
import { VoiceCallOverlay } from './components/VoiceCallOverlay';

// --- LAZY LOADING ---
const Settings = React.lazy(() => import(/* webpackChunkName: "Settings" */ './components/Settings'));

const App: React.FC = () => {
  const [session, setSession] = useState<any>(null);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  
  const [activeCallContact, setActiveCallContact] = useState<UserProfile | null>(null);
  const [isCallMaximized, setIsCallMaximized] = useState(false);

  useEffect(() => {
      const playTone = (freq: number, type: 'sine'|'square'|'triangle' = 'sine', duration: number = 0.1) => {
          try {
              const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
              const osc = ctx.createOscillator();
              const gain = ctx.createGain();
              osc.type = type;
              osc.frequency.setValueAtTime(freq, ctx.currentTime);
              gain.gain.setValueAtTime(0.1, ctx.currentTime);
              gain.gain.exponentialRampToValueAtTime(0.00001, ctx.currentTime + duration);
              osc.connect(gain);
              gain.connect(ctx.destination);
              osc.start();
              osc.stop(ctx.currentTime + duration);
          } catch(e) {}
      };

      const handleIncoming = () => playTone(880, 'sine', 0.2); 
      const handleSent = () => playTone(440, 'triangle', 0.1); 

      window.addEventListener('play-notification', handleIncoming);
      window.addEventListener('play-sent', handleSent);
      return () => {
          window.removeEventListener('play-notification', handleIncoming);
          window.removeEventListener('play-sent', handleSent);
      };
  }, []);

  const { path, navigate, query } = useRouter();

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const webrtcTargetUser = activeCallContact || selectedUser;
  const rtcRoomId = (currentUser && webrtcTargetUser) ? [currentUser.id, webrtcTargetUser.id].sort().join('_') : null;

  const handleCallEnded = () => {
      localStorage.removeItem('mv_active_call');
      setActiveCallContact(null);
      setIsCallMaximized(false);
  };

  const userPlan = currentUser?.plan || (currentUser?.is_family ? 'pro' : 'free');

  const { 
    callState, 
    remoteStream, 
    remoteScreenStream,
    localVideoStream,
    localScreenStream,
    startCall: rtcStartCall, 
    endCall: rtcEndCall, 
    answerCall: rtcAnswerCall, 
    toggleMute, 
    toggleVideo, 
    toggleScreenShare,
    toggleRemoteAudio,
    isMuted, 
    isVideoEnabled,
    isScreenSharing,
    rtcStats,
    setInputGain,
    inputGain
  } = useWebRTC(rtcRoomId, currentUser?.id || '', userPlan, handleCallEnded);

  useEffect(() => {
      const restoreCall = async () => {
          const stored = localStorage.getItem('mv_active_call');
          if (stored && !activeCallContact) {
              try {
                  const { partnerId, isGroup } = JSON.parse(stored);
                  if (!isGroup && partnerId) {
                      const { data } = await supabase.from('profiles').select('*').eq('id', partnerId).single();
                      if (data) {
                          setActiveCallContact(data);
                          setIsCallMaximized(true);
                      }
                  }
              } catch (e) {
                  localStorage.removeItem('mv_active_call');
              }
          }
      };
      restoreCall();
  }, []);

  useEffect(() => {
      if (activeCallContact && callState === CallState.IDLE && localStorage.getItem('mv_active_call')) {
           const t = setTimeout(() => { rtcStartCall(); }, 1000);
           return () => clearTimeout(t);
      }
  }, [activeCallContact, callState, rtcStartCall]);

  useEffect(() => {
      if (callState === CallState.CONNECTED && activeCallContact) {
          localStorage.setItem('mv_active_call', JSON.stringify({ partnerId: activeCallContact.id, isGroup: false }));
      }
  }, [callState, activeCallContact]);

  const handleStartCall = () => {
      if (selectedUser) {
          setActiveCallContact(selectedUser);
          rtcStartCall();
          setIsCallMaximized(true);
      }
  };

  const handleEndCall = () => {
      rtcEndCall();
      handleCallEnded();
  };

  const handleAnswerCall = () => {
      rtcAnswerCall();
      if (selectedUser && !activeCallContact) {
          setActiveCallContact(selectedUser);
      }
      setIsCallMaximized(true);
  };

  useEffect(() => {
      if (callState === CallState.RECEIVING && !activeCallContact && selectedUser) {
          setActiveCallContact(selectedUser);
          setIsCallMaximized(true);
      }
  }, [callState, selectedUser, activeCallContact]);

  useEffect(() => {
    if (!currentUser) return;
    const presenceChannel = supabase.channel('global_presence', { config: { presence: { key: currentUser.id } } });
    presenceChannel
      .on('presence', { event: 'sync' }, () => {
        const newState = presenceChannel.presenceState();
        const onlineIds = new Set<string>();
        Object.keys(newState).forEach(id => onlineIds.add(id));
        setOnlineUsers(onlineIds);
      })
      .on('presence', { event: 'join' }, ({ key }) => setOnlineUsers(prev => new Set(prev).add(key)))
      .on('presence', { event: 'leave' }, ({ key }) => setOnlineUsers(prev => { const next = new Set(prev); next.delete(key); return next; }))
      .subscribe(async (status) => { if (status === 'SUBSCRIBED') await presenceChannel.track({ online_at: new Date().toISOString() }); });
    return () => { supabase.removeChannel(presenceChannel); };
  }, [currentUser?.id]);

  useEffect(() => {
    const initSession = async () => {
        try {
            const { data, error } = await supabase.auth.getSession();
            if (error) throw error;
            setSession(data.session);
            if (data.session?.user) {
                setCurrentUser({ 
                    id: data.session.user.id, 
                    email: data.session.user.email || 'No Email', 
                    is_family: true,
                    plan: 'pro',
                    email_confirmed_at: data.session.user.email_confirmed_at
                });
                if (['/login', '/register'].includes(window.location.pathname)) navigate('/conversations');
            }
        } catch (err: any) {
            console.error("Session init error:", err.message);
        }
    };
    initSession();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      if (session?.user) {
          setCurrentUser({ 
              id: session.user.id, 
              email: session.user.email || 'No Email', 
              is_family: true,
              plan: 'pro',
              email_confirmed_at: session.user.email_confirmed_at
          });
          if (['/login', '/register'].includes(window.location.pathname)) navigate('/conversations');
      } else {
          setCurrentUser(null);
          setSelectedUser(null);
          setOnlineUsers(new Set());
          if (['/conversations', '/settings'].includes(window.location.pathname)) navigate('/login');
      }
    });
    return () => subscription.unsubscribe();
  }, [navigate]);

  useEffect(() => {
    if (!currentUser) return;
    const userIdParam = query.get('userId');
    const pathParts = window.location.pathname.split('/');
    const isGroupRoute = window.location.pathname.startsWith('/conversations/groups/');
    const groupIdFromPath = isGroupRoute && pathParts.length >= 4 ? pathParts[3] : null;

    if (userIdParam) {
        if (!selectedUser || selectedUser.id !== userIdParam) {
            supabase.from('profiles').select('*').eq('id', userIdParam).single().then(({ data }) => {
                if (data) {
                    setSelectedGroup(null);
                    setSelectedUser(data);
                }
            });
        }
    } else if (groupIdFromPath) {
        if (!selectedGroup || selectedGroup.id !== groupIdFromPath) {
            supabase.from('groups').select('*').eq('id', groupIdFromPath).single().then(({ data }) => {
                if (data) {
                    setSelectedUser(null);
                    setSelectedGroup(data);
                }
            });
        }
    } else {
        if (window.location.pathname === '/conversations' && !window.location.search && (selectedUser || selectedGroup)) {
             setSelectedUser(null);
             setSelectedGroup(null);
        }
    }
  }, [path, query, currentUser]);

  const handleSelectUser = (user: UserProfile) => {
      if (selectedUser?.id !== user.id) {
          setSelectedGroup(null);
          setSelectedUser(user);
          navigate(`/conversations?userId=${user.id}`);
      }
  };

  const handleSelectGroup = (group: Group) => {
      if (selectedGroup?.id !== group.id) {
          setSelectedUser(null);
          setSelectedGroup(group);
          navigate(`/conversations/groups/${group.id}`);
      }
  };

  const isSettingsOpen = path === '/settings';
  const showChatInterface = (path.startsWith('/conversations') || isSettingsOpen) && session && currentUser;

  const renderPublicView = () => {
      switch (path) {
          case '/v2/telemetry': return <TelemetryApiResponse />;
          case '/login': return <Auth mode="signin" onBack={() => navigate('/')} onSwitchMode={() => navigate('/register')} />;
          case '/register': return <Auth mode="signup" onBack={() => navigate('/')} onSwitchMode={() => navigate('/login')} />;
          case '/privacy': return <PrivacyPolicy onBack={() => navigate('/')} />;
          case '/terms': return <TermsOfService onBack={() => navigate('/')} />;
          case '/contact': return <ContactSupport onBack={() => navigate('/')} />;
          case '/docs': return <Documentation onBack={() => navigate('/')} />;
          case '/plans/show-more': return <PlansPage onBack={() => navigate('/')} onNavigate={navigate} />;
          case '/compare':
          case '/plans/compare': return <ComparePlansPage onBack={() => navigate('/')} onNavigate={navigate} />;
          case '/api_key': return <ApiKeyPage onBack={() => navigate('/')} onNavigate={navigate} />;
          case '/mau-limit': return <MauLimitPage onBack={() => navigate('/api_key')} onNavigate={navigate} />;
          case '/verify': return <VerifyPage onBack={() => navigate('/')} onNavigate={navigate} />;
          case '/dev': return <DevPage onNavigate={navigate} onBack={() => navigate('/')} />;
          case '/theme-editor': return <ThemeEditorPage onBack={() => navigate('/settings')} onNavigate={navigate} />;
          case '/telemetry': return <TelemetryPage onBack={() => navigate('/dev')} onNavigate={navigate} />;
          case '/': return <LandingPage onNavigate={navigate} isAuthenticated={!!currentUser} />;
          default: if (showChatInterface) return null; return <NotFoundPage onBack={() => navigate('/')} />;
      }
  };

  const isChatOpen = selectedUser || selectedGroup;

  if (!showChatInterface) {
      return (
          <>
            {renderPublicView()}
            <VoiceCallOverlay 
                callState={callState} 
                remoteStream={remoteStream}
                remoteScreenStream={remoteScreenStream} 
                localVideoStream={localVideoStream}
                localScreenStream={localScreenStream}
                onEndCall={handleEndCall} 
                onAnswer={handleAnswerCall} 
                toggleMute={toggleMute}
                toggleVideo={toggleVideo}
                toggleScreenShare={toggleScreenShare}
                toggleRemoteAudio={toggleRemoteAudio}
                isMuted={isMuted}
                isVideoEnabled={isVideoEnabled}
                isScreenSharing={isScreenSharing}
                recipient={activeCallContact || selectedUser || undefined}
                rtcStats={rtcStats}
                setInputGain={setInputGain}
                inputGain={inputGain}
                isMaximized={isCallMaximized}
                setIsMaximized={setIsCallMaximized}
            />
          </>
      );
  }

  return (
    <div className="relative h-screen w-screen bg-[#030014] overflow-hidden">
        <div className={`absolute inset-0 flex transition-all duration-500 ease-in-out ${isSettingsOpen ? 'scale-[0.98] opacity-30 pointer-events-none blur-sm' : 'opacity-100 scale-100'}`}>
              {(!isMobile || !isChatOpen) && (
                  <div className={`flex-none w-full md:w-80 h-full ${isChatOpen ? 'hidden md:block' : 'block'}`}>
                    <ChatList 
                        currentUser={currentUser!} 
                        onSelectUser={handleSelectUser} 
                        onSelectGroup={handleSelectGroup}
                        onlineUsers={onlineUsers}
                        onOpenSettings={() => navigate('/settings')}
                    />
                  </div>
              )}
              <div className={`flex-1 h-full flex flex-col relative ${!isChatOpen ? 'hidden md:flex' : 'flex'}`}>
                {isChatOpen && !isSettingsOpen ? (
                    <>
                        <div className="md:hidden bg-[#060609] p-4 pt-4 border-b border-white/5 flex items-center gap-3">
                            <button onClick={() => { setSelectedUser(null); setSelectedGroup(null); navigate('/conversations'); }} className="text-gray-400 hover:text-white p-2 -ml-2 rounded-full hover:bg-white/10 transition">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                            </button>
                            <div className="flex items-center gap-2">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white ${selectedGroup ? 'bg-gradient-to-br from-purple-500 to-indigo-600' : 'bg-gray-800'}`}>
                                    {selectedGroup ? selectedGroup.name[0].toUpperCase() : selectedUser?.email[0].toUpperCase()}
                                </div>
                                <span className="font-bold text-white">{selectedGroup ? selectedGroup.name : selectedUser?.email.split('@')[0]}</span>
                            </div>
                        </div>
                        {selectedGroup ? (
                            <GroupWindow
                                key={`group_${selectedGroup.id}`}
                                currentUser={currentUser!}
                                selectedGroup={selectedGroup}
                                onlineUsers={onlineUsers}
                            />
                        ) : (
                            <ChatWindow 
                                key={`user_${selectedUser!.id}`}
                                currentUser={currentUser!} 
                                recipient={selectedUser} 
                                onlineUsers={onlineUsers}
                                channel={null} 
                                callState={callState}
                                onStartCall={handleStartCall}
                                onAnswerCall={handleAnswerCall}
                                onEndCall={handleEndCall}
                                activeCallContact={activeCallContact}
                                onExpandCall={() => setIsCallMaximized(true)}
                            />
                        )}
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-gray-500 bg-[#030014] relative overflow-hidden">
                        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none mix-blend-overlay"></div>
                        <div className="w-24 h-24 bg-gradient-to-tr from-indigo-500/20 to-fuchsia-500/20 rounded-[2rem] flex items-center justify-center mb-6 animate-float relative z-10 border border-white/5 shadow-2xl backdrop-blur-sm">
                            <svg className="w-10 h-10 text-indigo-400 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">Your Space is Ready</h3>
                        <p className="max-w-xs text-center text-gray-400">Select a chat to begin.</p>
                    </div>
                )}
              </div>
        </div>
        {isSettingsOpen && (
             <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                <Suspense fallback={
                    <div className="w-full h-full md:max-w-2xl md:h-[90vh] md:rounded-[2rem] bg-[#060609] flex flex-col items-center justify-center border border-white/10 shadow-2xl animate-pulse">
                        <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                        <p className="text-indigo-400 font-bold tracking-widest text-xs uppercase">Loading Settings...</p>
                    </div>
                }>
                    <div className="w-full h-full md:max-w-2xl md:h-[90vh] md:rounded-[2rem] bg-[#060609] overflow-hidden shadow-2xl relative animate-slide-up">
                        <Settings currentUser={currentUser!} onBack={() => navigate('/conversations')} />
                    </div>
                </Suspense>
             </div>
        )}
        <VoiceCallOverlay 
            callState={callState} 
            remoteStream={remoteStream}
            remoteScreenStream={remoteScreenStream}
            localVideoStream={localVideoStream} 
            localScreenStream={localScreenStream}
            onEndCall={handleEndCall} 
            onAnswer={handleAnswerCall} 
            toggleMute={toggleMute}
            toggleVideo={toggleVideo}
            toggleScreenShare={toggleScreenShare}
            toggleRemoteAudio={toggleRemoteAudio}
            isMuted={isMuted}
            isVideoEnabled={isVideoEnabled}
            isScreenSharing={isScreenSharing}
            recipient={activeCallContact || selectedUser || undefined}
            rtcStats={rtcStats}
            setInputGain={setInputGain}
            inputGain={inputGain}
            isMaximized={isCallMaximized}
            setIsMaximized={setIsCallMaximized}
        />
    </div>
  );
};

export default App;