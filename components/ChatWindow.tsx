import React, { useEffect, useState, useRef } from 'react';
import { supabase } from '../supabaseClient';
import { Message, UserProfile, CallState, Attachment } from '../types';
import { useWebRTC } from '../hooks/useWebRTC';
import { VoiceCallOverlay } from './VoiceCallOverlay';
import { ICE_SERVERS } from '../constants';

interface ChatWindowProps {
  currentUser: UserProfile;
  recipient: UserProfile;
  onlineUsers: Set<string>;
}

interface MessageItemProps {
    msg: Message;
    isMe: boolean;
    recipient: UserProfile;
    onEdit: (msg: Message) => void;
    onDelete: (id: string) => void;
    onRetry: (msg: Message) => void;
    isFamily?: boolean;
}

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
    onEdit, 
    onDelete,
    onRetry,
    isFamily
}) => {
    const [isHovered, setIsHovered] = useState(false);
    const [imageLoaded, setImageLoaded] = useState(false);
    
    // Check if message was recently edited
    const isRecentlyEdited = msg.created_at !== (msg as any).updated_at && (msg as any).updated_at;
    const isSending = msg.status === 'sending';
    const isError = msg.status === 'error';

    const renderAttachment = () => {
        if (!msg.attachment) return null;

        if (msg.attachment.type === 'image') {
            return (
                <div className="mb-2 relative rounded-lg overflow-hidden group/image">
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
                    <a 
                        href={msg.attachment.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="absolute inset-0 bg-black/50 opacity-0 group-hover/image:opacity-100 transition-opacity flex items-center justify-center text-white"
                    >
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                    </a>
                </div>
            );
        }

        return (
            <a 
                href={msg.attachment.url} 
                target="_blank" 
                rel="noopener noreferrer"
                className={`flex items-center gap-3 p-3 rounded-xl mb-2 transition-colors ${isMe ? 'bg-white/10 hover:bg-white/20' : 'bg-black/20 hover:bg-black/30'} border border-white/10`}
            >
                <div className="w-10 h-10 rounded-lg bg-gray-800 flex items-center justify-center text-indigo-400 shrink-0">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                </div>
                <div className="min-w-0 overflow-hidden">
                    <p className="text-sm font-bold truncate text-white">{msg.attachment.name}</p>
                    <p className="text-xs text-gray-400">{formatFileSize(msg.attachment.size)}</p>
                </div>
                <div className="ml-auto">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                </div>
            </a>
        );
    };

    return (
        <div 
            className={`w-full flex ${isMe ? 'justify-end' : 'justify-start'} mb-6 animate-message-enter group relative px-2`}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
             {/* Action Buttons */}
             {isMe && isHovered && !isSending && !isError && (
                <div className="flex items-center space-x-1 mr-2 animate-fade-in absolute right-full top-1/2 -translate-y-1/2 px-2 z-10">
                    {!msg.attachment && (
                        <button 
                            onClick={() => onEdit(msg)}
                            className="p-1.5 bg-gray-800/80 hover:bg-indigo-600 backdrop-blur-md rounded-full text-gray-400 hover:text-white transition border border-white/5"
                        >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                        </button>
                    )}
                    <button 
                        onClick={() => onDelete(msg.id)}
                        className="p-1.5 bg-gray-800/80 hover:bg-red-600 backdrop-blur-md rounded-full text-gray-400 hover:text-white transition border border-white/5"
                    >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                </div>
            )}

            <div className={`flex items-end gap-3 max-w-[85%] md:max-w-[70%] ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                
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

                <div className="flex flex-col min-w-0">
                    <div className={`relative px-5 py-3 shadow-md transition-all duration-300 backdrop-blur-md ${
                        isMe 
                        ? 'bg-gradient-to-br from-indigo-600 to-violet-600 text-white rounded-[1.2rem] rounded-br-sm border border-white/10 shadow-indigo-500/10' 
                        : 'bg-white/10 text-gray-100 rounded-[1.2rem] rounded-bl-sm border border-white/5 shadow-black/20'
                    } ${isRecentlyEdited ? 'animate-message-flash' : ''} ${isSending ? 'opacity-70' : ''} ${isError ? 'border-red-500/50 bg-red-900/10' : ''}`}>
                        
                        {renderAttachment()}
                        
                        {msg.content && <p className="leading-relaxed whitespace-pre-wrap break-words text-[15px]">{msg.content}</p>}
                        
                        <div className={`flex items-center justify-between mt-1.5 gap-3 select-none ${isMe ? 'text-indigo-200/80' : 'text-gray-400'}`}>
                            <div className="flex items-center gap-1.5">
                                <p className="text-[10px] font-medium">
                                    {isSending ? 'Sending...' : isError ? 'Failed' : new Date(msg.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                </p>
                            </div>
                            {isRecentlyEdited && <span className="text-[9px] opacity-70 italic">edited</span>}
                        </div>
                    </div>
                </div>

                {isError && (
                    <button onClick={() => onRetry(msg)} className="mb-2 p-2 bg-red-600 rounded-full hover:bg-red-500 text-white transition shadow-lg shrink-0" title="Retry">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                    </button>
                )}
            </div>
        </div>
    );
};

export const ChatWindow: React.FC<ChatWindowProps> = ({ currentUser, recipient, onlineUsers }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const [familyModeEnabled, setFamilyModeEnabled] = useState(true); 
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<any>(null);

  // File Upload State
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Call Terms State
  const [showCallTerms, setShowCallTerms] = useState(false);
  const [pendingAction, setPendingAction] = useState<'start' | 'answer' | null>(null);
  const hasAcceptedTerms = useRef(localStorage.getItem('mv_call_terms_accepted') === 'true');

  const roomId = [currentUser.id, recipient.id].sort().join('_');
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const [channel, setChannel] = useState<ReturnType<typeof supabase.channel> | null>(null);

  const isRecipientOnline = onlineUsers.has(recipient.id);
  const isPenguin = recipient.email === 'cindygaldamez@yahoo.com';

  useEffect(() => {
    if (channelRef.current) supabase.removeChannel(channelRef.current);

    const newChannel = supabase.channel(`room:${roomId}`, {
        config: { broadcast: { self: false } },
    });

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
                setMessages((prev) => prev.map(m => m.id === newRecord.id ? { ...(newRecord as Message), status: 'sent' } : m));
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
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') setChannel(newChannel);
      });

    channelRef.current = newChannel;
    return () => {
        if (channelRef.current) supabase.removeChannel(channelRef.current);
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, [roomId, currentUser.id, recipient.id]);

  useEffect(() => {
    const fetchMessages = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .or(`sender_id.eq.${currentUser.id},receiver_id.eq.${currentUser.id}`)
        .or(`sender_id.eq.${recipient.id},receiver_id.eq.${recipient.id}`)
        .order('created_at', { ascending: true });

      if (!error && data) {
        const conversation = data.filter(
            (m: Message) => 
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
  }, [messages, isTyping]);

  const { callState, remoteStream, startCall, endCall, answerCall, toggleMute, isMuted } = useWebRTC(channel, currentUser.id);

  // If call disconnects while terms modal is open for answering, close it
  useEffect(() => {
      if (pendingAction === 'answer' && callState === CallState.IDLE) {
          setShowCallTerms(false);
          setPendingAction(null);
      }
  }, [callState, pendingAction]);

  const handleStartCallClick = () => {
      if (hasAcceptedTerms.current) {
          startCall();
      } else {
          setPendingAction('start');
          setShowCallTerms(true);
      }
  };

  const handleAnswerCallClick = () => {
      if (hasAcceptedTerms.current) {
          answerCall();
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
          startCall();
      } else if (pendingAction === 'answer') {
          answerCall();
      }
      setPendingAction(null);
  };

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
      setNewMessage(e.target.value);
      channel?.send({ type: 'broadcast', event: 'typing', payload: { userId: currentUser.id } });
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
          setSelectedFile(e.target.files[0]);
      }
  };

  const handleSendMessage = async (e?: React.FormEvent, retryMsg?: Message) => {
    if (e) e.preventDefault();
    const content = retryMsg ? retryMsg.content : newMessage;
    const fileToSend = selectedFile; // Capture in closure
    
    // Allow sending if there is text OR a file
    if (!content.trim() && !fileToSend && !retryMsg) return;

    if (editingId && !retryMsg) {
        // Edit flow (no file upload support in edit mode for this demo)
        const idToUpdate = editingId;
        setMessages(prev => prev.map(m => m.id === idToUpdate ? { ...m, content, status: 'sending' } : m));
        setNewMessage('');
        setEditingId(null);

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
            content: content 
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
        // Fallback for content if only sending file (assuming DB permits empty string, otherwise use a placeholder)
        if (!finalMsg.content) finalMsg.content = ""; 

        const { data, error } = await supabase.from('messages').insert(finalMsg).select().single();
        if (error) setMessages(prev => prev.map(m => m.id === tempId ? { ...m, status: 'error' } : m));
        else if (data) setMessages((prev) => prev.map(m => m.id === tempId ? { ...data, status: 'sent' } : m));
    }
  };

  const handleEdit = (msg: Message) => {
      if (msg.attachment) {
          alert("Editing messages with attachments is not supported in this version.");
          return;
      }
      setNewMessage(msg.content);
      setEditingId(msg.id);
      document.getElementById('chat-input')?.focus();
  };

  const handleDelete = async (id: string) => {
      if(!confirm("Are you sure?")) return;
      setMessages(prev => prev.filter(m => m.id !== id));
      await supabase.from('messages').delete().eq('id', id);
  };

  return (
    <div className="flex flex-col h-full bg-[#030014] relative font-['Outfit']">
      {/* Background & Effects */}
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.15] pointer-events-none mix-blend-overlay"></div>
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none"></div>
      
      {/* Header - Hidden on Mobile in favor of App wrapper header, shown on Desktop */}
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
            {currentUser.is_family && (
                <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-full border border-white/5 mr-2">
                    <button 
                        onClick={() => setFamilyModeEnabled(!familyModeEnabled)}
                        className={`w-7 h-3.5 rounded-full relative transition-colors duration-300 ${familyModeEnabled ? 'bg-amber-500' : 'bg-gray-600'}`}
                    >
                        <div className={`absolute top-0.5 left-0.5 w-2.5 h-2.5 bg-white rounded-full transition-transform duration-300 ${familyModeEnabled ? 'translate-x-3.5' : 'translate-x-0'}`}></div>
                    </button>
                    <span className={`text-[9px] font-bold ${familyModeEnabled ? 'text-amber-400' : 'text-gray-500'}`}>PRIORITY</span>
                </div>
            )}
            
            <button
              onClick={handleStartCallClick}
              disabled={callState !== CallState.IDLE}
              className={`p-2.5 rounded-full transition-all duration-300 shadow-lg group ${
                  callState === CallState.IDLE 
                  ? 'bg-white/10 hover:bg-white/20 text-white hover:scale-105 border border-white/10' 
                  : 'bg-gray-800 text-gray-600 cursor-not-allowed'
              }`}
              title="Start Voice Call"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
            </button>
        </div>
      </div>
      
      {/* Mobile Only Header Actions (If needed, typically inside App.tsx wrapper for mobile) */}
      <div className="md:hidden absolute top-4 right-4 z-30">
           <button
              onClick={handleStartCallClick}
              disabled={callState !== CallState.IDLE}
              className={`p-2.5 rounded-full transition-all duration-300 shadow-lg ${
                  callState === CallState.IDLE 
                  ? 'bg-white/10 text-white border border-white/10 backdrop-blur-md' 
                  : 'bg-gray-800/80 text-gray-500'
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
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                        onRetry={(m) => handleSendMessage(undefined, m)}
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
        <div className="max-w-4xl mx-auto relative">
            {/* File Preview */}
            {selectedFile && (
                <div className="absolute bottom-full left-0 mb-3 mx-4 bg-gray-900/90 backdrop-blur-xl border border-indigo-500/50 rounded-2xl p-3 flex items-center gap-3 animate-slide-up shadow-2xl z-30 max-w-[80%]">
                    <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center shrink-0 text-indigo-400">
                        {selectedFile.type.startsWith('image/') ? (
                             <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                        ) : (
                             <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                        )}
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

            {editingId && (
                <div className="absolute bottom-full left-0 right-0 mb-3 mx-4 bg-gray-900/90 backdrop-blur-xl border border-indigo-500/50 rounded-2xl px-4 py-3 flex justify-between items-center text-xs text-indigo-300 animate-slide-up shadow-2xl">
                    <div className="flex items-center gap-2">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                        <span className="font-semibold">Editing message</span>
                    </div>
                    <button onClick={() => { setNewMessage(''); setEditingId(null); }} className="hover:text-white bg-white/10 px-3 py-1 rounded-lg transition">Cancel</button>
                </div>
            )}
            
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
                type="text"
                className="flex-1 bg-transparent text-white px-2 py-3 focus:outline-none placeholder-gray-600 font-medium text-[15px]"
                placeholder={editingId ? "Update your message..." : "Message..."}
                value={newMessage}
                onChange={handleInput}
                autoComplete="off"
              />
              
              <button
                type="submit"
                disabled={(!newMessage.trim() && !selectedFile) || isUploading}
                className={`p-2.5 rounded-full text-white font-bold transition-all shadow-lg active:scale-95 flex items-center justify-center shrink-0 ${
                    (newMessage.trim() || selectedFile) && !isUploading
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

      <VoiceCallOverlay 
        callState={callState} 
        remoteStream={remoteStream} 
        onEndCall={endCall} 
        onAnswer={handleAnswerCallClick}
        toggleMute={toggleMute}
        isMuted={isMuted}
        recipient={recipient}
      />

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
    </div>
  );
};