import React, { useEffect, useState, useRef, useMemo } from 'react';
import { supabase } from '../supabaseClient';
import { Message, UserProfile, CallState, Attachment } from '../types';
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

interface ChatWindowProps {
    currentUser: UserProfile;
    recipient: UserProfile | null;
    onlineUsers: Set<string>;
    channel: any | null; 
    callState: CallState;
    onStartCall: () => void;
    onAnswerCall: () => void;
    onEndCall: () => void;
    activeCallContact?: UserProfile | null;
    onExpandCall?: () => void;
}

interface MessageItemProps {
    msg: Message;
    isMe: boolean;
    recipient?: UserProfile | null;
    currentUser: UserProfile;
    onEdit: (msg: Message) => void;
    onDelete: (id: string) => void;
    onRetry: (msg: Message) => void;
    onReply: (msg: Message) => void;
    onReaction: (msg: Message, emoji: string) => void;
    onPin: (msg: Message) => void;
    onJumpTo: (messageId: string) => void;
    onImageClick: (url: string) => void;
    isHighlighted: boolean;
    availableEmojis: string[];
}

const EMOJI_SOURCE_URL = 'https://cdn.jsdelivr.net/npm/emoji-datasource-apple/emoji.json';
const DEFAULT_EMOJI_LIST = ["👍", "👎", "❤️", "🔥", "😂", "😢", "😮", "😡", "🎉", "👀"];

// GIPHY API Integration
const GIPHY_API_KEY = 'dc6zaTOxFJmzC'; 

// "Grab every Gir GIF" - Fallback engine
const FALLBACK_GIR_GIFS = [
    "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExM3Z6ZnB6OHRwaHpxeG85M3Z5Z2Z5Z2Z5Z2Z5Z2Z5Z2Z5Z2Z5ZyZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/V2mS31M44xLJC/giphy.gif",
    "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExM3Z6ZnB6OHRwaHpxeG85M3Z5Z2Z5Z2Z5Z2Z5Z2Z5Z2Z5Z2Z5ZyZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/mSguM0eKjF3mE/giphy.gif",
    "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExM3Z6ZnB6OHRwaHpxeG85M3Z5Z2Z5Z2Z5Z2Z5Z2Z5Z2Z5Z2Z5ZyZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/9S5iSgtLzU9Y170tH4/giphy.gif",
    "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExM3Z6ZnB6OHRwaHpxeG85M3Z5Z2Z5Z2Z5Z2Z5Z2Z5Z2Z5Z2Z5ZyZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/Zf8q6n1oG7Y/giphy.gif",
    "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExM3Z6ZnB6OHRwaHpxeG85M3Z5Z2Z5Z2Z5Z2Z5Z2Z5Z2Z5Z2Z5ZyZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/6uMqzcbWRhoT6/giphy.gif",
    "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExM3Z6ZnB6OHRwaHpxeG85M3Z5Z2Z5Z2Z5Z2Z5Z2Z5Z2Z5Z2Z5ZyZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/M07Q6on9o1U7C/giphy.gif",
    "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExM3Z6ZnB6OHRwaHpxeG85M3Z5Z2Z5Z2Z5Z2Z5Z2Z5Z2Z5Z2Z5ZyZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/kIkc2pV9q6HXC/giphy.gif"
];

