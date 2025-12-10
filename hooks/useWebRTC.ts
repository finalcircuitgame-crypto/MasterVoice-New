import { useEffect, useRef, useState, useCallback } from 'react';
import { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '../supabaseClient';
import { ICE_SERVERS } from '../constants';
import { CallState, SignalingPayload } from '../types';

export const useWebRTC = (roomId: string | null, userId: string) => {
  const [callState, setCallState] = useState<CallState>(CallState.IDLE);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [rtcStats, setRtcStats] = useState<any>(null);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  const pc = useRef<RTCPeerConnection | null>(null);
  const iceCandidateQueue = useRef<RTCIceCandidateInit[]>([]);
  const incomingOfferRef = useRef<RTCSessionDescriptionInit | null>(null);
  const handleSignalRef = useRef<((payload: SignalingPayload) => Promise<void>) | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const reconnectTimeoutRef = useRef<number | null>(null);
  const isProcessingOfferRef = useRef<boolean>(false);
  const iceGatheringTimeoutRef = useRef<number | null>(null);

  // Keep ref for local stream for cleanup
  const localStreamRef = useRef<MediaStream | null>(null);
  useEffect(() => { localStreamRef.current = localStream; }, [localStream]);

  // --- Cleanup Function ---
  const cleanup = useCallback((reason?: string) => {
    console.log('[WebRTC] Cleaning up call resources', reason ? `Reason: ${reason}` : '');

    if (reconnectTimeoutRef.current) {
      window.clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (iceGatheringTimeoutRef.current) {
      window.clearTimeout(iceGatheringTimeoutRef.current);
      iceGatheringTimeoutRef.current = null;
    }

    const ls = localStreamRef.current;
    if (ls) {
      ls.getTracks().forEach(t => t.stop());
      setLocalStream(null);
    }

    if (pc.current) {
      try {
        pc.current.onicecandidate = null;
        pc.current.ontrack = null;
        pc.current.onconnectionstatechange = null;
        pc.current.oniceconnectionstatechange = null;
        pc.current.onicegatheringstatechange = null;
        pc.current.close();
      } catch (e) {
        console.warn('[WebRTC] Error closing pc', e);
      }
      pc.current = null;
    }

    setRemoteStream(null);
    setCallState(CallState.IDLE);
    setRtcStats(null);
    iceCandidateQueue.current = [];
    incomingOfferRef.current = null;
    setIsMuted(false);
    isProcessingOfferRef.current = false;
    setConnectionError(null);
  }, []);

  // --- Signaling Channel Management ---
  useEffect(() => {
    if (!roomId || !userId) return;

    // Create a dedicated channel for WebRTC signaling
    const channel = supabase.channel(`webrtc:${roomId}`, {
      config: { broadcast: { self: false } }
    });

    channel
      .on('broadcast', { event: 'signal' }, (response) => {
        // Dispatch to current handler logic
        if (handleSignalRef.current) {
          handleSignalRef.current(response.payload as SignalingPayload);
        }
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log(`[WebRTC] Subscribed to signaling channel: ${roomId}`);
        }
      });

    channelRef.current = channel;

    return () => {
      console.log(`[WebRTC] Unsubscribing from signaling channel`);
      supabase.removeChannel(channel);
      channelRef.current = null;
      // When channel dies (e.g. switched user), kill the call
      cleanup('channel closed');
    };
  }, [roomId, userId, cleanup]);


  // --- Create and configure RTCPeerConnection ---
  const createPeerConnection = useCallback(() => {
    if (pc.current && pc.current.signalingState !== 'closed') return pc.current;

    console.log('[WebRTC] Creating RTCPeerConnection');
    const newPc = new RTCPeerConnection({
      iceServers: ICE_SERVERS,
      iceCandidatePoolSize: 10,
      bundlePolicy: 'max-bundle',
      rtcpMuxPolicy: 'require',
      iceTransportPolicy: 'all' // Try both relay and host candidates
    });

    newPc.onicecandidate = (event) => {
      console.log('[WebRTC] ICE candidate:', event.candidate ? event.candidate.type : 'null (gathering complete)');
      if (event.candidate && channelRef.current) {
        channelRef.current.send({
          type: 'broadcast',
          event: 'signal',
          payload: { type: 'candidate', candidate: event.candidate.toJSON() } as SignalingPayload,
        }).catch(err => console.error('[WebRTC] Send candidate error', err));
      }
    };

    newPc.ontrack = (event) => {
      console.log('[WebRTC] Received remote track:', event.track.kind, 'streams:', event.streams.length);
      // Create or update remote stream
      if (!remoteStream) {
        const stream = new MediaStream();
        stream.addTrack(event.track);
        setRemoteStream(stream);
      } else {
        // If stream already exists, add the track to it
        const stream = remoteStream;
        stream.addTrack(event.track);
        setRemoteStream(stream.clone()); // Trigger re-render
      }

      // Set connected state when we receive tracks
      if (callState !== CallState.CONNECTED) {
        setCallState(CallState.CONNECTED);
        setConnectionError(null);
      }
    };

    newPc.onconnectionstatechange = () => {
      console.log('[WebRTC] Connection state:', newPc.connectionState);
      if (newPc.connectionState === 'connected') {
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
          reconnectTimeoutRef.current = null;
        }
        setCallState(CallState.CONNECTED);
        setConnectionError(null);
      } else if (newPc.connectionState === 'disconnected') {
        // Grace Period Logic
        console.warn('[WebRTC] Peer disconnected, starting grace period...');
        setCallState(CallState.RECONNECTING);
        setConnectionError('Connection lost, attempting to reconnect...');

        if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);

        reconnectTimeoutRef.current = window.setTimeout(() => {
          console.log('[WebRTC] Reconnection timed out. Ending call.');
          cleanup('reconnection timeout');
        }, 3 * 60 * 1000); // 3 minutes

      } else if (newPc.connectionState === 'failed' || newPc.connectionState === 'closed') {
        setConnectionError('Connection failed. Please try again.');
        cleanup('connection failed');
      }
    };

    newPc.oniceconnectionstatechange = () => {
      console.log('[WebRTC] ICE connection state:', newPc.iceConnectionState);
      if (newPc.iceConnectionState === 'failed') {
        console.log('[WebRTC] ICE failed, attempting to restart ICE');
        setConnectionError('Network connection issue. Attempting to reconnect...');
        try {
          newPc.restartIce();
        } catch (e) {
          console.error('[WebRTC] Failed to restart ICE:', e);
        }
      } else if (newPc.iceConnectionState === 'disconnected') {
        setConnectionError('Network connection unstable...');
      } else if (newPc.iceConnectionState === 'connected') {
        setConnectionError(null);
      }
    };

    newPc.onicegatheringstatechange = () => {
      console.log('[WebRTC] ICE gathering state:', newPc.iceGatheringState);
    };

    // Add negotiationneeded handler
    newPc.onnegotiationneeded = async () => {
      console.log('[WebRTC] Negotiation needed');
    };

    pc.current = newPc;
    return newPc;
  }, [cleanup, remoteStream, callState]);

  // --- Stats Collection ---
  useEffect(() => {
    let interval: number;
    if (callState === CallState.CONNECTED && pc.current) {
      interval = window.setInterval(async () => {
        try {
          const stats = await pc.current!.getStats();
          let activeCandidatePair: any = null;
          let inboundAudio: any = null;
          let outboundAudio: any = null;

          stats.forEach(report => {
            if (report.type === 'candidate-pair' && report.state === 'succeeded') {
              activeCandidatePair = report;
            }
            if (report.type === 'inbound-rtp' && report.kind === 'audio') {
              inboundAudio = report;
            }
            if (report.type === 'outbound-rtp' && report.kind === 'audio') {
              outboundAudio = report;
            }
          });

          setRtcStats({
            rtt: activeCandidatePair?.currentRoundTripTime ? Math.round(activeCandidatePair.currentRoundTripTime * 1000) : 0,
            packetsLost: inboundAudio?.packetsLost || 0,
            jitter: inboundAudio?.jitter ? Math.round(inboundAudio.jitter * 1000) : 0,
            bytesReceived: inboundAudio?.bytesReceived || 0,
            bytesSent: outboundAudio?.bytesSent || 0,
            codec: inboundAudio?.codecId || 'opus',
            candidatePair: activeCandidatePair?.localCandidateId ? 'active' : 'none'
          });
        } catch (e) {
          console.warn("Failed to get stats", e);
        }
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [callState]);

  // --- Signaling Logic ---
  const handleSignal = useCallback(async (payload: SignalingPayload) => {
    console.log('[WebRTC] Received signal:', payload.type, payload);

    if (payload.type === 'hangup') {
      console.log('[WebRTC] Remote hung up');
      cleanup('remote hangup');
      return;
    }

    // Handle offer - both for initial call and reconnection
    if (payload.type === 'offer') {
      // Prevent processing the same offer multiple times
      if (isProcessingOfferRef.current) {
        console.log('[WebRTC] Already processing an offer, ignoring');
        return;
      }

      isProcessingOfferRef.current = true;

      // If we're already in a call and receive a new offer, it's likely a reconnection attempt
      if (callState === CallState.CONNECTED || callState === CallState.RECONNECTING) {
        console.log('[WebRTC] Reconnection offer received');
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
          reconnectTimeoutRef.current = null;
        }
        // Clean up old connection
        if (pc.current) {
          pc.current.close();
          pc.current = null;
        }
        iceCandidateQueue.current = [];
      }

      console.log('[WebRTC] Received Offer');
      setCallState(CallState.RECEIVING);
      incomingOfferRef.current = payload.sdp!;
      isProcessingOfferRef.current = false;
      return;
    }

    // For answer and candidate, we need an active peer connection
    if (!pc.current) {
      console.log('[WebRTC] No peer connection for signal:', payload.type);
      // Queue candidates if we don't have a PC yet (shouldn't happen often)
      if (payload.type === 'candidate' && payload.candidate) {
        iceCandidateQueue.current.push(payload.candidate);
      }
      return;
    }

    try {
      if (payload.type === 'answer') {
        console.log('[WebRTC] Received Answer');
        if (pc.current.signalingState === 'have-local-offer') {
          await pc.current.setRemoteDescription(new RTCSessionDescription(payload.sdp!));

          // Process queued candidates for Caller
          while (iceCandidateQueue.current.length > 0) {
            const c = iceCandidateQueue.current.shift();
            if (c) {
              try {
                await pc.current.addIceCandidate(new RTCIceCandidate(c));
              } catch (e) {
                console.warn("Error adding queued candidate", e);
              }
            }
          }
        }
      } else if (payload.type === 'candidate' && payload.candidate) {
        try {
          // Only add candidates if we have a remote description
          if (pc.current.remoteDescription && pc.current.remoteDescription.type) {
            await pc.current.addIceCandidate(new RTCIceCandidate(payload.candidate));
          } else {
            // Queue candidates if remote description isn't set yet
            console.log('[WebRTC] Queueing candidate, no remote description yet');
            iceCandidateQueue.current.push(payload.candidate);
          }
        } catch (e) {
          console.warn("Error adding candidate", e);
        }
      }
    } catch (err) {
      console.error("Signaling error", err);
      isProcessingOfferRef.current = false;
    }
  }, [callState, cleanup]);

  // Keep the ref updated for the channel listener
  useEffect(() => { handleSignalRef.current = handleSignal; }, [handleSignal]);


  // --- User Actions ---

  const startCall = useCallback(async () => {
    if (!channelRef.current) {
      console.error('[WebRTC] No signaling channel');
      setConnectionError('No signaling channel available');
      return;
    }

    cleanup('starting new call'); // Reset any old state

    try {
      console.log('[WebRTC] Starting Call (Caller)...');
      setCallState(CallState.CONNECTING);

      // Get local media first
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        },
        video: false
      }).catch(err => {
        console.error('[WebRTC] Failed to get media:', err);
        setConnectionError('Microphone access denied. Please check permissions.');
        throw err;
      });

      setLocalStream(stream);
      localStreamRef.current = stream;

      // Create peer connection after we have media
      const peer = createPeerConnection();

      // Add all tracks to the connection
      stream.getTracks().forEach(track => {
        peer.addTrack(track, stream);
      });

      // Set timeout for ICE gathering
      iceGatheringTimeoutRef.current = window.setTimeout(() => {
        console.log('[WebRTC] ICE gathering timeout - proceeding with available candidates');
      }, 5000);

      // Create and send offer
      const offer = await peer.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: false,
        iceRestart: false
      });

      await peer.setLocalDescription(offer);
      setCallState(CallState.OFFERING);

      // Wait a bit for ICE candidates to gather before sending offer
      await new Promise(resolve => setTimeout(resolve, 100));

      await channelRef.current.send({
        type: 'broadcast',
        event: 'signal',
        payload: {
          type: 'offer',
          sdp: offer,
          callerId: userId
        } as SignalingPayload,
      });

      console.log('[WebRTC] Offer sent');

    } catch (err) {
      console.error('[WebRTC] Start call failed', err);
      setConnectionError('Failed to start call. Please try again.');
      cleanup('start call failed');
    }
  }, [createPeerConnection, cleanup, userId]);

  const answerCall = useCallback(async () => {
    if (!incomingOfferRef.current || !channelRef.current) {
      console.error('[WebRTC] No offer to answer or no channel');
      setConnectionError('No incoming call to answer');
      return;
    }

    try {
      console.log('[WebRTC] Answering Call (Callee)...');
      setCallState(CallState.CONNECTING);

      // Get local media first
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        },
        video: false
      }).catch(err => {
        console.error('[WebRTC] Failed to get media:', err);
        setConnectionError('Microphone access denied. Please check permissions.');
        throw err;
      });

      setLocalStream(stream);
      localStreamRef.current = stream;

      // Create peer connection
      const peer = createPeerConnection();

      // Add local tracks
      stream.getTracks().forEach(track => {
        peer.addTrack(track, stream);
      });

      // Set remote description (the offer)
      await peer.setRemoteDescription(new RTCSessionDescription(incomingOfferRef.current));

      // Process any queued candidates
      while (iceCandidateQueue.current.length > 0) {
        const c = iceCandidateQueue.current.shift();
        if (c) {
          try {
            await peer.addIceCandidate(new RTCIceCandidate(c));
          } catch (e) {
            console.warn("Error adding queued candidate", e);
          }
        }
      }

      // Create and send answer
      const answer = await peer.createAnswer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: false
      });

      await peer.setLocalDescription(answer);

      await channelRef.current.send({
        type: 'broadcast',
        event: 'signal',
        payload: { type: 'answer', sdp: answer } as SignalingPayload,
      });

      console.log('[WebRTC] Answer sent');
      setCallState(CallState.CONNECTED);

    } catch (err) {
      console.error('[WebRTC] Answer call failed', err);
      setConnectionError('Failed to answer call. Please try again.');
      cleanup('answer call failed');
    }
}, [createPeerConnection, cleanup]);

