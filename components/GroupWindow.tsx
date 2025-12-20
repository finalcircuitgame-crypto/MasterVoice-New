import React, { useEffect, useState, useRef, useMemo } from 'react';
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
const GIF_LIST = [
    "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExbXp4Z2Y5M3Z5aGZ5Y3Z5aGZ5Y3Z5aGZ5Y3Z5aGZ5YyZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/3o7TKSjRrfIPjeiVyM/giphy.gif",
    "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExbXp4Z2Y5M3Z5aGZ5Y3Z5aGZ5Y3Z5aGZ5Y3Z5aGZ5YyZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/l0HlHFRbmaZtBRhXG/giphy.gif",
    "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExbXp4Z2Y5M3Z5aGZ5Y3Z5aGZ5Y3Z5aGZ5Y3Z5aGZ5YyZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/xT5LMHxhOfscxPfIfm/giphy.gif",
    "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExbXp4Z2Y5M3Z5aGZ5Y3Z5aGZ5Y3Z5aGZ5Y3Z5aGZ5YyZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/3oKIPnAiaMCws8nOsE/giphy.gif",
    "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExbXp4Z2Y5M3Z5aGZ5Y3Z5aGZ5Y3Z5aGZ5Y3Z5aGZ5YyZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/26ufdipQqU2lhNA4g/giphy.gif",
    "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExbXp4Z2Y5M3Z5aGZ5Y3Z5aGZ5Y3Z5aGZ5Y3Z5aGZ5YyZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/l2JI4z9s4YQYQ/giphy.gif"
];

// Poll Constants
const POLL_PREFIX = "$$POLL$$";
const VOTE_OPTIONS = ["1️⃣", "2️⃣", "3️⃣", "4️⃣"];

