import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { UserProfile } from '../types';

interface ChatListProps {
  currentUser: UserProfile;
  onSelectUser: (user: UserProfile) => void;
  onlineUsers: Set<string>;
}

export const ChatList: React.FC<ChatListProps> = ({ currentUser, onSelectUser, onlineUsers }) => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    // Check URL for active user on mount to highlight correctly
    const params = new URLSearchParams(window.location.search);
    const userIdParam = params.get('userId');
    if (userIdParam) setActiveId(userIdParam);

    const fetchUsers = async () => {
        const { data, error } = await supabase.from('profiles').select('*');
        if (!error && data) {
            setUsers(data.filter((u: UserProfile) => u.id !== currentUser.id));
        }
    };
    fetchUsers();
    
    const channel = supabase.channel('public:profiles')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => {
            fetchUsers();
        })
        .subscribe();
        
    return () => { supabase.removeChannel(channel); };
  }, [currentUser.id]);

  // Update active state when URL changes (via parent or nav)
  useEffect(() => {
      const handleLocationChange = () => {
        const params = new URLSearchParams(window.location.search);
        setActiveId(params.get('userId'));
      };
      
      // Listen for pushState calls (monkeypatched in Router or native events)
      // Since App.tsx handles nav, we just check query param on render usually,
      // but explicitly updating state ensures instant feedback
      const params = new URLSearchParams(window.location.search);
      setActiveId(params.get('userId'));
  }, [window.location.search]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const isPenguinUser = (email: string) => email === 'cindygaldamez@yahoo.com';

  return (
    <div className="w-full md:w-80 bg-[#060609]/95 backdrop-blur-xl border-r border-white/5 flex flex-col h-full font-['Outfit'] relative z-20 shadow-2xl">
      {/* Current User Header */}
      <div className="p-6 bg-gradient-to-b from-white/5 to-transparent border-b border-white/5">
        <h1 className="text-xl font-bold text-white tracking-tight mb-4 flex items-center gap-2">
            <span className="w-2 h-6 bg-indigo-500 rounded-full"></span>
            MasterVoice
        </h1>
        
        <div className="flex items-center gap-3 p-3 bg-white/5 rounded-2xl border border-white/5 hover:bg-white/10 transition-colors cursor-default">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-700 flex items-center justify-center text-sm font-bold shadow-lg text-white">
                {currentUser.email[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                    <p className="text-sm font-semibold text-gray-200 truncate">{currentUser.email.split('@')[0]}</p>
                    {isPenguinUser(currentUser.email) && <span className="text-sm animate-wobble" title="Special Penguin Badge">🐧</span>}
                </div>
                {currentUser.is_family && (
                    <p className="text-[10px] text-amber-400 font-bold uppercase tracking-wider flex items-center gap-1">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
                        Family
                    </p>
                )}
            </div>
        </div>
      </div>
      
      {/* Search */}
      <div className="p-4">
          <div className="bg-[#1a1a20] border border-white/5 rounded-xl px-4 py-3 flex items-center gap-3 text-sm text-gray-400 focus-within:ring-1 focus-within:ring-indigo-500/50 transition-all focus-within:bg-[#202025]">
              <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              <input className="bg-transparent outline-none w-full placeholder-gray-600 text-gray-200" placeholder="Search friends..." />
          </div>
      </div>

      <div className="flex-1 overflow-y-auto px-3 space-y-1">
        <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest px-4 py-2">Direct Messages</h3>
        {users.length === 0 && (
            <div className="p-8 text-center">
                <div className="w-16 h-16 bg-white/5 rounded-full mx-auto mb-3 flex items-center justify-center text-2xl grayscale opacity-50">👻</div>
                <p className="text-gray-500 text-sm">No one here yet.</p>
            </div>
        )}
        {users.map((user) => {
            const isOnline = onlineUsers.has(user.id);
            const isActive = activeId === user.id;
            
            return (
              <button
                key={user.id}
                onClick={() => {
                    setActiveId(user.id);
                    onSelectUser(user);
                }}
                className={`w-full p-3 flex items-center space-x-3 rounded-xl transition-all duration-200 text-left group relative overflow-hidden ${
                    isActive 
                    ? 'bg-indigo-600/10 border border-indigo-500/30' 
                    : 'hover:bg-white/5 border border-transparent'
                }`}
              >
                {isActive && <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-500 rounded-l"></div>}
                
                <div className="relative shrink-0">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold transition-colors ${
                        isActive ? 'bg-indigo-600 shadow-lg shadow-indigo-500/20' : 'bg-gray-800 group-hover:bg-gray-700'
                    }`}>
                       {user.email[0].toUpperCase()}
                    </div>
                    {isOnline && (
                        <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-[#060609]"></div>
                    )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center mb-0.5">
                      <div className="flex items-center gap-1.5 truncate">
                        <p className={`text-sm font-medium truncate transition-colors ${isActive ? 'text-white' : 'text-gray-300 group-hover:text-white'}`}>
                            {user.email}
                        </p>
                        {isPenguinUser(user.email) && <span className="text-xs animate-wobble">🐧</span>}
                      </div>
                  </div>
                  <p className={`text-xs truncate ${isActive ? 'text-indigo-300' : 'text-gray-500 group-hover:text-gray-400'}`}>
                      {isOnline ? 'Active now' : 'Offline'}
                  </p>
                </div>
              </button>
            );
        })}
      </div>

      <div className="p-4 border-t border-white/5 bg-[#0a0a0f]/50">
        <button
            onClick={handleLogout}
            className="w-full py-3 px-4 bg-white/5 hover:bg-red-500/10 text-gray-400 hover:text-red-400 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 border border-white/5 hover:border-red-500/20"
        >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
            Sign Out
        </button>
      </div>
    </div>
  );
};