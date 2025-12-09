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

// Separate component for individual message items to handle animations and interactions cleanly
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
    
    // Check if message was recently edited (within last 5 seconds) to trigger flash
    const isRecentlyEdited = msg.created_at !== (msg as any).updated_at && (msg as any).updated_at;
    
    // Status visual helpers
    const isSending = msg.status === 'sending';
    const isError = msg.status === 'error';

    return (
        <div 
            className={`w-full flex ${isMe ? 'justify-end' : 'justify-start'} mb-5 animate-message-enter group relative px-2`}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
             {/* Action Buttons for user's own messages */}
             {isMe && isHovered && !isSending && !isError && (
                <div className="flex items-center space-x-2 mr-3 animate-fade-in absolute right-full top-1/2 -translate-y-1/2 px-2 z-10">
                    <button 
                        onClick={() => onEdit(msg)}
                        className="p-2 bg-gray-800/80 hover:bg-indigo-600 backdrop-blur-md rounded-full text-gray-300 hover:text-white transition shadow-lg border border-white/5"
                        title="Edit"
                    >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                    </button>
                    <button 
                        onClick={() => onDelete(msg.id)}
                        className="p-2 bg-gray-800/80 hover:bg-red-600 backdrop-blur-md rounded-full text-gray-300 hover:text-white transition shadow-lg border border-white/5"
                        title="Delete"
                    >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                </div>
            )}

            <div className={`flex items-end gap-3 max-w-[85%] md:max-w-[70%] ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                
                {/* Avatar for Recipient (Friend) */}
                {!isMe && (
                    <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-gray-800 to-gray-700 flex items-center justify-center text-xs text-white font-bold shrink-0 mb-1 shadow-lg border border-white/5 relative">
                        {recipientInitial}
                    </div>
                )}

                <div className="flex flex-col">
                    <div className={`relative px-5 py-3.5 shadow-xl transition-all duration-300 border border-white/5 backdrop-blur-sm ${
                        isMe 
                        ? 'bg-gradient-to-tr from-indigo-600 to-violet-600 text-white rounded-2xl rounded-tr-sm shadow-indigo-500/10' 
                        : 'bg-white/5 text-gray-100 rounded-2xl rounded-tl-sm shadow-black/20'
                    } ${isRecentlyEdited ? 'animate-message-flash' : ''} ${isSending ? 'opacity-70 grayscale' : ''} ${isError ? 'border-red-500/50 bg-red-900/10' : ''}`}>
                        
                        <p className="leading-relaxed whitespace-pre-wrap break-words text-[15px]">{msg.content}</p>
                        
                        <div className="flex items-center justify-between mt-1 gap-4 select-none">
                            <div className="flex items-center gap-2">
                                <p className={`text-[10px] ${isMe ? 'text-indigo-200' : 'text-gray-400'}`}>
                                    {isSending ? 'Sending...' : isError ? 'Failed' : new Date(msg.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                </p>
                                {isSending && (
                                    <svg className="animate-spin h-3 w-3 text-indigo-200" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                )}
                            </div>
                            {isRecentlyEdited && (
                                <span className={`text-[9px] opacity-70 italic ${isMe ? 'text-indigo-200' : 'text-gray-400'}`}>edited</span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Retry Button placed nicely next to bubble if error */}
                {isError && (
                    <button 
                        onClick={() => onRetry(msg)}
                        className="mb-2 p-2 bg-red-600 rounded-full hover:bg-red-500 text-white transition shadow-lg shrink-0"
                        title="Retry sending"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
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
  const [familyModeEnabled, setFamilyModeEnabled] = useState(true); // Default true for demo
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<any>(null);

  // Determine a unique room ID (sorted user IDs)
  const roomId = [currentUser.id, recipient.id].sort().join('_');
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  // Initialize Channel for Msg + Signal
  const [channel, setChannel] = useState<ReturnType<typeof supabase.channel> | null>(null);

  // Status check
  const isRecipientOnline = onlineUsers.has(recipient.id);
  const isPenguin = recipient.email === 'cindygaldamez@yahoo.com';

  useEffect(() => {
    // Clean up old channel if exists
    if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
    }

    const newChannel = supabase.channel(`room:${roomId}`, {
        config: {
            broadcast: { self: false },
        },
    });

    // Subscribe to DB changes for Messages (ALL events: INSERT, UPDATE, DELETE)
    newChannel
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
        },
        (payload) => {
            const { eventType, new: newRecord, old: oldRecord } = payload;
            
            // Filter: Ensure message belongs to this conversation
            const record = (newRecord || oldRecord) as any;
            if (!record) return;
            
            // Check if this message involves current conversation participants
            const isRelevant = 
                (record.sender_id === currentUser.id && record.receiver_id === recipient.id) ||
                (record.sender_id === recipient.id && record.receiver_id === currentUser.id);
                
            if (!isRelevant) return;

            if (eventType === 'INSERT') {
                setMessages((prev) => {
                    // Prevent duplicates. Usually the Optimistic UI adds a message first with a temp ID.
                    // If we find a message with content match and 'sending' status, we might replace it, 
                    // but it's safer to rely on ID. Since ID changes from temp to real on success, 
                    // this realtime event acts as a "confirm from other devices" or "receive from other user".
                    
                    // For incoming messages from others:
                    if (prev.find(m => m.id === newRecord.id)) return prev;
                    return [...prev, { ...newRecord, status: 'sent' } as Message];
                });
                
                // If the other user sent a message, they stopped typing
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
      // Listen for Typing Indicators
      .on('broadcast', { event: 'typing' }, (payload) => {
          if (payload.payload.userId === recipient.id) {
              setIsTyping(true);
              // Auto-clear typing status after 3 seconds of inactivity
              if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
              typingTimeoutRef.current = setTimeout(() => setIsTyping(false), 3000);
          }
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
            setChannel(newChannel);
        }
      });

    channelRef.current = newChannel;

    return () => {
        if (channelRef.current) supabase.removeChannel(channelRef.current);
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, [roomId, currentUser.id, recipient.id]);

  // Fetch initial messages
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
        // Filter locally to ensure we only get this conversation
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

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // WebRTC Hook
  const { callState, remoteStream, startCall, endCall, answerCall, toggleMute, isMuted } = useWebRTC(channel, currentUser.id);

  // Send Typing Indicator
  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
      setNewMessage(e.target.value);
      
      // Throttle sending typing events
      channel?.send({
          type: 'broadcast',
          event: 'typing',
          payload: { userId: currentUser.id }
      });
  };

  const handleSendMessage = async (e?: React.FormEvent, retryMsg?: Message) => {
    if (e) e.preventDefault();
    
    const content = retryMsg ? retryMsg.content : newMessage;
    if (!content.trim()) return;

    if (editingId && !retryMsg) {
        // Handle Update
        const idToUpdate = editingId;
        
        // Optimistic Update
        setMessages(prev => prev.map(m => m.id === idToUpdate ? { ...m, content, status: 'sending' } : m));
        setNewMessage('');
        setEditingId(null);

        const { error } = await supabase
            .from('messages')
            .update({ content, updated_at: new Date().toISOString() })
            .eq('id', idToUpdate);
            
        if (error) {
            console.error("Failed to update message", error);
            // Mark as error
            setMessages(prev => prev.map(m => m.id === idToUpdate ? { ...m, status: 'error' } : m));
        } else {
            // Mark as sent
            setMessages(prev => prev.map(m => m.id === idToUpdate ? { ...m, status: 'sent' } : m));
        }
    } else {
        // Handle Insert
        const tempId = retryMsg ? retryMsg.id : Math.random().toString();
        const msg: any = {
          sender_id: currentUser.id,
          receiver_id: recipient.id,
          content: content,
        };
    
        if (!retryMsg) {
            // Optimistic Append
            setMessages((prev) => [...prev, { ...msg, id: tempId, created_at: new Date().toISOString(), status: 'sending' }]);
            setNewMessage('');
        } else {
            // Update existing failed message to sending
             setMessages((prev) => prev.map(m => m.id === tempId ? { ...m, status: 'sending' } : m));
        }
    
        const { data, error } = await supabase.from('messages').insert(msg).select().single();
        
        if (error) {
            console.error('Error sending message:', error);
            setMessages(prev => prev.map(m => m.id === tempId ? { ...m, status: 'error' } : m));
        } else if (data) {
            // Replace temp ID with real ID and mark sent
            setMessages((prev) => prev.map(m => m.id === tempId ? { ...data, status: 'sent' } : m));
        }
    }
  };

  const handleEdit = (msg: Message) => {
      setNewMessage(msg.content);
      setEditingId(msg.id);
      // Focus input
      const input = document.getElementById('chat-input');
      if(input) input.focus();
  };

  const handleDelete = async (id: string) => {
      if(!confirm("Are you sure you want to delete this message?")) return;

      // Optimistic Delete
      setMessages(prev => prev.filter(m => m.id !== id));

      const { error } = await supabase.from('messages').delete().eq('id', id);
      if (error) {
          console.error("Failed to delete", error);
          // Re-fetch or revert in robust app
      }
  };

  const cancelEdit = () => {
      setNewMessage('');
      setEditingId(null);
  };

  return (
    <div className="flex flex-col h-full bg-[#030014] relative">
      {/* Background Noise Texture */}
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none mix-blend-overlay"></div>
      
      {/* Header */}
      <div className="px-6 py-4 flex justify-between items-center bg-gray-900/60 backdrop-blur-xl border-b border-white/5 shadow-xl z-20 sticky top-0">
        <div className="flex items-center space-x-4">
            <div className="relative">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-500 to-fuchsia-600 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-indigo-500/20">
                    {recipient.email[0].toUpperCase()}
                </div>
                <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-[#030014] flex items-center justify-center ${isRecipientOnline ? 'bg-green-500' : 'bg-gray-500'}`}>
                    {isRecipientOnline && <div className="w-full h-full rounded-full animate-ping bg-green-400 opacity-75"></div>}
                </div>
            </div>
            <div>
                <div className="flex items-center gap-2">
                    <h2 className="font-bold text-white text-lg leading-tight">{recipient.email}</h2>
                    {isPenguin && <span className="text-xl animate-wobble" title="Special Penguin Badge">🐧</span>}
                </div>
                <div className="flex items-center gap-2">
                    <span className={`text-xs font-medium ${isRecipientOnline ? 'text-green-400' : 'text-gray-400'}`}>
                        {isRecipientOnline ? 'Online' : 'Offline'}
                    </span>
                    {currentUser.is_family && (
                        <div className="flex items-center gap-1 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                            <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider animate-text-shimmer">Family Member</span>
                        </div>
                    )}
                </div>
            </div>
        </div>

        <div className="flex items-center gap-3">
            {/* Family Priority Feature Toggle */}
            {currentUser.is_family && (
                <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-gray-800/50 rounded-full border border-white/5 mr-2">
                    <button 
                        onClick={() => setFamilyModeEnabled(!familyModeEnabled)}
                        className={`w-8 h-4 rounded-full relative transition-colors duration-300 ${familyModeEnabled ? 'bg-amber-500' : 'bg-gray-600'}`}
                    >
                        <div className={`absolute top-0.5 left-0.5 w-3 h-3 bg-white rounded-full transition-transform duration-300 ${familyModeEnabled ? 'translate-x-4' : 'translate-x-0'}`}></div>
                    </button>
                    <span className={`text-[10px] font-bold ${familyModeEnabled ? 'text-amber-400' : 'text-gray-400'}`}>PRIORITY</span>
                </div>
            )}
            
            <button
              onClick={startCall}
              disabled={callState !== CallState.IDLE}
              className={`p-3 rounded-xl transition-all duration-300 shadow-lg ${
                  callState === CallState.IDLE 
                  ? 'bg-gradient-to-r from-indigo-600 to-violet-600 hover:scale-105 text-white shadow-indigo-500/20' 
                  : 'bg-gray-700 text-gray-500 cursor-not-allowed'
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
      <div className="flex-1 overflow-y-auto p-6 space-y-4 relative z-10 scroll-smooth">
        {loading ? (
            <div className="flex flex-col items-center justify-center h-full space-y-4">
                <div className="relative w-12 h-12">
                    <div className="absolute inset-0 border-4 border-indigo-500/30 rounded-full"></div>
                    <div className="absolute inset-0 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
                <span className="text-indigo-200/50 text-sm font-medium tracking-wide">Loading history...</span>
            </div>
        ) : (
            <>
                <div className="flex justify-center mb-6">
                    <span className="text-xs text-gray-500 bg-gray-900/50 px-3 py-1 rounded-full border border-white/5">
                        Messages are secured with end-to-end encryption logic.
                    </span>
                </div>

                {messages.map((msg) => (
                    <MessageItem 
                        key={msg.id} 
                        msg={msg} 
                        isMe={Boolean(currentUser && currentUser.id && msg.sender_id === currentUser.id)} // STRICT CHECK
                        recipientInitial={recipient.email[0].toUpperCase()}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                        onRetry={(m) => handleSendMessage(undefined, m)}
                        isFamily={currentUser.is_family}
                    />
                ))}
                
                {/* Typing Indicator */}
                {isTyping && (
                    <div className="flex justify-start mb-4 animate-fade-in-up w-full px-2">
                        <div className="flex items-end gap-3">
                            <div className="w-9 h-9 rounded-2xl bg-gray-800 flex items-center justify-center text-xs text-white shrink-0 mb-1 border border-white/5">
                                {recipient.email[0].toUpperCase()}
                            </div>
                            <div className="bg-gray-800/80 backdrop-blur-sm rounded-2xl rounded-tl-sm px-4 py-3.5 flex space-x-1.5 items-center border border-white/5">
                                <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-typing-bounce" style={{ animationDelay: '0s' }}></div>
                                <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-typing-bounce" style={{ animationDelay: '0.2s' }}></div>
                                <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-typing-bounce" style={{ animationDelay: '0.4s' }}></div>
                            </div>
                        </div>
                    </div>
                )}
            </>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Floating Input Area */}
      <div className="p-4 relative z-20">
        <div className="max-w-4xl mx-auto">
            {editingId && (
                <div className="mx-4 mb-2 bg-indigo-900/30 backdrop-blur border border-indigo-500/30 rounded-xl px-4 py-2 flex justify-between items-center text-xs text-indigo-200 animate-slide-up">
                    <div className="flex items-center gap-2">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                        <span className="font-semibold">Editing message...</span>
                    </div>
                    <button onClick={cancelEdit} className="hover:text-white bg-white/10 px-2 py-0.5 rounded transition">Cancel</button>
                </div>
            )}
            
            <form onSubmit={(e) => handleSendMessage(e)} className="flex items-center gap-3 bg-gray-900/80 backdrop-blur-xl border border-white/10 p-2 rounded-[2rem] shadow-2xl">
              <div className="pl-4">
                  <button type="button" className="text-gray-400 hover:text-indigo-400 transition">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  </button>
              </div>
              
              <input
                id="chat-input"
                type="text"
                className="flex-1 bg-transparent text-white px-2 py-3 focus:outline-none placeholder-gray-500 font-medium"
                placeholder={editingId ? "Update your message..." : "Type a message..."}
                value={newMessage}
                onChange={handleInput}
                autoComplete="off"
              />
              
              <button
                type="submit"
                className={`p-3 pr-5 pl-5 rounded-full text-white font-bold transition-all shadow-lg active:scale-95 flex items-center gap-2 ${
                    editingId 
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:shadow-emerald-500/20' 
                    : 'bg-gradient-to-r from-indigo-600 to-fuchsia-600 hover:shadow-indigo-500/20'
                }`}
              >
                <span>{editingId ? 'Save' : 'Send'}</span>
                {!editingId && <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>}
              </button>
            </form>
        </div>
      </div>

      {/* Call Overlay */}
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