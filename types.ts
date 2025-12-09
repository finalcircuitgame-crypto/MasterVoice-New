export interface UserProfile {
  id: string;
  email: string; // Using email as username for simplicity in this demo
  updated_at?: string;
}

export interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  created_at: string;
  status?: 'sending' | 'sent' | 'error';
}

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