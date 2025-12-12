import React, { useEffect, useState, useRef } from 'react';
import { supabase } from '../supabaseClient';
import { Message, UserProfile, Group } from '../types';
import { useModal } from './ModalContext';
import { useRouter } from '../hooks/useRouter';

// --- Confetti Utility ---
const triggerConfetti = () => {
    const colors = ['#6366f1', '#a855f7', '#ec4899', '#ffffff', '#fbbf24', '#22c55e'];
    for (let i = 0; i < 60; i++) {
        const el = document.createElement('div');
        el.style.position = 'fixed';
        el.style.left = '50%';
        el.style.top = '50%';
        el.style.width = '8px';
        el.style.height = '8px';
        el.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        el.style.borderRadius = Math.random() > 0.5 ? '50%' : '2px';
        el.style.zIndex = '9999';
        el.style.pointerEvents = 'none';
        document.body.appendChild(el);

        const angle = Math.random() * Math.PI * 2;
        const velocity = 8 + Math.random() * 12;
        const tx = Math.cos(angle) * velocity * 25;
        const ty = Math.sin(angle) * velocity * 25;
        const rot = Math.random() * 360;

        el.animate([
            { transform: 'translate(0, 0) rotate(0deg) scale(1)', opacity: 1 },
            { transform: `translate(${tx}px, ${ty}px) rotate(${rot}deg) scale(0)`, opacity: 0 }
        ], {
            duration: 1200 + Math.random() * 600,
            easing: 'cubic-bezier(0.25, 1, 0.5, 1)'
        }).onfinish = () => el.remove();
    }
};

interface GroupWindowProps {
    currentUser: UserProfile;
    selectedGroup: Group;
    onlineUsers: Set<string>;
}

// Emoji Source
const EMOJI_SOURCE_URL = 'https://cdn.jsdelivr.net/npm/emoji-datasource-apple/emoji.json';
const DEFAULT_EMOJI_LIST = ["👍", "👎", "❤️", "🔥", "😂", "😢", "😮", "😡", "🎉", "👀"];

