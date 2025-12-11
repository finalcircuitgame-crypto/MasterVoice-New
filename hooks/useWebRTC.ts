import { useEffect, useRef, useState, useCallback } from 'react';
import { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '../supabaseClient';
import { ICE_SERVERS } from '../constants';
import { CallState, SignalingPayload } from '../types';

export const useWebRTC = (roomId: string | null, userId: string) => {
  const [callState, setCallState] = useState<CallState>(CallState.IDLE);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null); // Audio Stream
  const [localVideoStream, setLocalVideoStream] = useState<MediaStream | null>(null); // Video Stream
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [rtcStats, setRtcStats] = useState<any>(null);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [inputGain, setInputGain] = useState(1.0); // Mic Volume

  const pc = useRef<RTCPeerConnection | null>(null);
  const iceCandidateQueue = useRef<RTCIceCandidateInit[]>([]);
  const incomingOfferRef = useRef<RTCSessionDescriptionInit | null>(null);
  const handleSignalRef = useRef<((payload: SignalingPayload) => Promise<void>) | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const reconnectTimeoutRef = useRef<number | null>(null);
  const isProcessingOfferRef = useRef<boolean>(false);
  const iceGatheringTimeoutRef = useRef<number | null>(null);
  const videoSenderRef = useRef<RTCRtpSender | null>(null);

  // Audio Processing Refs
  const audioContextRef = useRef<AudioContext | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const sourceNodeRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const destNodeRef = useRef<MediaStreamAudioDestinationNode | null>(null);

  // Keep ref for local stream for cleanup
  const localStreamRef = useRef<MediaStream | null>(null);
  useEffect(() => { localStreamRef.current = localStream; }, [localStream]);

  // Handle Input Gain (Mic Volume) changes
  useEffect(() => {
      if (gainNodeRef.current) {
          gainNodeRef.current.gain.value = inputGain;
      }
  }, [inputGain]);

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
    
    if (localVideoStream) {
        localVideoStream.getTracks().forEach(t => t.stop());
        setLocalVideoStream(null);
    }

    // Clean up Audio Context
    if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
        gainNodeRef.current = null;
        sourceNodeRef.current = null;
        destNodeRef.current = null;
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
    setIsVideoEnabled(false);
    setIsScreenSharing(false);
    videoSenderRef.current = null;
    isProcessingOfferRef.current = false;
    setConnectionError(null);
    setInputGain(1.0);
  }, [localVideoStream]); // Added localVideoStream dependency to ensure it cleans up if ref logic misses it

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
      // console.log('[WebRTC] ICE candidate:', event.candidate ? event.candidate.type : 'null (gathering complete)');
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
      
      setRemoteStream(prev => {
          const stream = prev || new MediaStream();
          // Check if track is already added
          if (!stream.getTracks().find(t => t.id === event.track.id)) {
              stream.addTrack(event.track);
          }
          return stream.clone(); // Clone to trigger re-render
      });

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

    pc.current = newPc;
    return newPc;
  }, [cleanup, callState]);

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
          // console.warn("Failed to get stats", e);
        }
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [callState]);

  // --- Signaling Logic ---
  const handleSignal = useCallback(async (payload: SignalingPayload) => {
    // console.log('[WebRTC] Received signal:', payload.type);

    if (payload.type === 'hangup') {
      console.log('[WebRTC] Remote signal hangup received - entering grace period');
      setCallState(CallState.RECONNECTING);
      
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = window.setTimeout(() => {
        cleanup('grace period expired (hangup)');
      }, 2000); // Short timeout for explicit hangup
      return;
    }

    if (payload.type === 'offer') {
      if (isProcessingOfferRef.current) return;
      isProcessingOfferRef.current = true;

      // Handle Renegotiation if connected
      if (callState === CallState.CONNECTED) {
          console.log('[WebRTC] Processing Renegotiation Offer');
          if (!pc.current) return;
          try {
              await pc.current.setRemoteDescription(new RTCSessionDescription(payload.sdp!));
              const answer = await pc.current.createAnswer();
              await pc.current.setLocalDescription(answer);
              
              channelRef.current?.send({
                  type: 'broadcast',
                  event: 'signal',
                  payload: { type: 'answer', sdp: answer } as SignalingPayload,
              });
          } catch (e) {
              console.error("[WebRTC] Renegotiation failed", e);
          } finally {
              isProcessingOfferRef.current = false;
          }
          return;
      }

      // Initial Offer Handling
      console.log('[WebRTC] Received Initial Offer');
      setCallState(CallState.RECEIVING);
      incomingOfferRef.current = payload.sdp!;
      isProcessingOfferRef.current = false;
      return;
    }

    if (!pc.current) {
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
          if (pc.current.remoteDescription && pc.current.remoteDescription.type) {
            await pc.current.addIceCandidate(new RTCIceCandidate(payload.candidate));
          } else {
            // console.log('[WebRTC] Queueing candidate, no remote description yet');
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

  useEffect(() => { handleSignalRef.current = handleSignal; }, [handleSignal]);


  // --- Helper to process Audio with Gain ---
  const getProcessedStream = async () => {
      const rawStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        },
        video: false
      });

      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const source = ctx.createMediaStreamSource(rawStream);
      const gainNode = ctx.createGain();
      const dest = ctx.createMediaStreamDestination();

      source.connect(gainNode);
      gainNode.connect(dest);

      audioContextRef.current = ctx;
      sourceNodeRef.current = source;
      gainNodeRef.current = gainNode;
      destNodeRef.current = dest;
      
      gainNode.gain.value = inputGain;

      return { rawStream, processedStream: dest.stream };
  };

  // --- Negotiate Helper ---
  const renegotiate = useCallback(async () => {
      if (!pc.current || !channelRef.current) return;
      try {
          console.log('[WebRTC] Negotiating new tracks...');
          const offer = await pc.current.createOffer();
          await pc.current.setLocalDescription(offer);
          channelRef.current.send({
              type: 'broadcast',
              event: 'signal',
              payload: { type: 'offer', sdp: offer, callerId: userId } as SignalingPayload,
          });
      } catch (err) {
          console.error("Renegotiation failed", err);
      }
  }, [userId]);

  // --- Toggle Video ---
  const toggleVideo = useCallback(async () => {
      if (!pc.current) return;

      if (isVideoEnabled) {
          // STOP VIDEO
          if (videoSenderRef.current) {
              pc.current.removeTrack(videoSenderRef.current);
              videoSenderRef.current = null;
          }
          if (localVideoStream) {
              localVideoStream.getTracks().forEach(t => t.stop());
              setLocalVideoStream(null);
          }
          setIsVideoEnabled(false);
          setIsScreenSharing(false); // Reset screen share too if implicit
          renegotiate();
      } else {
          // START VIDEO
          try {
              const videoStream = await navigator.mediaDevices.getUserMedia({ video: true });
              setLocalVideoStream(videoStream);
              const videoTrack = videoStream.getVideoTracks()[0];
              
              // Handle track ending (user closes permission/hardware issue)
              videoTrack.onended = () => {
                  setIsVideoEnabled(false);
                  videoSenderRef.current = null;
                  setLocalVideoStream(null);
                  renegotiate();
              };

              const sender = pc.current.addTrack(videoTrack, videoStream);
              videoSenderRef.current = sender;
              setIsVideoEnabled(true);
              setIsScreenSharing(false); // Can't do both simply in this version
              renegotiate();
          } catch (e) {
              console.error("Failed to start video", e);
              setConnectionError("Could not access camera");
          }
      }
  }, [isVideoEnabled, localVideoStream, renegotiate]);

  // --- Toggle Screen Share ---
  const toggleScreenShare = useCallback(async () => {
      if (!pc.current) return;

      if (isScreenSharing) {
          // STOP SHARE -> Revert to camera if was enabled, or nothing
          if (videoSenderRef.current) {
              pc.current.removeTrack(videoSenderRef.current);
              videoSenderRef.current = null;
          }
          if (localVideoStream) {
              localVideoStream.getTracks().forEach(t => t.stop());
              setLocalVideoStream(null);
          }
          setIsScreenSharing(false);
          setIsVideoEnabled(false); // Assume stop means stop video too for simplicity
          renegotiate();
      } else {
          // START SHARE
          try {
              // Stop existing video if any
              if (localVideoStream) {
                  localVideoStream.getTracks().forEach(t => t.stop());
              }
              if (videoSenderRef.current) {
                  pc.current.removeTrack(videoSenderRef.current);
              }

              const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
              setLocalVideoStream(screenStream);
              const screenTrack = screenStream.getVideoTracks()[0];

              screenTrack.onended = () => {
                  setIsScreenSharing(false);
                  setIsVideoEnabled(false);
                  videoSenderRef.current = null;
                  setLocalVideoStream(null);
                  renegotiate();
              };

              const sender = pc.current.addTrack(screenTrack, screenStream);
              videoSenderRef.current = sender;
              setIsScreenSharing(true);
              setIsVideoEnabled(true); // Technically video is enabled, just source is screen
              renegotiate();
          } catch (e) {
              console.error("Failed to share screen", e);
          }
      }
  }, [isScreenSharing, localVideoStream, renegotiate]);


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

      // Get processed stream (with gain)
      const { rawStream, processedStream } = await getProcessedStream().catch(err => {
        console.error('[WebRTC] Failed to get media:', err);
        setConnectionError('Microphone access denied. Please check permissions.');
        throw err;
      });

      setLocalStream(rawStream); // Store raw stream for simple track cleanup
      localStreamRef.current = rawStream;

      // Create peer connection
      const peer = createPeerConnection();

      // Add the PROCESSED tracks to the connection
      processedStream.getTracks().forEach(track => {
        peer.addTrack(track, processedStream);
      });

      iceGatheringTimeoutRef.current = window.setTimeout(() => {
        console.log('[WebRTC] ICE gathering timeout - proceeding with available candidates');
      }, 5000);

      const offer = await peer.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true, // Request video capability initially
        iceRestart: false
      });

      await peer.setLocalDescription(offer);
      setCallState(CallState.OFFERING);

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
  }, [createPeerConnection, cleanup, userId, inputGain]);

  const answerCall = useCallback(async () => {
    if (!incomingOfferRef.current || !channelRef.current) {
      console.error('[WebRTC] No offer to answer or no channel');
      setConnectionError('No incoming call to answer');
      return;
    }

    try {
      console.log('[WebRTC] Answering Call (Callee)...');
      setCallState(CallState.CONNECTING);

      const { rawStream, processedStream } = await getProcessedStream().catch(err => {
        console.error('[WebRTC] Failed to get media:', err);
        setConnectionError('Microphone access denied. Please check permissions.');
        throw err;
      });

      setLocalStream(rawStream);
      localStreamRef.current = rawStream;

      const peer = createPeerConnection();

      // Add processed tracks
      processedStream.getTracks().forEach(track => {
        peer.addTrack(track, processedStream);
      });

      await peer.setRemoteDescription(new RTCSessionDescription(incomingOfferRef.current));

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

      const answer = await peer.createAnswer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true // Support video if offered
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
  // Mute at the source level
  if (localStreamRef.current) {
    const audioTrack = localStreamRef.current.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled;
      setIsMuted(!audioTrack.enabled);
    }
  }
}, []);

return {
  callState,
  localStream,
  localVideoStream, // Export video stream
  remoteStream,
  startCall,
  endCall,
  answerCall,
  toggleMute,
  toggleVideo, // Export video toggle
  toggleScreenShare, // Export screen share
  isMuted,
  isVideoEnabled,
  isScreenSharing,
  rtcStats,
  connectionError,
  setInputGain,
  inputGain
};
};