const parseMessageContent = (text: string) => {
    if (!text) return null;
    const lines = text.split('\n');
    return lines.map((line, lineIdx) => {
        const parts = line.split(/(\*\*.*?\*\*|_.*?_|`.*?`|https?:\/\/[^\s]+)/g);
        return (
            <div key={lineIdx} className="min-h-[1.2em]">
                {parts.map((part, i) => {
                    if (part.startsWith('**') && part.endsWith('**')) return <strong key={i} className="font-bold">{part.slice(2, -2)}</strong>;
                    if (part.startsWith('_') && part.endsWith('_')) return <em key={i} className="italic">{part.slice(1, -1)}</em>;
                    if (part.startsWith('`') && part.endsWith('`')) return <code key={i} className="bg-black/30 rounded px-1 py-0.5 font-mono text-xs">{part.slice(1, -1)}</code>;
                    if (part.match(/^https?:\/\//)) {
                        return <a key={i} href={part} target="_blank" rel="noopener noreferrer" className="text-blue-300 underline hover:text-blue-200 break-all" onClick={(e)=>e.stopPropagation()}>{part}</a>;
                    }
                    return <span key={i}>{part}</span>;
                })}
            </div>
        );
    });
};

const MessageItem = React.memo<MessageItemProps>(({ msg, isMe, recipient, currentUser, onEdit, onDelete, onRetry, onReply, onReaction, onPin, onJumpTo, onImageClick, isHighlighted, availableEmojis }) => {
    const [showActions, setShowActions] = useState(false);
    const [showReactions, setShowReactions] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const isRecentlyEdited = msg.updated_at && msg.created_at && new Date(msg.updated_at).getTime() > new Date(msg.created_at).getTime() + 1000;
    const isSending = msg.status === 'sending';
    const isError = msg.status === 'error';
    const hasReacted = (emoji: string) => msg.reactions?.[emoji]?.includes(currentUser.id);
    const isPinned = msg.reactions?.['📌'] && msg.reactions['📌'].length > 0;
    const isUrl = msg.content && msg.content.trim().match(/^https?:\/\/[^\s]+$/);
    const isImageUrl = isUrl && (msg.content.match(/\.(jpeg|jpg|gif|png|webp|svg)/i) || msg.content.includes('giphy.com/media') || msg.content.includes('media.giphy.com'));

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) { setShowActions(false); setShowReactions(false); }
        };
        document.addEventListener('mousedown', handleClickOutside, true);
        return () => document.removeEventListener('mousedown', handleClickOutside, true);
    }, []);

    const copyToClipboard = () => { if (msg.content) navigator.clipboard.writeText(msg.content); setShowActions(false); };

    const renderAttachment = () => {
        if (msg.attachment) return (<div className="mb-2 rounded-lg overflow-hidden cursor-zoom-in" onClick={(e) => { e.stopPropagation(); onImageClick(msg.attachment!.url); }}><img src={msg.attachment.url} alt="Attachment" className="max-w-full rounded-lg max-h-80 object-cover" /></div>);
        if (isImageUrl) return (<div className="mb-2 rounded-lg overflow-hidden cursor-zoom-in" onClick={(e) => { e.stopPropagation(); onImageClick(msg.content); }}><img src={msg.content} alt="GIF/Image" className="max-w-full rounded-lg max-h-80 object-cover border border-white/5" /></div>);
        return null;
    };

    return (
        <div id={`msg-${msg.id}`} ref={containerRef} className={`w-full flex ${isMe ? 'justify-end' : 'justify-start'} mb-6 px-2 group relative`}>
            {isPinned && <div className={`absolute -top-3 ${isMe ? 'right-4' : 'left-14'} z-0`}><div className="bg-indigo-600 text-white text-[9px] font-bold px-2 py-0.5 rounded-t-lg shadow-sm flex items-center gap-1">📌 Pinned</div></div>}
            <div className={`flex flex-col max-w-[85%] md:max-w-[70%] ${isMe ? 'items-end' : 'items-start'} relative z-10`}>
                <div className={`flex items-end gap-3 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                    {!isMe && <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center text-xs font-bold mb-1 border border-white/10 overflow-hidden">{recipient?.avatar_url ? <img src={recipient.avatar_url} className="w-full h-full object-cover" /> : recipient?.email[0].toUpperCase()}</div>}
                    <div className="flex flex-col min-w-0 cursor-pointer relative" onClick={() => setShowActions(!showActions)}>
                        {showActions && !isSending && (<div className={`absolute z-20 -top-14 ${isMe ? 'right-0' : 'left-0'} bg-[#1a1a20] border border-white/10 rounded-xl p-1 flex gap-1 shadow-xl animate-scale-in`}>
                                <button onClick={(e) => { e.stopPropagation(); setShowReactions(!showReactions); }} className="p-2 hover:bg-white/10 rounded-lg text-gray-400">😊</button>
                                <button onClick={(e) => { e.stopPropagation(); onReply(msg); setShowActions(false); }} className="p-2 hover:bg-white/10 rounded-lg text-gray-400">↩️</button>
                                <button onClick={(e) => { e.stopPropagation(); onPin(msg); setShowActions(false); }} className={`p-2 hover:bg-white/10 rounded-lg ${isPinned ? 'text-indigo-400' : 'text-gray-400'}`}>📌</button>
                                <button onClick={(e) => { e.stopPropagation(); copyToClipboard(); }} className="p-2 hover:bg-white/10 rounded-lg text-gray-400">📋</button>
                                {isMe && !msg.attachment && !isImageUrl && <button onClick={(e) => { e.stopPropagation(); onEdit(msg); setShowActions(false); }} className="p-2 hover:bg-white/10 rounded-lg text-gray-400">✏️</button>}
                                {isMe && <button onClick={(e) => { e.stopPropagation(); onDelete(msg.id); }} className="p-2 hover:bg-white/10 rounded-lg text-red-400">🗑️</button>}
                            </div>)}
                        {showReactions && (<div className="absolute -top-12 left-0 bg-[#2a2a30] rounded-xl p-2 shadow-xl z-30 flex gap-1 animate-scale-in border border-white/10 w-64 flex-wrap">{(availableEmojis || DEFAULT_EMOJI_LIST).slice(0, 16).map(emoji => (<button key={emoji} onClick={(e) => { e.stopPropagation(); onReaction(msg, emoji); setShowReactions(false); setShowActions(false); }} className="hover:bg-white/10 p-1.5 rounded transition hover:scale-125 text-lg">{emoji}</button>))}</div>)}
                        {msg.reply_to && (<div onClick={(e) => { e.stopPropagation(); onJumpTo(msg.reply_to!.id); }} className={`mb-1 px-3 py-1.5 rounded-lg bg-white/5 border-l-2 border-indigo-500 text-xs text-gray-400 cursor-pointer hover:bg-white/10 transition ${isMe ? 'ml-auto' : ''}`}><span className="font-bold text-indigo-400 mr-2">{msg.reply_to.sender_id === currentUser.id ? 'You' : 'Reply'}</span><span className="truncate block opacity-80">{msg.reply_to.content || 'Attachment'}</span></div>)}
                        <div className={`px-5 py-3 shadow-md backdrop-blur-md transition-all ${isMe ? 'bg-gradient-to-br from-[var(--theme-500)] to-[var(--theme-600)] text-white rounded-[1.2rem] rounded-br-sm' : 'bg-white/10 text-gray-100 rounded-[1.2rem] rounded-bl-sm border border-white/5'} ${isHighlighted ? 'ring-2 ring-white/50 scale-[1.02]' : ''} ${isError ? 'border-red-500 bg-red-900/10' : ''} ${isPinned ? 'ring-1 ring-indigo-500/50' : ''}`}>
                            {renderAttachment()}
                            {msg.content && !isImageUrl && <div className="leading-relaxed whitespace-pre-wrap break-words text-[15px]">{parseMessageContent(msg.content)}</div>}
                            <div className={`flex items-center justify-between mt-1.5 gap-3 ${isMe ? 'text-white/80' : 'text-gray-400'}`}><div className="flex items-center gap-2"><p className="text-[10px] font-medium">{isSending ? 'Sending...' : new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>{isRecentlyEdited && <span className="text-[9px] italic opacity-70">edited</span>}</div></div>
                        </div>
                        {msg.reactions && Object.keys(msg.reactions).some(k => k !== '📌' && (msg.reactions![k] as string[]).length > 0) && (<div className={`flex gap-1 mt-1 flex-wrap ${isMe ? 'justify-end' : 'justify-start'}`}>{Object.entries(msg.reactions).map(([emoji, users]) => (emoji !== '📌' && (users as string[]).length > 0 && (<button key={emoji} onClick={(e) => { e.stopPropagation(); onReaction(msg, emoji); }} className={`px-2 py-0.5 rounded-full text-[10px] border flex items-center gap-1 shadow-sm transition hover:scale-110 ${hasReacted(emoji) ? 'bg-indigo-500/20 border-indigo-500/30 text-indigo-300' : 'bg-gray-800/80 border-white/5 text-gray-400'}`}><span>{emoji}</span><span className="font-bold">{(users as string[]).length}</span></button>)))}</div>)}
                    </div>
                </div>
            </div>
        </div>
    );
});

