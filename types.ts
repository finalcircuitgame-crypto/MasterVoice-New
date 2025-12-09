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
}

export interface SignalingPayload {
  type: 'offer' | 'answer' | 'candidate' | 'hangup';
  sdp?: RTCSessionDescriptionInit;
  candidate?: RTCIceCandidateInit;
  callerId?: string;
}

export enum CallState {
  IDLE = 'IDLE',
  OFFERING = 'OFFERING',
  RECEIVING = 'RECEIVING',
  CONNECTED = 'CONNECTED',
}