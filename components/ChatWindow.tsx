import React, { useEffect, useState, useRef } from 'react';
import { supabase } from '../supabaseClient';
import { Message, UserProfile, CallState, Attachment } from '../types';
import { ICE_SERVERS } from '../constants';
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
    recipient: UserProfile;
    onlineUsers: Set<string>;
    channel: any | null; 
    callState: CallState;
    onStartCall: () => void;
    onAnswerCall: () => void;
    onEndCall: () => void;
}

interface MessageItemProps {
    msg: Message;
    isMe: boolean;
    recipient: UserProfile;
    currentUser: UserProfile;
    onEdit: (msg: Message) => void;
    onDelete: (id: string) => void;
    onRetry: (msg: Message) => void;
    onReply: (msg: Message) => void;
    onReaction: (msg: Message, emoji: string) => void;
    onJumpTo: (messageId: string) => void;
    isHighlighted: boolean;
    isFamily?: boolean;
}

// FAMILY FEATURE: Exclusive emoji for family members
const getAvailableReactions = (isFamily: boolean) => {
    const base = ["👍", "❤️", "😂", "😮", "😢"];
    if (isFamily) base.push("👑"); // Family Feature
    return base;
};

const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
};

// Optimized MessageItem with React.memo to prevent re-renders on parent state changes (like typing)
const MessageItem = React.memo<MessageItemProps>(({
    msg,
    isMe,
    recipient,
    currentUser,
    onEdit,
    onDelete,
    onRetry,
    onReply,
    onReaction,
    onJumpTo,
    isHighlighted,
    isFamily
}) => {
    const [showActions, setShowActions] = useState(false);
    const [imageLoaded, setImageLoaded] = useState(false);
    const [showReactions, setShowReactions] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const actionsMenuRef = useRef<HTMLDivElement>(null);

    // Check if message was recently edited
    const isRecentlyEdited = msg.updated_at && msg.created_at &&
        new Date(msg.updated_at).getTime() > new Date(msg.created_at).getTime() + 1000;

    const isSending = msg.status === 'sending';
    const isError = msg.status === 'error';

    const hasReacted = (emoji: string) => {
        return msg.reactions?.[emoji]?.includes(currentUser.id);
    };

    const reactionsList = getAvailableReactions(!!isFamily);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                containerRef.current &&
                !containerRef.current.contains(event.target as Node) &&
                (!actionsMenuRef.current || !actionsMenuRef.current.contains(event.target as Node))
            ) {
                setShowActions(false);
                setShowReactions(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside, true);
        return () => document.removeEventListener('mousedown', handleClickOutside, true);
    }, []);

    const handleToggleActions = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setShowActions(!showActions);
    };

    const renderAttachment = () => {
        if (!msg.attachment) return null;

        if (msg.attachment.type === 'image') {
            return (
                <div className="mb-2 relative rounded-lg overflow-hidden group/image pointer-events-none">
                    {!imageLoaded && (
                        <div className="w-full h-48 bg-gray-800/50 animate-pulse flex items-center justify-center">
                            <svg className="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                        </div>
                    )}
                    <img
                        src={msg.attachment.url}
                        alt="Attachment"
                        className={`max-w-full rounded-lg max-h-80 object-cover transition-opacity duration-300 ${imageLoaded ? 'opacity-100' : 'opacity-0 absolute top-0 left-0'}`}
                        onLoad={() => setImageLoaded(true)}
                    />
                </div>
            );
        }

        if (msg.attachment.type === 'audio') {
            return (
                <div className={`flex items-center gap-3 p-3 pr-2 rounded-xl mb-2 transition-colors ${isMe ? 'bg-indigo-800/20' : 'bg-black/20'} border border-white/5 min-w-[220px]`}>
                     <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${isMe ? 'bg-white/10 text-indigo-300' : 'bg-indigo-500/20 text-indigo-400'}`}>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
                     </div>
                     <div className="flex-1 flex flex-col justify-center min-w-0">
                        <audio controls src={msg.attachment.url} className="h-8 w-full max-w-[200px] opacity-90 accent-indigo-500" style={{ filter: isMe ? 'invert(1) hue-rotate(180deg)' : 'none' }} />
                        <span className="text-[10px] text-gray-400 mt-1 ml-1 font-mono">Voice Message</span>
                     </div>
                </div>
            );
        }

        return (
            <div className={`flex items-center gap-3 p-3 rounded-xl mb-2 transition-colors ${isMe ? 'bg-white/10' : 'bg-black/20'} border border-white/10`}>
                <div className="w-10 h-10 rounded-lg bg-gray-800 flex items-center justify-center text-indigo-400 shrink-0">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                </div>
                <div className="min-w-0 overflow-hidden">
                    <p className="text-sm font-bold truncate text-white">{msg.attachment.name}</p>
                    <p className="text-xs text-gray-400">{formatFileSize(msg.attachment.size)}</p>
                </div>
            </div>
        );
    };

    return (
        <div
            id={`msg-${msg.id}`}
            ref={containerRef}
            className={`w-full flex ${isMe ? 'justify-end' : 'justify-start'} mb-6 animate-message-enter px-2 transition-all duration-500 ${isHighlighted ? 'scale-105' : ''}`}
        >
            <div className={`flex flex-col max-w-[85%] md:max-w-[70%] ${isMe ? 'items-end' : 'items-start'}`}>
                <div className={`flex items-end gap-3 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                    {/* Avatar for Recipient */}
                    {!isMe && (
                        <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center text-xs text-gray-300 font-bold shrink-0 mb-1 border border-white/10 shadow-sm overflow-hidden">
                            {recipient.avatar_url ? (
                                <img src={recipient.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                            ) : (
                                recipient.email[0].toUpperCase()
                            )}
                        </div>
                    )}

                    {/* Message Bubble Wrapper */}
                    <div
                        className="flex flex-col min-w-0 cursor-pointer relative group"
                        onClick={handleToggleActions}
                    >
                        {/* Action Menu */}
                        {showActions && !isSending && !isError && (
                            <div
                                ref={actionsMenuRef}
                                className={`absolute z-50 flex items-center gap-1 p-1.5 bg-[#1a1a20] border border-white/10 rounded-full shadow-2xl animate-scale-in -top-12 ${isMe ? 'right-0' : 'left-0'}`}
                                onClick={(e) => e.stopPropagation()} 
                                style={{ minWidth: 'max-content' }}
                            >
                                <div className="relative">
                                    <button
                                        onClick={() => setShowReactions(!showReactions)}
                                        className="p-2 hover:bg-white/10 rounded-full text-gray-400 hover:text-indigo-400 transition"
                                        title="React"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                    </button>
                                    {showReactions && (
                                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 flex bg-[#2a2a30] border border-white/20 rounded-full p-1 shadow-xl z-50 min-w-max">
                                            {reactionsList.map(emoji => (
                                                <button
                                                    key={emoji}
                                                    onClick={() => { onReaction(msg, emoji); setShowReactions(false); setShowActions(false); }}
                                                    className={`p-2 hover:bg-white/10 rounded-full transition text-lg ${hasReacted(emoji) ? 'bg-indigo-500/20' : ''}`}
                                                >
                                                    {emoji}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <button onClick={() => { onReply(msg); setShowActions(false); }} className="p-2 hover:bg-white/10 rounded-full text-gray-400 hover:text-white transition" title="Reply">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" /></svg>
                                </button>

                                {isMe && !msg.attachment && (
                                    <button onClick={() => { onEdit(msg); setShowActions(false); }} className="p-2 hover:bg-white/10 rounded-full text-gray-400 hover:text-white transition" title="Edit">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                    </button>
                                )}

                                {isMe && (
                                    <button onClick={() => { onDelete(msg.id); setShowActions(false); }} className="p-2 hover:bg-white/10 rounded-full text-gray-400 hover:text-red-500 transition" title="Delete">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                    </button>
                                )}
                            </div>
                        )}

                        {/* Reply Context */}
                        {msg.reply_to && (
                            <div 
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onJumpTo(msg.reply_to!.id);
                                }}
                                className={`mb-1 px-3 py-1.5 rounded-lg bg-white/5 border-l-2 border-indigo-500 text-xs text-gray-400 max-w-full truncate opacity-80 flex items-center gap-2 cursor-pointer hover:bg-white/10 transition-colors ${isMe ? 'ml-auto' : ''}`}
                            >
                                <span className="font-bold text-indigo-400 shrink-0">{msg.reply_to.sender_id === currentUser.id ? 'You' : (recipient.id === msg.reply_to.sender_id ? recipient.email.split('@')[0] : 'Unknown')}</span>
                                <span className="truncate max-w-[150px]">{msg.reply_to.attachment ? '📷 [Attachment]' : msg.reply_to.content}</span>
                            </div>
                        )}

                        <div className={`relative px-5 py-3 shadow-md transition-all duration-300 backdrop-blur-md hover:brightness-110 ${isMe
                                ? 'bg-gradient-to-br from-indigo-600 to-violet-600 text-white rounded-[1.2rem] rounded-br-sm border border-white/10 shadow-indigo-500/10'
                                : 'bg-white/10 text-gray-100 rounded-[1.2rem] rounded-bl-sm border border-white/5 shadow-black/20'
                            } ${isRecentlyEdited ? 'animate-message-flash' : ''} ${isHighlighted ? 'ring-2 ring-white/50 shadow-[0_0_20px_rgba(255,255,255,0.3)] bg-indigo-500/40' : ''} ${isSending ? 'opacity-70' : ''} ${isError ? 'border-red-500/50 bg-red-900/10' : ''}`}>

                            {renderAttachment()}

                            {msg.content && <p className="leading-relaxed whitespace-pre-wrap break-words text-[15px] select-text pointer-events-none">{msg.content}</p>}

                            <div className={`flex items-center justify-between mt-1.5 gap-3 select-none ${isMe ? 'text-indigo-200/80' : 'text-gray-400'}`}>
                                <div className="flex items-center gap-1.5">
                                    <p className="text-[10px] font-medium">
                                        {isSending ? 'Sending...' : isError ? 'Failed' : new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                </div>
                                {isRecentlyEdited && <span className="text-[9px] opacity-70 italic">edited</span>}
                            </div>
                        </div>

                        {/* Reactions Display */}
                        {msg.reactions && Object.keys(msg.reactions).some(k => msg.reactions![k].length > 0) && (
                            <div className={`flex gap-1 mt-1 ${isMe ? 'justify-end' : 'justify-start'}`}>
                                {Object.entries(msg.reactions).map(([emoji, users]) => (
                                    users.length > 0 && (
                                        <button
                                            key={emoji}
                                            onClick={(e) => { e.stopPropagation(); onReaction(msg, emoji); }}
                                            className={`px-1.5 py-0.5 rounded-full text-[10px] border flex items-center gap-1 transition ${hasReacted(emoji)
                                                    ? 'bg-indigo-500/20 border-indigo-500/30 text-indigo-300'
                                                    : 'bg-gray-800/50 border-white/5 text-gray-400 hover:bg-white/10'
                                                }`}
                                        >
                                            <span>{emoji}</span>
                                            <span className="font-bold">{users.length}</span>
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
}, (prev, next) => {
    // Custom Comparator to ignore constant function prop recreation on parent re-render
    return (
        prev.msg === next.msg && 
        prev.isMe === next.isMe && 
        prev.isHighlighted === next.isHighlighted && 
        prev.isFamily === next.isFamily &&
        prev.recipient.id === next.recipient.id &&
        prev.recipient.avatar_url === next.recipient.avatar_url &&
        prev.currentUser.id === next.currentUser.id
    );
});

export const ChatWindow: React.FC<ChatWindowProps> = ({
    currentUser,
    recipient,
    onlineUsers,
    callState,
    onStartCall,
    onEndCall,
    onAnswerCall
}) => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [editingId, setEditingId] = useState<string | null>(null);
    const [replyingTo, setReplyingTo] = useState<Message | null>(null);
    const [loading, setLoading] = useState(true);
    const [isTyping, setIsTyping] = useState(false);
    const [highlightedMessageId, setHighlightedMessageId] = useState<string | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const typingTimeoutRef = useRef<any>(null);
    const [chatChannel, setChatChannel] = useState<ReturnType<typeof supabase.channel> | null>(null);

    // File Upload State
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);

    // Recording State
    const [isRecording, setIsRecording] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);

    // Call Terms & Modals
    const [showCallTerms, setShowCallTerms] = useState(false);
    const [pendingAction, setPendingAction] = useState<'start' | 'answer' | null>(null);
    const hasAcceptedTerms = useRef(localStorage.getItem('mv_call_terms_accepted') === 'true');
    const inputRef = useRef<HTMLInputElement>(null);

    const { showAlert, showConfirm } = useModal();

    const isRecipientOnline = onlineUsers.has(recipient.id);
    const isPenguin = recipient.email === 'cindygaldamez@yahoo.com';
    const roomId = [currentUser.id, recipient.id].sort().join('_');

    useEffect(() => {
        const chatRoomId = [currentUser.id, recipient.id].sort().join('_');
        const newChannel = supabase.channel(`chat_messages:${chatRoomId}`);

        newChannel
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'messages' },
                (payload) => {
                    const { eventType, new: newRecord, old: oldRecord } = payload;
                    const record = (newRecord || oldRecord) as any;
                    if (!record) return;
                    const isRelevant =
                        (record.sender_id === currentUser.id && record.receiver_id === recipient.id) ||
                        (record.sender_id === recipient.id && record.receiver_id === currentUser.id);
                    if (!isRelevant) return;

                    if (eventType === 'INSERT') {
                        setMessages((prev) => {
                            if (prev.find(m => m.id === newRecord.id)) return prev;
                            return [...prev, { ...newRecord, status: 'sent' } as Message];
                        });
                        if (record.sender_id === recipient.id) {
                            setIsTyping(false);
                            if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
                        }
                    } else if (eventType === 'UPDATE') {
                        setMessages((prev) => prev.map(m => m.id === newRecord.id ? { ...m, ...newRecord, status: 'sent', reply_to: m.reply_to } : m));
                    } else if (eventType === 'DELETE') {
                        setMessages((prev) => prev.filter(m => m.id !== oldRecord.id));
                    }
                }
            )
            .on('broadcast', { event: 'typing' }, (payload) => {
                if (payload.payload.userId === recipient.id) {
                    setIsTyping(true);
                    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
                    typingTimeoutRef.current = setTimeout(() => setIsTyping(false), 3000);
                }
            })
            .subscribe();

        setChatChannel(newChannel);
        return () => { supabase.removeChannel(newChannel); };
    }, [currentUser.id, recipient.id]);

    useEffect(() => {
        const fetchMessages = async () => {
            setLoading(true);
            const { data, error } = await supabase
                .from('messages')
                .select(`*, reply_to:reply_to_id(id, content, sender_id, attachment)`)
                .or(`sender_id.eq.${currentUser.id},receiver_id.eq.${currentUser.id}`)
                .or(`sender_id.eq.${recipient.id},receiver_id.eq.${recipient.id}`)
                .order('created_at', { ascending: true });

            if (!error && data) {
                const conversation = data.filter(
                    (m: any) =>
                        (m.sender_id === currentUser.id && m.receiver_id === recipient.id) ||
                        (m.sender_id === recipient.id && m.receiver_id === currentUser.id)
                );
                setMessages(conversation.map((m: any) => ({ ...m, status: 'sent' })));
            }
            setLoading(false);
        };
        fetchMessages();
    }, [currentUser.id, recipient.id]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages.length, messages.length > 0 ? messages[messages.length - 1].id : null, isTyping, replyingTo]);

    // Recording Timer
    useEffect(() => {
        let interval: any;
        if (isRecording) {
            interval = setInterval(() => {
                setRecordingTime(prev => prev + 1);
            }, 1000);
        } else {
            setRecordingTime(0);
        }
        return () => clearInterval(interval);
    }, [isRecording]);

    const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        setNewMessage(e.target.value);
        chatChannel?.send({ type: 'broadcast', event: 'typing', payload: { userId: currentUser.id } });
    };

    const handleStartRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            
            // Determine supported mimeType
            let mimeType = 'audio/webm';
            if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
                mimeType = 'audio/webm;codecs=opus';
            } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
                mimeType = 'audio/mp4';
            }

            const recorder = new MediaRecorder(stream, { mimeType });
            mediaRecorderRef.current = recorder;
            audioChunksRef.current = [];

            recorder.ondataavailable = (e) => {
                if (e.data.size > 0) {
                    audioChunksRef.current.push(e.data);
                }
            };

            recorder.start();
            setIsRecording(true);
        } catch (err) {
            console.error("Failed to start recording", err);
            await showAlert("Microphone Error", "Could not access microphone.");
        }
    };

    const handleStopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.onstop = () => {
                const mimeType = mediaRecorderRef.current?.mimeType || 'audio/webm';
                const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
                const ext = mimeType.includes('mp4') ? 'mp4' : 'webm';
                const audioFile = new File([audioBlob], `voice_${Date.now()}.${ext}`, { type: mimeType });
                setSelectedFile(audioFile);
                
                // Reset stream tracks
                mediaRecorderRef.current?.stream.getTracks().forEach(track => track.stop());
            };
            mediaRecorderRef.current.stop();
            setIsRecording(false);
        }
    };

    const handleCancelRecording = () => {
        if (mediaRecorderRef.current) {
            mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
            mediaRecorderRef.current = null;
        }
        setIsRecording(false);
        audioChunksRef.current = [];
    };

    const handleSendMessage = async (e?: React.FormEvent, retryMsg?: Message) => {
        if (e) e.preventDefault();
        const content = retryMsg ? retryMsg.content : newMessage;
        const fileToSend = selectedFile;

        // Easter Egg Check
        if (['congrats', 'yay', 'party', 'celebrate'].some(word => content.toLowerCase().includes(word))) {
            triggerConfetti();
        }

        if (!content.trim() && !fileToSend && !retryMsg) return;

        if (editingId && !retryMsg) {
            const idToUpdate = editingId;
            setMessages(prev => prev.map(m => m.id === idToUpdate ? { ...m, content, status: 'sending', updated_at: new Date().toISOString() } : m));
            setNewMessage('');
            setEditingId(null);
            setReplyingTo(null);

            const { error } = await supabase.from('messages').update({ content, updated_at: new Date().toISOString() }).eq('id', idToUpdate);
            if (error) setMessages(prev => prev.map(m => m.id === idToUpdate ? { ...m, status: 'error' } : m));
            else setMessages(prev => prev.map(m => m.id === idToUpdate ? { ...m, status: 'sent' } : m));
        } else {
            const tempId = retryMsg ? retryMsg.id : Math.random().toString();
            let attachmentData: Attachment | null = null;
            let optimisticAttachment = null;

            if (fileToSend) {
                const isAudio = fileToSend.type.includes('audio');
                const isImage = fileToSend.type.includes('image');
                
                optimisticAttachment = {
                    url: URL.createObjectURL(fileToSend),
                    type: isImage ? 'image' : isAudio ? 'audio' : 'file',
                    name: isAudio ? 'Voice Message' : fileToSend.name,
                    size: fileToSend.size,
                    mimeType: fileToSend.type
                };
            }

            const optimisticMsg: any = {
                sender_id: currentUser.id,
                receiver_id: recipient.id,
                content: content,
                reply_to_id: replyingTo ? replyingTo.id : null,
                reply_to: replyingTo,
                attachment: optimisticAttachment
            };

            if (!retryMsg) {
                setMessages((prev) => [...prev, { ...optimisticMsg, id: tempId, created_at: new Date().toISOString(), status: 'sending' }]);
                setNewMessage('');
                setSelectedFile(null);
                setReplyingTo(null);
                if (fileInputRef.current) fileInputRef.current.value = '';
            } else {
                setMessages((prev) => prev.map(m => m.id === tempId ? { ...m, status: 'sending' } : m));
            }

            if (fileToSend) {
                setIsUploading(true);
                const fileExt = fileToSend.name.split('.').pop() || 'webm';
                const fileName = `${roomId}/${Date.now()}_${Math.random()}.${fileExt}`;

                try {
                    const { error: uploadError } = await supabase.storage.from('attachments').upload(fileName, fileToSend);
                    if (uploadError) throw uploadError;
                    const { data: { publicUrl } } = supabase.storage.from('attachments').getPublicUrl(fileName);
                    
                    attachmentData = {
                        url: publicUrl,
                        type: fileToSend.type.startsWith('image/') ? 'image' : fileToSend.type.startsWith('audio/') ? 'audio' : 'file',
                        name: fileToSend.name,
                        size: fileToSend.size,
                        mimeType: fileToSend.type
                    };
                } catch (err) {
                    console.error("Upload failed", err);
                    setMessages(prev => prev.map(m => m.id === tempId ? { ...m, status: 'error' } : m));
                    setIsUploading(false);
                    return;
                }
                setIsUploading(false);
            }

            const finalMsg = { ...optimisticMsg, attachment: attachmentData };
            delete finalMsg.reply_to;
            if (!finalMsg.content) finalMsg.content = "";

            const { data, error } = await supabase.from('messages').insert(finalMsg).select().single();
            if (error) setMessages(prev => prev.map(m => m.id === tempId ? { ...m, status: 'error' } : m));
            else if (data) setMessages((prev) => prev.map(m => m.id === tempId ? { ...data, status: 'sent', reply_to: optimisticMsg.reply_to } : m));
        }
    };

    const handleReaction = async (msg: Message, emoji: string) => {
        const currentReactions = msg.reactions || {};
        const userIds = currentReactions[emoji] || [];
        const hasReacted = userIds.includes(currentUser.id);

        let newReactions = { ...currentReactions };
        if (hasReacted) {
            newReactions[emoji] = userIds.filter(id => id !== currentUser.id);
            if (newReactions[emoji].length === 0) delete newReactions[emoji];
        } else {
            newReactions[emoji] = [...userIds, currentUser.id];
        }
        setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, reactions: newReactions } : m));
        await supabase.from('messages').update({ reactions: newReactions }).eq('id', msg.id);
    };

    const handleEdit = (msg: Message) => {
        if (msg.attachment) { 
            showAlert("Edit Error", "Editing messages with attachments is not supported."); 
            return; 
        }
        setNewMessage(msg.content);
        setEditingId(msg.id);
        setReplyingTo(null);
        inputRef.current?.focus();
    };

    const handleReply = (msg: Message) => {
        setReplyingTo(msg);
        setEditingId(null);
        inputRef.current?.focus();
    };

    const handleDeleteClick = async (id: string) => {
        const confirmed = await showConfirm(
            "Delete Message?", 
            "Are you sure you want to delete this message? This cannot be undone.",
            "Delete",
            "Cancel"
        );
        
        if (confirmed) {
            setMessages(prev => prev.filter(m => m.id !== id));
            await supabase.from('messages').delete().eq('id', id);
        }
    };

    const handleJumpToMessage = (messageId: string) => {
        const el = document.getElementById(`msg-${messageId}`);
        if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            setHighlightedMessageId(messageId);
            setTimeout(() => setHighlightedMessageId(null), 2000);
        }
    };

    const handleStartCallClick = () => {
        if (callState !== CallState.IDLE) return;

        if (hasAcceptedTerms.current) onStartCall();
        else { setPendingAction('start'); setShowCallTerms(true); }
    };

    const handleAcceptTerms = () => {
        localStorage.setItem('mv_call_terms_accepted', 'true');
        hasAcceptedTerms.current = true;
        setShowCallTerms(false);
        if (pendingAction === 'start') onStartCall();
        if (pendingAction === 'answer') onAnswerCall();
        setPendingAction(null);
    };

    return (
        <div className="flex flex-col h-full bg-[#030014] relative font-['Outfit']">
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.15] pointer-events-none mix-blend-overlay"></div>
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none"></div>

            {(callState === CallState.CONNECTED || callState === CallState.RECONNECTING) && (
                 <div className="bg-green-500/10 border-b border-green-500/20 py-1.5 px-4 flex justify-between items-center relative z-30 animate-fade-in-up backdrop-blur-md">
                     <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full animate-pulse ${callState === CallState.RECONNECTING ? 'bg-amber-500' : 'bg-green-500'}`}></span>
                        <span className={`text-xs font-bold uppercase tracking-wide ${callState === CallState.RECONNECTING ? 'text-amber-400' : 'text-green-400'}`}>
                            {callState === CallState.RECONNECTING ? 'Connection Unstable...' : 'Call Active'}
                        </span>
                     </div>
                 </div>
            )}

            <div className="hidden md:flex px-6 py-4 justify-between items-center bg-[#030014]/60 backdrop-blur-xl border-b border-white/5 z-20 sticky top-0 shadow-sm">
                <div className="flex items-center space-x-4">
                    <div className="relative">
                        <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-indigo-500 to-fuchsia-600 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-indigo-500/30 overflow-hidden">
                            {recipient.avatar_url ? <img src={recipient.avatar_url} className="w-full h-full object-cover" /> : recipient.email[0].toUpperCase()}
                        </div>
                        <div className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-[#030014] flex items-center justify-center ${isRecipientOnline ? 'bg-green-500' : 'bg-gray-500'}`}>
                            {isRecipientOnline && <div className="w-full h-full rounded-full animate-ping bg-green-400 opacity-75"></div>}
                        </div>
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h2 className="font-bold text-white text-lg tracking-tight">{recipient.email}</h2>
                            {isPenguin && <span className="text-xl animate-wobble">🐧</span>}
                        </div>
                        <span className={`text-xs font-medium ${isRecipientOnline ? 'text-green-400' : 'text-gray-500'}`}>{isRecipientOnline ? 'Active Now' : 'Offline'}</span>
                    </div>
                </div>
                <button 
                    onClick={handleStartCallClick} 
                    disabled={callState !== CallState.IDLE} 
                    className={`p-2.5 rounded-full transition-all duration-300 shadow-lg group ${callState === CallState.IDLE ? 'bg-white/10 hover:bg-white/20 text-white hover:scale-105 border border-white/10' : 'bg-green-500/20 text-green-400 animate-pulse border border-green-500/50 cursor-not-allowed opacity-50'}`}
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                </button>
            </div>

            <div className="md:hidden absolute top-4 right-4 z-30">
                <button 
                    onClick={handleStartCallClick} 
                    disabled={callState !== CallState.IDLE} 
                    className={`p-2.5 rounded-full transition-all duration-300 shadow-lg ${callState === CallState.IDLE ? 'bg-white/10 text-white border border-white/10 backdrop-blur-md' : 'bg-green-500/20 text-green-400 border border-green-500/50 cursor-not-allowed opacity-50'}`}
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 md:p-6 relative z-10 scroll-smooth space-y-2 no-scrollbar">
                {loading ? (
                    <div className="flex flex-col items-center justify-center h-full space-y-4">
                        <div className="relative w-10 h-10"><div className="absolute inset-0 border-2 border-indigo-500/30 rounded-full"></div><div className="absolute inset-0 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div></div>
                        <span className="text-gray-500 text-xs font-medium tracking-wide">Decryption in progress...</span>
                    </div>
                ) : (
                    <>
                        <div className="flex justify-center mb-8 mt-4">
                            <span className="text-[10px] text-gray-500 bg-white/5 px-4 py-1.5 rounded-full border border-white/5 tracking-wider uppercase backdrop-blur-md">End-to-End Encrypted</span>
                        </div>
                        {messages.map((msg) => (
                            <MessageItem key={msg.id} msg={msg} isMe={Boolean(currentUser && currentUser.id && msg.sender_id === currentUser.id)} recipient={recipient} currentUser={currentUser} onEdit={handleEdit} onDelete={handleDeleteClick} onRetry={(m) => handleSendMessage(undefined, m)} onReply={handleReply} onReaction={handleReaction} onJumpTo={handleJumpToMessage} isHighlighted={msg.id === highlightedMessageId} isFamily={currentUser.is_family} />
                        ))}
                        {isTyping && (
                            <div className="flex justify-start mb-4 animate-fade-in-up px-2">
                                <div className="bg-white/5 rounded-[1.2rem] rounded-bl-sm px-4 py-3 flex space-x-1.5 items-center border border-white/5">
                                    <div className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-typing-bounce"></div><div className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-typing-bounce" style={{ animationDelay: '0.15s' }}></div><div className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-typing-bounce" style={{ animationDelay: '0.3s' }}></div>
                                </div>
                            </div>
                        )}
                    </>
                )}
                <div ref={messagesEndRef} className="h-4" />
            </div>

            <div className="p-4 md:p-6 pt-2 relative z-20 pb-safe">
                <div className="max-w-4xl mx-auto flex flex-col gap-2">
                    <div className="flex flex-col gap-2">
                        {selectedFile && (
                            <div className="bg-gray-900/90 backdrop-blur-xl border border-indigo-500/50 rounded-2xl p-3 flex items-center gap-3 animate-slide-up shadow-2xl max-w-[80%] self-start">
                                <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center shrink-0 text-indigo-400">
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                </div>
                                <div className="min-w-0">
                                    <p className="text-sm font-bold text-white truncate max-w-[200px]">{selectedFile.name}</p>
                                    <p className="text-xs text-gray-400">{formatFileSize(selectedFile.size)}</p>
                                </div>
                                <button onClick={() => { setSelectedFile(null); if (fileInputRef.current) fileInputRef.current.value = ''; }} className="p-1 hover:bg-white/10 rounded-full text-gray-400 hover:text-white transition">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                </button>
                            </div>
                        )}
                        {editingId && (
                            <div className="bg-gray-900/90 backdrop-blur-xl border border-indigo-500/50 rounded-2xl px-4 py-3 flex justify-between items-center text-xs text-indigo-300 animate-slide-up shadow-2xl">
                                <div className="flex items-center gap-2"><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg><span className="font-semibold">Editing message</span></div>
                                <button onClick={() => { setNewMessage(''); setEditingId(null); }} className="hover:text-white bg-white/10 px-3 py-1 rounded-lg transition">Cancel</button>
                            </div>
                        )}
                        {replyingTo && (
                            <div className="bg-gray-900/90 backdrop-blur-xl border border-indigo-500/50 rounded-2xl px-4 py-3 flex justify-between items-center text-xs text-indigo-300 animate-slide-up shadow-2xl">
                                <div className="flex items-center gap-2 max-w-[80%]"><svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" /></svg><span className="font-semibold shrink-0">Replying to:</span><span className="truncate text-gray-400">{replyingTo.content || '[Attachment]'}</span></div>
                                <button onClick={() => { setReplyingTo(null); }} className="hover:text-white bg-white/10 px-3 py-1 rounded-lg transition shrink-0">Cancel</button>
                            </div>
                        )}
                    </div>

                    {isRecording ? (
                         <div className="w-full flex items-center gap-3 bg-[#13131a]/95 backdrop-blur-xl border border-red-500/30 p-2 pl-4 rounded-full shadow-2xl animate-pulse-glow h-[58px]">
                             <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse shrink-0"></div>
                             
                             {/* Visualizer */}
                             <div className="flex items-center gap-0.5 h-8 flex-1 justify-center px-2 opacity-80 overflow-hidden">
                                {[...Array(20)].map((_, i) => (
                                    <div 
                                        key={i} 
                                        className="w-1 bg-red-500 rounded-full animate-wave" 
                                        style={{ 
                                            animationDuration: `${0.6 + Math.random() * 0.4}s`, 
                                            animationDelay: `${Math.random() * 0.5}s`,
                                            height: '20%' // Base height handled by animation
                                        }}
                                    ></div>
                                ))}
                             </div>
                             
                             <span className="text-white font-mono font-bold text-sm tracking-widest shrink-0 w-12 text-center">{formatDuration(recordingTime)}</span>
                             
                             <button onClick={handleCancelRecording} className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition text-xs font-bold uppercase tracking-wider shrink-0">Cancel</button>
                             <button onClick={handleStopRecording} className="p-2.5 bg-red-500 hover:bg-red-600 text-white rounded-full transition-all shadow-lg active:scale-95 shrink-0 flex items-center justify-center w-10 h-10">
                                 <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><rect x="6" y="6" width="12" height="12" rx="2" /></svg>
                             </button>
                         </div>
                    ) : (
                        <form onSubmit={(e) => handleSendMessage(e)} className={`group w-full flex items-center gap-2 bg-[#13131a]/90 backdrop-blur-xl border p-1.5 pl-4 rounded-full shadow-2xl focus-within:ring-2 focus-within:ring-indigo-500/50 focus-within:border-indigo-500/50 transition-all duration-300 h-[58px] ${currentUser.is_family ? 'border-amber-500/50 shadow-amber-500/10' : 'border-white/10 hover:border-white/20'}`}>
                            <input type="file" ref={fileInputRef} onChange={(e) => { if (e.target.files?.length) setSelectedFile(e.target.files[0]); }} className="hidden" />
                            <button type="button" onClick={() => fileInputRef.current?.click()} className="text-gray-500 hover:text-indigo-400 transition p-1 shrink-0" title="Attach file">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
                            </button>

                            <input id="chat-input" ref={inputRef} type="text" className="flex-1 bg-transparent text-white px-2 py-3 focus:outline-none placeholder-gray-600 font-medium text-[15px] min-w-0" placeholder={editingId ? "Update message..." : replyingTo ? "Type reply..." : "Message..."} value={newMessage} onChange={handleInput} autoComplete="off" />
                            
                            {!newMessage.trim() && !selectedFile ? (
                                <button type="button" onClick={handleStartRecording} className="p-2.5 rounded-full text-gray-400 hover:text-white hover:bg-white/10 transition active:scale-95 shrink-0">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                </button>
                            ) : (
                                <button type="submit" disabled={isUploading} className={`p-2.5 rounded-full text-white font-bold transition-all shadow-lg active:scale-95 flex items-center justify-center shrink-0 bg-gradient-to-r from-indigo-600 to-fuchsia-600 hover:shadow-indigo-500/25 transform hover:-translate-y-0.5 w-10 h-10`}>
                                    {isUploading ? (
                                        <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                                    ) : editingId ? <span className="text-xs px-2">Save</span> : <svg className="w-5 h-5 ml-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 5l7 7-7 7M5 5l7 7-7 7" /></svg>}
                                </button>
                            )}
                        </form>
                    )}
                </div>
            </div>

            {showCallTerms && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
                    <div className="bg-[#13131a] border border-white/10 rounded-[2rem] p-8 max-w-lg w-full shadow-2xl relative overflow-hidden animate-slide-up">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-fuchsia-500"></div>
                        <div className="mb-6 flex flex-col items-center text-center">
                            <div className="w-16 h-16 rounded-full bg-indigo-500/10 flex items-center justify-center mb-4 border border-indigo-500/20 shadow-[0_0_20px_rgba(99,102,241,0.2)]">
                                <svg className="w-8 h-8 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
                            </div>
                            <h3 className="text-2xl font-bold text-white mb-2">Voice Call Terms</h3>
                            <p className="text-gray-400 text-sm leading-relaxed">Review technical operating protocols before establishing P2P session.</p>
                        </div>
                        <div className="h-64 overflow-y-auto bg-black/20 p-4 rounded-lg border border-white/5 text-[10px] md:text-xs text-gray-400 space-y-4 font-mono mb-6 shadow-inner scrollbar-thin scrollbar-thumb-indigo-900">
                            <p className="font-bold text-gray-200">1. WEB RTC MESH</p><p>Calls use direct P2P connections where available. Your IP is shared with the peer to establish the tunnel.</p>
                            <p className="font-bold text-gray-200">2. ICE CANDIDATES</p><p>Authorized STUN/TURN: {ICE_SERVERS[0].urls[0]}</p>
                            <p className="font-bold text-gray-200">3. ENCRYPTION</p><p>DTLS-SRTP mandated for all audio streams.</p>
                        </div>
                        <div className="flex flex-col gap-3">
                            <button onClick={handleAcceptTerms} className="w-full py-3.5 bg-white text-black font-bold rounded-xl hover:bg-gray-200 transition-colors shadow-lg active:scale-95 text-sm uppercase tracking-wide">I Accept</button>
                            <button onClick={() => { setShowCallTerms(false); setPendingAction(null); }} className="w-full py-3.5 text-gray-500 font-medium hover:text-white transition-colors text-sm">Decline</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};