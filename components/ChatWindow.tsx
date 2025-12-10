import React, { useEffect, useState, useRef } from 'react';
import { supabase } from '../supabaseClient';
import { Message, UserProfile, CallState, Attachment } from '../types';
import { ICE_SERVERS } from '../constants';

interface ChatWindowProps {
    currentUser: UserProfile;
    recipient: UserProfile;
    onlineUsers: Set<string>;
    // Props from App.tsx
    // channel prop removed as it is no longer used for signaling here
    channel: any | null; // Kept as optional/any to prevent breaking if passed, but logic ignored
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

const COMMON_REACTIONS = ["👍", "❤️", "😂", "😮", "😢"];

const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

const MessageItem: React.FC<MessageItemProps> = ({
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

    // Click Outside Handler
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            // Close if clicking outside container AND outside the popup menu itself
            // (Though menu is usually inside container, we check strictly)
            if (
                containerRef.current &&
                !containerRef.current.contains(event.target as Node) &&
                (!actionsMenuRef.current || !actionsMenuRef.current.contains(event.target as Node))
            ) {
                setShowActions(false);
                setShowReactions(false);
            }
        };
        // Use capture to catch events early
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
                    {/* pointer-events-none ensures tap goes to bubble handler, not image */}
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

                    {/* Message Bubble Wrapper - Relative for Action Menu Positioning */}
                    <div
                        className="flex flex-col min-w-0 cursor-pointer relative group"
                        onClick={handleToggleActions}
                    >
                        {/* Action Menu (Positioned ABOVE Bubble) */}
                        {showActions && !isSending && !isError && (
                            <div
                                ref={actionsMenuRef}
                                className={`absolute z-50 flex items-center gap-1 p-1.5 bg-[#1a1a20] border border-white/10 rounded-full shadow-2xl animate-scale-in -top-12 ${isMe ? 'right-0' : 'left-0'}`}
                                onClick={(e) => e.stopPropagation()} // Prevent bubble toggle
                                style={{ minWidth: 'max-content' }}
                            >
                                {/* Reaction Button */}
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
                                            {COMMON_REACTIONS.map(emoji => (
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

                                <button
                                    onClick={() => { onReply(msg); setShowActions(false); }}
                                    className="p-2 hover:bg-white/10 rounded-full text-gray-400 hover:text-white transition"
                                    title="Reply"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" /></svg>
                                </button>

                                {isMe && !msg.attachment && (
                                    <button
                                        onClick={() => { onEdit(msg); setShowActions(false); }}
                                        className="p-2 hover:bg-white/10 rounded-full text-gray-400 hover:text-white transition"
                                        title="Edit"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                    </button>
                                )}

                                {isMe && (
                                    <button
                                        onClick={() => { onDelete(msg.id); setShowActions(false); }}
                                        className="p-2 hover:bg-white/10 rounded-full text-gray-400 hover:text-red-500 transition"
                                        title="Delete"
                                    >
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
};

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

    // Local channel for chat messages and typing indicators
    const [chatChannel, setChatChannel] = useState<ReturnType<typeof supabase.channel> | null>(null);

    // File Upload State
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);

    // Call Terms State
    const [showCallTerms, setShowCallTerms] = useState(false);
    const [pendingAction, setPendingAction] = useState<'start' | 'answer' | null>(null);
    const hasAcceptedTerms = useRef(localStorage.getItem('mv_call_terms_accepted') === 'true');
    const inputRef = useRef<HTMLInputElement>(null);

    // Delete Modal State
    const [messageToDelete, setMessageToDelete] = useState<string | null>(null);

    const isRecipientOnline = onlineUsers.has(recipient.id);
    const isPenguin = recipient.email === 'cindygaldamez@yahoo.com';
    const roomId = [currentUser.id, recipient.id].sort().join('_');

    useEffect(() => {
        // Create a separate channel for Message updates to ensure postgres_changes subscribes correctly
        const chatRoomId = [currentUser.id, recipient.id].sort().join('_');
        const newChannel = supabase.channel(`chat_messages:${chatRoomId}`);

        newChannel
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'messages' },
                (payload) => {
                    const { eventType, new: newRecord, old: oldRecord } = payload;

                    // Relevance check
                    const record = (newRecord || oldRecord) as any;
                    if (!record) return;
                    const isRelevant =
                        (record.sender_id === currentUser.id && record.receiver_id === recipient.id) ||
                        (record.sender_id === recipient.id && record.receiver_id === currentUser.id);
                    if (!isRelevant) return;

                    if (eventType === 'INSERT') {
                        setMessages((prev) => {
                            // Prevent duplicates if optimistic update already added it
                            if (prev.find(m => m.id === newRecord.id)) return prev;
                            return [...prev, { ...newRecord, status: 'sent' } as Message];
                        });
                        if (record.sender_id === recipient.id) {
                            setIsTyping(false);
                            if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
                        }
                    } else if (eventType === 'UPDATE') {
                        // Preserve reply info if it was loaded
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

        return () => {
            supabase.removeChannel(newChannel);
        };
    }, [currentUser.id, recipient.id]);

    useEffect(() => {
        const fetchMessages = async () => {
            setLoading(true);
            // Fetch messages AND joined reply_to parent message
            const { data, error } = await supabase
                .from('messages')
                .select(`
            *,
            reply_to:reply_to_id(id, content, sender_id, attachment)
        `)
                .or(`sender_id.eq.${currentUser.id},receiver_id.eq.${currentUser.id}`)
                .or(`sender_id.eq.${recipient.id},receiver_id.eq.${recipient.id}`)
                .order('created_at', { ascending: true });

            if (!error && data) {
                // Double check filtering (RLS handles this but good for safety if RLS is open)
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
    }, [messages, isTyping, replyingTo]);

    // If call disconnects while terms modal is open for answering, close it
    useEffect(() => {
        if (pendingAction === 'answer' && callState === CallState.IDLE) {
            setShowCallTerms(false);
            setPendingAction(null);
        }
    }, [callState, pendingAction]);

    const handleStartCallClick = () => {
        if (hasAcceptedTerms.current) {
            onStartCall();
        } else {
            setPendingAction('start');
            setShowCallTerms(true);
        }
    };

    const handleAnswerCallClick = () => {
        if (hasAcceptedTerms.current) {
            onAnswerCall();
        } else {
            setPendingAction('answer');
            setShowCallTerms(true);
        }
    };

    const handleAcceptTerms = () => {
        localStorage.setItem('mv_call_terms_accepted', 'true');
        hasAcceptedTerms.current = true;
        setShowCallTerms(false);

        if (pendingAction === 'start') {
            onStartCall();
        } else if (pendingAction === 'answer') {
            onAnswerCall();
        }
        setPendingAction(null);
    };

    const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        setNewMessage(e.target.value);
        // channel?.send({ type: 'broadcast', event: 'typing', payload: { userId: currentUser.id } }); // Old channel removed
        chatChannel?.send({ type: 'broadcast', event: 'typing', payload: { userId: currentUser.id } });
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            setSelectedFile(e.target.files[0]);
        }
    };

    const handleSendMessage = async (e?: React.FormEvent, retryMsg?: Message) => {
        if (e) e.preventDefault();
        const content = retryMsg ? retryMsg.content : newMessage;
        const fileToSend = selectedFile;

        // Allow sending if there is text OR a file
        if (!content.trim() && !fileToSend && !retryMsg) return;

        if (editingId && !retryMsg) {
            // Edit flow
            const idToUpdate = editingId;
            setMessages(prev => prev.map(m => m.id === idToUpdate ? { ...m, content, status: 'sending', updated_at: new Date().toISOString() } : m));
            setNewMessage('');
            setEditingId(null);
            setReplyingTo(null);

            const { error } = await supabase.from('messages').update({ content, updated_at: new Date().toISOString() }).eq('id', idToUpdate);
            if (error) setMessages(prev => prev.map(m => m.id === idToUpdate ? { ...m, status: 'error' } : m));
            else setMessages(prev => prev.map(m => m.id === idToUpdate ? { ...m, status: 'sent' } : m));
        } else {
            // New Message Flow
            const tempId = retryMsg ? retryMsg.id : Math.random().toString();
            let attachmentData: Attachment | null = null;

            // Optimistic Update
            const optimisticMsg: any = {
                sender_id: currentUser.id,
                receiver_id: recipient.id,
                content: content,
                reply_to_id: replyingTo ? replyingTo.id : null,
                reply_to: replyingTo // Optimistic UI only
            };

            if (fileToSend) {
                setIsUploading(true);
                // Optimistic attachment preview
                optimisticMsg.attachment = {
                    url: URL.createObjectURL(fileToSend),
                    type: fileToSend.type.startsWith('image/') ? 'image' : 'file',
                    name: fileToSend.name,
                    size: fileToSend.size,
                    mimeType: fileToSend.type
                };
            }

            if (!retryMsg) {
                setMessages((prev) => [...prev, { ...optimisticMsg, id: tempId, created_at: new Date().toISOString(), status: 'sending' }]);
                setNewMessage('');
                setSelectedFile(null);
                setReplyingTo(null);
                if (fileInputRef.current) fileInputRef.current.value = '';
            } else {
                setMessages((prev) => prev.map(m => m.id === tempId ? { ...m, status: 'sending' } : m));
            }

            // Upload File if present
            if (fileToSend) {
                const fileExt = fileToSend.name.split('.').pop();
                const fileName = `${roomId}/${Date.now()}_${Math.random()}.${fileExt}`;

                try {
                    const { error: uploadError } = await supabase.storage
                        .from('attachments')
                        .upload(fileName, fileToSend);

                    if (uploadError) throw uploadError;

                    const { data: { publicUrl } } = supabase.storage
                        .from('attachments')
                        .getPublicUrl(fileName);

                    attachmentData = {
                        url: publicUrl,
                        type: fileToSend.type.startsWith('image/') ? 'image' : 'file',
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
            }

            setIsUploading(false);

            // Insert into DB
            const finalMsg = { ...optimisticMsg, attachment: attachmentData };
            // Remove virtual props before insert
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

        // Optimistic Update
        setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, reactions: newReactions } : m));

        const { error } = await supabase
            .from('messages')
            .update({ reactions: newReactions })
            .eq('id', msg.id);

        if (error) {
            console.error("Failed to add reaction", error);
        }
    };

    const handleEdit = (msg: Message) => {
        if (msg.attachment) {
            alert("Editing messages with attachments is not supported in this version.");
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

    const handleDeleteClick = (id: string) => {
        setMessageToDelete(id);
    };

    const confirmDelete = async () => {
        if (!messageToDelete) return;
        
        // Optimistic Update
        setMessages(prev => prev.filter(m => m.id !== messageToDelete));
        
        // DB Deletion
        const { error } = await supabase.from('messages').delete().eq('id', messageToDelete);
        
        if (error) {
            console.error("Failed to delete message", error);
            // Optionally revert UI if needed, but optimistic usually preferred
        }
        
        setMessageToDelete(null);
    };

    const handleJumpToMessage = (messageId: string) => {
        const el = document.getElementById(`msg-${messageId}`);
        if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            setHighlightedMessageId(messageId);
            setTimeout(() => setHighlightedMessageId(null), 2000);
        } else {
            // If virtualized, we would need to load the message. 
            // Since we load all, it might not be rendered or doesn't exist.
            console.warn("Message not found in DOM");
        }
    };

    return (
        <div className="flex flex-col h-full bg-[#030014] relative font-['Outfit']">
            {/* Background & Effects */}
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.15] pointer-events-none mix-blend-overlay"></div>
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none"></div>

            {/* Active Call Banner */}
            {(callState === CallState.CONNECTED || callState === CallState.RECONNECTING) && (
                 <div className="bg-green-500/10 border-b border-green-500/20 py-1.5 px-4 flex justify-between items-center relative z-30 animate-fade-in-up backdrop-blur-md">
                     <div className="flex items-center gap-2">
                        {callState === CallState.RECONNECTING ? (
                            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                        ) : (
                            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                        )}
                        <span className={`text-xs font-bold uppercase tracking-wide ${callState === CallState.RECONNECTING ? 'text-amber-400' : 'text-green-400'}`}>
                            {callState === CallState.RECONNECTING ? 'Connection Unstable - Reconnecting...' : 'Call Active'}
                        </span>
                     </div>
                     {/* Note: Clicking anywhere else or maximizing restores overlay, this visual cue just reminds user call is active */}
                 </div>
            )}

            {/* Header */}
            <div className="hidden md:flex px-6 py-4 justify-between items-center bg-[#030014]/60 backdrop-blur-xl border-b border-white/5 z-20 sticky top-0 shadow-sm">
                <div className="flex items-center space-x-4">
                    <div className="relative">
                        <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-indigo-500 to-fuchsia-600 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-indigo-500/30 overflow-hidden">
                            {recipient.avatar_url ? (
                                <img src={recipient.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                            ) : (
                                recipient.email[0].toUpperCase()
                            )}
                        </div>
                        <div className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-[#030014] flex items-center justify-center ${isRecipientOnline ? 'bg-green-500' : 'bg-gray-500'}`}>
                            {isRecipientOnline && <div className="w-full h-full rounded-full animate-ping bg-green-400 opacity-75"></div>}
                        </div>
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h2 className="font-bold text-white text-lg tracking-tight">{recipient.email}</h2>
                            {isPenguin && <span className="text-xl animate-wobble" title="Special Penguin Badge">🐧</span>}
                        </div>
                        <div className="flex items-center gap-2">
                            <span className={`text-xs font-medium ${isRecipientOnline ? 'text-green-400' : 'text-gray-500'}`}>
                                {isRecipientOnline ? 'Active Now' : 'Offline'}
                            </span>
                            {currentUser.is_family && (
                                <div className="hidden sm:flex items-center gap-1 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                                    <span className="text-[9px] text-amber-400 font-bold uppercase tracking-wider">Family</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={handleStartCallClick}
                        disabled={callState !== CallState.IDLE && callState !== CallState.CONNECTED && callState !== CallState.RECONNECTING}
                        className={`p-2.5 rounded-full transition-all duration-300 shadow-lg group ${callState === CallState.IDLE
                                ? 'bg-white/10 hover:bg-white/20 text-white hover:scale-105 border border-white/10'
                                : 'bg-green-500/20 text-green-400 animate-pulse border border-green-500/50'
                            }`}
                        title="Start Voice Call"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                    </button>
                </div>
            </div>

            {/* Mobile Only Header Actions */}
            <div className="md:hidden absolute top-4 right-4 z-30">
                <button
                    onClick={handleStartCallClick}
                    disabled={callState !== CallState.IDLE && callState !== CallState.CONNECTED && callState !== CallState.RECONNECTING}
                    className={`p-2.5 rounded-full transition-all duration-300 shadow-lg ${callState === CallState.IDLE
                            ? 'bg-white/10 text-white border border-white/10 backdrop-blur-md'
                            : 'bg-green-500/20 text-green-400 border border-green-500/50'
                        }`}
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                </button>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6 relative z-10 scroll-smooth space-y-2 no-scrollbar">
                {loading ? (
                    <div className="flex flex-col items-center justify-center h-full space-y-4">
                        <div className="relative w-10 h-10">
                            <div className="absolute inset-0 border-2 border-indigo-500/30 rounded-full"></div>
                            <div className="absolute inset-0 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                        </div>
                        <span className="text-gray-500 text-xs font-medium tracking-wide">Decryption in progress...</span>
                    </div>
                ) : (
                    <>
                        <div className="flex justify-center mb-8 mt-4">
                            <span className="text-[10px] text-gray-500 bg-white/5 px-4 py-1.5 rounded-full border border-white/5 tracking-wider uppercase backdrop-blur-md">
                                End-to-End Encrypted Conversation
                            </span>
                        </div>

                        {messages.map((msg) => (
                            <MessageItem
                                key={msg.id}
                                msg={msg}
                                isMe={Boolean(currentUser && currentUser.id && msg.sender_id === currentUser.id)}
                                recipient={recipient}
                                currentUser={currentUser}
                                onEdit={handleEdit}
                                onDelete={handleDeleteClick}
                                onRetry={(m) => handleSendMessage(undefined, m)}
                                onReply={handleReply}
                                onReaction={handleReaction}
                                onJumpTo={handleJumpToMessage}
                                isHighlighted={msg.id === highlightedMessageId}
                                isFamily={currentUser.is_family}
                            />
                        ))}

                        {isTyping && (
                            <div className="flex justify-start mb-4 animate-fade-in-up px-2">
                                <div className="bg-white/5 rounded-[1.2rem] rounded-bl-sm px-4 py-3 flex space-x-1.5 items-center border border-white/5">
                                    <div className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-typing-bounce"></div>
                                    <div className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-typing-bounce" style={{ animationDelay: '0.15s' }}></div>
                                    <div className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-typing-bounce" style={{ animationDelay: '0.3s' }}></div>
                                </div>
                            </div>
                        )}
                    </>
                )}
                <div ref={messagesEndRef} className="h-4" />
            </div>

            {/* Floating Input Area */}
            <div className="p-4 md:p-6 pt-2 relative z-20 pb-safe">
                <div className="max-w-4xl mx-auto flex flex-col gap-2">
                    {/* Indicators Container (Stacks upwards) */}
                    <div className="flex flex-col gap-2">
                        {/* File Preview */}
                        {selectedFile && (
                            <div className="bg-gray-900/90 backdrop-blur-xl border border-indigo-500/50 rounded-2xl p-3 flex items-center gap-3 animate-slide-up shadow-2xl max-w-[80%] self-start">
                                <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center shrink-0 text-indigo-400">
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                </div>
                                <div className="min-w-0">
                                    <p className="text-sm font-bold text-white truncate max-w-[200px]">{selectedFile.name}</p>
                                    <p className="text-xs text-gray-400">{formatFileSize(selectedFile.size)}</p>
                                </div>
                                <button
                                    onClick={() => { setSelectedFile(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                                    className="p-1 hover:bg-white/10 rounded-full text-gray-400 hover:text-white transition"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                </button>
                            </div>
                        )}

                        {/* Editing Indicator */}
                        {editingId && (
                            <div className="bg-gray-900/90 backdrop-blur-xl border border-indigo-500/50 rounded-2xl px-4 py-3 flex justify-between items-center text-xs text-indigo-300 animate-slide-up shadow-2xl">
                                <div className="flex items-center gap-2">
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                    <span className="font-semibold">Editing message</span>
                                </div>
                                <button onClick={() => { setNewMessage(''); setEditingId(null); }} className="hover:text-white bg-white/10 px-3 py-1 rounded-lg transition">Cancel</button>
                            </div>
                        )}

                        {/* Replying Indicator */}
                        {replyingTo && (
                            <div className="bg-gray-900/90 backdrop-blur-xl border border-indigo-500/50 rounded-2xl px-4 py-3 flex justify-between items-center text-xs text-indigo-300 animate-slide-up shadow-2xl">
                                <div className="flex items-center gap-2 max-w-[80%]">
                                    <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" /></svg>
                                    <span className="font-semibold shrink-0">Replying to:</span>
                                    <span className="truncate text-gray-400">{replyingTo.content || '[Attachment]'}</span>
                                </div>
                                <button onClick={() => { setReplyingTo(null); }} className="hover:text-white bg-white/10 px-3 py-1 rounded-lg transition shrink-0">Cancel</button>
                            </div>
                        )}
                    </div>

                    <form onSubmit={(e) => handleSendMessage(e)} className="group flex items-center gap-2 bg-[#13131a]/90 backdrop-blur-xl border border-white/10 p-1.5 pl-4 rounded-full shadow-2xl focus-within:ring-2 focus-within:ring-indigo-500/50 focus-within:border-indigo-500/50 transition-all duration-300 hover:border-white/20">
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileSelect}
                            className="hidden"
                        />
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="text-gray-500 hover:text-indigo-400 transition p-1"
                            title="Attach file"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
                        </button>

                        <input
                            id="chat-input"
                            ref={inputRef}
                            type="text"
                            className="flex-1 bg-transparent text-white px-2 py-3 focus:outline-none placeholder-gray-600 font-medium text-[15px]"
                            placeholder={editingId ? "Update your message..." : replyingTo ? "Type your reply..." : "Message..."}
                            value={newMessage}
                            onChange={handleInput}
                            autoComplete="off"
                        />

                        <button
                            type="submit"
                            disabled={(!newMessage.trim() && !selectedFile) || isUploading}
                            className={`p-2.5 rounded-full text-white font-bold transition-all shadow-lg active:scale-95 flex items-center justify-center shrink-0 ${(newMessage.trim() || selectedFile) && !isUploading
                                    ? 'bg-gradient-to-r from-indigo-600 to-fuchsia-600 hover:shadow-indigo-500/25 transform hover:-translate-y-0.5'
                                    : 'bg-gray-800 text-gray-500 cursor-not-allowed'
                                }`}
                        >
                            {isUploading ? (
                                <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                            ) : editingId ? (
                                <span className="text-xs px-2">Save</span>
                            ) : (
                                <svg className="w-5 h-5 ml-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 5l7 7-7 7M5 5l7 7-7 7" /></svg>
                            )}
                        </button>
                    </form>
                </div>
            </div>

            {/* Call Terms Modal */}
            {showCallTerms && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
                    <div className="bg-[#13131a] border border-white/10 rounded-[2rem] p-8 max-w-lg w-full shadow-2xl relative overflow-hidden animate-slide-up">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-fuchsia-500"></div>

                        <div className="mb-6 flex flex-col items-center text-center">
                            <div className="w-16 h-16 rounded-full bg-indigo-500/10 flex items-center justify-center mb-4 border border-indigo-500/20 shadow-[0_0_20px_rgba(99,102,241,0.2)]">
                                <svg className="w-8 h-8 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
                            </div>
                            <h3 className="text-2xl font-bold text-white mb-2">Voice Call Terms & Protocols</h3>
                            <p className="text-gray-400 text-sm leading-relaxed">
                                Please review the technical operating protocols before establishing a P2P session.
                            </p>
                        </div>

                        <div className="h-64 overflow-y-auto bg-black/20 p-4 rounded-lg border border-white/5 text-[10px] md:text-xs text-gray-400 space-y-4 font-mono mb-6 shadow-inner scrollbar-thin scrollbar-thumb-indigo-900 scrollbar-track-transparent">
                            <p className="font-bold text-gray-200">1. PROVISION OF REAL-TIME COMMUNICATION SERVICES</p>
                            <p>By initiating or accepting this Voice over Internet Protocol (VoIP) session, you acknowledge that MasterVoice employs WebRTC (Web Real-Time Communication) technology. This service utilizes a mesh networking topology where available.</p>

                            <p className="font-bold text-gray-200">2. NETWORK TRAVERSAL AND PRIVACY (ICE NEGOTIATION)</p>
                            <p>The system dynamically selects the optimal path for media stream delivery using Interactive Connectivity Establishment (ICE). Based on current configuration, the following STUN/TURN servers are authorized for this session:</p>
                            <ul className="list-disc pl-4 space-y-1 text-indigo-400/80 break-all">
                                {ICE_SERVERS.flatMap(s => [s.urls].flat()).map((url, i) => (
                                    <li key={i}>{url}</li>
                                ))}
                            </ul>
                            <p className="text-amber-500/80 mt-2 border-l-2 border-amber-500/50 pl-2">
                                WARNING: In "Direct Peer" (STUN) mode, your public IP address will be disclosed to the remote peer to establish the UDP socket. If a direct connection fails due to Symmetric NAT, the system will fall back to "Relayed" (TURN) mode via the listed relay servers.
                            </p>

                            <p className="font-bold text-gray-200">3. ENCRYPTION STANDARDS</p>
                            <p>All media streams are encrypted using DTLS-SRTP (Datagram Transport Layer Security - Secure Real-time Transport Protocol). No passive listener, including MasterVoice infrastructure, can decrypt the raw audio stream. However, metadata regarding call duration and participant IDs is logged for quality assurance.</p>

                            <p className="font-bold text-gray-200">4. USER RESPONSIBILITY</p>
                            <p>You agree not to transmit illegal, harassing, or unauthorized content. MasterVoice creates a transient tunnel; we do not moderate real-time audio.</p>

                            <p className="font-bold text-gray-200">5. DATA RETENTION</p>
                            <p>No audio data is written to persistent storage. Ephemeral keys are generated per-session and discarded upon signaling state closure (Hangup).</p>
                        </div>

                        <div className="flex flex-col gap-3">
                            <button
                                onClick={handleAcceptTerms}
                                className="w-full py-3.5 bg-white text-black font-bold rounded-xl hover:bg-gray-200 transition-colors shadow-lg active:scale-95 text-sm uppercase tracking-wide"
                            >
                                {pendingAction === 'answer' ? 'I Accept & Join Call' : 'I Accept & Start Call'}
                            </button>
                            <button
                                onClick={() => { setShowCallTerms(false); setPendingAction(null); }}
                                className="w-full py-3.5 text-gray-500 font-medium hover:text-white transition-colors text-sm"
                            >
                                Decline & Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* DELETE CONFIRMATION MODAL */}
            {messageToDelete && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
                    <div className="bg-[#1a1a20] border border-white/10 rounded-2xl p-6 max-w-sm w-full shadow-2xl animate-scale-in">
                        <div className="flex justify-center mb-4">
                            <div className="w-12 h-12 bg-red-500/10 rounded-full flex items-center justify-center text-red-500">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                            </div>
                        </div>
                        <h3 className="text-lg font-bold text-white mb-2 text-center">Delete Message?</h3>
                        <p className="text-gray-400 text-sm mb-6 text-center leading-relaxed">
                            This action cannot be undone. The message will be permanently removed for everyone in the chat.
                        </p>
                        <div className="flex gap-3">
                            <button 
                                onClick={() => setMessageToDelete(null)} 
                                className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl text-sm font-medium transition active:scale-95"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={confirmDelete} 
                                className="flex-1 py-3 bg-red-600 hover:bg-red-500 text-white rounded-xl text-sm font-medium transition shadow-lg shadow-red-600/20 active:scale-95"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};