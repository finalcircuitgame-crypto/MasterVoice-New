// Using OpenRelay.metered.ca free tier for demonstration
export const ICE_SERVERS: RTCIceServer[] = [
  // STUN servers
  { urls: 'stun:openrelay.metered.ca:80' },
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  { urls: 'stun:stun2.l.google.com:19302' },
  { urls: 'stun:stun3.l.google.com:19302' },
  { urls: 'stun:stun4.l.google.com:19302' },
  { urls: 'stun:stun.stunprotocol.org:3478' },
  { urls: 'stun:stun.voipbuster.com:3478' },

  // TURN servers (examples). Replace credentials with secure values.
  {
    urls: [
      'turn:openrelay.metered.ca:80',
      'turn:openrelay.metered.ca:443',
      'turn:openrelay.metered.ca:443?transport=tcp',
    ],
    username: 'openrelayproject',
    credential: 'openrelayproject',
  },
];

export const DB_TABLES = {
  PROFILES: 'profiles',
  MESSAGES: 'messages',
} as const;
