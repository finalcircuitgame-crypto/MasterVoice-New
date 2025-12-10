import { useEffect, useRef, useState, useCallback } from 'react';
import { RealtimeChannel } from '@supabase/supabase-js';
import { ICE_SERVERS } from '../constants';
import { CallState, SignalingPayload } from '../types';

export const useWebRTC = (channel: RealtimeChannel | null, userId: string) => {
  const [callState, setCallState] = useState<CallState>(CallState.IDLE);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [isMuted, setIsMuted] = useState(false);

  const pc = useRef<RTCPeerConnection | null>(null);
  const iceCandidateQueue = useRef<RTCIceCandidateInit[]>([]);
  const incomingOfferRef = useRef<RTCSessionDescriptionInit | null>(null);
  const handleSignalRef = useRef<((payload: SignalingPayload) => Promise<void>) | null>(null);

  // Keep refs for latest channel and localStream to avoid stale closures
  const channelRef = useRef<RealtimeChannel | null>(channel);
  useEffect(() => { channelRef.current = channel; }, [channel]);

  const localStreamRef = useRef<MediaStream | null>(null);
  useEffect(() => { localStreamRef.current = localStream; }, [localStream]);

  // --- Utility: add or replace local audio track on the peer connection
  const addOrReplaceLocalTrack = useCallback((peer: RTCPeerConnection, stream: MediaStream) => {
    const audioTrack = stream.getAudioTracks()[0];
    if (!audioTrack) return;

    const existingSender = peer.getSenders().find(s => s.track?.kind === 'audio');
    if (existingSender) {
      existingSender.replaceTrack(audioTrack).catch(err => {
        // If replaceTrack fails, fall back to adding a new sender (rare)
        console.warn('[WebRTC] replaceTrack failed, adding new track', err);
        try { peer.addTrack(audioTrack, stream); } catch (e) { /* ignore */ }
      });
    } else {
      try {
        peer.addTrack(audioTrack, stream);
      } catch (e) {
        console.error('[WebRTC] addTrack failed', e);
      }
    }
  }, []);

  // --- Cleanup (uses refs to avoid stale deps)
  const cleanup = useCallback(() => {
    console.log('[WebRTC] Cleaning up call resources');

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
        pc.current.close();
      } catch (e) {
        console.warn('[WebRTC] Error closing pc', e);
      }
      pc.current = null;
    }

    setRemoteStream(null);
    setCallState(CallState.IDLE);
    iceCandidateQueue.current = [];
    incomingOfferRef.current = null;
    setIsMuted(false);
  }, []);

  // --- Create and configure RTCPeerConnection
  const createPeerConnection = useCallback(() => {
    // If an existing PC is open, reuse it
    if (pc.current && pc.current.signalingState !== 'closed') return pc.current;

    console.log('[WebRTC] Creating RTCPeerConnection');
    const newPc = new RTCPeerConnection({ iceServers: ICE_SERVERS });

    // Send serialized candidate objects (safe for JSON transport)
    newPc.onicecandidate = (event) => {
      if (event.candidate && channelRef.current) {
        try {
          channelRef.current.send({
            type: 'broadcast',
            event: 'signal',
            payload: { type: 'candidate', candidate: event.candidate.toJSON() } as SignalingPayload,
          });
        } catch (err) {
          console.error('[WebRTC] Failed to send candidate:', err);
        }
      }
    };

    newPc.ontrack = (event) => {
      console.log('[WebRTC] Received remote track');
      // prefer the first stream if present
      if (event.streams && event.streams[0]) {
        setRemoteStream(event.streams[0]);
      } else {
        // fallback: construct a stream from tracks
        const s = new MediaStream();
        event.track && s.addTrack(event.track);
        setRemoteStream(s);
      }
    };

    newPc.onconnectionstatechange = () => {
      console.log('[WebRTC] Connection state:', newPc.connectionState);
      if (newPc.connectionState === 'connected') {
        setCallState(CallState.CONNECTED);
      } else if (newPc.connectionState === 'failed') {
        console.warn('[WebRTC] Connection failed, cleaning up.');
        cleanup();
      }
    };

    newPc.oniceconnectionstatechange = () => {
      console.log('[WebRTC] ICE connection state:', newPc.iceConnectionState);
      // treat 'failed' as terminal, 'disconnected' as transient
      if (newPc.iceConnectionState === 'failed') {
        cleanup();
      }
    };

    // Optional: small helper to log stats for debugging (can be removed in prod)
    // setInterval(() => { if (pc.current) pc.current.getStats().then(s => {/* inspect if needed */}); }, 30000);

    pc.current = newPc;
    return newPc;
  }, [cleanup]);

  // --- Signaling handler
  const handleSignal = useCallback(async (payload: SignalingPayload) => {
    // Hangup has top priority
    if (payload.type === 'hangup') {
      console.log('[WebRTC] Received hangup signal. Ending call.');
      cleanup();
      return;
    }

    // If we don't have a PC and it's not an offer, ignore
    if (!pc.current && payload.type !== 'offer') return;

    try {
      switch (payload.type) {
        case 'offer': {
          if (callState !== CallState.IDLE) {
            console.warn('[WebRTC] Received offer while busy');
            return;
          }
          console.log('[WebRTC] Received offer');
          setCallState(CallState.RECEIVING);
          incomingOfferRef.current = payload.sdp!;

          // Create PC immediately so we can accept early candidates
          createPeerConnection();
          break;
        }

        case 'answer': {
          console.log('[WebRTC] Received answer');
          if (!pc.current) {
            console.warn('[WebRTC] No PC to apply answer to');
            return;
          }

          // Only set remote description if we are waiting for an answer
          if (pc.current.signalingState === 'have-local-offer' || pc.current.signalingState === 'have-remote-offer') {
            await pc.current.setRemoteDescription(new RTCSessionDescription(payload.sdp!));

            // Drain buffered candidates
            while (iceCandidateQueue.current.length > 0) {
              const c = iceCandidateQueue.current.shift();
              if (c) {
                try {
                  await pc.current.addIceCandidate(new RTCIceCandidate(c));
                } catch (e) {
                  console.error('[WebRTC] Error adding buffered candidate', e);
                }
              }
            }
          } else {
            console.warn('[WebRTC] Ignored answer in wrong state:', pc.current.signalingState);
          }
          break;
        }

        case 'candidate': {
          if (!payload.candidate) break;
          const candidate = payload.candidate as RTCIceCandidateInit;

          if (pc.current && pc.current.remoteDescription && pc.current.signalingState !== 'closed') {
            try {
              await pc.current.addIceCandidate(new RTCIceCandidate(candidate));
            } catch (e) {
              console.error('[WebRTC] Error adding candidate', e);
            }
          } else {
            // Buffer candidate until remote description is set
            console.log('[WebRTC] Buffering candidate (no remote desc)');
            iceCandidateQueue.current.push(candidate);
          }
          break;
        }

        default:
          console.warn('[WebRTC] Unknown signal type', payload.type);
      }
    } catch (error) {
      console.error('[WebRTC] Error handling signal:', error);
      // keep connection alive where possible
    }
  }, [callState, createPeerConnection, cleanup]);

  // Keep ref to latest handler to avoid re-subscribing channel listener
  useEffect(() => { handleSignalRef.current = handleSignal; }, [handleSignal]);

  // Subscribe to channel once and unsubscribe on cleanup or channel change
  useEffect(() => {
    if (!channel) return;

    const subscription = channel
      .on('broadcast', { event: 'signal' }, (response) => {
        if (handleSignalRef.current) {
          handleSignalRef.current(response.payload as SignalingPayload);
        }
      })
      .subscribe();

    return () => {
      try { subscription.unsubscribe(); } catch (e) { /* ignore */ }
    };
  }, [channel]);

  // --- Actions
  const startCall = useCallback(async () => {
    if (!channelRef.current || callState !== CallState.IDLE) return;

    try {
      console.log('[WebRTC] Starting call...');
      const peer = createPeerConnection();

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      setLocalStream(stream);
      localStreamRef.current = stream;

      addOrReplaceLocalTrack(peer, stream);

      const offer = await peer.createOffer();
      await peer.setLocalDescription(offer);
      setCallState(CallState.OFFERING);

      // send offer
      channelRef.current.send({
        type: 'broadcast',
        event: 'signal',
        payload: { type: 'offer', sdp: offer, callerId: userId } as SignalingPayload,
      });
    } catch (err) {
      console.error('[WebRTC] Failed to start call:', err);
      cleanup();
    }
  }, [addOrReplaceLocalTrack, callState, createPeerConnection, cleanup, userId]);

  const answerCall = useCallback(async () => {
    if (!incomingOfferRef.current) return;

    try {
      const peer = createPeerConnection();

      // If peer is not stable, bail (prevents double-answer)
      if (peer.signalingState !== 'stable') return;

      await peer.setRemoteDescription(new RTCSessionDescription(incomingOfferRef.current));

      // Drain any pre-answer candidates
      while (iceCandidateQueue.current.length > 0) {
        const c = iceCandidateQueue.current.shift();
        if (c) {
          try {
            await peer.addIceCandidate(new RTCIceCandidate(c));
          } catch (e) {
            console.error('[WebRTC] Error adding pre-answer candidate', e);
          }
        }
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      setLocalStream(stream);
      localStreamRef.current = stream;

      addOrReplaceLocalTrack(peer, stream);

      const answer = await peer.createAnswer();
      await peer.setLocalDescription(answer);

      channelRef.current?.send({
        type: 'broadcast',
        event: 'signal',
        payload: { type: 'answer', sdp: answer } as SignalingPayload,
      });

      // optimistic UI update; actual connected state will be set by connection events
      setCallState(CallState.CONNECTED);
    } catch (err) {
      console.error('[WebRTC] Failed to answer call:', err);
      cleanup();
    }
  }, [addOrReplaceLocalTrack, createPeerConnection, cleanup]);

  const endCall = useCallback(() => {
    // Send hangup first
    try {
      channelRef.current?.send({
        type: 'broadcast',
        event: 'signal',
        payload: { type: 'hangup' } as SignalingPayload,
      });
    } catch (e) {
      console.error('[WebRTC] Failed to send hangup', e);
    }

    // Then cleanup locally
    cleanup();
  }, [cleanup]);

  const toggleMute = useCallback(() => {
    const ls = localStreamRef.current;
    if (!ls) return;
    ls.getAudioTracks().forEach(track => { track.enabled = !track.enabled; });
    setIsMuted(prev => !prev);
  }, []);

  // Ensure we cleanup when the component unmounts
  useEffect(() => {
    return () => { cleanup(); };
  }, [cleanup]);

  return {
    callState,
    localStream,
    remoteStream,
    startCall,
    endCall,
    answerCall,
    toggleMute,
    isMuted,
  };
};
