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

  const pc = useRef<RTCPeerConnection | null>(null);
  const iceCandidateQueue = useRef<RTCIceCandidateInit[]>([]);
  const incomingOfferRef = useRef<RTCSessionDescriptionInit | null>(null);
  const handleSignalRef = useRef<((payload: SignalingPayload) => Promise<void>) | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);

  // Keep ref for local stream for cleanup
  const localStreamRef = useRef<MediaStream | null>(null);
  useEffect(() => { localStreamRef.current = localStream; }, [localStream]);

  // --- Cleanup Function ---
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
    setRtcStats(null);
    iceCandidateQueue.current = [];
    incomingOfferRef.current = null;
    setIsMuted(false);
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
        cleanup();
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
        rtcpMuxPolicy: 'require'
    });

    newPc.onicecandidate = (event) => {
      if (event.candidate && channelRef.current) {
        channelRef.current.send({
          type: 'broadcast',
          event: 'signal',
          payload: { type: 'candidate', candidate: event.candidate.toJSON() } as SignalingPayload,
        }).catch(err => console.error('[WebRTC] Send candidate error', err));
      }
    };

    newPc.ontrack = (event) => {
      console.log('[WebRTC] Received remote track:', event.track.kind);
      // Ensure we catch the stream properly
      const stream = event.streams[0] || new MediaStream([event.track]);
      setRemoteStream(stream);
      
      // CRITICAL FIX: Explicitly set CONNECTED when media starts flowing
      // This prevents the UI from getting stuck in "Connecting..." if connectionState lags
      setCallState(CallState.CONNECTED); 
    };

    newPc.onconnectionstatechange = () => {
      console.log('[WebRTC] Connection state:', newPc.connectionState);
      if (newPc.connectionState === 'connected') {
        setCallState(CallState.CONNECTED);
      } else if (newPc.connectionState === 'failed' || newPc.connectionState === 'closed') {
        cleanup();
      }
    };

    newPc.oniceconnectionstatechange = () => {
        if (newPc.iceConnectionState === 'failed') {
            newPc.restartIce();
        }
    };

    pc.current = newPc;
    return newPc;
  }, [cleanup]);

  // --- Stats Collection ---
  useEffect(() => {
    let interval: number;
    if (callState === CallState.CONNECTED) {
        interval = window.setInterval(async () => {
            if (!pc.current) return;
            try {
                const stats = await pc.current.getStats();
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
                    codec: inboundAudio?.codecId || 'opus'
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
    if (payload.type === 'hangup') {
      console.log('[WebRTC] Remote hung up');
      cleanup();
      return;
    }

    // If we are IDLE and get an offer, we can accept it
    if (!pc.current && payload.type === 'offer') {
        if (callState !== CallState.IDLE) return; // Busy
        console.log('[WebRTC] Received Offer');
        setCallState(CallState.RECEIVING);
        incomingOfferRef.current = payload.sdp!;
        return;
    }

    if (!pc.current) return;

    try {
      if (payload.type === 'answer') {
          console.log('[WebRTC] Received Answer');
          if (pc.current.signalingState === 'have-local-offer') {
            await pc.current.setRemoteDescription(new RTCSessionDescription(payload.sdp!));
          }
      } else if (payload.type === 'candidate' && payload.candidate) {
          try {
              if (pc.current.remoteDescription) {
                  await pc.current.addIceCandidate(new RTCIceCandidate(payload.candidate));
              } else {
                  iceCandidateQueue.current.push(payload.candidate);
              }
          } catch (e) {
              console.warn("Error adding candidate", e);
          }
      }
    } catch (err) {
        console.error("Signaling error", err);
    }
  }, [callState, cleanup]);

  // Keep the ref updated for the channel listener
  useEffect(() => { handleSignalRef.current = handleSignal; }, [handleSignal]);


  // --- User Actions ---

  const startCall = useCallback(async () => {
    if (!channelRef.current) return;
    cleanup(); // Reset any old state

    try {
      console.log('[WebRTC] Starting Call (Caller)...');
      const peer = createPeerConnection();

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      setLocalStream(stream);
      localStreamRef.current = stream;

      // Add transceiver to ensure audio direction is sendrecv
      stream.getTracks().forEach(track => {
          peer.addTransceiver(track, { direction: 'sendrecv', streams: [stream] });
      });

      const offer = await peer.createOffer();
      await peer.setLocalDescription(offer);
      setCallState(CallState.OFFERING);

      await channelRef.current.send({
        type: 'broadcast',
        event: 'signal',
        payload: { type: 'offer', sdp: offer, callerId: userId } as SignalingPayload,
      });

    } catch (err) {
      console.error('[WebRTC] Start call failed', err);
      cleanup();
    }
  }, [createPeerConnection, cleanup, userId]);

  const answerCall = useCallback(async () => {
    if (!incomingOfferRef.current || !channelRef.current) return;

    try {
      console.log('[WebRTC] Answering Call (Callee)...');
      const peer = createPeerConnection();

      // 1. Set Remote Description (Offer)
      await peer.setRemoteDescription(new RTCSessionDescription(incomingOfferRef.current));

      // 2. Process queued candidates
      while (iceCandidateQueue.current.length > 0) {
          const c = iceCandidateQueue.current.shift();
          if (c) await peer.addIceCandidate(new RTCIceCandidate(c));
      }

      // 3. Get Local Stream
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      setLocalStream(stream);
      localStreamRef.current = stream;

      // 4. Attach to Transceiver
      // Find the audio transceiver created by setRemoteDescription
      const audioTransceiver = peer.getTransceivers().find(t => t.receiver.track.kind === 'audio');
      if (audioTransceiver) {
          audioTransceiver.direction = 'sendrecv';
          await audioTransceiver.sender.replaceTrack(stream.getAudioTracks()[0]);
      } else {
          // Fallback
          stream.getTracks().forEach(track => peer.addTrack(track, stream));
      }

      const answer = await peer.createAnswer();
      await peer.setLocalDescription(answer);

      await channelRef.current.send({
        type: 'broadcast',
        event: 'signal',
        payload: { type: 'answer', sdp: answer } as SignalingPayload,
      });

      setCallState(CallState.CONNECTED);

    } catch (err) {
      console.error('[WebRTC] Answer call failed', err);
      cleanup();
    }
  }, [createPeerConnection, cleanup]);

  const endCall = useCallback(() => {
    channelRef.current?.send({
        type: 'broadcast',
        event: 'signal',
        payload: { type: 'hangup' } as SignalingPayload,
    }).catch(() => {});
    cleanup();
  }, [cleanup]);

  const toggleMute = useCallback(() => {
    if (localStreamRef.current) {
        const enabled = !localStreamRef.current.getAudioTracks()[0].enabled;
        localStreamRef.current.getAudioTracks().forEach(t => t.enabled = !t.enabled);
        setIsMuted(!enabled);
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
    rtcStats
  };
};