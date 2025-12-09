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

  useEffect(() => {
    const fetchUsers = async () => {
        // In a real app, query 'profiles' table. 
        const { data, error } = await supabase.from('profiles').select('*');
        if (!error && data) {
            setUsers(data.filter((u: UserProfile) => u.id !== currentUser.id));
        }
    };
    fetchUsers();
    
    // Subscribe to new profiles (optional, for real-time user list)
    const channel = supabase.channel('public:profiles')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => {
            fetchUsers();
        })
        .subscribe();
        
    return () => { supabase.removeChannel(channel); };
  }, [currentUser.id]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const isPenguinUser = (email: string) => email === 'cindygaldamez@yahoo.com';

  return (
    <div className="w-full md:w-80 bg-[#060609] border-r border-white/5 flex flex-col h-full font-['Outfit'] relative z-20">
      {/* Current User Header */}
      <div className="p-6 border-b border-white/5 bg-[#0a0a0f]">
        <h1 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-fuchsia-400 mb-1">MasterVoice</h1>
        <div className="flex items-center gap-2 mt-2 bg-white/5 p-2 rounded-xl">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-xs font-bold shadow-lg shadow-indigo-500/20">
                {currentUser.email[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1">
                    <p className="text-xs font-medium text-gray-300 truncate">{currentUser.email}</p>
                    {isPenguinUser(currentUser.email) && <span className="text-sm animate-wobble" title="Special Penguin Badge">🐧</span>}
                </div>
                {currentUser.is_family && (
                    <p className="text-[10px] text-amber-400 font-bold flex items-center gap-1">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
                        FAMILY MEMBER
                    </p>
                )}
            </div>
        </div>
      </div>
      
      {/* Search (Visual Only) */}
      <div className="p-4">
          <div className="bg-white/5 border border-white/5 rounded-xl px-4 py-2.5 flex items-center gap-2 text-sm text-gray-400">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              <input className="bg-transparent outline-none w-full placeholder-gray-600" placeholder="Search chats..." />
          </div>
      </div>

      <div className="flex-1 overflow-y-auto px-2">
        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest px-4 mb-2 mt-2">All Chats</h3>
        {users.length === 0 && (
            <div className="p-4 text-center text-gray-600 text-sm mt-10">
                <div className="w-12 h-12 bg-gray-800 rounded-full mx-auto mb-3 flex items-center justify-center text-xl">👻</div>
                No users found.<br/>Invite friends to chat!
            </div>
        )}
        {users.map((user) => {
            const isOnline = onlineUsers.has(user.id);
            return (
              <button
                key={user.id}
                onClick={() => onSelectUser(user)}
                className="w-full p-3 flex items-center space-x-3 hover:bg-white/5 rounded-xl transition-all duration-200 text-left group mb-1"
              >
                <div className="relative">
                    <div className="w-11 h-11 rounded-full bg-gray-800 border border-white/5 flex items-center justify-center text-gray-400 font-bold group-hover:bg-gray-700 transition-colors">
                       {user.email[0].toUpperCase()}
                    </div>
                    {isOnline && (
                        <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-[#060609]"></div>
                    )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center mb-0.5">
                      <div className="flex items-center gap-1.5 truncate">
                        <p className="text-sm font-semibold text-gray-200 truncate group-hover:text-white transition-colors">{user.email}</p>
                        {isPenguinUser(user.email) && <span className="text-sm animate-wobble">🐧</span>}
                      </div>
                      {isOnline && <span className="text-[10px] text-green-400 font-bold bg-green-500/10 px-1.5 py-0.5 rounded">ONLINE</span>}
                  </div>
                  <p className="text-xs text-gray-500 truncate group-hover:text-gray-400">Tap to start conversation</p>
                </div>
              </button>
            );
        })}
      </div>

      <div className="p-4 border-t border-white/5 bg-[#0a0a0f]">
        <button
            onClick={handleLogout}
            className="w-full py-3 px-4 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white rounded-xl text-sm font-bold transition flex items-center justify-center gap-2"
        >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
            Sign Out
        </button>
      </div>
    </div>
  );
};