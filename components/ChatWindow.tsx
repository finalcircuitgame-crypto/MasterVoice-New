import React, { useEffect, useState, useRef } from 'react';
import { supabase } from '../supabaseClient';
import { Message, UserProfile, CallState } from '../types';
import { useWebRTC } from '../hooks/useWebRTC';
import { VoiceCallOverlay } from './VoiceCallOverlay';

interface ChatWindowProps {
  currentUser: UserProfile;
  recipient: UserProfile;
  onlineUsers: Set<string>;
}

interface MessageItemProps {
    msg: Message;
    isMe: boolean;
    recipientInitial?: string;
    onEdit: (msg: Message) => void;
    onDelete: (id: string) => void;
    onRetry: (msg: Message) => void;
    isFamily?: boolean;
}

const MessageItem: React.FC<MessageItemProps> = ({ 
    msg, 
    isMe, 
    recipientInitial,
    onEdit, 
    onDelete,
    onRetry,
    isFamily
}) => {
    const [isHovered, setIsHovered] = useState(false);
    
    // Check if message was recently edited
    const isRecentlyEdited = msg.created_at !== (msg as any).updated_at && (msg as any).updated_at;
    const isSending = msg.status === 'sending';
    const isError = msg.status === 'error';

    return (
        <div 
            className={`w-full flex ${isMe ? 'justify-end' : 'justify-start'} mb-6 animate-message-enter group relative px-2`}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
             {/* Action Buttons */}
             {isMe && isHovered && !isSending && !isError && (
                <div className="flex items-center space-x-1 mr-2 animate-fade-in absolute right-full top-1/2 -translate-y-1/2 px-2 z-10">
                    <button 
                        onClick={() => onEdit(msg)}
                        className="p-1.5 bg-gray-800/80 hover:bg-indigo-600 backdrop-blur-md rounded-full text-gray-400 hover:text-white transition border border-white/5"
                    >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                    </button>
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
                    <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center text-xs text-gray-300 font-bold shrink-0 mb-1 border border-white/10 shadow-sm">
                        {recipientInitial}
                    </div>
                )}

                <div className="flex flex-col">
                    <div className={`relative px-5 py-3 shadow-sm transition-all duration-300 backdrop-blur-md ${
                        isMe 
                        ? 'bg-gradient-to-br from-indigo-600 to-violet-600 text-white rounded-[1.2rem] rounded-br-sm border border-white/10 shadow-indigo-500/10' 
                        : 'bg-white/10 text-gray-100 rounded-[1.2rem] rounded-bl-sm border border-white/5 shadow-black/20'
                    } ${isRecentlyEdited ? 'animate-message-flash' : ''} ${isSending ? 'opacity-70' : ''} ${isError ? 'border-red-500/50 bg-red-900/10' : ''}`}>
                        
                        <p className="leading-relaxed whitespace-pre-wrap break-words text-[15px]">{msg.content}</p>
                        
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
                    <button onClick={() => onRetry(msg)} className="mb-2 p-2 bg-red-600 rounded-full hover:bg-red-500 text-white transition shadow-lg shrink-0">
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

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
      setNewMessage(e.target.value);
      channel?.send({ type: 'broadcast', event: 'typing', payload: { userId: currentUser.id } });
  };

  const handleSendMessage = async (e?: React.FormEvent, retryMsg?: Message) => {
    if (e) e.preventDefault();
    const content = retryMsg ? retryMsg.content : newMessage;
    if (!content.trim()) return;

    if (editingId && !retryMsg) {
        const idToUpdate = editingId;
        setMessages(prev => prev.map(m => m.id === idToUpdate ? { ...m, content, status: 'sending' } : m));
        setNewMessage('');
        setEditingId(null);

        const { error } = await supabase.from('messages').update({ content, updated_at: new Date().toISOString() }).eq('id', idToUpdate);
        if (error) setMessages(prev => prev.map(m => m.id === idToUpdate ? { ...m, status: 'error' } : m));
        else setMessages(prev => prev.map(m => m.id === idToUpdate ? { ...m, status: 'sent' } : m));
    } else {
        const tempId = retryMsg ? retryMsg.id : Math.random().toString();
        const msg: any = { sender_id: currentUser.id, receiver_id: recipient.id, content: content };
        
        if (!retryMsg) {
            setMessages((prev) => [...prev, { ...msg, id: tempId, created_at: new Date().toISOString(), status: 'sending' }]);
            setNewMessage('');
        } else {
             setMessages((prev) => prev.map(m => m.id === tempId ? { ...m, status: 'sending' } : m));
        }
    
        const { data, error } = await supabase.from('messages').insert(msg).select().single();
        if (error) setMessages(prev => prev.map(m => m.id === tempId ? { ...m, status: 'error' } : m));
        else if (data) setMessages((prev) => prev.map(m => m.id === tempId ? { ...data, status: 'sent' } : m));
    }
  };

  const handleEdit = (msg: Message) => {
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
    <div className="flex flex-col h-full bg-[#030014] relative">
      {/* Background & Effects */}
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.15] pointer-events-none mix-blend-overlay"></div>
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none"></div>
      
      {/* Header */}
      <div className="px-6 py-4 flex justify-between items-center bg-[#030014]/60 backdrop-blur-xl border-b border-white/5 z-20 sticky top-0 shadow-sm">
        <div className="flex items-center space-x-4">
            <div className="relative">
                <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-indigo-500 to-fuchsia-600 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-indigo-500/30">
                    {recipient.email[0].toUpperCase()}
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
              onClick={startCall}
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

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 relative z-10 scroll-smooth space-y-2">
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
                    <span className="text-[10px] text-gray-500 bg-white/5 px-4 py-1.5 rounded-full border border-white/5 tracking-wider uppercase">
                        End-to-End Encrypted Conversation
                    </span>
                </div>

                {messages.map((msg) => (
                    <MessageItem 
                        key={msg.id} 
                        msg={msg} 
                        isMe={Boolean(currentUser && currentUser.id && msg.sender_id === currentUser.id)}
                        recipientInitial={recipient.email[0].toUpperCase()}
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
      <div className="p-4 md:p-6 pt-2 relative z-20">
        <div className="max-w-4xl mx-auto relative">
            {editingId && (
                <div className="absolute bottom-full left-0 right-0 mb-3 mx-4 bg-gray-900/90 backdrop-blur-xl border border-indigo-500/50 rounded-2xl px-4 py-3 flex justify-between items-center text-xs text-indigo-300 animate-slide-up shadow-2xl">
                    <div className="flex items-center gap-2">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                        <span className="font-semibold">Editing message</span>
                    </div>
                    <button onClick={() => { setNewMessage(''); setEditingId(null); }} className="hover:text-white bg-white/10 px-3 py-1 rounded-lg transition">Cancel</button>
                </div>
            )}
            
            <form onSubmit={(e) => handleSendMessage(e)} className="group flex items-center gap-3 bg-[#13131a]/80 backdrop-blur-md border border-white/10 p-2 pr-3 pl-4 rounded-[1.8rem] shadow-2xl focus-within:ring-2 focus-within:ring-indigo-500/50 focus-within:border-indigo-500/50 transition-all duration-300 hover:border-white/20">
              <button type="button" className="text-gray-500 hover:text-indigo-400 transition p-1">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
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
                disabled={!newMessage.trim()}
                className={`p-2.5 rounded-full text-white font-bold transition-all shadow-lg active:scale-95 flex items-center justify-center ${
                    newMessage.trim() 
                    ? 'bg-gradient-to-r from-indigo-600 to-fuchsia-600 hover:shadow-indigo-500/25 transform hover:-translate-y-0.5' 
                    : 'bg-gray-800 text-gray-500 cursor-not-allowed'
                }`}
              >
                {editingId ? (
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
        onAnswer={answerCall}
        toggleMute={toggleMute}
        isMuted={isMuted}
      />
    </div>
  );
};