const MessageItem = React.memo<{
    msg: Message;
    isMe: boolean;
    currentUser: UserProfile;
    onReaction: (msg: Message, emoji: string) => void;
    onEdit: (msg: Message) => void;
    onDelete: (id: string) => void;
    availableEmojis: string[];
    onRetry?: (msg: Message) => void;
}>(({ msg, isMe, currentUser, onReaction, onEdit, onDelete, availableEmojis, onRetry }) => {
    const [showActions, setShowActions] = useState(false);
    
    const senderName = isMe ? 'You' : (msg.sender?.email?.split('@')[0] || 'Unknown');
    const senderAvatar = msg.sender?.avatar_url;
    const senderInitial = msg.sender?.email ? msg.sender.email[0].toUpperCase() : '?';

    const hasReacted = (emoji: string) => msg.reactions?.[emoji]?.includes(currentUser.id);
    const isSending = msg.status === 'sending';
    const isError = msg.status === 'error';
    const isRecentlyEdited = msg.updated_at && msg.created_at && new Date(msg.updated_at).getTime() > new Date(msg.created_at).getTime() + 1000;

    return (
        <div className={`w-full flex ${isMe ? 'justify-end' : 'justify-start'} mb-6 animate-message-enter px-2 group`}>
            <div className={`flex flex-col max-w-[85%] md:max-w-[70%] ${isMe ? 'items-end' : 'items-start'}`}>
                <div className={`flex items-end gap-3 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                    {!isMe && (
                        <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center text-xs text-gray-300 font-bold shrink-0 mb-1 border border-white/10 shadow-sm overflow-hidden" title={senderName}>
                            {senderAvatar ? <img src={senderAvatar} alt="Sender" className="w-full h-full object-cover" /> : senderInitial}
                        </div>
                    )}

                    <div className="flex flex-col min-w-0 cursor-pointer relative" onClick={() => setShowActions(!showActions)}>
                        {!isMe && <span className="text-[10px] text-gray-500 ml-1 mb-1 font-bold">{senderName}</span>}
                        
                        {/* Action Menu */}
                        {showActions && !isError && (
                            <div className={`absolute -top-12 ${isMe ? 'right-0' : 'left-0'} bg-[#1a1a20] border border-white/10 rounded-xl p-1 flex gap-1 shadow-xl z-20 animate-scale-in`}>
                                {availableEmojis.slice(0, 5).map(emoji => (
                                    <button key={emoji} onClick={(e) => { e.stopPropagation(); onReaction(msg, emoji); setShowActions(false); }} className="hover:bg-white/10 p-1 rounded transition text-sm">
                                        {emoji}
                                    </button>
                                ))}
                                {isMe && (
                                    <>
                                        <div className="w-px bg-white/10 mx-1"></div>
                                        <button onClick={(e) => { e.stopPropagation(); onEdit(msg); setShowActions(false); }} className="hover:bg-white/10 p-1.5 rounded transition text-gray-400" title="Edit">✏️</button>
                                        <button onClick={(e) => { e.stopPropagation(); onDelete(msg.id); }} className="hover:bg-white/10 p-1.5 rounded transition text-red-400" title="Delete">🗑️</button>
                                    </>
                                )}
                            </div>
                        )}

                        <div className={`relative px-5 py-3 shadow-md backdrop-blur-md ${isMe ? 'bg-gradient-to-br from-indigo-600 to-violet-600 text-white rounded-[1.2rem] rounded-br-sm' : 'bg-white/10 text-gray-100 rounded-[1.2rem] rounded-bl-sm border border-white/5'} ${isError ? 'border-red-500 bg-red-900/10' : ''}`}>
                            {msg.content && <p className="leading-relaxed whitespace-pre-wrap break-words text-[15px]">{msg.content}</p>}
                            <div className={`flex items-center justify-end mt-1.5 gap-1.5 ${isMe ? 'text-indigo-200/80' : 'text-gray-400'}`}>
                                {isError ? (
                                    <span className="text-red-300 text-[10px] font-bold flex items-center gap-1 cursor-pointer hover:underline" onClick={(e) => { e.stopPropagation(); onRetry?.(msg); }}>
                                        Failed <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                                    </span>
                                ) : isSending ? (
                                    <span className="text-white/50 text-[10px]">Sending...</span>
                                ) : (
                                    <div className="flex items-center gap-2">
                                        <p className="text-[10px] font-medium">{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                        {isRecentlyEdited && <span className="text-[9px] italic opacity-70">edited</span>}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Reactions Display */}
                        {msg.reactions && Object.keys(msg.reactions).some(k => (msg.reactions![k] as string[]).length > 0) && (
                            <div className={`flex gap-1 mt-1 ${isMe ? 'justify-end' : 'justify-start'}`}>
                                {Object.entries(msg.reactions).map(([emoji, users]) => (
                                    (users as string[]).length > 0 && (
                                        <button key={emoji} className={`px-1.5 py-0.5 rounded-full text-[10px] border flex items-center gap-1 ${hasReacted(emoji) ? 'bg-indigo-500/20 border-indigo-500/30 text-indigo-300' : 'bg-gray-800/50 border-white/5 text-gray-400'}`}>
                                            <span>{emoji}</span><span className="font-bold">{(users as string[]).length}</span>
                                        </button>
                                    )
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
});

export const GroupWindow: React.FC<GroupWindowProps> = ({ currentUser, selectedGroup, onlineUsers }) => {
    const { navigate } = useRouter();
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [emojiList, setEmojiList] = useState<string[]>(DEFAULT_EMOJI_LIST);
    const [showAddMemberModal, setShowAddMemberModal] = useState(false);
    const [groupMembers, setGroupMembers] = useState<UserProfile[]>([]);
    const [friends, setFriends] = useState<UserProfile[]>([]);
    const [addingMember, setAddingMember] = useState(false);
    const [showMobileSidebar, setShowMobileSidebar] = useState(false);
    
    // Feature: Edit Group Name
    const [groupName, setGroupName] = useState(selectedGroup.name);
    const [isEditingName, setIsEditingName] = useState(false);
    const [showGroupSettings, setShowGroupSettings] = useState(false);

    // Feature: Message Editing
    const [editingId, setEditingId] = useState<string | null>(null);

    // Feature: Typing Indicators
    const [remoteDrafts, setRemoteDrafts] = useState<Record<string, string>>({});
    const typingTimeouts = useRef<Record<string, NodeJS.Timeout>>({});
    const lastTypingBroadcast = useRef<number>(0);
    const [groupChannel, setGroupChannel] = useState<any>(null);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const { showAlert, showConfirm } = useModal();

    // Owner Check
    const isOwner = selectedGroup.created_by === currentUser.id;

    // Load Emojis
    useEffect(() => {
        fetch(EMOJI_SOURCE_URL).then(res => res.json()).then(data => {
            if (Array.isArray(data)) setEmojiList(data.map((i:any) => i.char || i).filter(Boolean).slice(0, 100));
        }).catch(() => {});
    }, []);

    // Load Group Data & Setup Realtime
    useEffect(() => {
        setGroupName(selectedGroup.name);
        
        const fetchMessages = async () => {
            setLoading(true);
            const { data } = await supabase.from('messages')
                .select('*, sender:sender_id(email, avatar_url)')
                .eq('group_id', selectedGroup.id)
                .order('created_at', { ascending: true });
            if (data) setMessages(data.map(m => ({ ...m, status: 'sent' })));
            setLoading(false);
        };
        fetchMessages();

        const channel = supabase.channel(`group:${selectedGroup.id}`)
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `group_id=eq.${selectedGroup.id}` }, async (payload) => {
                // Skip if we already added it optimistically
                setMessages(prev => {
                    if (prev.find(m => m.id === payload.new.id)) return prev;
                    return prev; 
                });

                // Fetch sender details for incoming messages from others
                if (payload.new.sender_id !== currentUser.id) {
                     const { data } = await supabase.from('profiles').select('email, avatar_url').eq('id', payload.new.sender_id).single();
                     setMessages(prev => [...prev, { ...payload.new, sender: data, status: 'sent' } as Message]);
                     setRemoteDrafts(prev => { const n = {...prev}; delete n[payload.new.sender_id]; return n; });
                }
            })
            // Realtime Update (Reactions/Edits)
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'messages', filter: `group_id=eq.${selectedGroup.id}` }, (payload) => {
                 setMessages(prev => prev.map(m => m.id === payload.new.id ? { ...m, ...payload.new } : m));
            })
            // Realtime Delete
            .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'messages', filter: `group_id=eq.${selectedGroup.id}` }, (payload) => {
                 setMessages(prev => prev.filter(m => m.id !== payload.old.id));
            })
            // Realtime listener for member additions
            .on('postgres_changes', { event: '*', schema: 'public', table: 'group_members', filter: `group_id=eq.${selectedGroup.id}` }, () => {
                fetchMembers(); // Reload members if someone else adds one or leaves
            })
            // Realtime Group Name updates
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'groups', filter: `id=eq.${selectedGroup.id}` }, (payload) => {
                setGroupName(payload.new.name);
            })
            // Feature: Typing Indicators Broadcast
            .on('broadcast', { event: 'typing' }, ({ payload }) => {
                if (payload.userId === currentUser.id) return;
                
                if (typingTimeouts.current[payload.userId]) clearTimeout(typingTimeouts.current[payload.userId]);
                
                if (payload.content) {
                    setRemoteDrafts(prev => ({ ...prev, [payload.userId]: payload.content }));
                    typingTimeouts.current[payload.userId] = setTimeout(() => {
                        setRemoteDrafts(prev => { const n = {...prev}; delete n[payload.userId]; return n; });
                    }, 3000);
                } else {
                    setRemoteDrafts(prev => { const n = {...prev}; delete n[payload.userId]; return n; });
                }
            })
            .subscribe();

        setGroupChannel(channel);
        // Initial member load
        fetchMembers();

        return () => { supabase.removeChannel(channel); };
    }, [selectedGroup.id, currentUser.id]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages.length, remoteDrafts]);

    const fetchMembers = async () => {
        const { data: memberRows, error } = await supabase.from('group_members').select('user_id').eq('group_id', selectedGroup.id);
        if (error) { console.error("Error fetching group members:", error); return; }

        if (memberRows) {
            const { data: profiles } = await supabase.from('profiles').select('*').in('id', memberRows.map(m => m.user_id));
            if (profiles) setGroupMembers(profiles);
        }
    };

    const fetchFriendsToAdd = async () => {
        // 1. Get friends
        const { data: requests } = await supabase.from('friend_requests').select('sender_id, receiver_id').eq('status', 'accepted')
            .or(`sender_id.eq.${currentUser.id},receiver_id.eq.${currentUser.id}`);
        const friendIds = new Set<string>();
        requests?.forEach(req => friendIds.add(req.sender_id === currentUser.id ? req.receiver_id : req.sender_id));

        if (friendIds.size === 0) { setFriends([]); return; }

        // 2. Exclude current members
        const { data: current } = await supabase.from('group_members').select('user_id').eq('group_id', selectedGroup.id);
        const currentIds = new Set(current?.map(m => m.user_id));
        const available = Array.from(friendIds).filter(id => !currentIds.has(id));

        if (available.length > 0) {
            const { data } = await supabase.from('profiles').select('*').in('id', available);
            setFriends(data || []);
        } else {
            setFriends([]);
        }
    };

    const handleAddMember = async (userId: string) => {
        setAddingMember(true);
        const { error } = await supabase.from('group_members').insert({ group_id: selectedGroup.id, user_id: userId });
        
        if (!error) {
            setFriends(prev => prev.filter(f => f.id !== userId));
            showAlert("Success", "Member added!");
            fetchMembers();
        } else {
            if (error.code === '23505') {
                 showAlert("Member Exists", "This user is already in the group.");
                 setFriends(prev => prev.filter(f => f.id !== userId));
                 fetchMembers();
            } else {
                 showAlert("Error", "Failed to add member: " + error.message);
            }
        }
        setAddingMember(false);
    };

    const handleRemoveMember = async (userId: string) => {
        const confirmed = await showConfirm("Remove Member", "Are you sure you want to remove this user?");
        if (!confirmed) return;
        
        const { error } = await supabase.from('group_members').delete().match({ group_id: selectedGroup.id, user_id: userId });
        if (error) {
            showAlert("Error", "Failed to remove member: " + error.message);
        }
    };

    // Feature: Group Rename
    const handleRenameGroup = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsEditingName(false);
        const trimmed = groupName.trim();
        
        if (!trimmed) {
            setGroupName(selectedGroup.name);
            return;
        }
        
        if (trimmed === selectedGroup.name) return;
        
        const { error } = await supabase.from('groups').update({ name: trimmed }).eq('id', selectedGroup.id);
        if (error) {
            showAlert("Error", "Failed to update group name.");
            setGroupName(selectedGroup.name);
        }
    };

    // Feature: Leave Group
    const handleLeaveGroup = async () => {
        const confirmed = await showConfirm("Leave Group", "Are you sure you want to leave this group? You won't be able to rejoin unless invited.");
        if (confirmed) {
            const { error } = await supabase.from('group_members').delete().match({ group_id: selectedGroup.id, user_id: currentUser.id });
            if (!error) {
                navigate('/conversations');
            } else {
                showAlert("Error", "Failed to leave group: " + error.message);
            }
        }
    };

    // Feature: Delete Group
    const handleDeleteGroup = async () => {
        const confirmed = await showConfirm("Delete Group", "Are you sure? This will delete the group and all messages for everyone. This action cannot be undone.", "Delete Forever");
        if (confirmed) {
            const { error } = await supabase.from('groups').delete().eq('id', selectedGroup.id);
            if (!error) {
                navigate('/conversations');
            } else {
                showAlert("Error", "Failed to delete group: " + error.message);
            }
        }
    };

    const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setNewMessage(val);
        const now = Date.now();
        if (now - lastTypingBroadcast.current > 200) {
            groupChannel?.send({ type: 'broadcast', event: 'typing', payload: { userId: currentUser.id, content: val } });
            lastTypingBroadcast.current = now;
        }
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim()) return;
        const content = newMessage;
        setNewMessage('');
        
        if (editingId) {
            // Edit Existing Message
            const { error } = await supabase.from('messages').update({ content, updated_at: new Date().toISOString() }).eq('id', editingId);
            if (error) showAlert("Error", "Failed to update message.");
            setEditingId(null);
            return;
        }

        // Send New Message
        const tempId = Math.random().toString();
        const optimisticMsg: Message = { 
            id: tempId, 
            sender_id: currentUser.id, 
            group_id: selectedGroup.id, 
            content, 
            created_at: new Date().toISOString(),
            status: 'sending',
            sender: { email: currentUser.email, avatar_url: currentUser.avatar_url } 
        };
        
        setMessages(prev => [...prev, optimisticMsg]);

        const { data, error } = await supabase.from('messages').insert({
            sender_id: currentUser.id,
            group_id: selectedGroup.id,
            receiver_id: null, 
            content
        }).select().single();

        if (error) {
            console.error("Group message failed:", error);
            setMessages(prev => prev.map(m => m.id === tempId ? { ...m, status: 'error' } : m));
        } else {
            setMessages(prev => prev.map(m => m.id === tempId ? { ...data, sender: optimisticMsg.sender, status: 'sent' } : m));
        }
    };

    // Feature: Delete Message
    const handleDeleteMessage = async (id: string) => {
        const { error } = await supabase.from('messages').delete().eq('id', id);
        if (error) {
            console.error("Delete failed", error);
            showAlert("Error", "Could not delete message.");
        }
    };

    const handleRetry = async (msg: Message) => {
        setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, status: 'sending' } : m));
        const { data, error } = await supabase.from('messages').insert({
            sender_id: currentUser.id,
            group_id: selectedGroup.id,
            receiver_id: null,
            content: msg.content
        }).select().single();

        if (error) {
            setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, status: 'error' } : m));
        } else {
            setMessages(prev => prev.map(m => m.id === msg.id ? { ...data, sender: msg.sender, status: 'sent' } : m));
        }
    };

    const handleReaction = async (msg: Message, emoji: string) => {
        const current = msg.reactions || {};
        const users = current[emoji] || [];
        const updated = users.includes(currentUser.id) 
            ? users.filter(u => u !== currentUser.id) 
            : [...users, currentUser.id];
        
        const newReactions = { ...current, [emoji]: updated };
        if (updated.length === 0) delete newReactions[emoji];

        setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, reactions: newReactions } : m));
        await supabase.from('messages').update({ reactions: newReactions }).eq('id', msg.id);
    };

    // --- Sidebar Logic ---
    const onlineMembers = groupMembers.filter(m => onlineUsers.has(m.id));
    const offlineMembers = groupMembers.filter(m => !onlineUsers.has(m.id));

    const renderMember = (m: UserProfile, isOnline: boolean) => (
        <div key={m.id} className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/5 transition group cursor-default justify-between">
            <div className="flex items-center gap-3 min-w-0">
                <div className="relative shrink-0">
                    {m.avatar_url ? (
                        <img src={m.avatar_url} className="w-8 h-8 rounded-full object-cover border border-white/10" />
                    ) : (
                        <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-xs font-bold text-white border border-white/10">
                            {m.email[0].toUpperCase()}
                        </div>
                    )}
                    <div className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-[#060609] ${isOnline ? 'bg-green-500' : 'bg-gray-500'}`}></div>
                </div>
                <div className="flex flex-col min-w-0">
                    <span className="text-sm text-gray-200 font-medium truncate group-hover:text-white transition-colors flex items-center gap-1">
                        {m.email.split('@')[0]}
                        {/* Feature: Owner Badge */}
                        {m.id === selectedGroup.created_by && <span className="text-yellow-500 text-[10px]" title="Owner">👑</span>}
                    </span>
                    {isOnline && <span className="text-[9px] text-green-500 font-bold uppercase tracking-wider">Online</span>}
                </div>
            </div>
            {isOwner && m.id !== currentUser.id && (
                <button 
                    onClick={(e) => { e.stopPropagation(); handleRemoveMember(m.id); }}
                    className="opacity-0 group-hover:opacity-100 p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition"
                    title="Remove Member"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
            )}
        </div>
    );

    return (
        <div className="flex flex-row h-full bg-[#030014] relative font-['Outfit'] overflow-hidden">
            
            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0 h-full relative z-0">
                {/* Header */}
                <div className="px-6 py-4 flex justify-between items-center bg-[#030014]/60 backdrop-blur-xl border-b border-white/5 sticky top-0 z-20 shadow-sm shrink-0">
                    <div className="flex items-center gap-4 min-w-0 flex-1">
                        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-lg shrink-0">
                            {groupName?.[0]?.toUpperCase() || '?'}
                        </div>
                        <div className="min-w-0 flex-1">
                            {isEditingName ? (
                                <form onSubmit={handleRenameGroup} className="flex items-center gap-2">
                                    <input 
                                        type="text" 
                                        value={groupName} 
                                        onChange={(e) => setGroupName(e.target.value)}
                                        className="bg-black/50 border border-white/20 text-white px-2 py-1 rounded text-sm font-bold w-full focus:outline-none focus:border-indigo-500"
                                        autoFocus
                                        onBlur={handleRenameGroup}
                                    />
                                </form>
                            ) : (
                                <div className="flex items-center gap-2 group">
                                    <h2 className="font-bold text-white text-lg tracking-tight truncate cursor-default">{groupName}</h2>
                                    {isOwner && (
                                        <button onClick={() => setIsEditingName(true)} className="opacity-0 group-hover:opacity-100 text-gray-500 hover:text-white transition">
                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                        </button>
                                    )}
                                </div>
                            )}
                            <div className="flex items-center gap-3">
                                <span className="text-xs text-indigo-400 font-medium">Group Chat</span>
                                <button onClick={() => setShowMobileSidebar(true)} className="md:hidden text-[10px] text-gray-400 hover:text-white flex items-center gap-1 bg-white/5 px-2 py-0.5 rounded-full border border-white/5">
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                                    <span>{groupMembers.length}</span>
                                </button>
                            </div>
                        </div>
                    </div>
                    
                    {/* Settings Dropdown */}
                    <div className="relative">
                        <button onClick={() => setShowGroupSettings(!showGroupSettings)} className="p-2 bg-white/10 hover:bg-white/20 rounded-lg text-white transition text-xs font-bold flex items-center gap-1 shrink-0">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" /></svg>
                        </button>
                        {showGroupSettings && (
                            <div className="absolute right-0 top-12 bg-[#1a1a20] border border-white/10 rounded-xl shadow-2xl p-1 z-30 min-w-[160px] animate-scale-in">
                                <button onClick={() => { setShowGroupSettings(false); setShowAddMemberModal(true); fetchFriendsToAdd(); }} className="w-full text-left px-3 py-2 hover:bg-white/10 rounded-lg text-sm text-gray-300 hover:text-white flex items-center gap-2">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg> Add Member
                                </button>
                                {isOwner ? (
                                    <button onClick={() => { setShowGroupSettings(false); handleDeleteGroup(); }} className="w-full text-left px-3 py-2 hover:bg-red-500/20 rounded-lg text-sm text-red-400 flex items-center gap-2">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg> Delete Group
                                    </button>
                                ) : (
                                    <button onClick={() => { setShowGroupSettings(false); handleLeaveGroup(); }} className="w-full text-left px-3 py-2 hover:bg-red-500/20 rounded-lg text-sm text-red-400 flex items-center gap-2">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg> Leave Group
                                    </button>
                                )}
                            </div>
                        )}
                        {showGroupSettings && <div className="fixed inset-0 z-20" onClick={() => setShowGroupSettings(false)}></div>}
                    </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-2 no-scrollbar">
                    {loading ? (
                        <div className="flex justify-center h-full items-center"><div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div></div>
                    ) : (
                        messages.map(msg => (
                            <MessageItem 
                                key={msg.id} 
                                msg={msg} 
                                isMe={msg.sender_id === currentUser.id} 
                                currentUser={currentUser} 
                                onReaction={handleReaction} 
                                onEdit={(m) => { setEditingId(m.id); setNewMessage(m.content); }}
                                onDelete={handleDeleteMessage}
                                availableEmojis={emojiList} 
                                onRetry={handleRetry}
                            />
                        ))
                    )}
                    
                    {/* Feature: Typing Indicators */}
                    {Object.keys(remoteDrafts).length > 0 && (
                        <div className="px-4 py-2 text-xs text-gray-500 italic flex items-center gap-1 animate-fade-in">
                            <div className="w-1 h-1 bg-gray-500 rounded-full animate-bounce"></div>
                            <div className="w-1 h-1 bg-gray-500 rounded-full animate-bounce delay-75"></div>
                            <div className="w-1 h-1 bg-gray-500 rounded-full animate-bounce delay-150"></div>
                            <span className="ml-1">Someone is typing...</span>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <div className="p-4 pb-safe bg-[#030014]/80 backdrop-blur-md shrink-0">
                    <div className="max-w-4xl mx-auto flex flex-col gap-2">
                        {editingId && (
                            <div className="flex items-center justify-between bg-gray-800/50 p-2 px-4 rounded-lg text-xs text-gray-300 animate-slide-up">
                                <span>Editing message</span>
                                <button onClick={() => { setEditingId(null); setNewMessage(''); }} className="hover:text-white">Cancel</button>
                            </div>
                        )}
                        <form onSubmit={handleSendMessage} className="flex items-center gap-2 bg-[#13131a] border border-white/10 p-1.5 pl-4 rounded-full shadow-2xl">
                            <input 
                                type="text" 
                                value={newMessage} 
                                onChange={handleInput}
                                className="flex-1 bg-transparent text-white px-2 py-3 focus:outline-none placeholder-gray-600 text-[15px]" 
                                placeholder={`Message ${groupName}...`} 
                            />
                            <button type="submit" disabled={!newMessage.trim()} className="p-2.5 rounded-full bg-gradient-to-r from-indigo-600 to-fuchsia-600 text-white font-bold transition shadow-lg disabled:opacity-50 hover:scale-105 active:scale-95">
                                {editingId ? 'Save' : <svg className="w-5 h-5 ml-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 5l7 7-7 7M5 5l7 7-7 7" /></svg>}
                            </button>
                        </form>
                    </div>
                </div>
            </div>

            {/* Right Sidebar */}
            <div className={`
                fixed inset-y-0 right-0 z-40 w-72 bg-[#060609] border-l border-white/5 flex flex-col shrink-0 transition-transform duration-300 shadow-2xl
                md:relative md:translate-x-0 md:shadow-none
                ${showMobileSidebar ? 'translate-x-0' : 'translate-x-full md:translate-x-0'}
            `}>
                <div className="h-[73px] flex items-center justify-between px-6 border-b border-white/5 shrink-0">
                    <h3 className="font-bold text-gray-400 text-xs uppercase tracking-wider flex items-center gap-2">
                        Members <span className="bg-white/10 px-1.5 py-0.5 rounded-full text-white">{groupMembers.length}</span>
                    </h3>
                    <button onClick={() => setShowMobileSidebar(false)} className="md:hidden text-gray-400 hover:text-white bg-white/5 p-1 rounded-lg">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 custom-scrollbar space-y-6">
                    <div>
                        <div className="px-2 mb-2 flex items-center gap-2 text-[10px] font-bold text-gray-500 uppercase">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                            Online — {onlineMembers.length}
                        </div>
                        <div className="space-y-1">
                            {onlineMembers.length > 0 ? onlineMembers.map(m => renderMember(m, true)) : <div className="px-2 text-xs text-gray-600 italic">No one online</div>}
                        </div>
                    </div>
                    <div>
                        <div className="px-2 mb-2 flex items-center gap-2 text-[10px] font-bold text-gray-500 uppercase">
                            <span className="w-1.5 h-1.5 rounded-full bg-gray-600"></span>
                            Offline — {offlineMembers.length}
                        </div>
                        <div className="space-y-1">
                            {offlineMembers.length > 0 ? offlineMembers.map(m => renderMember(m, false)) : <div className="px-2 text-xs text-gray-600 italic">No offline members</div>}
                        </div>
                    </div>
                </div>

                <div className="p-4 border-t border-white/5 bg-white/5">
                    <button onClick={() => { setShowAddMemberModal(true); fetchFriendsToAdd(); }} className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition text-xs shadow-lg shadow-indigo-600/20 active:scale-95 flex items-center justify-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg>
                        Invite People
                    </button>
                </div>
            </div>
            
            {showMobileSidebar && (
                <div className="fixed inset-0 bg-black/50 z-30 md:hidden backdrop-blur-sm" onClick={() => setShowMobileSidebar(false)}></div>
            )}

            {showAddMemberModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
                    <div className="bg-[#1a1a20] border border-white/10 rounded-3xl p-6 w-full max-w-sm shadow-2xl animate-scale-in">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-bold text-white">Add Friends</h3>
                            <button onClick={() => setShowAddMemberModal(false)} className="text-gray-400 hover:text-white"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
                        </div>
                        <div className="space-y-2 max-h-64 overflow-y-auto custom-scrollbar">
                            {friends.length === 0 ? <p className="text-gray-500 text-center text-sm py-4">No new friends to add.</p> : friends.map(f => (
                                <div key={f.id} className="flex items-center justify-between p-2 rounded-xl bg-white/5 gap-3">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-xs font-bold">{f.email[0]}</div>
                                        <span className="text-gray-200 text-sm">{f.email.split('@')[0]}</span>
                                    </div>
                                    <button onClick={() => handleAddMember(f.id)} disabled={addingMember} className="p-1.5 bg-green-600/20 text-green-400 rounded-lg hover:bg-green-600 hover:text-white transition">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};