export interface UserProfile {
  id: string;
  email: string; // Using email as username for simplicity in this demo
  updated_at?: string;
  is_family?: boolean; // New feature flag
  avatar_url?: string | null;
}

export interface Attachment {
  url: string;
  type: 'image' | 'video' | 'file';
  name: string;
  size: number;
  mimeType: string;
}

export interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  created_at: string;
  updated_at?: string; // Important for edit detection
  status?: 'sending' | 'sent' | 'error';
  attachment?: Attachment | null;
  reactions?: Record<string, string[]>; // { "👍": ["userId1", "userId2"] }
  reply_to_id?: string | null;
  reply_to?: {
    id: string;
    content: string;
    sender_id: string;
    attachment?: Attachment | null;
  } | null;
}

export interface FriendRequest {
  id: string;
  sender_id: string;
  receiver_id: string;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
}

export type FriendshipStatus = 'none' | 'pending_sent' | 'pending_received' | 'friends';

export interface SignalingPayload {
  type: 'offer' | 'answer' | 'candidate' | 'hangup';
  sdp?: RTCSessionDescriptionInit;
  candidate?: RTCIceCandidateInit;
  callerId?: string;
}

// Changed from enum to const object to ensure runtime availability
export const CallState = {
  IDLE: 'IDLE',
  OFFERING: 'OFFERING',
  RECEIVING: 'RECEIVING',
  CONNECTED: 'CONNECTED',
} as const;

export type CallState = typeof CallState[keyof typeof CallState];