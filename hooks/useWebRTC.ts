import { useEffect, useRef, useState, useCallback } from 'react';
import { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '../supabaseClient';
import { ICE_SERVERS } from '../constants';
import { CallState, SignalingPayload } from '../types';

export const useWebRTC = (roomId: string | null, userId: string, userPlan: 'free' | 'pro' | 'team' = 'free', onCallEnded?: () => void) => {
  const [callState, setCallState] = useState<CallState>(CallState.IDLE);
  
  // Streams
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null); // Audio + Cam
  const [remoteScreenStream, setRemoteScreenStream] = useState<MediaStream | null>(null); // Remote Screen Share
  
  const [localStream, setLocalStream] = useState<MediaStream | null>(null); // Audio
  const [localVideoStream, setLocalVideoStream] = useState<MediaStream | null>(null); // Cam
  const [localScreenStream, setLocalScreenStream] = useState<MediaStream | null>(null); // Screen Share

  // State
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [rtcStats, setRtcStats] = useState<any>(null);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [inputGain, setInputGain] = useState(1.0);

  // Refs
  const pc = useRef<RTCPeerConnection | null>(null);
  const iceCandidateQueue = useRef<RTCIceCandidateInit[]>([]);
  const incomingOfferRef = useRef<RTCSessionDescriptionInit | null>(null);
  const handleSignalRef = useRef<((payload: SignalingPayload) => Promise<void>) | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const reconnectTimeoutRef = useRef<number | null>(null);
  const isProcessingOfferRef = useRef<boolean>(false);
  const iceGatheringTimeoutRef = useRef<number | null>(null);
  
  // Track Senders
  const videoSenderRef = useRef<RTCRtpSender | null>(null);
  const screenSenderRef = useRef<RTCRtpSender | null>(null);

  // Audio Processing Refs
  const audioContextRef = useRef<AudioContext | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const sourceNodeRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const destNodeRef = useRef<MediaStreamAudioDestinationNode | null>(null);

  // Keep ref for local streams for cleanup
  const localStreamRef = useRef<MediaStream | null>(null);
  const localVideoStreamRef = useRef<MediaStream | null>(null);
  const localScreenStreamRef = useRef<MediaStream | null>(null);

  useEffect(() => { localStreamRef.current = localStream; }, [localStream]);
  useEffect(() => { localVideoStreamRef.current = localVideoStream; }, [localVideoStream]);
  useEffect(() => { localScreenStreamRef.current = localScreenStream; }, [localScreenStream]);

  // Handle Input Gain
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

    const stopStream = (s: MediaStream | null) => s?.getTracks().forEach(t => t.stop());
    stopStream(localStreamRef.current);
    stopStream(localVideoStreamRef.current);
    stopStream(localScreenStreamRef.current);

    setLocalStream(null);
    setLocalVideoStream(null);
    setLocalScreenStream(null);

    if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
        gainNodeRef.current = null;
        sourceNodeRef.current = null;
        destNodeRef.current = null;
    }

    if (pc.current) {
      try {
        pc.current.close();
      } catch (e) {
        console.warn('[WebRTC] Error closing pc', e);
      }
      pc.current = null;
    }

    setRemoteStream(null);
    setRemoteScreenStream(null);
    setCallState(CallState.IDLE);
    setRtcStats(null);
    iceCandidateQueue.current = [];
    incomingOfferRef.current = null;
    setIsMuted(false);
    setIsVideoEnabled(false);
    setIsScreenSharing(false);
    videoSenderRef.current = null;
    screenSenderRef.current = null;
    isProcessingOfferRef.current = false;
    setConnectionError(null);
    setInputGain(1.0);
  }, []); 

  // --- Signaling Setup ---
  useEffect(() => {
    if (!roomId || !userId) return;
    const channel = supabase.channel(`webrtc:${roomId}`, { config: { broadcast: { self: false } } });
    channel
      .on('broadcast', { event: 'signal' }, (response) => {
        if (handleSignalRef.current) handleSignalRef.current(response.payload as SignalingPayload);
      })
      .subscribe();
    channelRef.current = channel;
    return () => { supabase.removeChannel(channel); channelRef.current = null; cleanup('channel closed'); };
  }, [roomId, userId, cleanup]);

  // --- Create PeerConnection ---
  const createPeerConnection = useCallback(() => {
    if (pc.current && pc.current.signalingState !== 'closed') return pc.current;

    const newPc = new RTCPeerConnection({
      iceServers: ICE_SERVERS,
      iceCandidatePoolSize: 10,
      bundlePolicy: 'max-bundle',
      rtcpMuxPolicy: 'require'
    });

    newPc.onicecandidate = (event) => {
      if (event.candidate && channelRef.current) {
        channelRef.current.send({
          type: 'broadcast', event: 'signal',
          payload: { type: 'candidate', candidate: event.candidate.toJSON() } as SignalingPayload,
        }).catch(err => console.error(err));
      }
    };

    // Handle incoming tracks (Audio, Video, Screen)
    newPc.ontrack = (event) => {
      console.log('[WebRTC] Received remote track:', event.track.kind, event.streams[0]?.id);
      const incomingStream = event.streams[0];

      if (event.track.kind === 'audio') {
          // Audio always goes to primary remote stream
          setRemoteStream(prev => {
              const stream = prev || new MediaStream();
              if (!stream.getAudioTracks().length) stream.addTrack(event.track);
              return stream; // Don't clone audio stream unnecessarily to avoid glitches
          });
      } else if (event.track.kind === 'video') {
          // If we already have a video track in remoteStream, this new one is likely Screen Share
          setRemoteStream(prev => {
              // Primary Stream Logic
              if (!prev || prev.getVideoTracks().length === 0) {
                  const stream = prev || new MediaStream();
                  stream.addTrack(event.track);
                  return stream.clone(); // Trigger render
              } else {
                  // Secondary Stream Logic (Screen Share)
                  // Check if this track is already in primary
                  if (prev.getTracks().find(t => t.id === event.track.id)) return prev;
                  
                  // It's a new video track, assign to Screen Stream
                  setRemoteScreenStream(screenPrev => {
                      const sStream = screenPrev || new MediaStream();
                      sStream.addTrack(event.track);
                      return sStream.clone();
                  });
                  return prev;
              }
          });
      }

      if (callState !== CallState.CONNECTED) {
        setCallState(CallState.CONNECTED);
        setConnectionError(null);
      }
    };

    newPc.onconnectionstatechange = () => {
      if (newPc.connectionState === 'connected') {
        if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
        setCallState(CallState.CONNECTED);
        setConnectionError(null);
      } else if (newPc.connectionState === 'disconnected') {
        setCallState(CallState.RECONNECTING);
        setConnectionError('Reconnecting...');
        if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = window.setTimeout(() => cleanup('timeout'), 15 * 60 * 1000);
      } else if (newPc.connectionState === 'failed' || newPc.connectionState === 'closed') {
        cleanup('failed');
      }
    };

    pc.current = newPc;
    return newPc;
  }, [cleanup, callState]);

  // --- Stats ---
  useEffect(() => {
    let interval: number;
    if (callState === CallState.CONNECTED && pc.current) {
      interval = window.setInterval(async () => {
        try {
          const stats = await pc.current!.getStats();
          let activeCandidatePair: any = null;
          let inboundAudio: any = null;
          let inboundVideo: any = null;

          stats.forEach(report => {
            if (report.type === 'candidate-pair' && report.state === 'succeeded') activeCandidatePair = report;
            if (report.type === 'inbound-rtp' && report.kind === 'audio') inboundAudio = report;
            if (report.type === 'inbound-rtp' && report.kind === 'video' && !inboundVideo) inboundVideo = report; // Grab first video
          });

          setRtcStats({
            rtt: activeCandidatePair?.currentRoundTripTime ? Math.round(activeCandidatePair.currentRoundTripTime * 1000) : 0,
            packetsLost: (inboundAudio?.packetsLost || 0) + (inboundVideo?.packetsLost || 0),
            resolution: inboundVideo ? `${inboundVideo.frameWidth}x${inboundVideo.frameHeight}` : 'N/A',
            fps: inboundVideo ? inboundVideo.framesPerSecond : 0
          });
        } catch (e) {}
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [callState]);

  // --- Signaling Handling ---
  const handleSignal = useCallback(async (payload: SignalingPayload) => {
    if (payload.type === 'hangup') {
      if (onCallEnded) onCallEnded();
      cleanup('remote hangup');
      return;
    }

    if (payload.type === 'offer') {
      if (isProcessingOfferRef.current) return;
      isProcessingOfferRef.current = true;

      if (callState === CallState.CONNECTED || callState === CallState.RECONNECTING) {
          if (!pc.current) createPeerConnection();
          if (pc.current) {
            try {
                await pc.current.setRemoteDescription(new RTCSessionDescription(payload.sdp!));
                const answer = await pc.current.createAnswer();
                await pc.current.setLocalDescription(answer);
                channelRef.current?.send({ type: 'broadcast', event: 'signal', payload: { type: 'answer', sdp: answer } as SignalingPayload });
                if (callState === CallState.RECONNECTING) setCallState(CallState.CONNECTED);
            } catch (e) { console.error(e); } 
            finally { isProcessingOfferRef.current = false; }
            return;
          }
      }
      setCallState(CallState.RECEIVING);
      incomingOfferRef.current = payload.sdp!;
      isProcessingOfferRef.current = false;
      return;
    }

    if (pc.current) {
      if (payload.type === 'answer') {
        if (pc.current.signalingState === 'have-local-offer') {
          await pc.current.setRemoteDescription(new RTCSessionDescription(payload.sdp!));
          while (iceCandidateQueue.current.length) {
            const c = iceCandidateQueue.current.shift();
            if (c) pc.current.addIceCandidate(new RTCIceCandidate(c));
          }
        }
      } else if (payload.type === 'candidate' && payload.candidate) {
        if (pc.current.remoteDescription) pc.current.addIceCandidate(new RTCIceCandidate(payload.candidate));
        else iceCandidateQueue.current.push(payload.candidate);
      }
    } else if (payload.type === 'candidate') {
        iceCandidateQueue.current.push(payload.candidate!);
    }
  }, [callState, cleanup, createPeerConnection, onCallEnded]);

  useEffect(() => { handleSignalRef.current = handleSignal; }, [handleSignal]);

  // --- Media Helpers ---
  const getProcessedStream = async () => {
      const rawStream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
        video: false
      });
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const source = ctx.createMediaStreamSource(rawStream);
      const gainNode = ctx.createGain();
      const dest = ctx.createMediaStreamDestination();
      source.connect(gainNode);
      gainNode.connect(dest);
      audioContextRef.current = ctx;
      gainNodeRef.current = gainNode;
      gainNode.gain.value = inputGain;
      return { rawStream, processedStream: dest.stream };
  };

  const renegotiate = useCallback(async () => {
      if (!pc.current || !channelRef.current || pc.current.signalingState !== 'stable') return;
      try {
          const offer = await pc.current.createOffer();
          await pc.current.setLocalDescription(offer);
          channelRef.current.send({ type: 'broadcast', event: 'signal', payload: { type: 'offer', sdp: offer, callerId: userId } });
      } catch (err) { console.error("Renegotiation error", err); }
  }, [userId]);

  // --- Camera Logic (Plan Based) ---
  const toggleVideo = useCallback(async () => {
      if (!pc.current) return;

      if (isVideoEnabled) {
          // Stop Video
          if (videoSenderRef.current) videoSenderRef.current.replaceTrack(null);
          if (localVideoStream) {
              localVideoStream.getTracks().forEach(t => t.stop());
              setLocalVideoStream(null);
          }
          setIsVideoEnabled(false);
          // If screen sharing is off too, we are audio only
          if (!isScreenSharing) renegotiate();
      } else {
          // Start Video with Plan Constraints
          try {
              // Forced upgrade: Everyone gets Pro quality (1080p/60fps)
              const constraints = { 
                  width: { ideal: 1920 }, 
                  height: { ideal: 1080 }, 
                  frameRate: { ideal: 60 } 
              };

              console.log(`[WebRTC] Starting Video (High Quality Unlocked)`, constraints);

              const videoStream = await navigator.mediaDevices.getUserMedia({ video: constraints });
              setLocalVideoStream(videoStream);
              const videoTrack = videoStream.getVideoTracks()[0];
              
              videoTrack.onended = () => {
                  setIsVideoEnabled(false);
                  if (videoSenderRef.current) videoSenderRef.current.replaceTrack(null);
                  setLocalVideoStream(null);
              };

              let sender = videoSenderRef.current;
              // Find existing video sender if we lost the ref
              if (!sender) sender = pc.current.getSenders().find(s => s.track?.kind === 'video') || null;

              if (sender) {
                  await sender.replaceTrack(videoTrack);
                  videoSenderRef.current = sender;
              } else {
                  const newSender = pc.current.addTrack(videoTrack, videoStream);
                  videoSenderRef.current = newSender;
              }
              renegotiate();
              setIsVideoEnabled(true);
          } catch (e) {
              console.error("Camera error", e);
              setConnectionError("Could not access camera");
          }
      }
  }, [isVideoEnabled, localVideoStream, renegotiate, isScreenSharing]);

  // --- Screen Share (Dual Stream Support) ---
  const toggleScreenShare = useCallback(async () => {
      if (!pc.current) return;

      if (isScreenSharing) {
          // Stop Sharing - Remove track
          if (screenSenderRef.current) {
              pc.current.removeTrack(screenSenderRef.current);
              screenSenderRef.current = null;
          }
          if (localScreenStream) {
              localScreenStream.getTracks().forEach(t => t.stop());
              setLocalScreenStream(null);
          }
          setIsScreenSharing(false);
          renegotiate();
      } else {
          // Start Sharing - Add new track (don't replace camera)
          try {
              // Forced upgrade: Everyone gets 60fps screen share
              const screenStream = await navigator.mediaDevices.getDisplayMedia({ 
                  video: { frameRate: 60, cursor: 'always' } as any, 
                  audio: true // Capture system audio
              });
              
              setLocalScreenStream(screenStream);
              const screenTrack = screenStream.getVideoTracks()[0];

              screenTrack.onended = () => {
                  setIsScreenSharing(false);
                  if (screenSenderRef.current) {
                      try { pc.current?.removeTrack(screenSenderRef.current); } catch(e){}
                      screenSenderRef.current = null;
                  }
                  setLocalScreenStream(null);
                  renegotiate();
              };

              // Add as a completely new track to support dual streams
              const newSender = pc.current.addTrack(screenTrack, screenStream);
              screenSenderRef.current = newSender;
              
              renegotiate();
              setIsScreenSharing(true);
          } catch (e) {
              console.error("Screen share error", e);
          }
      }
  }, [isScreenSharing, localScreenStream, renegotiate]);

  // --- Start/Answer ---
  const startCall = useCallback(async () => {
    if (!channelRef.current) return;
    cleanup('starting new');
    try {
      setCallState(CallState.CONNECTING);
      const { rawStream, processedStream } = await getProcessedStream();
      setLocalStream(rawStream);
      localStreamRef.current = rawStream;

      const peer = createPeerConnection();
      processedStream.getTracks().forEach(t => peer.addTrack(t, processedStream));

      const offer = await peer.createOffer({ offerToReceiveAudio: true, offerToReceiveVideo: true });
      await peer.setLocalDescription(offer);
      setCallState(CallState.OFFERING);
      await channelRef.current.send({ type: 'broadcast', event: 'signal', payload: { type: 'offer', sdp: offer, callerId: userId } });
    } catch (err) { cleanup('start failed'); }
  }, [createPeerConnection, cleanup, userId, inputGain]);

  const answerCall = useCallback(async () => {
    if (!incomingOfferRef.current || !channelRef.current) return;
    try {
      setCallState(CallState.CONNECTING);
      const { rawStream, processedStream } = await getProcessedStream();
      setLocalStream(rawStream);
      localStreamRef.current = rawStream;

      const peer = createPeerConnection();
      processedStream.getTracks().forEach(t => peer.addTrack(t, processedStream));
      await peer.setRemoteDescription(new RTCSessionDescription(incomingOfferRef.current));
      
      const answer = await peer.createAnswer();
      await peer.setLocalDescription(answer);
      await channelRef.current.send({ type: 'broadcast', event: 'signal', payload: { type: 'answer', sdp: answer } });
      setCallState(CallState.CONNECTED);
    } catch (err) { cleanup('answer failed'); }
  }, [createPeerConnection, cleanup]);

  const endCall = useCallback(() => {
    channelRef.current?.send({ type: 'broadcast', event: 'signal', payload: { type: 'hangup' } });
    cleanup('user ended');
  }, [cleanup]);

  const toggleMute = useCallback(() => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) { audioTrack.enabled = !audioTrack.enabled; setIsMuted(!audioTrack.enabled); }
    }
  }, []);

  const toggleRemoteAudio = useCallback(() => {
      remoteStream?.getAudioTracks().forEach(t => t.enabled = !t.enabled);
  }, [remoteStream]);

  return {
    callState,
    localStream, localVideoStream, localScreenStream,
    remoteStream, remoteScreenStream,
    startCall, endCall, answerCall,
    toggleMute, toggleVideo, toggleScreenShare, toggleRemoteAudio,
    isMuted, isVideoEnabled, isScreenSharing,
    rtcStats, connectionError, setInputGain, inputGain
  };
};