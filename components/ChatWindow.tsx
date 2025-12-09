import React, { useEffect, useState, useRef } from 'react';
import { supabase } from '../supabaseClient';
import { Message, UserProfile, CallState } from '../types';
import { useWebRTC } from '../hooks/useWebRTC';
import { VoiceCallOverlay } from './VoiceCallOverlay';

interface ChatWindowProps {
  currentUser: UserProfile;
  recipient: UserProfile;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({ currentUser, recipient }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Determine a unique room ID (sorted user IDs)
  const roomId = [currentUser.id, recipient.id].sort().join('_');
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  // Initialize Channel for Msg + Signal
  const [channel, setChannel] = useState<ReturnType<typeof supabase.channel> | null>(null);

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

    // Subscribe to DB changes for Messages
    newChannel
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `receiver_id=eq.${currentUser.id}`, // Very basic filter, in prod use RLS
        },
        (payload) => {
            // In a real app with proper RLS and filters, we'd verify sender
            // Here we just append if it matches sender
            if (payload.new.sender_id === recipient.id) {
                setMessages((prev) => [...prev, payload.new as Message]);
            }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
            setChannel(newChannel);
        }
      });

    channelRef.current = newChannel;

    return () => {
        if (channelRef.current) supabase.removeChannel(channelRef.current);
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
        // Filter locally to ensure we only get this conversation (PostgREST OR syntax is tricky combined)
        const conversation = data.filter(
            (m: Message) => 
            (m.sender_id === currentUser.id && m.receiver_id === recipient.id) ||
            (m.sender_id === recipient.id && m.receiver_id === currentUser.id)
        );
        setMessages(conversation);
      }
      setLoading(false);
    };
    fetchMessages();
  }, [currentUser.id, recipient.id]);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // WebRTC Hook
  const { callState, remoteStream, startCall, endCall } = useWebRTC(channel, currentUser.id);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const msg = {
      sender_id: currentUser.id,
      receiver_id: recipient.id,
      content: newMessage,
    };

    // Optimistic UI
    const tempId = Math.random().toString();
    setMessages((prev) => [...prev, { ...msg, id: tempId, created_at: new Date().toISOString() }]);
    setNewMessage('');

    const { data, error } = await supabase.from('messages').insert(msg).select().single();
    
    if (error) {
        console.error('Error sending message:', error);
        // Revert optimistic update (simplified)
    } else if (data) {
        // Update ID
        setMessages((prev) => prev.map(m => m.id === tempId ? data : m));
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-900">
      {/* Header */}
      <div className="p-4 border-b border-gray-800 flex justify-between items-center bg-gray-800">
        <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">
                {recipient.email[0].toUpperCase()}
            </div>
            <div>
                <h2 className="font-semibold text-white">{recipient.email}</h2>
                <span className="text-xs text-green-400">Online via Supabase</span>
            </div>
        </div>
        <button
          onClick={startCall}
          disabled={callState !== CallState.IDLE}
          className="p-2 bg-gray-700 hover:bg-gray-600 rounded-full text-blue-400 disabled:opacity-50 disabled:cursor-not-allowed transition"
          title="Start Voice Call"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
          </svg>
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {loading ? (
            <div className="flex justify-center mt-10"><span className="text-gray-500">Loading history...</span></div>
        ) : (
            messages.map((msg) => {
                const isMe = msg.sender_id === currentUser.id;
                return (
                    <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-xs md:max-w-md px-4 py-2 rounded-2xl ${
                            isMe ? 'bg-blue-600 text-white rounded-br-none' : 'bg-gray-700 text-gray-200 rounded-bl-none'
                        }`}>
                            <p>{msg.content}</p>
                            <p className={`text-[10px] mt-1 ${isMe ? 'text-blue-200' : 'text-gray-400'}`}>
                                {new Date(msg.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                            </p>
                        </div>
                    </div>
                );
            })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 bg-gray-800 border-t border-gray-700">
        <form onSubmit={sendMessage} className="flex space-x-2">
          <input
            type="text"
            className="flex-1 bg-gray-700 text-white rounded-full px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none border border-gray-600"
            placeholder="Type a message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
          />
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white rounded-full p-2 px-4 transition"
          >
            Send
          </button>
        </form>
      </div>

      {/* Call Overlay */}
      <VoiceCallOverlay 
        callState={callState} 
        remoteStream={remoteStream} 
        onEndCall={endCall} 
      />
    </div>
  );
};