import React, { useEffect, useState, useRef } from 'react';
import { supabase } from '../supabaseClient';
import { Message, UserProfile, Group } from '../types';
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

const DEFAULT_EMOJI_LIST = ["👍", "👎", "❤️", "🔥", "😂", "😢", "😮", "😡", "🎉", "👀"];
const GIPHY_API_KEY = 'dc6zaTOxFJmzC';

const POLL_PREFIX = "$$POLL$$";
const VOTE_OPTIONS = ["1️⃣", "2️⃣", "3️⃣", "4️⃣"];

const MessageItem = React.memo<{
    msg: Message;
    isMe: boolean;
    currentUser: UserProfile;
    onReaction: (msg: Message, emoji: string) => void;
    onEdit: (msg: Message) => void;
    onDelete: (id: string) => void;
    onPin: (msg: Message) => void;
    availableEmojis: string[];
    onImageClick?: (url: string) => void;
}>(({ msg, isMe, currentUser, onReaction, onEdit, onDelete, onPin, availableEmojis, onImageClick }) => {
    const [showActions, setShowActions] = useState(false);
    
    const senderName = isMe ? 'You' : (msg.sender?.email?.split('@')[0] || 'Unknown');
    const senderAvatar = msg.sender?.avatar_url;
    const senderInitial = msg.sender?.email ? msg.sender.email[0].toUpperCase() : '?';

    const hasReacted = (emoji: string) => msg.reactions?.[emoji]?.includes(currentUser.id);
    const isError = msg.status === 'error';
    const isPinned = msg.reactions?.['📌'] && msg.reactions['📌'].length > 0;

    const isUrl = msg.content && msg.content.trim().match(/^https?:\/\/[^\s]+$/);
    const isImageUrl = isUrl && (msg.content.match(/\.(jpeg|jpg|gif|png|webp|svg)/i) || msg.content.includes('giphy.com/media') || msg.content.includes('media.giphy.com'));

    const isPoll = msg.content.startsWith(POLL_PREFIX);
    let pollData = null;
    if (isPoll) {
        try { pollData = JSON.parse(msg.content.replace(POLL_PREFIX, '')); } catch(e) {}
    }

    return (
        <div className={`w-full flex ${isMe ? 'justify-end' : 'justify-start'} mb-6 px-2 group relative`}>
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
                        {showActions && !isError && (
                            <div className={`absolute -top-12 ${isMe ? 'right-0' : 'left-0'} bg-[#1a1a20] border border-white/10 rounded-xl p-1 flex gap-1 shadow-xl z-20 animate-scale-in`}>
                                {!isPoll && availableEmojis.slice(0, 5).map(emoji => (
                                    <button key={emoji} onClick={(e) => { e.stopPropagation(); onReaction(msg, emoji); setShowActions(false); }} className="hover:bg-white/10 p-1 rounded transition text-sm">{emoji}</button>
                                ))}
                                <div className="w-px bg-white/10 mx-1"></div>
                                <button onClick={(e) => { e.stopPropagation(); onPin(msg); setShowActions(false); }} className={`hover:bg-white/10 p-1.5 rounded transition ${isPinned ? 'text-indigo-400' : 'text-gray-400'}`} title={isPinned ? "Unpin" : "Pin"}>📌</button>
                                {isMe && (
                                    <>
                                        {!isPoll && !isImageUrl && <button onClick={(e) => { e.stopPropagation(); onEdit(msg); setShowActions(false); }} className="hover:bg-white/10 p-1.5 rounded transition text-gray-400" title="Edit">✏️</button>}
                                        <button onClick={(e) => { e.stopPropagation(); onDelete(msg.id); }} className="hover:bg-white/10 p-1.5 rounded transition text-red-400" title="Delete">🗑️</button>
                                    </>
                                )}
                            </div>
                        )}
                        <div className={`relative px-5 py-3 shadow-md backdrop-blur-md ${isPoll ? 'bg-gray-800 border border-white/10 rounded-xl w-full min-w-[250px]' : (isMe ? 'bg-gradient-to-br from-[var(--theme-500)] to-[var(--theme-600)] text-white rounded-[1.2rem] rounded-br-sm' : 'bg-white/10 text-gray-100 rounded-[1.2rem] rounded-bl-sm border border-white/5')} ${isError ? 'border-red-500 bg-red-900/10' : ''} ${isPinned ? 'ring-1 ring-indigo-500/50' : ''}`}>
                            {isPoll && pollData ? (
                                <div className="text-white w-full">
                                    <h4 className="font-bold text-sm mb-3 flex items-center gap-2"><svg className="w-4 h-4 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>Poll: {pollData.question}</h4>
                                    <div className="space-y-2">
                                        {pollData.options.map((opt: string, i: number) => {
                                            const voteKey = VOTE_OPTIONS[i];
                                            const total = Object.keys(msg.reactions || {}).filter(k => VOTE_OPTIONS.includes(k)).reduce((acc, k) => acc + (msg.reactions![k]?.length || 0), 0);
                                            const votes = msg.reactions?.[voteKey]?.length || 0;
                                            const pct = total > 0 ? Math.round((votes / total) * 100) : 0;
                                            return <button key={i} onClick={(e) => { e.stopPropagation(); onReaction(msg, voteKey); }} className={`w-full p-2 rounded-lg border text-left relative overflow-hidden transition ${hasReacted(voteKey) ? 'border-indigo-500 bg-indigo-500/10' : 'border-white/10 hover:bg-white/5'}`}><div className={`absolute top-0 left-0 bottom-0 bg-indigo-500/20 transition-all duration-500`} style={{ width: `${pct}%` }}></div><div className="relative flex justify-between text-xs font-medium z-10"><span>{opt}</span><span>{pct}% ({votes})</span></div></button>
                                        })}
                                    </div>
                                </div>
                            ) : (
                                <>
                                    {isImageUrl && <img src={msg.content} alt="GIF" className="max-w-full rounded-lg max-h-80 object-cover border border-white/5 mb-2" onClick={(e) => { e.stopPropagation(); onImageClick?.(msg.content); }} />}
                                    {msg.content && !isImageUrl && <p className="leading-relaxed whitespace-pre-wrap break-words text-[15px]">{msg.content}</p>}
                                </>
                            )}
                            <div className={`flex items-center justify-end mt-1.5 gap-1.5 ${isMe ? 'text-white/80' : 'text-gray-400'}`}>
                                <p className="text-[10px] font-medium">{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
});

export const GroupWindow: React.FC<{ currentUser: UserProfile; selectedGroup: Group; onlineUsers: Set<string>; }> = ({ currentUser, selectedGroup, onlineUsers }) => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    
    // GIF States
    const [showGifPicker, setShowGifPicker] = useState(false);
    const [gifSearch, setGifSearch] = useState('Gir');
    const [gifs, setGifs] = useState<any[]>([]);
    const [loadingGifs, setLoadingGifs] = useState(false);
    
    const [lightboxImage, setLightboxImage] = useState<string | null>(null);
    const [editingId, setEditingId] = useState<string | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            const { data } = await supabase.from('messages').select('*, sender:sender_id(email, avatar_url)').eq('group_id', selectedGroup.id).order('created_at', { ascending: true });
            if (data) setMessages(data.map(m => ({ ...m, status: 'sent' })));
            setLoading(false);
        };
        load();
        const channel = supabase.channel(`group:${selectedGroup.id}`)
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `group_id=eq.${selectedGroup.id}` }, async (payload) => {
                if (payload.new.sender_id !== currentUser.id) {
                     const { data } = await supabase.from('profiles').select('email, avatar_url').eq('id', payload.new.sender_id).single();
                     setMessages(prev => [...prev, { ...payload.new, sender: data, status: 'sent' } as Message]);
                }
            })
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'messages', filter: `group_id=eq.${selectedGroup.id}` }, (p) => setMessages(prev => prev.map(m => m.id === p.new.id ? { ...m, ...p.new } : m)))
            .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'messages', filter: `group_id=eq.${selectedGroup.id}` }, (p) => setMessages(prev => prev.filter(m => m.id !== p.old.id)))
            .subscribe();
        return () => { supabase.removeChannel(channel); };
    }, [selectedGroup.id, currentUser.id]);

    useEffect(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), [messages.length]);

    // GIPHY Fetch Logic
    useEffect(() => {
        if (!showGifPicker) return;
        const fetchGifs = async () => {
            setLoadingGifs(true);
            try {
                const endpoint = gifSearch.trim() 
                    ? `https://api.giphy.com/v1/gifs/search?api_key=${GIPHY_API_KEY}&q=${encodeURIComponent(gifSearch)}&limit=20`
                    : `https://api.giphy.com/v1/gifs/trending?api_key=${GIPHY_API_KEY}&limit=20`;
                const res = await fetch(endpoint);
                const json = await res.json();
                setGifs(json.data || []);
            } catch (e) { console.error(e); }
            finally { setLoadingGifs(false); }
        };
        const timer = setTimeout(fetchGifs, 500);
        return () => clearTimeout(timer);
    }, [gifSearch, showGifPicker]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e && e.preventDefault();
        const content = newMessage;
        if (!content.trim()) return;
        setNewMessage('');
        setShowGifPicker(false);
        if (content.toLowerCase().includes('congrats')) triggerConfetti();

        if (editingId) {
            await supabase.from('messages').update({ content, updated_at: new Date().toISOString() }).eq('id', editingId);
            setEditingId(null);
            return;
        }

        const tempId = Math.random().toString();
        const optimisticMsg: any = { id: tempId, sender_id: currentUser.id, group_id: selectedGroup.id, content, created_at: new Date().toISOString(), status: 'sending', sender: { email: currentUser.email, avatar_url: currentUser.avatar_url } };
        setMessages(prev => [...prev, optimisticMsg]);
        
        const { data, error } = await supabase.from('messages').insert({ sender_id: currentUser.id, group_id: selectedGroup.id, content }).select().single();
        
        if (error) {
            setMessages(prev => prev.map(m => m.id === tempId ? { ...m, status: 'error' } : m));
        } else {
            setMessages(prev => prev.map(m => m.id === tempId ? { ...data, sender: { email: currentUser.email, avatar_url: currentUser.avatar_url }, status: 'sent' } : m));
        }
    };

    const handleSendGif = (url: string) => {
        const tempId = Math.random().toString();
        const optimisticMsg: any = { id: tempId, sender_id: currentUser.id, group_id: selectedGroup.id, content: url, created_at: new Date().toISOString(), status: 'sending', sender: { email: currentUser.email, avatar_url: currentUser.avatar_url } };
        setMessages(prev => [...prev, optimisticMsg]);
        setShowGifPicker(false);
        supabase.from('messages').insert({ sender_id: currentUser.id, group_id: selectedGroup.id, content: url }).then(({ data, error }) => {
            if (error) setMessages(prev => prev.map(m => m.id === tempId ? { ...m, status: 'error' } : m));
            else setMessages(prev => prev.map(m => m.id === tempId ? { ...data, sender: { email: currentUser.email, avatar_url: currentUser.avatar_url }, status: 'sent' } : m));
        });
    };

    const handleReaction = async (msg: Message, emoji: string) => {
        const current = msg.reactions || {};
        const users = current[emoji] || [];
        const updated = users.includes(currentUser.id) ? users.filter(u => u !== currentUser.id) : [...users, currentUser.id];
        const newReactions = { ...current, [emoji]: updated };
        if (updated.length === 0) delete newReactions[emoji];
        setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, reactions: newReactions } : m));
        await supabase.from('messages').update({ reactions: newReactions }).eq('id', msg.id);
    };

    const handlePin = async (msg: Message) => handleReaction(msg, '📌');
    const handleDeleteMessage = (id: string) => supabase.from('messages').delete().eq('id', id);

    return (
        <div className="flex flex-col h-full bg-[#030014] relative font-['Outfit']">
            <div className="px-6 py-4 flex justify-between items-center bg-[#030014]/60 backdrop-blur-xl border-b border-white/5 sticky top-0 z-20 shadow-sm">
                <div className="flex items-center gap-4">
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-500 to-fuchsia-600 flex items-center justify-center text-white font-bold text-lg shadow-lg border border-white/10">{selectedGroup.name[0].toUpperCase()}</div>
                    <div><h2 className="font-bold text-white text-lg tracking-tight">{selectedGroup.name}</h2><span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Group Chat</span></div>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-2 no-scrollbar scroll-smooth">
                {loading && <div className="flex justify-center py-10"><div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div></div>}
                {messages.map(msg => (
                    <MessageItem key={msg.id} msg={msg} isMe={msg.sender_id === currentUser.id} currentUser={currentUser} onReaction={handleReaction} onEdit={(m) => { setEditingId(m.id); setNewMessage(m.content); }} onDelete={handleDeleteMessage} onPin={handlePin} availableEmojis={DEFAULT_EMOJI_LIST} onImageClick={setLightboxImage} />
                ))}
                <div ref={messagesEndRef} />
            </div>

            {showGifPicker && (
                <div className="absolute bottom-20 left-4 z-30 bg-[#1a1a20]/95 backdrop-blur-xl border border-white/10 rounded-2xl p-4 shadow-2xl animate-slide-up w-80">
                    <div className="relative mb-3">
                         <input 
                            autoFocus
                            type="text" 
                            value={gifSearch} 
                            onChange={(e) => setGifSearch(e.target.value)} 
                            className="w-full bg-black/40 border border-white/10 rounded-full py-2 px-4 text-xs text-white outline-none focus:ring-2 focus:ring-indigo-500/50" 
                            placeholder="Search GIFs..." 
                         />
                         {loadingGifs && <div className="absolute right-3 top-2.5 w-3 h-3 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>}
                    </div>
                    <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto custom-scrollbar pr-1">
                        {gifs.length === 0 && !loadingGifs && <div className="col-span-2 text-center py-10 text-xs text-gray-500">No GIFs found</div>}
                        {gifs.map((gif, i) => (
                            <img 
                                key={gif.id} 
                                src={gif.images.fixed_height_small.url} 
                                alt="GIF" 
                                className="w-full h-24 object-cover rounded-lg cursor-pointer hover:scale-105 transition" 
                                onClick={() => handleSendGif(gif.images.original.url)} 
                            />
                        ))}
                    </div>
                    <div className="mt-2 text-[8px] text-gray-600 uppercase tracking-widest text-center">Powered by Giphy</div>
                </div>
            )}

            <div className="p-4 pb-safe bg-[#030014]/80 backdrop-blur-md">
                <form onSubmit={handleSendMessage} className="max-w-4xl mx-auto flex items-center gap-2 bg-[#13131a] border border-white/10 p-1.5 pl-4 rounded-full shadow-2xl focus-within:ring-2 focus-within:ring-indigo-500/30">
                    <button type="button" onClick={() => setShowGifPicker(!showGifPicker)} className={`p-2 rounded-full transition ${showGifPicker ? 'text-indigo-400 bg-indigo-500/10' : 'text-gray-400 hover:text-white hover:bg-white/10'}`}><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg></button>
                    <input type="text" value={newMessage} onChange={(e) => setNewMessage(e.target.value)} className="flex-1 bg-transparent text-white px-2 py-3 focus:outline-none placeholder-gray-600 text-[15px]" placeholder="Group message..." />
                    <button type="submit" className="p-2.5 rounded-full text-white font-bold transition shadow-lg" style={{ background: 'var(--theme-gradient)' }}><svg className="w-5 h-5 ml-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 5l7 7-7 7M5 5l7 7-7 7" /></svg></button>
                </form>
            </div>

            {lightboxImage && (
                <div className="fixed inset-0 z-[1000] bg-black/90 backdrop-blur-md flex items-center justify-center animate-fade-in" onClick={() => setLightboxImage(null)}>
                    <img src={lightboxImage} className="max-w-[90vw] max-h-[90vh] rounded-lg shadow-2xl animate-scale-in" />
                </div>
            )}
        </div>
    );
};