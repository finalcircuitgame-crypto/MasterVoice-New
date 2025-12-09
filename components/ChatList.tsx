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
        // Note: You must manually create a row in 'profiles' for each auth user 
        // via Supabase Triggers for this to populate automatically.
        // For this demo, we assume the 'profiles' table exists and is populated.
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

  return (
    <div className="w-full md:w-80 bg-gray-800 border-r border-gray-700 flex flex-col h-full">
      <div className="p-4 border-b border-gray-700 bg-gray-900">
        <h1 className="text-xl font-bold text-white mb-1">Chats</h1>
        <p className="text-xs text-gray-400 truncate">Logged in as: {currentUser.email}</p>
      </div>
      
      <div className="flex-1 overflow-y-auto">
        {users.length === 0 && (
            <div className="p-4 text-center text-gray-500 text-sm">
                No other users found. Create another account in a new incognito window to chat!
            </div>
        )}
        {users.map((user) => {
            const isOnline = onlineUsers.has(user.id);
            return (
              <button
                key={user.id}
                onClick={() => onSelectUser(user)}
                className="w-full p-4 flex items-center space-x-3 hover:bg-gray-700 transition border-b border-gray-700/50 text-left relative group"
              >
                <div className="relative">
                    <div className="w-10 h-10 rounded-full bg-gray-600 flex items-center justify-center text-gray-300 font-bold">
                       {user.email[0].toUpperCase()}
                    </div>
                    {isOnline && (
                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-gray-800 animate-pulse"></div>
                    )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center mb-0.5">
                      <p className="text-sm font-medium text-white truncate">{user.email}</p>
                      {isOnline && <span className="text-[10px] text-green-400 font-semibold bg-green-500/10 px-1.5 rounded">ONLINE</span>}
                  </div>
                  <p className="text-xs text-gray-400">Click to chat</p>
                </div>
              </button>
            );
        })}
      </div>

      <div className="p-4 border-t border-gray-700">
        <button
            onClick={handleLogout}
            className="w-full py-2 px-4 bg-gray-700 hover:bg-gray-600 text-gray-200 rounded text-sm transition"
        >
            Sign Out
        </button>
      </div>
    </div>
  );
};