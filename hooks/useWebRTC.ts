import { useEffect, useRef, useState, useCallback } from 'react';
import { RealtimeChannel } from '@supabase/supabase-js';
import { ICE_SERVERS } from '../constants';
import { CallState, SignalingPayload } from '../types';

export const useWebRTC = (
  channel: RealtimeChannel | null,
  userId: string
) => {
  const [callState, setCallState] = useState<CallState>(CallState.IDLE);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  
  const pc = useRef<RTCPeerConnection | null>(null);
  const iceCandidateQueue = useRef<RTCIceCandidateInit[]>([]);
  const incomingOfferRef = useRef<RTCSessionDescriptionInit | null>(null);
  const handleSignalRef = useRef<(payload: SignalingPayload) => Promise<void>>();

  // Cleanup function
  const cleanup = useCallback(() => {
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
      setLocalStream(null);
    }
    if (pc.current) {
      pc.current.close();
      pc.current = null;
    }
    setRemoteStream(null);
    setCallState(CallState.IDLE);
    iceCandidateQueue.current = [];
    incomingOfferRef.current = null;
    setIsMuted(false);
  }, [localStream]);

  // Initialize PeerConnection
  const createPeerConnection = useCallback(() => {
    if (pc.current && pc.current.signalingState !== 'closed') return pc.current;

    console.log('[WebRTC] Creating RTCPeerConnection');
    const newPc = new RTCPeerConnection({ iceServers: ICE_SERVERS });

    newPc.onicecandidate = (event) => {
      if (event.candidate && channel) {
        channel.send({
          type: 'broadcast',
          event: 'signal',
          payload: { type: 'candidate', candidate: event.candidate } as SignalingPayload,
        });
      }
    };

    newPc.ontrack = (event) => {
      console.log('[WebRTC] Received remote track');
      setRemoteStream(event.streams[0]);
    };

    newPc.onconnectionstatechange = () => {
      console.log('[WebRTC] Connection state:', newPc.connectionState);
      if (newPc.connectionState === 'connected') {
        setCallState(CallState.CONNECTED);
      } else if (newPc.connectionState === 'disconnected' || newPc.connectionState === 'failed') {
        cleanup();
      }
    };

    pc.current = newPc;
    return newPc;
  }, [channel, cleanup]);

  // Handle incoming signaling messages
  const handleSignal = useCallback(async (payload: SignalingPayload) => {
    if (!pc.current && payload.type !== 'offer') return;

    try {
      switch (payload.type) {
        case 'offer':
          if (callState !== CallState.IDLE) {
             console.warn('[WebRTC] Received offer while busy');
             return; 
          }
          console.log('[WebRTC] Received offer');
          setCallState(CallState.RECEIVING);
          incomingOfferRef.current = payload.sdp!;
          break;

        case 'answer':
          console.log('[WebRTC] Received answer');
          if (pc.current) {
            // Check state to avoid InvalidStateError
            if (pc.current.signalingState === 'have-local-offer') {
                await pc.current.setRemoteDescription(new RTCSessionDescription(payload.sdp!));
                while(iceCandidateQueue.current.length > 0) {
                    const c = iceCandidateQueue.current.shift();
                    if(c) await pc.current.addIceCandidate(new RTCIceCandidate(c));
                }
            }
          }
          break;

        case 'candidate':
          if (payload.candidate) {
            if (pc.current && pc.current.remoteDescription && pc.current.signalingState !== 'closed') {
               try {
                   await pc.current.addIceCandidate(new RTCIceCandidate(payload.candidate));
               } catch (e) {
                   console.error('[WebRTC] Error adding candidate', e);
               }
            } else {
               iceCandidateQueue.current.push(payload.candidate);
            }
          }
          break;

        case 'hangup':
          console.log('[WebRTC] Received hangup');
          cleanup();
          break;
      }
    } catch (error) {
      console.error('[WebRTC] Error handling signal:', error);
      cleanup();
    }
  }, [channel, callState, createPeerConnection, cleanup]);

  // Ref pattern to prevent stale closures and duplicate listeners
  useEffect(() => {
    handleSignalRef.current = handleSignal;
  }, [handleSignal]);

  // Setup channel listener ONLY ONCE
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
       // Channel cleanup handled by parent usually, but we unsubscribe specific listener if needed
       // supabase.removeChannel(channel) happens in parent
    };
  }, [channel]);

  // Actions
  const startCall = async () => {
    if (!channel || callState !== CallState.IDLE) return;
    
    try {
      console.log('[WebRTC] Starting call...');
      const peer = createPeerConnection();
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      setLocalStream(stream);
      stream.getTracks().forEach(track => peer.addTrack(track, stream));

      const offer = await peer.createOffer();
      await peer.setLocalDescription(offer);
      setCallState(CallState.OFFERING);

      channel.send({
        type: 'broadcast',
        event: 'signal',
        payload: { type: 'offer', sdp: offer, callerId: userId } as SignalingPayload,
      });
    } catch (err) {
      console.error('[WebRTC] Failed to start call:', err);
      cleanup();
    }
  };

  const answerCall = async () => {
     if (!incomingOfferRef.current) return;
     
     try {
         const peer = createPeerConnection();
         // If we are already connected or connecting, don't reset
         if (peer.signalingState !== 'stable') return;

         await peer.setRemoteDescription(new RTCSessionDescription(incomingOfferRef.current));
          
         while(iceCandidateQueue.current.length > 0) {
            const c = iceCandidateQueue.current.shift();
            if(c) await peer.addIceCandidate(new RTCIceCandidate(c));
         }

         const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
         setLocalStream(stream);
         stream.getTracks().forEach(track => peer.addTrack(track, stream));

         const answer = await peer.createAnswer();
         await peer.setLocalDescription(answer);

         channel?.send({
            type: 'broadcast',
            event: 'signal',
            payload: { type: 'answer', sdp: answer } as SignalingPayload,
         });
         
         // Optimistically update state to update UI immediately
         setCallState(CallState.CONNECTED);
         
     } catch (err) {
         console.error('[WebRTC] Failed to answer call:', err);
         cleanup();
     }
  };

  const endCall = () => {
    channel?.send({
      type: 'broadcast',
      event: 'signal',
      payload: { type: 'hangup' } as SignalingPayload,
    });
    cleanup();
  };
  
  const toggleMute = () => {
      if (localStream) {
          localStream.getAudioTracks().forEach(track => {
              track.enabled = !track.enabled;
          });
          setIsMuted(!localStream.getAudioTracks()[0]?.enabled);
      }
  };

  return {
    callState,
    localStream,
    remoteStream,
    startCall,
    endCall,
    answerCall,
    toggleMute,
    isMuted
  };
};