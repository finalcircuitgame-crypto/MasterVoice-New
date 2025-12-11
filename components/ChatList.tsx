import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { UserProfile, Group } from '../types';
import { useModal } from './ModalContext';
import { useRouter } from '../hooks/useRouter';

interface ChatListProps {
  currentUser: UserProfile;
  onSelectUser: (user: UserProfile) => void;
  onSelectGroup: (group: Group) => void;
  onlineUsers: Set<string>;
  onOpenSettings: () => void;
}

// Simple time ago formatter
const timeAgo = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (seconds < 60) return 'just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
};

export const ChatList: React.FC<ChatListProps> = ({ currentUser, onSelectUser, onSelectGroup, onlineUsers, onOpenSettings }) => {
  const [activeTab, setActiveTab] = useState<'chats' | 'requests' | 'groups'>('chats');
  const [friends, setFriends] = useState<UserProfile[]>([]);
  const [incomingRequests, setIncomingRequests] = useState<any[]>([]);
  const [outgoingRequests, setOutgoingRequests] = useState<any[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserProfile[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState(false);

  const { showPrompt, showAlert } = useModal();
  const { navigate } = useRouter();

  // --- Initial Tab based on URL ---
  useEffect(() => {
      if (window.location.pathname.includes('/requests')) {
          setActiveTab('requests');
      } else if (window.location.pathname.includes('/groups/')) {
          setActiveTab('groups');
      }
  }, []);

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
    
    // Subscribe to Friend Requests
    const requestsChannel = supabase.channel('realtime:friend_requests')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'friend_requests' }, () => {
            fetchData();
        })
        .subscribe();

    // Subscribe to Groups
    const groupsChannel = supabase.channel('realtime:groups_list')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'groups' }, (payload) => {
            if (payload.new.created_by === currentUser.id) fetchData(); 
        })
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'group_members', filter: `user_id=eq.${currentUser.id}` }, () => {
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
      const isGroupPath = window.location.pathname.startsWith('/conversations/groups/');
      const groupIdPath = isGroupPath ? window.location.pathname.split('/').pop() : null;

      if (userIdParam) setActiveId(userIdParam);
      else if (groupIdPath) { setActiveId(groupIdPath); setActiveTab('groups'); }
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
  const handleTabChange = (tab: 'chats' | 'requests' | 'groups') => {
      setActiveTab(tab);
      setSearchQuery('');
      if (tab === 'requests') navigate('/conversations/requests');
      else if (tab === 'chats') navigate('/conversations');
      else if (tab === 'groups') navigate('/conversations');
  };

  const sendRequest = async (targetId: string) => {
      await supabase.from('friend_requests').insert({ sender_id: currentUser.id, receiver_id: targetId, status: 'pending' });
      setSearchQuery(''); 
      setSearchResults([]);
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
          const { data: group, error } = await supabase.from('groups').insert({ name, created_by: currentUser.id }).select().single();
          if (error) throw error;
          await supabase.from('group_members').insert({ group_id: group.id, user_id: currentUser.id });
          setGroups(prev => [group, ...prev]);
          showAlert("Success", "Group created!");
      } catch (e: any) {
          showAlert("Error", e.message);
      }
  };

  const copyMyId = () => {
      navigator.clipboard.writeText(currentUser.email);
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
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
             <button key={tab.id} onClick={() => handleTabChange(tab.id)} className={`pb-3 text-sm font-bold tracking-wide border-b-2 transition-all whitespace-nowrap flex items-center gap-2 ${activeTab === tab.id ? 'border-indigo-500 text-white' : 'border-transparent text-gray-500 hover:text-gray-300'}`}>
                  {tab.label}
                  {tab.count > 0 && <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-extrabold animate-pulse">{tab.count}</span>}
             </button>
          ))}
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto px-3 space-y-1 pb-20 md:pb-0 pt-2 custom-scrollbar">
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
            <div className="space-y-6 pt-2 pb-10">
                {/* 1. Share Profile Section */}
                <div className="mx-2 mb-4 p-4 rounded-2xl bg-gradient-to-r from-indigo-900/30 to-purple-900/30 border border-indigo-500/20 text-center relative overflow-hidden group">
                    <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <p className="text-xs text-indigo-300 font-bold mb-1">Your ID</p>
                    <p className="text-white text-sm font-mono truncate mb-2">{currentUser.email}</p>
                    <button onClick={copyMyId} className="text-[10px] bg-white/10 hover:bg-white/20 px-3 py-1 rounded-full text-white transition flex items-center gap-1 mx-auto border border-white/5">
                        {copiedId ? <span>✓ Copied</span> : <span>Copy to Share</span>}
                    </button>
                </div>

                {/* 2. Incoming Requests */}
                <div>
                    <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest px-4 py-2 flex items-center gap-2">
                        Incoming <span className={`text-[9px] px-1.5 rounded-full ${incomingRequests.length > 0 ? 'bg-indigo-500 text-white animate-pulse' : 'bg-gray-800 text-gray-500'}`}>{incomingRequests.length}</span>
                    </h3>
                    {incomingRequests.length === 0 && (
                        <div className="px-4 py-6 text-center">
                            <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-2 text-gray-600">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" /></svg>
                            </div>
                            <p className="text-xs text-gray-500">No pending requests</p>
                        </div>
                    )}
                    {incomingRequests.map(req => (
                        <div key={req.id} className="w-full p-3 flex items-center justify-between rounded-2xl bg-white/5 border border-white/5 mb-2 mx-2 hover:bg-white/10 transition animate-fade-in-up group">
                            <div className="flex items-center gap-3 min-w-0">
                                {renderAvatar(req.sender)}
                                <div className="flex flex-col min-w-0">
                                    <span className="text-sm font-bold truncate text-gray-200">{req.sender?.email.split('@')[0]}</span>
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] text-indigo-400 font-medium">Wants to connect</span>
                                        <span className="text-[9px] text-gray-600">• {timeAgo(req.created_at)}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => acceptRequest(req.id)} className="p-2 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500 hover:text-white transition shadow-lg transform hover:scale-110" title="Accept">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                                </button>
                                <button onClick={() => cancelRequest(req.id)} className="p-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500 hover:text-white transition shadow-lg transform hover:scale-110" title="Decline">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                {/* 3. Outgoing Requests */}
                <div>
                    <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest px-4 py-2 flex items-center gap-2">
                        Outgoing <span className="bg-gray-800 text-gray-500 text-[9px] px-1.5 rounded-full">{outgoingRequests.length}</span>
                    </h3>
                    {outgoingRequests.length === 0 && <div className="px-4 text-xs text-gray-600 italic py-2">No sent requests</div>}
                    {outgoingRequests.map(req => (
                        <div key={req.id} className="w-full p-3 flex items-center justify-between rounded-2xl bg-white/5 border border-white/5 mb-2 mx-2 opacity-80 hover:opacity-100 transition animate-fade-in-up">
                            <div className="flex items-center gap-3 min-w-0">
                                <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center text-xs font-bold text-gray-500 border border-dashed border-gray-600">
                                    {req.receiver?.email?.[0]?.toUpperCase()}
                                </div>
                                <div className="flex flex-col min-w-0">
                                    <span className="text-sm font-medium truncate text-gray-300">{req.receiver?.email.split('@')[0]}</span>
                                    <span className="text-[10px] text-gray-500">Sent {timeAgo(req.created_at)}</span>
                                </div>
                            </div>
                            <button onClick={() => cancelRequest(req.id)} className="px-3 py-1.5 bg-white/5 hover:bg-red-500/20 text-xs text-gray-400 hover:text-red-400 rounded-lg transition border border-white/5" title="Cancel Request">
                                Cancel
                            </button>
                        </div>
                    ))}
                </div>
                
                {/* 4. Add Friend Search Section */}
                <div className="px-3 pt-6">
                    <h3 className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-3 ml-1 flex items-center gap-2">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg>
                        Add New Connection
                    </h3>
                    <div className="bg-[#13131a] border border-white/10 rounded-2xl px-4 py-3 flex items-center gap-2 text-sm text-gray-400 focus-within:ring-2 focus-within:ring-indigo-500/50 shadow-inner relative transition-all group focus-within:bg-black/40">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                        <input className="bg-transparent outline-none w-full placeholder-gray-600" placeholder="Search by email..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                        {searchQuery && (
                            <button onClick={() => setSearchQuery('')} className="text-gray-600 hover:text-white"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
                        )}
                    </div>
                    
                    {isSearching && <div className="text-center text-xs text-gray-500 mt-4 flex items-center justify-center gap-2"><div className="w-3 h-3 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div> Searching directory...</div>}
                    
                    <div className="mt-3 space-y-2">
                        {searchResults.length > 0 && searchResults.map(user => (
                            <div key={user.id} className="flex justify-between items-center p-3 bg-white/5 rounded-xl border border-white/5 hover:bg-white/10 transition animate-scale-in">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-gray-700 to-gray-600 flex items-center justify-center text-xs font-bold text-white">{user.email[0].toUpperCase()}</div>
                                    <span className="text-sm text-gray-200 font-medium">{user.email.split('@')[0]}</span>
                                </div>
                                {/* Check if already friend or pending */}
                                {friends.find(f => f.id === user.id) ? (
                                    <span className="text-[10px] text-green-500 font-bold px-2 py-1 bg-green-500/10 rounded-lg flex items-center gap-1"><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg> Connected</span>
                                ) : incomingRequests.find(r => r.sender_id === user.id) ? (
                                    <span className="text-[10px] text-indigo-400 font-bold px-2 py-1 bg-indigo-500/10 rounded-lg">Check Incoming</span>
                                ) : outgoingRequests.find(r => r.receiver_id === user.id) ? (
                                    <span className="text-[10px] text-gray-500 font-bold px-2 py-1 bg-white/5 rounded-lg border border-white/5">Pending</span>
                                ) : (
                                    <button onClick={() => sendRequest(user.id)} className="text-xs bg-indigo-600 hover:bg-indigo-500 px-3 py-1.5 rounded-lg text-white font-bold transition shadow-lg shadow-indigo-600/20 active:scale-95">Add +</button>
                                )}
                            </div>
                        ))}
                        {searchQuery && !isSearching && searchResults.length === 0 && (
                            <div className="text-center text-xs text-gray-600 mt-2 py-4">No users found.</div>
                        )}
                    </div>
                </div>
            </div>
        )}
      </div>
    </div>
  );
};