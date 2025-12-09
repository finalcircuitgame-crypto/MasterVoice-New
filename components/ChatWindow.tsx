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
    onEdit: (msg: Message) => void;
    onDelete: (id: string) => void;
    onRetry: (msg: Message) => void;
}

// Separate component for individual message items to handle animations and interactions cleanly
const MessageItem: React.FC<MessageItemProps> = ({ 
    msg, 
    isMe, 
    onEdit, 
    onDelete,
    onRetry
}) => {
    const [isHovered, setIsHovered] = useState(false);
    
    // Check if message was recently edited (within last 5 seconds) to trigger flash
    const isRecentlyEdited = msg.created_at !== (msg as any).updated_at && (msg as any).updated_at;
    
    // Status visual helpers
    const isSending = msg.status === 'sending';
    const isError = msg.status === 'error';

    return (
        <div 
            className={`flex ${isMe ? 'justify-end' : 'justify-start'} mb-4 animate-message-enter group relative`}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
             {/* Action Buttons for user's own messages */}
             {isMe && isHovered && !isSending && !isError && (
                <div className="flex items-center space-x-2 mr-2 animate-fade-in absolute right-full top-1/2 -translate-y-1/2 px-2">
                    <button 
                        onClick={() => onEdit(msg)}
                        className="p-1.5 bg-gray-700 hover:bg-blue-600 rounded-full text-gray-300 hover:text-white transition"
                        title="Edit"
                    >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                    </button>
                    <button 
                        onClick={() => onDelete(msg.id)}
                        className="p-1.5 bg-gray-700 hover:bg-red-600 rounded-full text-gray-300 hover:text-white transition"
                        title="Delete"
                    >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                </div>
            )}

            <div className={`flex items-end ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                <div className={`relative max-w-xs md:max-w-md px-4 py-2 rounded-2xl shadow-md transition-all duration-300 ${
                    isMe ? 'bg-blue-600 text-white rounded-br-none' : 'bg-gray-700 text-gray-200 rounded-bl-none'
                } ${isRecentlyEdited ? 'animate-message-flash' : ''} ${isSending ? 'opacity-70' : ''} ${isError ? 'border-2 border-red-500 bg-red-900/20' : ''}`}>
                    
                    <p>{msg.content}</p>
                    
                    <div className="flex items-center justify-between mt-1 gap-4">
                        <div className="flex items-center gap-2">
                             <p className={`text-[10px] ${isMe ? 'text-blue-200' : 'text-gray-400'}`}>
                                {isSending ? 'Sending...' : isError ? 'Failed' : new Date(msg.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                             </p>
                             {isSending && (
                                <svg className="animate-spin h-3 w-3 text-blue-200" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                             )}
                        </div>
                        {isRecentlyEdited && (
                            <span className={`text-[9px] opacity-70 italic ${isMe ? 'text-blue-200' : 'text-gray-400'}`}>edited</span>
                        )}
                    </div>
                </div>

                {isError && (
                    <button 
                        onClick={() => onRetry(msg)}
                        className="mb-2 mx-2 p-2 bg-red-600 rounded-full hover:bg-red-500 text-white transition shadow-lg"
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
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<any>(null);

  // Determine a unique room ID (sorted user IDs)
  const roomId = [currentUser.id, recipient.id].sort().join('_');
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  // Initialize Channel for Msg + Signal
  const [channel, setChannel] = useState<ReturnType<typeof supabase.channel> | null>(null);

  // Status check
  const isRecipientOnline = onlineUsers.has(recipient.id);

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
    <div className="flex flex-col h-full bg-gray-900">
      {/* Header */}
      <div className="p-4 border-b border-gray-800 flex justify-between items-center bg-gray-800 shadow-md z-10">
        <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold animate-pulse-glow">
                {recipient.email[0].toUpperCase()}
            </div>
            <div>
                <h2 className="font-semibold text-white">{recipient.email}</h2>
                <div className="flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${isRecipientOnline ? 'bg-green-500 animate-pulse' : 'bg-gray-500'}`}></span>
                    <span className={`text-xs ${isRecipientOnline ? 'text-green-400' : 'text-gray-400'}`}>
                        {isRecipientOnline ? 'Online' : 'Offline'}
                    </span>
                </div>
            </div>
        </div>
        <button
          onClick={startCall}
          disabled={callState !== CallState.IDLE}
          className="p-2.5 bg-gray-700 hover:bg-gray-600 rounded-full text-blue-400 disabled:opacity-50 disabled:cursor-not-allowed transition transform hover:scale-105 active:scale-95"
          title="Start Voice Call"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
          </svg>
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-1">
        {loading ? (
            <div className="flex flex-col items-center justify-center h-full space-y-4">
                <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-gray-500 text-sm">Loading history...</span>
            </div>
        ) : (
            <>
                {messages.map((msg) => (
                    <MessageItem 
                        key={msg.id} 
                        msg={msg} 
                        isMe={msg.sender_id === currentUser.id} 
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                        onRetry={(m) => handleSendMessage(undefined, m)}
                    />
                ))}
                
                {/* Typing Indicator */}
                {isTyping && (
                    <div className="flex justify-start mb-4 animate-fade-in-up">
                        <div className="bg-gray-700 rounded-2xl rounded-bl-none px-4 py-3 flex space-x-1 items-center">
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-typing-bounce" style={{ animationDelay: '0s' }}></div>
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-typing-bounce" style={{ animationDelay: '0.2s' }}></div>
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-typing-bounce" style={{ animationDelay: '0.4s' }}></div>
                        </div>
                    </div>
                )}
            </>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 bg-gray-800 border-t border-gray-700 relative">
        {editingId && (
            <div className="absolute top-[-30px] left-0 w-full bg-gray-800/90 backdrop-blur px-4 py-1 flex justify-between items-center text-xs border-t border-blue-500/30 text-blue-300 animate-slide-up">
                <span>Editing message...</span>
                <button onClick={cancelEdit} className="hover:text-white">Cancel</button>
            </div>
        )}
        <form onSubmit={(e) => handleSendMessage(e)} className="flex space-x-2">
          <input
            id="chat-input"
            type="text"
            className={`flex-1 bg-gray-700 text-white rounded-full px-5 py-3 focus:ring-2 focus:ring-blue-500 outline-none border border-gray-600 transition-all ${editingId ? 'ring-2 ring-blue-500/50' : ''}`}
            placeholder={editingId ? "Update your message..." : "Type a message..."}
            value={newMessage}
            onChange={handleInput}
          />
          <button
            type="submit"
            className={`rounded-full p-3 px-6 text-white font-semibold transition-all shadow-lg active:scale-95 ${
                editingId 
                ? 'bg-green-600 hover:bg-green-500 shadow-green-600/20' 
                : 'bg-blue-600 hover:bg-blue-500 shadow-blue-600/20'
            }`}
          >
            {editingId ? 'Update' : 'Send'}
          </button>
        </form>
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