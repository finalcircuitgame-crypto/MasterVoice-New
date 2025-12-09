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
  // Queue for ICE candidates received before remote description is set
  const iceCandidateQueue = useRef<RTCIceCandidateInit[]>([]);
  // Store incoming offer to answer later manually
  const incomingOfferRef = useRef<RTCSessionDescriptionInit | null>(null);

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
    // If a PC exists and is not closed, return it.
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
    // Ignore if no PC exists and it's not an offer (unless we need to create one)
    if (!pc.current && payload.type !== 'offer') return;

    try {
      switch (payload.type) {
        case 'offer':
          // If we receive an offer, we must be the callee
          if (callState !== CallState.IDLE) {
             console.warn('[WebRTC] Received offer while busy');
             return; 
          }
          console.log('[WebRTC] Received offer');
          setCallState(CallState.RECEIVING);
          incomingOfferRef.current = payload.sdp!;
          // We wait for manual answerCall() now
          break;

        case 'answer':
          console.log('[WebRTC] Received answer');
          if (pc.current) {
            if (pc.current.signalingState === 'have-local-offer') {
                await pc.current.setRemoteDescription(new RTCSessionDescription(payload.sdp!));
                // Process queued candidates
                while(iceCandidateQueue.current.length > 0) {
                    const c = iceCandidateQueue.current.shift();
                    if(c) await pc.current.addIceCandidate(new RTCIceCandidate(c));
                }
            } else {
                console.warn('[WebRTC] Received answer but signaling state is', pc.current.signalingState);
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
               // Queue if we haven't set remote description yet
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

  // Setup channel listener
  useEffect(() => {
    if (!channel) return;

    const subscription = channel
      .on('broadcast', { event: 'signal' }, (response) => {
        handleSignal(response.payload as SignalingPayload);
      })
      .subscribe();

    return () => {
       // Channel cleanup handled by parent
    };
  }, [channel, handleSignal]);

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
         if (peer.signalingState !== 'stable') return;

         await peer.setRemoteDescription(new RTCSessionDescription(incomingOfferRef.current));
          
         // Process queued candidates
         while(iceCandidateQueue.current.length > 0) {
            const c = iceCandidateQueue.current.shift();
            if(c) await peer.addIceCandidate(new RTCIceCandidate(c));
         }

         // Get User Media
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
         
         // State should naturally update to CONNECTED when ICE connects, but we can optimistically set connected if needed, 
         // though 'RECEIVING' state usually transitions to connected via onconnectionstatechange
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