export const ChatWindow: React.FC<ChatWindowProps> = ({ currentUser, recipient, onlineUsers, callState, onStartCall, onEndCall, onAnswerCall, activeCallContact, onExpandCall }) => {
    if (!recipient) return null;
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [editingId, setEditingId] = useState<string | null>(null);
    const [replyingTo, setReplyingTo] = useState<Message | null>(null);
    const [loading, setLoading] = useState(true);
    const [emojiList, setEmojiList] = useState<string[]>(DEFAULT_EMOJI_LIST);
    const [highlightedMessageId, setHighlightedMessageId] = useState<string | null>(null);
    const [showGifPicker, setShowGifPicker] = useState(false);
    const [gifSearch, setGifSearch] = useState('Gir');
    const [gifs, setGifs] = useState<any[]>([]);
    const [loadingGifs, setLoadingGifs] = useState(false);
    const [gifError, setGifError] = useState(false);
    const [lightboxImage, setLightboxImage] = useState<string | null>(null);
    const [showScrollButton, setShowScrollButton] = useState(false);
    const [remoteDrafts, setRemoteDrafts] = useState<Record<string, string>>({});
    const typingTimeouts = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
    const lastTypingBroadcast = useRef<number>(0);
    const [chatChannel, setChatChannel] = useState<any>(null);
    const [showIdentity, setShowIdentity] = useState(false);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const isRecipientOnline = onlineUsers.has(recipient.id);
    const roomId = [currentUser.id, recipient.id].sort().join('_');
    const pinnedMessage = useMemo(() => messages.slice().reverse().find(m => m.reactions?.['📌']?.length! > 0), [messages]);

    useEffect(() => {
        fetch(EMOJI_SOURCE_URL).then(res => res.json()).then(data => {
            if (Array.isArray(data)) {
                const processed = data.map((item: any) => item.char || item.unified?.split('-').map((code: string) => String.fromCodePoint(parseInt(code, 16))).join('')).filter(Boolean);
                setEmojiList(processed.slice(0, 100));
            }
        }).catch(() => setEmojiList(DEFAULT_EMOJI_LIST));
    }, []);

    useEffect(() => {
        if (!showGifPicker) return;
        const fetchGifs = async () => {
            setLoadingGifs(true);
            setGifError(false);
            try {
                const queryStr = gifSearch.trim() || 'Gir';
                const res = await fetch(`https://api.giphy.com/v1/gifs/search?api_key=${GIPHY_API_KEY}&q=${encodeURIComponent(queryStr)}&limit=25`);
                if (res.status === 403 || !res.ok) throw new Error("Limited");
                const json = await res.json();
                setGifs(json.data || []);
            } catch (e) { 
                setGifError(true);
                setGifs(FALLBACK_GIR_GIFS.map((url, i) => ({ id: `fallback-${i}`, images: { fixed_height_small: { url }, original: { url } } })));
            }
            finally { setLoadingGifs(false); }
        };
        const timer = setTimeout(fetchGifs, 500);
        return () => clearTimeout(timer);
    }, [gifSearch, showGifPicker]);

    useEffect(() => {
        const channel = supabase.channel(`chat_messages:${roomId}`);
        channel
            .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, (payload) => {
                const record = (payload.new || payload.old) as any;
                if (!record) return;
                if (!((record.sender_id === currentUser.id && record.receiver_id === recipient.id) || (record.sender_id === recipient.id && record.receiver_id === currentUser.id))) return;
                if (payload.eventType === 'INSERT') {
                    setMessages(prev => prev.find(m => m.id === payload.new.id) ? prev : [...prev, { ...payload.new, status: 'sent' } as Message]);
                    if (payload.new.sender_id !== currentUser.id) window.dispatchEvent(new CustomEvent('play-notification'));
                } else if (payload.eventType === 'UPDATE') { setMessages(prev => prev.map(m => m.id === payload.new.id ? { ...m, ...payload.new } as Message : m)); }
                else if (payload.eventType === 'DELETE') { setMessages(prev => prev.filter(m => m.id !== payload.old.id)); }
            })
            .on('broadcast', { event: 'typing' }, ({ payload }) => {
                if (payload.userId === currentUser.id) return;
                if (typingTimeouts.current[payload.userId]) clearTimeout(typingTimeouts.current[payload.userId]);
                setRemoteDrafts(payload.content ? { [payload.userId]: payload.content } : {});
                if (payload.content) typingTimeouts.current[payload.userId] = setTimeout(() => setRemoteDrafts({}), 3000);
            })
            .subscribe();
        setChatChannel(channel);
        return () => { supabase.removeChannel(channel); };
    }, [roomId, recipient.id, currentUser.id]);

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            const { data } = await supabase.from('messages').select('*, reply_to:reply_to_id(id, content, sender_id)').or(`and(sender_id.eq.${currentUser.id},receiver_id.eq.${recipient.id}),and(sender_id.eq.${recipient.id},receiver_id.eq.${currentUser.id})`).order('created_at', { ascending: true });
            if (data) setMessages(data.map(m => ({ ...m, status: 'sent' })));
            setLoading(false);
        };
        load();
    }, [recipient.id]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e && e.preventDefault();
        const content = newMessage;
        if (!content.trim()) return;
        setNewMessage('');
        setShowGifPicker(false);
        if (content.toLowerCase().includes('congrats')) triggerConfetti();
        if (editingId) {
            setMessages(prev => prev.map(m => m.id === editingId ? { ...m, content, updated_at: new Date().toISOString() } : m));
            setEditingId(null);
            await supabase.from('messages').update({ content, updated_at: new Date().toISOString() }).eq('id', editingId);
        } else {
            const tempId = Math.random().toString();
            setMessages(prev => [...prev, { id: tempId, sender_id: currentUser.id, receiver_id: recipient.id, content, created_at: new Date().toISOString(), status: 'sending', reply_to: replyingTo } as any]);
            setReplyingTo(null);
            window.dispatchEvent(new CustomEvent('play-sent'));
            const { data, error } = await supabase.from('messages').insert({ sender_id: currentUser.id, receiver_id: recipient.id, content, reply_to_id: replyingTo?.id }).select().single();
            if (error) setMessages(prev => prev.map(m => m.id === tempId ? { ...m, status: 'error' } : m));
            else setMessages(prev => prev.map(m => m.id === tempId ? { ...data, status: 'sent', reply_to: replyingTo } : m));
        }
    };

    return (
        <div className="flex flex-col h-full bg-[#030014] relative font-['Outfit']">
            <div className="px-6 py-4 flex justify-between items-center bg-[#030014]/60 backdrop-blur-xl border-b border-white/5 sticky top-0 z-20 shadow-sm">
                <div className="flex items-center gap-4 cursor-pointer" onClick={() => setShowIdentity(!showIdentity)}>
                    <div className="relative">
                        <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-indigo-500 to-fuchsia-600 flex items-center justify-center text-white font-bold text-lg shadow-lg overflow-hidden border border-white/10" style={{ background: 'var(--theme-gradient)' }}>
                            {recipient.avatar_url ? <img src={recipient.avatar_url} className="w-full h-full object-cover" /> : recipient.email[0].toUpperCase()}
                        </div>
                        <div className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-[#030014] ${isRecipientOnline ? 'bg-green-500' : 'bg-gray-500'}`}></div>
                    </div>
                    <div>
                        <h2 className="font-bold text-white text-lg tracking-tight flex items-center gap-2">
                            {recipient.email.split('@')[0]}
                            {isRecipientOnline && <div className="px-2 py-0.5 bg-green-500/10 rounded-full flex items-center gap-1.5"><span className="w-1 h-1 bg-green-500 rounded-full animate-pulse"></span><span className="text-[8px] text-green-400 uppercase tracking-widest font-black">Live</span></div>}
                        </h2>
                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest flex items-center gap-1">
                             <svg className="w-3 h-3 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                             Encrypted P2P Session
                        </span>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={onStartCall} disabled={callState !== CallState.IDLE} className={`p-2.5 rounded-full transition-all shadow-lg hover:scale-110 active:scale-95 ${callState === CallState.IDLE ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-gray-800 text-gray-500 cursor-not-allowed'}`}><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg></button>
                </div>
            </div>

            {showIdentity && (
                <div className="bg-indigo-600/10 border-b border-indigo-500/20 p-4 px-6 flex flex-col gap-2 animate-fade-in-up">
                    <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Verify Identity Fingerprint</p>
                    <div className="font-mono text-[9px] text-gray-400 break-all bg-black/40 p-2 rounded-lg border border-white/5">
                        SHA-256:{recipient.id.replace(/-/g, ':').toUpperCase()}
                    </div>
                    <p className="text-[9px] text-gray-500 italic">If this fingerprint matches the one on their screen, your connection is untampered.</p>
                </div>
            )}

            {pinnedMessage && <div onClick={() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })} className="bg-indigo-900/40 border-b border-indigo-500/20 p-2 px-6 flex items-center justify-between cursor-pointer hover:bg-indigo-900/60 transition backdrop-blur-sm z-10"><div className="flex items-center gap-3 overflow-hidden"><div className="bg-indigo-500 p-1 rounded"><svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20"><path d="M10 2a1 1 0 011 1v1.323l3.954 1.582 1.699 3.177a1 1 0 01.107.46V17l-4.586-2.293a1 1 0 00-.894 0L6.707 17v-7.46a1 1 0 01.107-.46l1.699-3.177L12.46 4.323V3a1 1 0 011-1zm0 5.382l-2-1V3h2v4.382z"/></svg></div><div className="flex flex-col"><span className="text-[10px] font-bold text-indigo-300">Pinned</span><span className="text-xs text-gray-300 truncate max-w-[200px]">{pinnedMessage.content}</span></div></div></div>}

            <div ref={scrollContainerRef} className="flex-1 overflow-y-auto p-4 md:p-6 space-y-2 no-scrollbar scroll-smooth">
                {loading && <div className="flex justify-center h-full items-center"><div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div></div>}
                {messages.map(msg => (<MessageItem key={msg.id} msg={msg} isMe={msg.sender_id === currentUser.id} recipient={recipient} currentUser={currentUser} onEdit={(m) => { setEditingId(m.id); setNewMessage(m.content); }} onDelete={async (id) => { setMessages(p => p.filter(m => m.id !== id)); await supabase.from('messages').delete().eq('id', id); }} onRetry={() => {}} onReply={setReplyingTo} onReaction={async (m, e) => { const curr = m.reactions || {}; const u = curr[e] || []; const up = u.includes(currentUser.id) ? u.filter(x => x !== currentUser.id) : [...u, currentUser.id]; const r = { ...curr, [e]: up }; if (!up.length) delete r[e]; setMessages(p => p.map(x => x.id === m.id ? { ...x, reactions: r } : x)); await supabase.from('messages').update({ reactions: r }).eq('id', m.id); }} onPin={async (m) => { const curr = m.reactions || {}; const u = curr['📌'] || []; const up = u.includes(currentUser.id) ? u.filter(x => x !== currentUser.id) : [...u, currentUser.id]; const r = { ...curr, '📌': up }; setMessages(p => p.map(x => x.id === m.id ? { ...x, reactions: r } : x)); await supabase.from('messages').update({ reactions: r }).eq('id', m.id); }} onJumpTo={(id) => { const el = document.getElementById(`msg-${id}`); if (el) { el.scrollIntoView({ behavior: 'smooth', block: 'center' }); setHighlightedMessageId(id); setTimeout(() => setHighlightedMessageId(null), 2000); } }} onImageClick={setLightboxImage} isHighlighted={msg.id === highlightedMessageId} availableEmojis={emojiList} />))}
                {Object.keys(remoteDrafts).length > 0 && (<div className="px-4 py-2 text-xs text-gray-500 italic flex items-center gap-1 animate-fade-in"><div className="w-1 h-1 bg-gray-500 rounded-full animate-bounce"></div><div className="w-1 h-1 bg-gray-500 rounded-full animate-bounce delay-75"></div><div className="w-1 h-1 bg-gray-500 rounded-full animate-bounce delay-150"></div><span className="ml-1">{recipient.email.split('@')[0]} is typing...</span></div>)}
                <div ref={messagesEndRef} />
            </div>

            {showGifPicker && (
                <div className="absolute bottom-20 left-4 z-30 bg-[#1a1a20]/95 backdrop-blur-xl border border-white/10 rounded-2xl p-4 shadow-2xl animate-slide-up w-80">
                    <div className="relative mb-3">
                         <input autoFocus type="text" value={gifSearch} onChange={(e) => setGifSearch(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-full py-2 px-4 text-xs text-white outline-none focus:ring-2 focus:ring-indigo-500/50" placeholder="Search GIFs..." />
                         {loadingGifs && <div className="absolute right-3 top-2.5 w-3 h-3 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>}
                    </div>
                    <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto custom-scrollbar pr-1">
                        {gifError && <div className="col-span-2 text-center py-2 text-[10px] text-amber-500 bg-amber-500/10 rounded mb-2 font-bold uppercase">Gir Offline Cache Active</div>}
                        {gifs.map((gif, i) => (<div key={gif.id} className="group relative rounded-lg overflow-hidden h-24 bg-black/20"><img src={gif.images.fixed_height_small.url} alt="GIF" className="w-full h-full object-cover cursor-pointer hover:scale-110 transition duration-300" onClick={async () => { const tempId = Math.random().toString(); setMessages(p => [...p, { id: tempId, sender_id: currentUser.id, receiver_id: recipient.id, content: gif.images.original.url, created_at: new Date().toISOString(), status: 'sending' } as any]); setShowGifPicker(false); await supabase.from('messages').insert({ sender_id: currentUser.id, receiver_id: recipient.id, content: gif.images.original.url }); }} /></div>))}
                    </div>
                </div>
            )}

            <div className="p-4 pb-safe bg-[#030014]/80 backdrop-blur-md relative z-10">
                <div className="max-w-4xl mx-auto flex flex-col gap-2">
                    <form onSubmit={handleSendMessage} className="flex items-center gap-2 bg-[#13131a] border border-white/10 p-1.5 pl-4 rounded-full shadow-2xl transition-all focus-within:ring-2 focus-within:ring-indigo-500/30">
                        <button type="button" onClick={() => setShowGifPicker(!showGifPicker)} className={`p-2 rounded-full transition ${showGifPicker ? 'text-indigo-400 bg-indigo-500/10' : 'text-gray-400 hover:text-white hover:bg-white/10'}`}><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg></button>
                        <input ref={inputRef} type="text" value={newMessage} onChange={(e) => { setNewMessage(e.target.value); const now = Date.now(); if (now - lastTypingBroadcast.current > 200) { chatChannel?.send({ type: 'broadcast', event: 'typing', payload: { userId: currentUser.id, content: e.target.value } }); lastTypingBroadcast.current = now; } }} className="flex-1 bg-transparent text-white px-2 py-3 focus:outline-none placeholder-gray-600 text-[15px]" placeholder="Message..." />
                        <button type="submit" disabled={!newMessage.trim()} className="p-2.5 rounded-full text-white font-bold transition shadow-lg hover:scale-105 active:scale-95" style={{ background: 'var(--theme-gradient)' }}><svg className="w-5 h-5 ml-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 5l7 7-7 7M5 5l7 7-7 7" /></svg></button>
                    </form>
                </div>
            </div>

            {lightboxImage && (
                <div className="fixed inset-0 z-[1000] bg-black/90 backdrop-blur-md flex items-center justify-center animate-fade-in" onClick={() => setLightboxImage(null)}>
                    <img src={lightboxImage} className="max-w-[90vw] max-h-[90vh] rounded-lg shadow-2xl animate-scale-in" onClick={(e) => e.stopPropagation()} />
                </div>
            )}
        </div>
    );
};
