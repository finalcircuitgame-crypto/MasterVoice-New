import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { UserProfile, FriendRequest, FriendshipStatus, Group } from '../types';
import { useModal } from './ModalContext';
import { useRouter } from '../hooks/useRouter';

interface ChatListProps {
  currentUser: UserProfile;
  onSelectUser: (user: UserProfile) => void;
  onSelectGroup: (group: Group) => void;
  onlineUsers: Set<string>;
  onOpenSettings: () => void;
}

export const ChatList: React.FC<ChatListProps> = ({ currentUser, onSelectUser, onSelectGroup, onlineUsers, onOpenSettings }) => {
  const [activeTab, setActiveTab] = useState<'chats' | 'requests' | 'groups' | 'favorites' | 'archived' | 'files'>('chats');
  const [friends, setFriends] = useState<UserProfile[]>([]);
  const [incomingRequests, setIncomingRequests] = useState<any[]>([]);
  const [outgoingRequests, setOutgoingRequests] = useState<any[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserProfile[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);

  const { showPrompt, showAlert } = useModal();
  const { navigate } = useRouter();

  // --- Data Fetching ---
  const fetchData = async () => {
    // Friends & Requests
    const { data: requestsData } = await supabase.from('friend_requests')
        .select(`*, sender:sender_id(id, email, avatar_url), receiver:receiver_id(id, email, avatar_url)`)
        .or(`sender_id.eq.${currentUser.id},receiver_id.eq.${currentUser.id}`);

    if (requestsData) {
        const acceptedIds = new Set<string>();
        const incoming: any[] = [];
        const outgoing: any[] = [];

        requestsData.forEach((req: any) => {
            if (req.status === 'accepted') {
                acceptedIds.add(req.sender_id === currentUser.id ? req.receiver_id : req.sender_id);
            } else if (req.status === 'pending') {
                if (req.receiver_id === currentUser.id) incoming.push(req);
                else outgoing.push(req);
            }
        });

        setIncomingRequests(incoming);
        setOutgoingRequests(outgoing);

        if (acceptedIds.size > 0) {
            const { data: friendsData } = await supabase.from('profiles').select('*').in('id', Array.from(acceptedIds));
            if (friendsData) setFriends(friendsData);
        } else {
            setFriends([]);
        }
    }

    // Groups
    const { data: groupData } = await supabase.from('groups').select('*').order('created_at', { ascending: false }); 
    if (groupData) setGroups(groupData);
  };

  useEffect(() => {
    fetchData();
    
    // Subscribe to Friend Requests (Both incoming and outgoing events)
    const requestsChannel = supabase.channel('realtime:friend_requests')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'friend_requests' }, () => {
            console.log("Friend request update detected, refreshing...");
            fetchData();
        })
        .subscribe();

    // Subscribe to Groups (New groups added)
    const groupsChannel = supabase.channel('realtime:groups_list')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'groups' }, (payload) => {
            if (payload.new.created_by === currentUser.id) fetchData(); // We already add optimistic, but this confirms
        })
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'group_members', filter: `user_id=eq.${currentUser.id}` }, () => {
            // Someone added me to a group
            fetchData();
        })
        .subscribe();

    return () => { 
        supabase.removeChannel(requestsChannel); 
        supabase.removeChannel(groupsChannel);
    };
  }, [currentUser.id]);

  // --- Sync Active ID from URL ---
  useEffect(() => {
      const params = new URLSearchParams(window.location.search);
      const userIdParam = params.get('userId');
      // For groups, we check the path
      const isGroupPath = window.location.pathname.startsWith('/conversations/groups/');
      const groupIdPath = isGroupPath ? window.location.pathname.split('/').pop() : null;

      if (userIdParam) setActiveId(userIdParam);
      else if (groupIdPath) setActiveId(groupIdPath);
      else setActiveId(null);
  }, [window.location.search, window.location.pathname]);

  // --- Search Logic ---
  useEffect(() => {
      if (!searchQuery.trim()) { setSearchResults([]); return; }
      const timer = setTimeout(async () => {
          setIsSearching(true);
          const { data } = await supabase.from('profiles').select('*').ilike('email', `%${searchQuery}%`).neq('id', currentUser.id).limit(10);
          if (data) setSearchResults(data);
          setIsSearching(false);
      }, 300);
      return () => clearTimeout(timer);
  }, [searchQuery, currentUser.id]);

  // --- Actions ---
  const sendRequest = async (targetId: string) => {
      // Optimistic UI update could go here, but realtime is fast enough usually
      await supabase.from('friend_requests').insert({ sender_id: currentUser.id, receiver_id: targetId, status: 'pending' });
  };
  
  const acceptRequest = async (id: string) => {
      await supabase.from('friend_requests').update({ status: 'accepted' }).eq('id', id);
  };
  
  const cancelRequest = async (id: string) => {
      await supabase.from('friend_requests').delete().eq('id', id);
  };

  const createGroup = async () => {
      const name = await showPrompt("New Group", "Enter a name for your group:", "e.g. Project Alpha");
      if (!name) return;
      try {
          // RLS ensures we can only create if auth.uid is sent as created_by
          const { data: group, error } = await supabase.from('groups').insert({ name, created_by: currentUser.id }).select().single();
          if (error) throw error;
          
          // Add self as member
          await supabase.from('group_members').insert({ group_id: group.id, user_id: currentUser.id });
          
          setGroups(prev => [group, ...prev]);
          showAlert("Success", "Group created!");
      } catch (e: any) {
          showAlert("Error", e.message);
      }
  };

  const renderAvatar = (user: any) => {
      if (user?.avatar_url) return <img src={user.avatar_url} className="w-10 h-10 rounded-full object-cover border border-white/10" />;
      return <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center text-white text-sm font-bold border border-white/5">{user?.email?.[0].toUpperCase() || '?'}</div>;
  };

  return (
    <div className="w-full md:w-80 bg-[#060609] md:bg-[#060609]/95 md:backdrop-blur-xl md:border-r border-white/5 flex flex-col h-full font-['Outfit'] relative z-20 shadow-2xl overflow-hidden">
      {/* Header */}
      <div className="p-6 bg-gradient-to-b from-white/5 to-transparent border-b border-white/5 flex items-center justify-between shrink-0">
        <div><h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2"><div className="w-2 h-6 bg-indigo-500 rounded-full"></div>MasterVoice</h1><p className="text-xs text-gray-500 ml-4 font-medium tracking-wide">SECURE P2P MESH</p></div>
        <button onClick={onOpenSettings} className="rounded-full bg-white/5 border border-white/10 hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition active:scale-95 shadow-lg overflow-hidden">{renderAvatar(currentUser)}</button>
      </div>
      
      {/* Tabs */}
      <div className="flex px-4 pt-4 gap-4 overflow-x-auto no-scrollbar shrink-0 border-b border-white/5 pb-0">
          {[{ id: 'chats', label: 'Chats' }, { id: 'groups', label: 'Groups' }, { id: 'requests', label: 'Requests', count: incomingRequests.length }].map((tab: any) => (
             <button key={tab.id} onClick={() => { setActiveTab(tab.id); setSearchQuery(''); }} className={`pb-3 text-sm font-bold tracking-wide border-b-2 transition-all whitespace-nowrap flex items-center gap-2 ${activeTab === tab.id ? 'border-indigo-500 text-white' : 'border-transparent text-gray-500 hover:text-gray-300'}`}>
                  {tab.label}
                  {tab.count > 0 && <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-extrabold animate-pulse">{tab.count}</span>}
             </button>
          ))}
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto px-3 space-y-1 pb-20 md:pb-0 pt-2">
        {activeTab === 'chats' && (
            <>
                <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest px-4 py-2 mt-2">Friends</h3>
                {friends.length === 0 && <div className="p-8 text-center text-gray-500 text-xs">No friends yet. Add some requests!</div>}
                {friends.map((user) => (
                    <button key={user.id} onClick={() => { setActiveId(user.id); onSelectUser(user); }} className={`w-full p-3 flex items-center space-x-3 rounded-2xl transition-all duration-300 text-left group relative overflow-hidden ${activeId === user.id ? 'bg-indigo-600/10 border border-indigo-500/30' : 'hover:bg-white/5 border border-transparent'}`}>
                        {activeId === user.id && <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-500 rounded-l"></div>}
                        <div className="relative shrink-0">{renderAvatar(user)} {onlineUsers.has(user.id) && <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-[#060609]"></div>}</div>
                        <div className="flex-1 min-w-0"><p className={`text-sm font-bold truncate ${activeId === user.id ? 'text-white' : 'text-gray-200'}`}>{user.email.split('@')[0]}</p><p className="text-[10px] text-gray-500">{onlineUsers.has(user.id) ? 'Online' : 'Offline'}</p></div>
                    </button>
                ))}
            </>
        )}

        {activeTab === 'groups' && (
             <>
                <div className="px-3 py-2 flex justify-between items-center"><h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Groups</h3><button onClick={createGroup} className="text-xs bg-indigo-600 hover:bg-indigo-500 px-3 py-1.5 rounded-lg text-white font-bold transition">+ New</button></div>
                {groups.length === 0 && <div className="p-8 text-center text-gray-500 text-xs">No groups created.</div>}
                {groups.map(group => (
                    <button key={group.id} onClick={() => { setActiveId(group.id); navigate(`/conversations/groups/${group.id}`); onSelectGroup(group); }} className={`w-full p-3 flex items-center space-x-3 rounded-2xl transition-all duration-300 text-left group relative overflow-hidden ${activeId === group.id ? 'bg-indigo-600/10 border border-indigo-500/30' : 'hover:bg-white/5 border border-transparent'}`}>
                        {activeId === group.id && <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-500 rounded-l"></div>}
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white font-bold shadow-lg shrink-0">{group.name[0].toUpperCase()}</div>
                        <div className="min-w-0"><p className={`text-sm font-medium truncate ${activeId === group.id ? 'text-white' : 'text-gray-200'}`}>{group.name}</p><p className="text-[10px] text-gray-500">Group Chat</p></div>
                    </button>
                ))}
             </>
        )}

        {activeTab === 'requests' && (
            <>
                <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest px-4 py-2 mt-2">Pending ({incomingRequests.length})</h3>
                {incomingRequests.map(req => (
                    <div key={req.id} className="w-full p-3 flex items-center justify-between rounded-2xl bg-white/5 border border-white/5 mb-2">
                        <div className="flex items-center gap-2 min-w-0">{renderAvatar(req.sender)}<span className="text-sm font-medium truncate text-gray-300">{req.sender?.email}</span></div>
                        <div className="flex gap-1"><button onClick={() => acceptRequest(req.id)} className="p-2 bg-green-500/20 text-green-400 rounded-lg">✓</button><button onClick={() => cancelRequest(req.id)} className="p-2 bg-red-500/20 text-red-400 rounded-lg">✕</button></div>
                    </div>
                ))}
                
                {/* Search for new friends here as well */}
                <div className="mt-4 px-2">
                    <div className="bg-[#13131a] border border-white/5 rounded-2xl px-4 py-2 flex items-center gap-2 text-sm text-gray-400 focus-within:ring-2 focus-within:ring-indigo-500/50">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                        <input className="bg-transparent outline-none w-full" placeholder="Find people..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                    </div>
                    {isSearching && <div className="text-center text-xs text-gray-500 mt-2">Searching...</div>}
                    {searchResults.length > 0 && searchResults.map(user => (
                        <div key={user.id} className="flex justify-between items-center p-2 mt-2 bg-white/5 rounded-xl">
                            <span className="text-sm text-gray-300">{user.email}</span>
                            {/* Check if already friend or pending */}
                            {friends.find(f => f.id === user.id) ? (
                                <span className="text-xs text-gray-500">Added</span>
                            ) : incomingRequests.find(r => r.sender_id === user.id) || outgoingRequests.find(r => r.receiver_id === user.id) ? (
                                <span className="text-xs text-gray-500">Pending</span>
                            ) : (
                                <button onClick={() => { sendRequest(user.id); setSearchQuery(''); setSearchResults([]); }} className="text-xs bg-indigo-600 px-2 py-1 rounded text-white">Add</button>
                            )}
                        </div>
                    ))}
                </div>
            </>
        )}
      </div>
    </div>
  );
};