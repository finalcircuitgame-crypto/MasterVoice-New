import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { UserProfile, FriendRequest, FriendshipStatus } from '../types';

interface ChatListProps {
  currentUser: UserProfile;
  onSelectUser: (user: UserProfile) => void;
  onlineUsers: Set<string>;
  onOpenSettings: () => void;
}

export const ChatList: React.FC<ChatListProps> = ({ currentUser, onSelectUser, onlineUsers, onOpenSettings }) => {
  const [activeTab, setActiveTab] = useState<'chats' | 'requests'>('chats');
  const [friends, setFriends] = useState<UserProfile[]>([]);
  const [incomingRequests, setIncomingRequests] = useState<any[]>([]);
  const [outgoingRequests, setOutgoingRequests] = useState<FriendRequest[]>([]);
  
  // Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserProfile[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);

  // --- Data Fetching ---
  
  const fetchData = async () => {
    // 1. Fetch all requests involving me
    const { data: requestsData, error: reqError } = await supabase
        .from('friend_requests')
        .select('*')
        .or(`sender_id.eq.${currentUser.id},receiver_id.eq.${currentUser.id}`);

    if (reqError || !requestsData) return;

    // Split into categories
    const acceptedIds = new Set<string>();
    const incoming: any[] = [];
    const outgoing: FriendRequest[] = [];

    requestsData.forEach((req: FriendRequest) => {
        if (req.status === 'accepted') {
            acceptedIds.add(req.sender_id === currentUser.id ? req.receiver_id : req.sender_id);
        } else if (req.status === 'pending') {
            if (req.receiver_id === currentUser.id) incoming.push(req);
            else outgoing.push(req);
        }
    });

    setOutgoingRequests(outgoing);

    // 2. Fetch Profiles for Accepted Friends
    if (acceptedIds.size > 0) {
        const { data: friendsData } = await supabase
            .from('profiles')
            .select('*')
            .in('id', Array.from(acceptedIds));
        if (friendsData) setFriends(friendsData);
    } else {
        setFriends([]);
    }

    // 3. Fetch Profiles for Incoming Requests
    if (incoming.length > 0) {
        const senderIds = incoming.map(r => r.sender_id);
        const { data: sendersData } = await supabase
            .from('profiles')
            .select('*')
            .in('id', senderIds);
        
        if (sendersData) {
            // Map profile data to request object
            const enrichedIncoming = incoming.map(req => ({
                ...req,
                sender: sendersData.find(u => u.id === req.sender_id)
            })).filter(r => r.sender); // ensure sender exists
            setIncomingRequests(enrichedIncoming);
        }
    } else {
        setIncomingRequests([]);
    }
  };

  useEffect(() => {
    fetchData();

    // Subscribe to Friend Request Changes
    const channel = supabase.channel('public:friend_requests')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'friend_requests' }, () => {
            fetchData();
        })
        .subscribe();
        
    return () => { supabase.removeChannel(channel); };
  }, [currentUser.id]);

  // --- URL Sync ---
  useEffect(() => {
      const params = new URLSearchParams(window.location.search);
      const userIdParam = params.get('userId');
      if (userIdParam) setActiveId(userIdParam);
  }, [window.location.search]);

  // --- Search Logic ---
  useEffect(() => {
      if (!searchQuery.trim()) {
          setSearchResults([]);
          return;
      }

      const doSearch = async () => {
          setIsSearching(true);
          // Search ALL profiles by email
          const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .ilike('email', `%${searchQuery}%`)
            .neq('id', currentUser.id) // Don't find self
            .limit(10);
            
          if (!error && data) {
              setSearchResults(data);
          }
          setIsSearching(false);
      };

      const timer = setTimeout(doSearch, 300);
      return () => clearTimeout(timer);
  }, [searchQuery, currentUser.id]);

  // --- Actions ---

  const acceptRequest = async (requestId: string) => {
      const { error } = await supabase.from('friend_requests').update({ status: 'accepted' }).eq('id', requestId);
      if (!error) {
          fetchData(); // Force refresh UI immediately
      }
  };

  const cancelOrRejectRequest = async (requestId: string) => {
      const { error } = await supabase.from('friend_requests').delete().eq('id', requestId);
      if (!error) {
          fetchData(); // Force refresh UI immediately
      }
  };

  const sendRequest = async (targetUserId: string) => {
      // 1. Check local state to see if a relationship already exists
      // This prevents 409 Conflicts and handles the UX gracefully
      const isFriend = friends.some(f => f.id === targetUserId);
      const isOutgoing = outgoingRequests.some(r => r.receiver_id === targetUserId);
      const incomingReq = incomingRequests.find(r => r.sender_id === targetUserId);

      if (isFriend) {
          // Already friends, just select them or do nothing
          return;
      }

      if (isOutgoing) {
          // Already sent a request, do nothing
          return;
      }

      if (incomingReq) {
          // They already sent me a request, just accept it!
          await acceptRequest(incomingReq.id);
          return;
      }

      // 2. If no existing relationship, create new request
      const { error } = await supabase.from('friend_requests').insert({
          sender_id: currentUser.id,
          receiver_id: targetUserId,
          status: 'pending'
      });
      
      if (!error) {
          fetchData(); // Force refresh
      }
  };

  // Helper to determine relationship status for a searched user
  const getRelationshipStatus = (targetId: string): { status: FriendshipStatus, reqId?: string } => {
      // Check friends
      if (friends.some(f => f.id === targetId)) return { status: 'friends' };
      
      // Check outgoing
      const out = outgoingRequests.find(r => r.receiver_id === targetId);
      if (out) return { status: 'pending_sent', reqId: out.id };

      // Check incoming
      const inc = incomingRequests.find(r => r.sender_id === targetId);
      if (inc) return { status: 'pending_received', reqId: inc.id };

      return { status: 'none' };
  };

  const isPenguinUser = (email: string) => email === 'cindygaldamez@yahoo.com';

  return (
    <div className="w-full md:w-80 bg-[#060609] md:bg-[#060609]/95 md:backdrop-blur-xl md:border-r border-white/5 flex flex-col h-full font-['Outfit'] relative z-20 shadow-2xl overflow-hidden">
      {/* Current User Header */}
      <div className="p-6 bg-gradient-to-b from-white/5 to-transparent border-b border-white/5 flex items-center justify-between shrink-0">
        <div>
            <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                <div className="w-2 h-6 bg-indigo-500 rounded-full"></div>
                MasterVoice
            </h1>
            <p className="text-xs text-gray-500 ml-4 font-medium tracking-wide">SECURE P2P MESH</p>
        </div>
        
        <button 
            onClick={onOpenSettings}
            className="w-10 h-10 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition active:scale-95 shadow-lg"
            aria-label="Settings"
        >
            {currentUser.email[0].toUpperCase()}
        </button>
      </div>
      
      {/* Tabs */}
      <div className="flex px-4 pt-4 gap-2 shrink-0">
          <button 
            onClick={() => { setActiveTab('chats'); setSearchQuery(''); }}
            className={`flex-1 pb-3 text-sm font-bold tracking-wide border-b-2 transition-all ${activeTab === 'chats' ? 'border-indigo-500 text-white' : 'border-transparent text-gray-500 hover:text-gray-300'}`}
          >
              Chats
          </button>
          <button 
            onClick={() => { setActiveTab('requests'); setSearchQuery(''); }}
            className={`flex-1 pb-3 text-sm font-bold tracking-wide border-b-2 transition-all flex items-center justify-center gap-2 ${activeTab === 'requests' ? 'border-indigo-500 text-white' : 'border-transparent text-gray-500 hover:text-gray-300'}`}
          >
              Requests
              {incomingRequests.length > 0 && (
                  <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-extrabold animate-pulse">{incomingRequests.length}</span>
              )}
          </button>
      </div>

      {/* Search */}
      <div className="p-4 pb-2 shrink-0">
          <div className="bg-[#13131a] border border-white/5 rounded-2xl px-4 py-3.5 flex items-center gap-3 text-sm text-gray-400 focus-within:ring-2 focus-within:ring-indigo-500/50 transition-all focus-within:bg-[#1a1a20] shadow-inner">
              <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              <input 
                className="bg-transparent outline-none w-full placeholder-gray-600 text-gray-200" 
                placeholder={activeTab === 'chats' ? "Find friends..." : "Search users..."} 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
          </div>
      </div>

      <div className="flex-1 overflow-y-auto px-3 space-y-1 pb-20 md:pb-0">
        
        {/* --- SEARCH RESULTS MODE --- */}
        {searchQuery.trim() !== '' ? (
            <>
                <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest px-4 py-2 mt-2">Global Search</h3>
                {isSearching ? (
                    <div className="p-8 text-center text-gray-500 text-xs animate-pulse">Searching directory...</div>
                ) : searchResults.length === 0 ? (
                    <div className="p-8 text-center text-gray-500 text-xs">No users found.</div>
                ) : (
                    searchResults.map(user => {
                        const { status, reqId } = getRelationshipStatus(user.id);
                        return (
                            <div key={user.id} className="w-full p-3 flex items-center justify-between rounded-2xl hover:bg-white/5 border border-transparent transition-all group animate-fade-in-up">
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center text-white text-sm font-bold border border-white/5">
                                        {user.email[0].toUpperCase()}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-sm font-medium text-gray-200 truncate">{user.email}</p>
                                        <p className="text-[10px] text-gray-500 font-medium">
                                            {status === 'friends' ? 'Already friends' : status === 'pending_sent' ? 'Request sent' : status === 'pending_received' ? 'Request received' : 'Stranger'}
                                        </p>
                                    </div>
                                </div>
                                
                                {/* Action Buttons */}
                                <div>
                                    {status === 'none' && (
                                        <button onClick={() => sendRequest(user.id)} className="p-2.5 bg-indigo-600/20 text-indigo-400 hover:bg-indigo-600 hover:text-white rounded-xl transition" title="Add Friend">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                                        </button>
                                    )}
                                    {status === 'pending_sent' && reqId && (
                                        <button onClick={() => cancelOrRejectRequest(reqId)} className="p-2.5 bg-gray-800 text-gray-400 hover:text-red-400 rounded-xl transition" title="Cancel Request">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                        </button>
                                    )}
                                    {status === 'pending_received' && reqId && (
                                        <div className="flex gap-2">
                                            <button onClick={() => acceptRequest(reqId)} className="p-2.5 bg-green-500/20 text-green-400 hover:bg-green-500 hover:text-white rounded-xl transition">
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                            </button>
                                            <button onClick={() => cancelOrRejectRequest(reqId)} className="p-2.5 bg-red-500/20 text-red-400 hover:bg-red-500 hover:text-white rounded-xl transition">
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                            </button>
                                        </div>
                                    )}
                                    {status === 'friends' && (
                                        <button onClick={() => { setActiveId(user.id); onSelectUser(user); setSearchQuery(''); }} className="p-2.5 bg-white/5 text-gray-300 hover:bg-white/10 rounded-xl transition" title="Message">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })
                )}
            </>
        ) : activeTab === 'requests' ? (
            /* --- INCOMING REQUESTS MODE --- */
            <>
                <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest px-4 py-2 mt-2">Incoming Requests</h3>
                {incomingRequests.length === 0 ? (
                    <div className="p-8 text-center">
                        <div className="w-12 h-12 bg-white/5 rounded-full mx-auto mb-3 flex items-center justify-center text-xl grayscale opacity-50">📫</div>
                        <p className="text-gray-500 text-sm">No pending requests.</p>
                    </div>
                ) : (
                    incomingRequests.map(req => (
                        <div key={req.id} className="w-full p-3 flex items-center justify-between rounded-2xl bg-white/5 border border-white/5 mb-2 hover:bg-white/10 transition-colors">
                            <div className="flex items-center gap-3 min-w-0">
                                <div className="w-10 h-10 rounded-full bg-indigo-900/50 border border-indigo-500/30 flex items-center justify-center text-indigo-200 text-xs font-bold shadow-lg shadow-indigo-500/10">
                                    {req.sender.email[0].toUpperCase()}
                                </div>
                                <div className="min-w-0">
                                    <p className="text-sm font-medium text-gray-200 truncate">{req.sender.email}</p>
                                    <p className="text-[10px] text-gray-500">{new Date(req.created_at).toLocaleDateString()}</p>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => acceptRequest(req.id)} className="p-2.5 bg-green-500/20 text-green-400 hover:bg-green-500 hover:text-white rounded-xl transition shadow-lg shadow-green-900/20">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                </button>
                                <button onClick={() => cancelOrRejectRequest(req.id)} className="p-2.5 bg-red-500/20 text-red-400 hover:bg-red-500 hover:text-white rounded-xl transition shadow-lg shadow-red-900/20">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                </button>
                            </div>
                        </div>
                    ))
                )}
                
                {outgoingRequests.length > 0 && (
                    <>
                         <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest px-4 py-2 mt-4">Sent Requests</h3>
                         <div className="px-4 text-xs text-gray-500 italic">
                             You have {outgoingRequests.length} pending sent request{outgoingRequests.length !== 1 ? 's' : ''}.
                         </div>
                    </>
                )}
            </>
        ) : (
            /* --- FRIENDS LIST MODE --- */
            <>
                <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest px-4 py-2 mt-2">My Friends</h3>
                {friends.length === 0 && (
                    <div className="p-8 text-center animate-fade-in">
                        <div className="w-16 h-16 bg-white/5 rounded-full mx-auto mb-4 flex items-center justify-center text-3xl grayscale opacity-30">👻</div>
                        <p className="text-gray-400 font-medium">No friends yet.</p>
                        <p className="text-xs text-gray-600 mt-2 max-w-[200px] mx-auto">Use the search bar above to find and add people to your mesh.</p>
                    </div>
                )}
                {friends.map((user) => {
                    const isOnline = onlineUsers.has(user.id);
                    const isActive = activeId === user.id;
                    
                    return (
                    <button
                        key={user.id}
                        onClick={() => {
                            setActiveId(user.id);
                            onSelectUser(user);
                        }}
                        className={`w-full p-3 flex items-center space-x-3 rounded-2xl transition-all duration-300 text-left group relative overflow-hidden ${
                            isActive 
                            ? 'bg-indigo-600/10 border border-indigo-500/30' 
                            : 'hover:bg-white/5 border border-transparent'
                        }`}
                    >
                        {isActive && <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-500 rounded-l"></div>}
                        
                        <div className="relative shrink-0">
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold transition-colors shadow-lg ${
                                isActive ? 'bg-gradient-to-br from-indigo-500 to-purple-600 shadow-indigo-500/30' : 'bg-gray-800 group-hover:bg-gray-700'
                            }`}>
                            {user.email[0].toUpperCase()}
                            </div>
                            {isOnline && (
                                <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-green-500 rounded-full border-4 border-[#060609]"></div>
                            )}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-center mb-1">
                            <div className="flex items-center gap-1.5 truncate">
                                <p className={`text-base font-bold truncate transition-colors ${isActive ? 'text-white' : 'text-gray-200 group-hover:text-white'}`}>
                                    {user.email.split('@')[0]}
                                </p>
                                {isPenguinUser(user.email) && <span className="text-sm animate-wobble">🐧</span>}
                            </div>
                        </div>
                        <p className={`text-xs truncate font-medium ${isActive ? 'text-indigo-300' : 'text-gray-500 group-hover:text-gray-400'}`}>
                            {isOnline ? 'Active now' : 'Offline'}
                        </p>
                        </div>
                    </button>
                    );
                })}
            </>
        )}
      </div>

      {/* Mobile Bottom Nav */}
      <div className="md:hidden border-t border-white/5 bg-[#060609]/90 backdrop-blur-lg fixed bottom-0 left-0 right-0 z-30 flex justify-around items-center h-16 pb-safe">
            <button 
                onClick={() => { setActiveTab('chats'); setSearchQuery(''); }}
                className={`flex flex-col items-center gap-1 p-2 w-full transition-colors ${activeTab === 'chats' ? 'text-indigo-400' : 'text-gray-600 hover:text-gray-400'}`}
            >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                <span className="text-[10px] font-bold tracking-wide">Chats</span>
            </button>
            <button 
                onClick={onOpenSettings}
                className="flex flex-col items-center gap-1 p-2 w-full text-gray-600 hover:text-white transition-colors"
            >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                <span className="text-[10px] font-bold tracking-wide">Settings</span>
            </button>
      </div>

      {/* Desktop Footer */}
      <div className="hidden md:flex p-4 border-t border-white/5 bg-[#0a0a0f]/50">
        <button
            onClick={onOpenSettings}
            className="w-full py-3 px-4 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 border border-white/5"
        >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            Open Settings
        </button>
      </div>
    </div>
  );
};