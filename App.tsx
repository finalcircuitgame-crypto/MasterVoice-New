import React, { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';
import { UserProfile } from './types';
import { Auth } from './components/Auth';
import { ChatList } from './components/ChatList';
import { ChatWindow } from './components/ChatWindow';
import { LandingPage } from './components/LandingPage';
import { PrivacyPolicy, TermsOfService, ContactSupport } from './components/Pages';
import { useRouter } from './hooks/useRouter';

const App: React.FC = () => {
  const [session, setSession] = useState<any>(null);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  
  const { path, navigate } = useRouter();

  useEffect(() => {
    // Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
          setCurrentUser({
              id: session.user.id,
              email: session.user.email || 'No Email',
          });
          // If user is logged in and on a public page, redirect to app
          if (['/', '/login', '/register'].includes(window.location.pathname)) {
            navigate('/app');
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
          if (['/', '/login', '/register'].includes(window.location.pathname)) {
             navigate('/app');
          }
      } else {
          setCurrentUser(null);
          setSelectedUser(null);
          // If on protected route, kick to login
          if (window.location.pathname === '/app') {
            navigate('/login');
          }
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  // Simple Router Switch
  const renderView = () => {
      // Protected App Route
      if (path === '/app') {
          if (!session || !currentUser) {
            // Ideally redirect, but for render safety:
            return <div className="h-screen w-screen bg-[#030014] flex items-center justify-center text-white">Loading...</div>;
          }

          return (
            <div className="flex h-screen w-screen bg-gray-900 overflow-hidden animate-fade-in-up">
              <div className={`flex-none w-full md:w-80 h-full ${selectedUser ? 'hidden md:block' : 'block'}`}>
                <ChatList currentUser={currentUser} onSelectUser={setSelectedUser} />
              </div>
              <div className={`flex-1 h-full flex flex-col relative ${!selectedUser ? 'hidden md:flex' : 'flex'}`}>
                {selectedUser ? (
                    <>
                        <div className="md:hidden bg-gray-800 p-2 border-b border-gray-700">
                            <button onClick={() => setSelectedUser(null)} className="text-blue-400 text-sm flex items-center">
                                &larr; Back to chats
                            </button>
                        </div>
                        <ChatWindow currentUser={currentUser} recipient={selectedUser} />
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
          case '/':
          default:
              return <LandingPage onNavigate={navigate} />;
      }
  };

  return renderView();
};

export default App;