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
  const handleSignalRef = useRef<((payload: SignalingPayload) => Promise<void>) | null>(null);
  
  // Keep a ref to the channel to avoid stale closures in event listeners (fixes 15s drop)
  const channelRef = useRef(channel);
  useEffect(() => {
    channelRef.current = channel;
  }, [channel]);

  // Cleanup function
  const cleanup = useCallback(() => {
    console.log('[WebRTC] Cleaning up call resources');
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
      setLocalStream(null);
    }
    if (pc.current) {
      // Remove listeners to prevent memory leaks
      pc.current.onicecandidate = null;
      pc.current.ontrack = null;
      pc.current.onconnectionstatechange = null;
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
      // Use channelRef.current to ensure we send on the ACTIVE channel
      if (event.candidate && channelRef.current) {
        channelRef.current.send({
          type: 'broadcast',
          event: 'signal',
          payload: { type: 'candidate', candidate: event.candidate } as SignalingPayload,
        }).catch(err => console.error("Failed to send candidate:", err));
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
      } 
      // Only cleanup on FAILED. Disconnected can be temporary (especially on mobile/WiFi switch)
      else if (newPc.connectionState === 'failed') {
        console.warn('[WebRTC] Connection failed, cleaning up.');
        cleanup();
      }
    };

    pc.current = newPc;
    return newPc;
  }, [cleanup]);

  // Handle incoming signaling messages
  const handleSignal = useCallback(async (payload: SignalingPayload) => {
    // 1. PRIORITY: Handle Hangup first, regardless of PC state.
    // This fixes the issue where one side remains "Connected" if the PC was buggy.
    if (payload.type === 'hangup') {
      console.log('[WebRTC] Received hangup signal. Ending call.');
      cleanup();
      return;
    }

    if (!pc.current && payload.type !== 'offer') {
        // If we don't have a PC and it's not an offer, ignore (except hangup, handled above)
        return;
    }

    try {
      switch (payload.type) {
        case 'offer':
          if (callState !== CallState.IDLE) {
             console.warn('[WebRTC] Received offer while busy');
             // Optionally send a "busy" signal back
             return; 
          }
          console.log('[WebRTC] Received offer');
          setCallState(CallState.RECEIVING);
          incomingOfferRef.current = payload.sdp!;
          break;

        case 'answer':
          console.log('[WebRTC] Received answer');
          if (pc.current) {
            // Only set remote description if we are waiting for an answer
            if (pc.current.signalingState === 'have-local-offer') {
                await pc.current.setRemoteDescription(new RTCSessionDescription(payload.sdp!));
                
                // Process buffered candidates now that Remote Description is set
                while(iceCandidateQueue.current.length > 0) {
                    const c = iceCandidateQueue.current.shift();
                    if(c) {
                        try {
                            await pc.current.addIceCandidate(new RTCIceCandidate(c));
                        } catch(e) { console.error("Error adding buffered candidate", e) }
                    }
                }
            } else {
                console.warn('[WebRTC] Ignored answer in wrong state:', pc.current.signalingState);
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
               // Buffer candidate if Remote Description isn't set yet (common race condition)
               console.log('[WebRTC] Buffering candidate (no remote desc)');
               iceCandidateQueue.current.push(payload.candidate);
            }
          }
          break;
      }
    } catch (error) {
      console.error('[WebRTC] Error handling signal:', error);
      // Don't auto-cleanup on signal error, might be recoverable
    }
  }, [callState, createPeerConnection, cleanup]);

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
       // We let the parent manage channel lifecycle
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
          
         // Process any candidates that arrived BEFORE the user clicked "Answer"
         while(iceCandidateQueue.current.length > 0) {
            const c = iceCandidateQueue.current.shift();
            if(c) {
                 try {
                     await peer.addIceCandidate(new RTCIceCandidate(c));
                 } catch (e) { console.error("Error adding pre-answer candidate", e); }
            }
         }

         const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
         setLocalStream(stream);
         stream.getTracks().forEach(track => peer.addTrack(track, stream));

         const answer = await peer.createAnswer();
         await peer.setLocalDescription(answer);

         channelRef.current?.send({
            type: 'broadcast',
            event: 'signal',
            payload: { type: 'answer', sdp: answer } as SignalingPayload,
         });
         
         // Optimistically update state to update UI immediately
         setCallState(CallState.CONNECTED);
         
     } catch (err)