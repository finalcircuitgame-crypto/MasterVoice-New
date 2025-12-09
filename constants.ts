// Using OpenRelay.metered.ca free tier for demonstration
export const ICE_SERVERS: RTCIceServer[] = [
  {
    urls: 'stun:openrelay.metered.ca:80',
  },
  {
    urls: 'turn:openrelay.metered.ca:80',
    username: 'openrelayproject',
    credential: 'openrelayproject',
  },
  {
    urls: 'turn:openrelay.metered.ca:443',
    username: 'openrelayproject',
    credential: 'openrelayproject',
  },
  {
    urls: 'turn:openrelay.metered.ca:443?transport=tcp',
    username: 'openrelayproject',
    credential: 'openrelayproject',
  },
];

export const DB_TABLES = {
  PROFILES: 'profiles',
  MESSAGES: 'messages',
};