const endCall = useCallback(() => {
  console.log('[WebRTC] Ending call');
  channelRef.current?.send({
    type: 'broadcast',
    event: 'signal',
    payload: { type: 'hangup' } as SignalingPayload,
  }).catch(() => { });
  cleanup('user ended call');
}, [cleanup]);

const toggleMute = useCallback(() => {
  if (localStreamRef.current) {
    const audioTrack = localStreamRef.current.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled;
      setIsMuted(!audioTrack.enabled);
    }
  }
}, []);

// Debug function to check ICE servers
const checkICEServers = useCallback(async () => {
  if (!pc.current) return;

  try {
    const stats = await pc.current.getStats();
    const iceCandidatePairs: any[] = [];
    const localCandidates: any[] = [];
    const remoteCandidates: any[] = [];

    stats.forEach(report => {
      if (report.type === 'candidate-pair') {
        iceCandidatePairs.push(report);
      }
      if (report.type === 'local-candidate') {
        localCandidates.push(report);
      }
      if (report.type === 'remote-candidate') {
        remoteCandidates.push(report);
      }
    });

    console.log('[WebRTC] ICE Debug:', {
      candidatePairs: iceCandidatePairs.length,
      localCandidates: localCandidates.length,
      remoteCandidates: remoteCandidates.length,
      localCandidateTypes: localCandidates.map(c => c.candidateType),
      remoteCandidateTypes: remoteCandidates.map(c => c.candidateType)
    });
  } catch (e) {
    console.error('[WebRTC] ICE debug failed:', e);
  }
}, []);

return {
  callState,
  localStream,
  remoteStream,
  startCall,
  endCall,
  answerCall,
  toggleMute,
  isMuted,
  rtcStats,
  connectionError,
  checkICEServers // Optional debug function
};
};