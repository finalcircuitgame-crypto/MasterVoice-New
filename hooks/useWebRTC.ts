import { useEffect, useRef, useState, useCallback } from 'react';
import { RealtimeChannel } from '@supabase/supabase-js';
import { ICE_SERVERS } from '../constants';
import { CallState, SignalingPayload } from '../types';

export const useWebRTC = (channel: RealtimeChannel | null, userId: string) => {
  const [callState, setCallState] = useState<CallState>(CallState.IDLE);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isMuted, setIsMuted] = useState(false);

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const iceQueueRef = useRef<RTCIceCandidateInit[]>([]);
  const incomingOfferRef = useRef<RTCSessionDescriptionInit | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(channel);

  useEffect(() => {
    channelRef.current = channel;
  }, [channel]);

  const cleanup = useCallback(() => {
    console.log('[WebRTC] cleanup');
    if (localStream) {
      localStream.getTracks().forEach(t => t.stop());
    }
    setLocalStream(null);
    setRemoteStream(null);

    if (pcRef.current) {
      pcRef.current.onicecandidate = null;
      pcRef.current.ontrack = null;
      pcRef.current.onconnectionstatechange = null;
      pcRef.current.oniceconnectionstatechange = null;
      try {
        pcRef.current.close();
      } catch (e) { console.warn(e); }
    }
    pcRef.current = null;

    iceQueueRef.current = [];
    incomingOfferRef.current = null;
    setCallState(CallState.IDLE);
    setIsMuted(false);
  }, [localStream]);

  const createPeerConnection = useCallback(() => {
    if (pcRef.current && pcRef.current.signalingState !== 'closed') {
      return pcRef.current;
    }

    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS, iceCandidatePoolSize: 10 });

    pc.onicecandidate = (ev) => {
      if (ev.candidate && channelRef.current) {
        channelRef.current.send({
          type: 'broadcast',
          event: 'signal',
          payload: { type: 'candidate', candidate: ev.candidate.toJSON() } as SignalingPayload,
        });
      }
    };

    pc.ontrack = (ev) => {
      console.log('[WebRTC] ontrack kind=', ev.track.kind);
      const incoming = ev.streams[0] ?? new MediaStream([ev.track]);
      setRemoteStream(incoming);
    };

    pc.onconnectionstatechange = () => {
      console.log('[WebRTC] connectionstatechange', pc.connectionState);
      if (pc.connectionState === 'connected') {
        setCallState(CallState.CONNECTED);
      } else if (pc.connectionState === 'failed' || pc.connectionState === 'disconnected') {
        cleanup();
      }
    };

    pc.oniceconnectionstatechange = () => {
      console.log('[WebRTC] iceConnectionState', pc.iceConnectionState);
      if (pc.iceConnectionState === 'failed' || pc.iceConnectionState === 'closed') {
        cleanup();
      }
    };

    pcRef.current = pc;
    return pc;
  }, [cleanup]);

  const handleSignal = useCallback(async (payload: SignalingPayload) => {
    if (payload.type === 'hangup') {
      cleanup();
      return;
    }

    // On offer or answer, ensure we have pc
    if (!pcRef.current && payload.type === 'offer') {
      // we'll create when answering
    } else if (!pcRef.current) {
      console.warn('[WebRTC] No pc to handle signal', payload.type);
      return;
    }

    const pc = createPeerConnection();

    try {
      if (payload.type === 'offer') {
        console.log('[WebRTC] Received offer');
        incomingOfferRef.current = payload.sdp!;
        setCallState(CallState.RECEIVING);
      } else if (payload.type === 'answer') {
        console.log('[WebRTC] Received answer');
        await pc.setRemoteDescription(new RTCSessionDescription(payload.sdp!));
      } else if (payload.type === 'candidate') {
        if (payload.candidate) {
          const candidate = new RTCIceCandidate(payload.candidate);
          if (pc.remoteDescription) {
            await pc.addIceCandidate(candidate);
          } else {
            iceQueueRef.current.push(payload.candidate);
          }
        }
      }
    } catch (err) {
      console.error('[WebRTC] error handling signal', err);
    }
  }, [createPeerConnection, cleanup]);

  useEffect(() => {
    if (!channel) return;
    const sub = channel
      .on('broadcast', { event: 'signal' }, (resp) => {
        handleSignal(resp.payload as SignalingPayload);
      })
      .subscribe();
    return () => {
      sub.unsubscribe();
    };
  }, [channel, handleSignal]);

  const startCall = useCallback(async () => {
    if (!channelRef.current || callState !== CallState.IDLE) return;

    try {
      console.log('[WebRTC] startCall');
      const pc = createPeerConnection();

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      setLocalStream(stream);
      stream.getAudioTracks().forEach(track => pc.addTrack(track, stream));

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      setCallState(CallState.OFFERING);

      channelRef.current.send({
        type: 'broadcast',
        event: 'signal',
        payload: { type: 'offer', sdp: offer, callerId: userId } as SignalingPayload,
      });
    } catch (err) {
      console.error('[WebRTC] startCall failed', err);
      cleanup();
    }
  }, [callState, createPeerConnection, cleanup, userId]);

  const answerCall = useCallback(async () => {
    if (!incomingOfferRef.current) return;

    try {
      console.log('[WebRTC] answerCall');
      const pc = createPeerConnection();
      await pc.setRemoteDescription(new RTCSessionDescription(incomingOfferRef.current));

      // Add any queued ICE candidates
      for (const c of iceQueueRef.current) {
        await pc.addIceCandidate(new RTCIceCandidate(c));
      }
      iceQueueRef.current = [];

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      setLocalStream(stream);
      stream.getAudioTracks().forEach(track => pc.addTrack(track, stream));

      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      channelRef.current?.send({
        type: 'broadcast',
        event: 'signal',
        payload: { type: 'answer', sdp: answer } as SignalingPayload,
      });

      setCallState(CallState.CONNECTED);
    } catch (err) {
      console.error('[WebRTC] answerCall failed', err);
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
    } catch (e) {
      console.error(e);
    }
    cleanup();
  }, [cleanup]);

  const toggleMute = useCallback(() => {
    if (!localStream) return;
    localStream.getAudioTracks().forEach(t => {
      t.enabled = !t.enabled;
    });
    setIsMuted(prev => !prev);
  }, [localStream]);

  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  return {
    callState,
    localStream,
    remoteStream,
    startCall,
    answerCall,
    endCall,
    toggleMute,
    isMuted,
  };
};