const MessageItem = React.memo<{
    msg: Message;
    isMe: boolean;
    currentUser: UserProfile;
    onReaction: (msg: Message, emoji: string) => void;
    onEdit: (msg: Message) => void;
    onDelete: (id: string) => void;
    onPin: (msg: Message) => void; // New
    availableEmojis: string[];
    onRetry?: (msg: Message) => void;
}>(({ msg, isMe, currentUser, onReaction, onEdit, onDelete, onPin, availableEmojis, onRetry }) => {
    const [showActions, setShowActions] = useState(false);
    
    const senderName = isMe ? 'You' : (msg.sender?.email?.split('@')[0] || 'Unknown');
    const senderAvatar = msg.sender?.avatar_url;
    const senderInitial = msg.sender?.email ? msg.sender.email[0].toUpperCase() : '?';

    const hasReacted = (emoji: string) => msg.reactions?.[emoji]?.includes(currentUser.id);
    const isSending = msg.status === 'sending';
    const isError = msg.status === 'error';
    const isRecentlyEdited = msg.updated_at && msg.created_at && new Date(msg.updated_at).getTime() > new Date(msg.created_at).getTime() + 1000;
    const isPinned = msg.reactions?.['📌'] && msg.reactions['📌'].length > 0;

    // Feature: Poll Rendering
    const isPoll = msg.content.startsWith(POLL_PREFIX);
    let pollData = null;
    if (isPoll) {
        try {
            pollData = JSON.parse(msg.content.replace(POLL_PREFIX, ''));
        } catch(e) {}
    }

    return (
        <div className={`w-full flex ${isMe ? 'justify-end' : 'justify-start'} mb-6 animate-message-enter px-2 group relative`}>
            {isPinned && (
                <div className={`absolute -top-3 ${isMe ? 'right-4' : 'left-14'} z-0`}>
                    <div className="bg-indigo-600 text-white text-[9px] font-bold px-2 py-0.5 rounded-t-lg shadow-sm flex items-center gap-1">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path d="M10 2a1 1 0 011 1v1.323l3.954 1.582 1.699 3.177a1 1 0 01.107.46V17l-4.586-2.293a1 1 0 00-.894 0L6.707 17v-7.46a1 1 0 01.107-.46l1.699-3.177L12.46 4.323V3a1 1 0 011-1zm0 5.382l-2-1V3h2v4.382z"/></svg> Pinned
                    </div>
                </div>
            )}
            <div className={`flex flex-col max-w-[85%] md:max-w-[70%] ${isMe ? 'items-end' : 'items-start'} relative z-10`}>
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
                                {!isPoll && availableEmojis.slice(0, 5).map(emoji => (
                                    <button key={emoji} onClick={(e) => { e.stopPropagation(); onReaction(msg, emoji); setShowActions(false); }} className="hover:bg-white/10 p-1 rounded transition text-sm">
                                        {emoji}
                                    </button>
                                ))}
                                <div className="w-px bg-white/10 mx-1"></div>
                                <button onClick={(e) => { e.stopPropagation(); onPin(msg); setShowActions(false); }} className={`hover:bg-white/10 p-1.5 rounded transition ${isPinned ? 'text-indigo-400' : 'text-gray-400'}`} title={isPinned ? "Unpin" : "Pin"}>📌</button>
                                {isMe && (
                                    <>
                                        {!isPoll && <button onClick={(e) => { e.stopPropagation(); onEdit(msg); setShowActions(false); }} className="hover:bg-white/10 p-1.5 rounded transition text-gray-400" title="Edit">✏️</button>}
                                        <button onClick={(e) => { e.stopPropagation(); onDelete(msg.id); }} className="hover:bg-white/10 p-1.5 rounded transition text-red-400" title="Delete">🗑️</button>
                                    </>
                                )}
                            </div>
                        )}

                        <div className={`relative px-5 py-3 shadow-md backdrop-blur-md ${isPoll ? 'bg-gray-800 border border-white/10 rounded-xl w-full min-w-[250px]' : (isMe ? 'bg-gradient-to-br from-[var(--theme-500)] to-[var(--theme-600)] text-white rounded-[1.2rem] rounded-br-sm' : 'bg-white/10 text-gray-100 rounded-[1.2rem] rounded-bl-sm border border-white/5')} ${isError ? 'border-red-500 bg-red-900/10' : ''} ${isPinned ? 'ring-1 ring-indigo-500/50' : ''}`}>
                            {isPoll && pollData ? (
                                <div className="text-white w-full">
                                    <h4 className="font-bold text-sm mb-3 flex items-center gap-2">
                                        <svg className="w-4 h-4 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                                        Poll: {pollData.question}
                                    </h4>
                                    <div className="space-y-2">
                                        {pollData.options.map((opt: string, i: number) => {
                                            const voteKey = VOTE_OPTIONS[i];
                                            const votes = msg.reactions?.[voteKey]?.length || 0;
                                            const totalVotes = Object.keys(msg.reactions || {}).filter(k => VOTE_OPTIONS.includes(k)).reduce((acc, k) => acc + (msg.reactions![k]?.length || 0), 0);
                                            const percent = totalVotes > 0 ? Math.round((votes / totalVotes) * 100) : 0;
                                            const iVoted = hasReacted(voteKey);

                                            return (
                                                <button 
                                                    key={i} 
                                                    onClick={(e) => { e.stopPropagation(); onReaction(msg, voteKey); }}
                                                    className={`w-full p-2 rounded-lg border text-left relative overflow-hidden transition ${iVoted ? 'border-indigo-500 bg-indigo-500/10' : 'border-white/10 hover:bg-white/5'}`}
                                                >
                                                    <div className={`absolute top-0 left-0 bottom-0 bg-indigo-500/20 transition-all duration-500`} style={{ width: `${percent}%` }}></div>
                                                    <div className="relative flex justify-between text-xs font-medium z-10">
                                                        <span>{opt}</span>
                                                        <span>{percent}% ({votes})</span>
                                                    </div>
                                                </button>
                                            )
                                        })}
                                    </div>
                                    <p className="text-[9px] text-gray-500 mt-2 text-right">Click options to vote</p>
                                </div>
                            ) : (
                                <>
                                    {msg.content && <p className="leading-relaxed whitespace-pre-wrap break-words text-[15px]">{msg.content}</p>}
                                </>
                            )}
                            
                            <div className={`flex items-center justify-end mt-1.5 gap-1.5 ${isMe ? 'text-white/80' : 'text-gray-400'}`}>
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

                        {/* Reactions Display (Non-Poll) */}
                        {!isPoll && msg.reactions && Object.keys(msg.reactions).some(k => k !== '📌' && (msg.reactions![k] as string[]).length > 0) && (
                            <div className={`flex gap-1 mt-1 ${isMe ? 'justify-end' : 'justify-start'}`}>
                                {Object.entries(msg.reactions).map(([emoji, users]) => (
                                    emoji !== '📌' && (users as string[]).length > 0 && (
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
    
    // Feature: Polls
    const [showPollCreator, setShowPollCreator] = useState(false);
    const [pollQuestion, setPollQuestion] = useState('');
    const [pollOptions, setPollOptions] = useState(['', '']);

    // Feature: GIF Picker
    const [showGifPicker, setShowGifPicker] = useState(false);

    // Feature: Edit Group Name
    const [groupName, setGroupName] = useState(selectedGroup.name);
    const [isEditingName, setIsEditingName] = useState(false);
    const [showGroupSettings, setShowGroupSettings] = useState(false);

    // Feature: Message Editing
    const [editingId, setEditingId] = useState<string | null>(null);

    // Feature: Typing Indicators
    const [remoteDrafts, setRemoteDrafts] = useState<Record<string, string>>({});
    const typingTimeouts = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
    const lastTypingBroadcast = useRef<number>(0);
    const [groupChannel, setGroupChannel] = useState<any>(null);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const { showAlert, showConfirm } = useModal();

    // Owner Check
    const isOwner = selectedGroup.created_by === currentUser.id;

    // Feature: Pinned Messages (Last message with '📌' reaction)
    const pinnedMessage = useMemo(() => {
        return messages.slice().reverse().find(m => m.reactions?.['📌']?.length! > 0);
    }, [messages]);

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

    // Feature: Create Poll
    const handleCreatePoll = async () => {
        if (!pollQuestion.trim() || pollOptions.some(o => !o.trim())) return;
        const pollContent = JSON.stringify({
            question: pollQuestion,
            options: pollOptions.filter(o => o.trim())
        });
        
        // Use standard send but with special prefix
        await supabase.from('messages').insert({
            sender_id: currentUser.id,
            group_id: selectedGroup.id,
            content: POLL_PREFIX + pollContent
        });
        
        setShowPollCreator(false);
        setPollQuestion('');
        setPollOptions(['', '']);
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e && e.preventDefault();
        const content = newMessage;
        if (!content.trim()) return;
        setNewMessage('');
        setShowGifPicker(false);
        
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

    // Feature: Send GIF
    const handleSendGif = (url: string) => {
        // Send as content url
        setNewMessage(url);
        // Trigger manual send immediately (mocking event)
        setTimeout(() => handleSendMessage(null as any), 0);
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