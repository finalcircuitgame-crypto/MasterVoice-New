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
        ], { duration: 1200 + Math.random() * 600, easing: 'cubic-bezier(0.25, 1, 0.5, 1)' }).onfinish = () => el.remove();
    }
};

const DEFAULT_EMOJI_LIST = ["👍", "👎", "❤️", "🔥", "😂", "😢", "😮", "😡", "🎉", "👀"];
// Using environment variable for protected Giphy API key
const GIPHY_API_KEY = process.env.GIPHY_API_KEY || 'dc6zaTOxFJmzC';
const FALLBACK_GIR_GIFS = ["https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExM3Z6ZnB6OHRwaHpxeG85M3Z5Z2Z5Z2Z5Z2Z5Z2Z5Z2Z5Z2Z5ZyZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/V2mS31M44xLJC/giphy.gif", "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExM3Z6ZnB6OHRwaHpxeG85M3Z5Z2Z5Z2Z5Z2Z5Z2Z5Z2Z5Z2Z5ZyZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/mSguM0eKjF3mE/giphy.gif", "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExM3Z6ZnB6OHRwaHpxeG85M3Z5Z2Z5Z2Z5Z2Z5Z2Z5Z2Z5Z2Z5ZyZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/9S5iSgtLzU9Y170tH4/giphy.gif"];
const POLL_PREFIX = "$$POLL$$";
const VOTE_OPTIONS = ["1️⃣", "2️⃣", "3️⃣", "4️⃣"];

