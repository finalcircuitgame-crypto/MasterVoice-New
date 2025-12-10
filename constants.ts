// Optimized ICE Servers configuration
// Using Expressturn TURN servers as requested, plus Google STUN
export const ICE_SERVERS: RTCIceServer[] = [
  {
    urls: [
      "stun:stun.l.google.com:19302",
      "stun:stun1.l.google.com:19302",
      "stun:stun2.l.google.com:19302",
      "stun:stun3.l.google.com:19302",
      "stun:stun4.l.google.com:19302",
      "stun:relay1.expressturn.com:3480",
      "turn:relay1.expressturn.com:3480?transport=udp",
      "turn:relay1.expressturn.com:3480?transport=tcp"
    ],
    username: "000000002080624754",
    credential: "TplmyCeWBfBAapvocrUf2IQx5u8="
  }
];

export const DB_TABLES = {
  PROFILES: 'profiles',
  MESSAGES: 'messages',
} as const;
