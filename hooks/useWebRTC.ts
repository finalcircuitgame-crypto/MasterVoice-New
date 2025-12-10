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

  // Keep refs for latest channel to avoid stale closures
  const channelRef = useRef<RealtimeChannel | null>(channel);
  useEffect(() => { channelRef.current = channel; }, [channel]);

  // Keep ref for local stream for cleanup
  const localStreamRef = useRef<MediaStream | null>(null);
  useEffect(() => { localStreamRef.current = localStream; }, [localStream]);

  // --- Cleanup
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
    if (pc.current && pc.current.signalingState !== 'closed') return pc.current;

    console.log('[WebRTC] Creating RTCPeerConnection');
    const newPc = new RTCPeerConnection({ 
        iceServers: ICE_SERVERS,
        iceCandidatePoolSize: 10,
    });

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
      console.log('[WebRTC] Received remote track:', event.track.kind);
      // Prefer the stream sent by the peer. If none, wrap the track.
      // This ensures we get the 'shared' stream object.
      const stream = event.streams[0] || new MediaStream([event.track]);
      setRemoteStream(stream);
    };

    newPc.onconnectionstatechange = () => {
      console.log('[WebRTC] Connection state:', newPc.connectionState);
      if (newPc.connectionState === 'connected') {
        setCallState(CallState.CONNECTED);
      } else if (newPc.connectionState === 'failed') {
        console.warn('[WebRTC] Connection failed. Cleaning up.');
        cleanup();
      }
    };

    newPc.oniceconnectionstatechange = () => {
      console.log('[WebRTC] ICE connection state:', newPc.iceConnectionState);
      if (newPc.iceConnectionState === 'failed' || newPc.iceConnectionState === 'closed') {
        cleanup();
      }
    };

    pc.current = newPc;
    return newPc;
  }, [cleanup]);

  // --- Signaling handler
  const handleSignal = useCallback(async (payload: SignalingPayload) => {
    // Hangup has top priority
    if (payload.type === 'hangup') {
      console.log('[WebRTC] Received hangup signal.');
      cleanup();
      return;
    }

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
          // We wait for the user to Answer before creating the PC
          break;
        }

        case 'answer': {
          console.log('[WebRTC] Received answer');
          if (!pc.current) return;
          await pc.current.setRemoteDescription(new RTCSessionDescription(payload.sdp!));
          break;
        }

        case 'candidate': {
          if (payload.candidate) {
              if (pc.current && pc.current.remoteDescription) {
                  await pc.current.addIceCandidate(new RTCIceCandidate(payload.candidate));
              } else {
                  iceCandidateQueue.current.push(payload.candidate);
              }
          }
          break;
        }
      }
    } catch (error) {
      console.error('[WebRTC] Error handling signal:', error);
    }
  }, [callState, cleanup]);

  useEffect(() => { handleSignalRef.current = handleSignal; }, [handleSignal]);

  useEffect(() => {
    if (!channel) return;
    const subscription = channel
      .on('broadcast', { event: 'signal' }, (response) => {
        if (handleSignalRef.current) {
          handleSignalRef.current(response.payload as SignalingPayload);
        }
      })
      .subscribe();
    return () => { subscription.unsubscribe(); };
  }, [channel]);

  // --- Actions
  const startCall = useCallback(async () => {
    if (!channelRef.current || callState !== CallState.IDLE) return;

    try {
      console.log('[WebRTC] Starting call...');
      const peer = createPeerConnection();

      // 1. Get User Media
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      setLocalStream(stream);
      localStreamRef.current = stream;

      // 2. Add Transceiver (SendRecv)
      // This forces the SDP to include an audio m-line with direction sendrecv
      stream.getTracks().forEach(track => {
          peer.addTransceiver(track, { direction: 'sendrecv', streams: [stream] });
      });

      // 3. Create Offer
      const offer = await peer.createOffer();
      await peer.setLocalDescription(offer);
      setCallState(CallState.OFFERING);

      channelRef.current.send({
        type: 'broadcast',
        event: 'signal',
        payload: { type: 'offer', sdp: offer, callerId: userId } as SignalingPayload,
      });
    } catch (err) {
      console.error('[WebRTC] Failed to start call:', err);
      cleanup();
    }
  }, [callState, createPeerConnection, cleanup, userId]);

  const answerCall = useCallback(async () => {
    if (!incomingOfferRef.current) return;

    try {
      console.log('[WebRTC] Answering call...');
      const peer = createPeerConnection();
      
      // 1. Set Remote Description FIRST to parse the Offer and create Transceivers
      await peer.setRemoteDescription(new RTCSessionDescription(incomingOfferRef.current));

      // 2. Drain ICE candidates now that remote desc is set
      while (iceCandidateQueue.current.length > 0) {
        const c = iceCandidateQueue.current.shift();
        if (c) await peer.addIceCandidate(new RTCIceCandidate(c));
      }

      // 3. Get User Media
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      setLocalStream(stream);
      localStreamRef.current = stream;

      // 4. Attach Local Track to the EXISTING Transceiver
      // This ensures we use the same m-line created by the offer, guaranteeing bi-directional audio
      const audioTrack = stream.getAudioTracks()[0];
      const audioTransceiver = peer.getTransceivers().find(t => t.receiver.track.kind === 'audio');
      
      if (audioTransceiver) {
          console.log('[WebRTC] Found existing audio transceiver, attaching local track...');
          audioTransceiver.direction = 'sendrecv';
          await audioTransceiver.sender.replaceTrack(audioTrack);
      } else {
          // Fallback (should rarely happen if offer had audio)
          console.warn('[WebRTC] No existing audio transceiver found, adding new track.');
          peer.addTrack(audioTrack, stream);
      }

      // 5. Create Answer
      const answer = await peer.createAnswer();
      await peer.setLocalDescription(answer);

      // 6. Send Answer
      channelRef.current?.send({
        type: 'broadcast',
        event: 'signal',
        payload: { type: 'answer', sdp: answer } as SignalingPayload,
      });

      setCallState(CallState.CONNECTED);
    } catch (err) {
      console.error('[WebRTC] Failed to answer call:', err);
      cleanup();
    }
  }, [createPeerConnection, cleanup]);

  const endCall = useCallback(() => {
    try {
      channelRef.current?.send({
        type: 'broadcast',
        event: 'signal',
        payload: { type: 'hangup' } as SignalingPayload,
      });
    } catch (e) { console.error(e); }
    cleanup();
  }, [cleanup]);

  const toggleMute = useCallback(() => {
    const ls = localStreamRef.current;
    if (!ls) return;
    ls.getAudioTracks().forEach(track => { track.enabled = !track.enabled; });
    setIsMuted(prev => !prev);
  }, []);

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