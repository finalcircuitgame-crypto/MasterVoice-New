import React, { useEffect, useState, useRef } from 'react';
import { supabase } from './supabaseClient';
import { UserProfile } from './types';
import { Auth } from './components/Auth';
import { ChatList } from './components/ChatList';
import { ChatWindow } from './components/ChatWindow';
import { LandingPage } from './components/LandingPage';
import { PrivacyPolicy, TermsOfService, ContactSupport, PlansPage } from './components/Pages';
import { useRouter } from './hooks/useRouter';

const App: React.FC = () => {
  const [session, setSession] = useState<any>(null);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const [showTrialNotification, setShowTrialNotification] = useState(false);
  
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
    // Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
          setCurrentUser({
              id: session.user.id,
              email: session.user.email || 'No Email',
          });
          // Only redirect from auth pages
          if (['/login', '/register'].includes(window.location.pathname)) {
            navigate('/conversations');
          }
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user) {
          setCurrentUser({
              id: session.user.id,
              email: session.user.email || 'No Email',
          });
          // Only redirect from auth pages
          if (['/login', '/register'].includes(window.location.pathname)) {
             navigate('/conversations');
          }
      } else {
          setCurrentUser(null);
          setSelectedUser(null);
          setOnlineUsers(new Set());
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
            return <div className="h-screen w-screen bg-[#030014] flex items-center justify-center text-white">Loading...</div>;
          }

          return (
            <div className="flex h-screen w-screen bg-gray-900 overflow-hidden animate-fade-in-up relative">
              
              {/* Trial Notification Toast */}
              {showTrialNotification && (
                  <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 animate-message-enter">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      <span className="font-semibold">Pro Trial Activated! Enjoy HD Voice.</span>
                      <button onClick={() => setShowTrialNotification(false)} className="hover:bg-white/20 rounded-full p-1"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
                  </div>
              )}

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
                        <div className="md:hidden bg-gray-800 p-2 border-b border-gray-700">
                            <button onClick={() => setSelectedUser(null)} className="text-blue-400 text-sm flex items-center">
                                &larr; Back to chats
                            </button>
                        </div>
                        <ChatWindow 
                            currentUser={currentUser} 
                            recipient={selectedUser} 
                            onlineUsers={onlineUsers}
                        />
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-gray-500 bg-gray-900">
                        <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mb-4">
                            <svg className="w-8 h-8 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                            </svg>
                        </div>
                        <p>Select a conversation to start chatting</p>
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
          default:
              return <LandingPage onNavigate={navigate} isAuthenticated={!!currentUser} />;
      }
  };

  return renderView();
};

export default App;