import React, { useEffect, useState, useRef } from 'react';
import { supabase } from '../supabaseClient';
import { Message, UserProfile, CallState, Attachment, Group } from '../types';
import { useModal } from './ModalContext';

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

const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

const MessageItem = React.memo<{
    msg: Message;
    isMe: boolean;
    currentUser: UserProfile;
    onReaction: (msg: Message, emoji: string) => void;
    availableEmojis: string[];
    onRetry?: (msg: Message) => void;
}>(({ msg, isMe, currentUser, onReaction, availableEmojis, onRetry }) => {
    const [showActions, setShowActions] = useState(false);
    
    const senderName = isMe ? 'You' : (msg.sender?.email?.split('@')[0] || 'Unknown');
    const senderAvatar = msg.sender?.avatar_url;
    const senderInitial = msg.sender?.email ? msg.sender.email[0].toUpperCase() : '?';

    const hasReacted = (emoji: string) => msg.reactions?.[emoji]?.includes(currentUser.id);
    const isSending = msg.status === 'sending';
    const isError = msg.status === 'error';

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
                        
                        {/* Reaction Menu */}
                        {showActions && !isError && (
                            <div className={`absolute -top-10 ${isMe ? 'right-0' : 'left-0'} bg-[#1a1a20] border border-white/10 rounded-full p-1 flex gap-1 shadow-xl z-20`}>
                                {availableEmojis.slice(0, 5).map(emoji => (
                                    <button key={emoji} onClick={(e) => { e.stopPropagation(); onReaction(msg, emoji); setShowActions(false); }} className="hover:bg-white/10 p-1 rounded transition text-sm">
                                        {emoji}
                                    </button>
                                ))}
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
                                    <p className="text-[10px] font-medium">{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                )}
                            </div>
                        </div>

                        {/* Reactions Display */}
                        {msg.reactions && Object.keys(msg.reactions).some(k => msg.reactions![k].length > 0) && (
                            <div className={`flex gap-1 mt-1 ${isMe ? 'justify-end' : 'justify-start'}`}>
                                {Object.entries(msg.reactions).map(([emoji, users]) => (
                                    users.length > 0 && (
                                        <button key={emoji} className={`px-1.5 py-0.5 rounded-full text-[10px] border flex items-center gap-1 ${hasReacted(emoji) ? 'bg-indigo-500/20 border-indigo-500/30 text-indigo-300' : 'bg-gray-800/50 border-white/5 text-gray-400'}`}>
                                            <span>{emoji}</span><span className="font-bold">{users.length}</span>
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
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [emojiList, setEmojiList] = useState<string[]>(DEFAULT_EMOJI_LIST);
    const [showMembersModal, setShowMembersModal] = useState(false);
    const [showAddMemberModal, setShowAddMemberModal] = useState(false);
    const [groupMembers, setGroupMembers] = useState<UserProfile[]>([]);
    const [friends, setFriends] = useState<UserProfile[]>([]);
    const [addingMember, setAddingMember] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const { showAlert } = useModal();

    // Load Emojis
    useEffect(() => {
        fetch(EMOJI_SOURCE_URL).then(res => res.json()).then(data => {
            if (Array.isArray(data)) setEmojiList(data.map((i:any) => i.char || i).filter(Boolean).slice(0, 100));
        }).catch(() => {});
    }, []);

    // Load Group Data & Setup Realtime
    useEffect(() => {
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
                    return prev; // We will handle optimistic update in send
                });

                // Fetch sender details for incoming messages from others
                if (payload.new.sender_id !== currentUser.id) {
                     const { data } = await supabase.from('profiles').select('email, avatar_url').eq('id', payload.new.sender_id).single();
                     setMessages(prev => [...prev, { ...payload.new, sender: data, status: 'sent' } as Message]);
                }
            })
            // Realtime listener for member additions
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'group_members', filter: `group_id=eq.${selectedGroup.id}` }, () => {
                fetchMembers(); // Reload members if someone else adds one
            })
            .subscribe();

        // Initial member load
        fetchMembers();

        return () => { supabase.removeChannel(channel); };
    }, [selectedGroup.id, currentUser.id]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages.length]);

    const fetchMembers = async () => {
        const { data: memberRows } = await supabase.from('group_members').select('user_id').eq('group_id', selectedGroup.id);
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
        } else {
            showAlert("Error", "Failed to add member.");
        }
        setAddingMember(false);
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim()) return;
        const content = newMessage;
        setNewMessage('');
        
        // Optimistic
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

        // Insert with explicit NULL receiver_id for groups
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

    const handleRetry = async (msg: Message) => {
        // Retry sending a failed message
        setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, status: 'sending' } : m));
        
        const { data, error } = await supabase.from('messages').insert({
            sender_id: currentUser.id,
            group_id: selectedGroup.id,
            receiver_id: null,
            content: msg.content
        }).select().single();

        if (error) {
            console.error("Retry failed:", error);
            setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, status: 'error' } : m));
        } else {
            // Remove the old temporary message and add the new real one, or update in place
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

    return (
        <div className="flex flex-col h-full bg-[#030014] relative font-['Outfit']">
            {/* Header */}
            <div className="px-6 py-4 flex justify-between items-center bg-[#030014]/60 backdrop-blur-xl border-b border-white/5 sticky top-0 z-20 shadow-sm">
                <div className="flex items-center gap-4">
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-lg">
                        {selectedGroup.name[0].toUpperCase()}
                    </div>
                    <div>
                        <h2 className="font-bold text-white text-lg tracking-tight">{selectedGroup.name}</h2>
                        <div className="flex items-center gap-3">
                            <span className="text-xs text-indigo-400 font-medium">Group Chat</span>
                            <button onClick={() => { setShowMembersModal(true); fetchMembers(); }} className="text-[10px] text-gray-400 hover:text-white hover:underline transition">View Members</button>
                        </div>
                    </div>
                </div>
                <button onClick={() => { setShowAddMemberModal(true); fetchFriendsToAdd(); }} className="p-2 bg-white/10 hover:bg-white/20 rounded-lg text-white transition text-xs font-bold flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                    <span>Add</span>
                </button>
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
                            availableEmojis={emojiList} 
                            onRetry={handleRetry}
                        />
                    ))
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 pb-safe bg-[#030014]/80 backdrop-blur-md">
                <form onSubmit={handleSendMessage} className="max-w-4xl mx-auto flex items-center gap-2 bg-[#13131a] border border-white/10 p-1.5 pl-4 rounded-full shadow-2xl">
                    <input 
                        type="text" 
                        value={newMessage} 
                        onChange={(e) => setNewMessage(e.target.value)}
                        className="flex-1 bg-transparent text-white px-2 py-3 focus:outline-none placeholder-gray-600 text-[15px]" 
                        placeholder={`Message ${selectedGroup.name}...`} 
                    />
                    <button type="submit" disabled={!newMessage.trim()} className="p-2.5 rounded-full bg-gradient-to-r from-indigo-600 to-fuchsia-600 text-white font-bold transition shadow-lg disabled:opacity-50">
                        <svg className="w-5 h-5 ml-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 5l7 7-7 7M5 5l7 7-7 7" /></svg>
                    </button>
                </form>
            </div>

            {/* Modals */}
            {showMembersModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
                    <div className="bg-[#1a1a20] border border-white/10 rounded-3xl p-6 w-full max-w-sm shadow-2xl animate-scale-in">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-bold text-white">Members</h3>
                            <button onClick={() => setShowMembersModal(false)} className="text-gray-400 hover:text-white"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
                        </div>
                        <div className="space-y-2 max-h-64 overflow-y-auto custom-scrollbar">
                            {groupMembers.map(m => (
                                <div key={m.id} className="flex items-center p-2 rounded-xl bg-white/5 gap-3">
                                    {m.avatar_url ? <img src={m.avatar_url} className="w-8 h-8 rounded-full object-cover" /> : <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-xs font-bold">{m.email[0]}</div>}
                                    <span className="text-gray-200 text-sm">{m.email.split('@')[0]}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
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