const MessageItem = React.memo<{ msg: Message; isMe: boolean; currentUser: UserProfile; onReaction: (msg: Message, emoji: string) => void; onEdit: (msg: Message) => void; onDelete: (id: string) => void; onPin: (msg: Message) => void; availableEmojis: string[]; onImageClick?: (url: string) => void; }>(({ msg, isMe, currentUser, onReaction, onEdit, onDelete, onPin, availableEmojis, onImageClick }) => {
    const [showActions, setShowActions] = useState(false);
    const senderName = isMe ? 'You' : (msg.sender?.email?.split('@')[0] || 'Unknown');
    const hasReacted = (emoji: string) => msg.reactions?.[emoji]?.includes(currentUser.id);
    const isError = msg.status === 'error';
    const isPinned = msg.reactions?.['📌'] && msg.reactions['📌'].length > 0;
    const isImageUrl = msg.content && msg.content.trim().match(/^https?:\/\/[^\s]+$/) && (msg.content.match(/\.(jpeg|jpg|gif|png|webp|svg)/i) || msg.content.includes('giphy.com/media') || msg.content.includes('media.giphy.com'));
    const isPoll = msg.content.startsWith(POLL_PREFIX);
    let pollData = null;
    if (isPoll) { try { pollData = JSON.parse(msg.content.replace(POLL_PREFIX, '')); } catch(e) {} }

    return (
        <div className={`w-full flex ${isMe ? 'justify-end' : 'justify-start'} mb-6 px-2 group relative`}>
            {isPinned && <div className={`absolute -top-3 ${isMe ? 'right-4' : 'left-14'} z-0`}><div className="bg-indigo-600 text-white text-[9px] font-bold px-2 py-0.5 rounded-t-lg shadow-sm">📌 Pinned</div></div>}
            <div className={`flex flex-col max-w-[85%] md:max-w-[70%] ${isMe ? 'items-end' : 'items-start'} relative z-10`}>
                <div className={`flex items-end gap-3 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                    {!isMe && <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center text-xs text-gray-300 font-bold mb-1 border border-white/10 overflow-hidden">{msg.sender?.avatar_url ? <img src={msg.sender.avatar_url} className="w-full h-full object-cover" /> : msg.sender?.email?.[0].toUpperCase()}</div>}
                    <div className="flex flex-col min-w-0 cursor-pointer relative" onClick={() => setShowActions(!showActions)}>
                        {!isMe && <span className="text-[10px] text-gray-500 ml-1 mb-1 font-bold">{senderName}</span>}
                        {showActions && !isError && (<div className={`absolute -top-12 ${isMe ? 'right-0' : 'left-0'} bg-[#1a1a20] border border-white/10 rounded-xl p-1 flex gap-1 shadow-xl z-20 animate-scale-in`}>
                                {!isPoll && availableEmojis.slice(0, 5).map(emoji => (<button key={emoji} onClick={(e) => { e.stopPropagation(); onReaction(msg, emoji); setShowActions(false); }} className="hover:bg-white/10 p-1 rounded transition text-sm">{emoji}</button>))}
                                <button onClick={(e) => { e.stopPropagation(); onPin(msg); setShowActions(false); }} className={`hover:bg-white/10 p-1.5 rounded transition ${isPinned ? 'text-indigo-400' : 'text-gray-400'}`}>📌</button>
                                {isMe && <button onClick={(e) => { e.stopPropagation(); onDelete(msg.id); }} className="hover:bg-white/10 p-1.5 rounded transition text-red-400">🗑️</button>}
                            </div>)}
                        <div className={`relative px-5 py-3 shadow-md backdrop-blur-md ${isPoll ? 'bg-gray-800 border border-white/10 rounded-xl' : (isMe ? 'bg-gradient-to-br from-[var(--theme-500)] to-[var(--theme-600)] text-white rounded-[1.2rem] rounded-br-sm' : 'bg-white/10 text-gray-100 rounded-[1.2rem] rounded-bl-sm border border-white/5')}`}>
                            {isPoll && pollData ? (<div className="text-white w-full"><h4 className="font-bold text-sm mb-3">Poll: {pollData.question}</h4><div className="space-y-2">{pollData.options.map((opt: string, i: number) => { const vk = VOTE_OPTIONS[i]; const t = Object.keys(msg.reactions || {}).filter(k => VOTE_OPTIONS.includes(k)).reduce((a, k) => a + (msg.reactions![k]?.length || 0), 0); const v = msg.reactions?.[vk]?.length || 0; const p = t > 0 ? Math.round((v / t) * 100) : 0; return <button key={i} onClick={(e) => { e.stopPropagation(); onReaction(msg, vk); }} className={`w-full p-2 rounded-lg border text-left relative overflow-hidden transition ${hasReacted(vk) ? 'border-indigo-500 bg-indigo-500/10' : 'border-white/10 hover:bg-white/5'}`}><div className="absolute top-0 left-0 bottom-0 bg-indigo-500/20" style={{ width: `${p}%` }}></div><div className="relative flex justify-between text-xs font-medium z-10"><span>{opt}</span><span>{p}%</span></div></button>})}</div></div>) : (
                                <>{isImageUrl && <img src={msg.content} alt="GIF" className="max-w-full rounded-lg max-h-80 object-cover border border-white/5 mb-2" onClick={(e) => { e.stopPropagation(); onImageClick?.(msg.content); }} />}{msg.content && !isImageUrl && <p className="leading-relaxed whitespace-pre-wrap break-words text-[15px]">{msg.content}</p>}</>
                            )}
                            <div className={`flex items-center justify-end mt-1.5 gap-1.5 ${isMe ? 'text-white/80' : 'text-gray-400'}`}><p className="text-[10px] font-medium">{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
});

export const GroupWindow: React.FC<{ currentUser: UserProfile; selectedGroup: Group; onlineUsers: Set<string>; }> = ({ currentUser, selectedGroup, onlineUsers }) => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [members, setMembers] = useState<UserProfile[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [showGifPicker, setShowGifPicker] = useState(false);
    const [gifSearch, setGifSearch] = useState('Gir');
    const [gifs, setGifs] = useState<any[]>([]);
    const [loadingGifs, setLoadingGifs] = useState(false);
    const [gifError, setGifError] = useState(false);
    const [lightboxImage, setLightboxImage] = useState<string | null>(null);
    const [showInfo, setShowInfo] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            const { data: msgs } = await supabase.from('messages').select('*, sender:sender_id(email, avatar_url)').eq('group_id', selectedGroup.id).order('created_at', { ascending: true });
            if (msgs) setMessages(msgs.map(m => ({ ...m, status: 'sent' })));
            const { data: mems } = await supabase.from('group_members').select('profiles(*)').eq('group_id', selectedGroup.id);
            if (mems) setMembers(mems.map((m: any) => m.profiles));
            setLoading(false);
        };
        load();
        const ch = supabase.channel(`group:${selectedGroup.id}`)
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `group_id=eq.${selectedGroup.id}` }, async (p) => {
                if (p.new.sender_id !== currentUser.id) { const { data } = await supabase.from('profiles').select('email, avatar_url').eq('id', p.new.sender_id).single(); setMessages(p_m => [...p_m, { ...p.new, sender: data, status: 'sent' } as Message]); }
            })
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'messages', filter: `group_id=eq.${selectedGroup.id}` }, (p) => setMessages(p_m => p_m.map(m => m.id === p.new.id ? { ...m, ...p.new } : m)))
            .subscribe();
        return () => { supabase.removeChannel(ch); };
    }, [selectedGroup.id, currentUser.id]);

    useEffect(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), [messages.length]);

    useEffect(() => {
        if (!showGifPicker) return;
        const fetchGifs = async () => {
            setLoadingGifs(true); setGifError(false);
            try {
                const res = await fetch(`https://api.giphy.com/v1/gifs/search?api_key=${GIPHY_API_KEY}&q=${encodeURIComponent(gifSearch || 'Gir')}&limit=25`);
                if (res.status === 403) throw new Error("Limited");
                const json = await res.json(); setGifs(json.data || []);
            } catch (e) { setGifError(true); setGifs(FALLBACK_GIR_GIFS.map((url, i) => ({ id: `fallback-${i}`, images: { fixed_height_small: { url }, original: { url } } }))); }
            finally { setLoadingGifs(false); }
        };
        const t = setTimeout(fetchGifs, 500); return () => clearTimeout(t);
    }, [gifSearch, showGifPicker]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e && e.preventDefault();
        const c = newMessage; if (!c.trim()) return; setNewMessage(''); setShowGifPicker(false); if (c.toLowerCase().includes('congrats')) triggerConfetti();
        const tempId = Math.random().toString();
        setMessages(p => [...p, { id: tempId, sender_id: currentUser.id, group_id: selectedGroup.id, content: c, created_at: new Date().toISOString(), status: 'sending', sender: { email: currentUser.email, avatar_url: currentUser.avatar_url } } as any]);
        await supabase.from('messages').insert({ sender_id: currentUser.id, group_id: selectedGroup.id, content: c });
    };

    return (
        <div className="flex h-full bg-[#030014] relative font-['Outfit'] overflow-hidden">
            <div className="flex-1 flex flex-col min-w-0">
                <div className="px-6 py-4 flex justify-between items-center bg-[#030014]/60 backdrop-blur-xl border-b border-white/5 sticky top-0 z-20 shadow-sm">
                    <div className="flex items-center gap-4 cursor-pointer" onClick={() => setShowInfo(!showInfo)}>
                        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-500 to-fuchsia-600 flex items-center justify-center text-white font-bold text-lg shadow-lg border border-white/10">{selectedGroup.name[0].toUpperCase()}</div>
                        <div><h2 className="font-bold text-white text-lg tracking-tight">{selectedGroup.name}</h2><span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">{members.length} Participants</span></div>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-2 no-scrollbar scroll-smooth">
                    {loading && <div className="flex justify-center py-10"><div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div></div>}
                    {messages.map(msg => (<MessageItem key={msg.id} msg={msg} isMe={msg.sender_id === currentUser.id} currentUser={currentUser} onReaction={async (m, e) => { const cr = m.reactions || {}; const u = cr[e] || []; const up = u.includes(currentUser.id) ? u.filter(x => x !== currentUser.id) : [...u, currentUser.id]; const r = { ...cr, [e]: up }; if (!up.length) delete r[e]; setMessages(p => p.map(x => x.id === m.id ? { ...x, reactions: r } : x)); await supabase.from('messages').update({ reactions: r }).eq('id', m.id); }} onEdit={() => {}} onDelete={async (id) => { setMessages(p => p.filter(m => m.id !== id)); await supabase.from('messages').delete().eq('id', id); }} onPin={() => {}} availableEmojis={DEFAULT_EMOJI_LIST} onImageClick={setLightboxImage} />))}
                    <div ref={messagesEndRef} />
                </div>

                {showGifPicker && (
                    <div className="absolute bottom-20 left-4 z-30 bg-[#1a1a20]/95 backdrop-blur-xl border border-white/10 rounded-2xl p-4 shadow-2xl animate-slide-up w-80">
                        <input autoFocus type="text" value={gifSearch} onChange={(e) => setGifSearch(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-full py-2 px-4 text-xs text-white outline-none focus:ring-2 focus:ring-indigo-500/50 mb-3" placeholder="Search GIFs..." />
                        <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto custom-scrollbar pr-1">
                            {gifs.map((gif, i) => (<img key={gif.id} src={gif.images.fixed_height_small.url} alt="GIF" className="w-full h-24 object-cover rounded-lg cursor-pointer hover:scale-105 transition" onClick={async () => { const tempId = Math.random().toString(); setMessages(p => [...p, { id: tempId, sender_id: currentUser.id, group_id: selectedGroup.id, content: gif.images.original.url, created_at: new Date().toISOString(), status: 'sending', sender: { email: currentUser.email, avatar_url: currentUser.avatar_url } } as any]); setShowGifPicker(false); await supabase.from('messages').insert({ sender_id: currentUser.id, group_id: selectedGroup.id, content: gif.images.original.url }); }} />))}
                        </div>
                    </div>
                )}

                <div className="p-4 pb-safe bg-[#030014]/80 backdrop-blur-md">
                    <form onSubmit={handleSendMessage} className="max-w-4xl mx-auto flex items-center gap-2 bg-[#13131a] border border-white/10 p-1.5 pl-4 rounded-full shadow-2xl">
                        <button type="button" onClick={() => setShowGifPicker(!showGifPicker)} className="p-2 rounded-full text-gray-400"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg></button>
                        <input type="text" value={newMessage} onChange={(e) => setNewMessage(e.target.value)} className="flex-1 bg-transparent text-white px-2 py-3 focus:outline-none placeholder-gray-600" placeholder="Group message..." />
                        <button type="submit" className="p-2.5 rounded-full text-white font-bold" style={{ background: 'var(--theme-gradient)' }}><svg className="w-5 h-5 ml-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 5l7 7-7 7M5 5l7 7-7 7" /></svg></button>
                    </form>
                </div>
            </div>

            {showInfo && (
                <div className="w-72 border-l border-white/5 bg-[#060609]/60 backdrop-blur-xl animate-slide-in-right p-6 overflow-y-auto no-scrollbar hidden lg:block">
                    <div className="flex items-center justify-between mb-8">
                        <h3 className="font-bold text-white uppercase text-xs tracking-widest">Group Info</h3>
                        <button onClick={() => setShowInfo(false)} className="text-gray-500 hover:text-white transition"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
                    </div>
                    <div className="text-center mb-8">
                        <div className="w-24 h-24 rounded-[2rem] bg-indigo-500/20 flex items-center justify-center mx-auto mb-4 border border-indigo-500/30 text-3xl font-bold text-indigo-400">{selectedGroup.name[0]}</div>
                        <h4 className="text-xl font-bold text-white">{selectedGroup.name}</h4>
                        <p className="text-[10px] text-gray-500 uppercase font-black mt-2 tracking-tighter">Created {new Date(selectedGroup.created_at).toLocaleDateString()}</p>
                    </div>
                    <h5 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Participants</h5>
                    <div className="space-y-3">
                        {members.map(m => (
                            <div key={m.id} className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center text-[10px] font-bold text-white border border-white/5 overflow-hidden">{m.avatar_url ? <img src={m.avatar_url} className="w-full h-full object-cover" /> : m.email[0].toUpperCase()}</div>
                                <div className="min-w-0"><p className="text-xs font-bold text-white truncate">{m.email.split('@')[0]}</p><p className="text-[9px] text-green-500 font-bold uppercase tracking-widest">{onlineUsers.has(m.id) ? 'Online' : 'Away'}</p></div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {lightboxImage && (<div className="fixed inset-0 z-[1000] bg-black/90 backdrop-blur-md flex items-center justify-center animate-fade-in" onClick={() => setLightboxImage(null)}><img src={lightboxImage} className="max-w-[90vw] max-h-[90vh] rounded-lg shadow-2xl animate-scale-in" /></div>)}
        </div>
    );
};