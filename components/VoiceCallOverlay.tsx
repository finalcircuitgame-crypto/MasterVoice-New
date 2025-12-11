import React, { useState, useEffect, useRef } from 'react';
import { CallState, UserProfile } from '../types';

interface VoiceCallOverlayProps {
  callState: CallState;
  remoteStream: MediaStream | null;
  remoteScreenStream?: MediaStream | null; // Added prop
  localVideoStream?: MediaStream | null;
  localScreenStream?: MediaStream | null; // Added prop
  onEndCall: () => void;
  onAnswer?: () => void;
  toggleMute?: () => void;
  toggleVideo?: () => void;
  toggleScreenShare?: () => void;
  toggleRemoteAudio?: () => void;
  isMuted?: boolean;
  isVideoEnabled?: boolean;
  isScreenSharing?: boolean;
  recipient?: UserProfile;
  rtcStats?: any;
  setInputGain?: (gain: number) => void;
  inputGain?: number;
  isMaximized: boolean;
  setIsMaximized: (val: boolean) => void;
}

export const VoiceCallOverlay: React.FC<VoiceCallOverlayProps> = ({
  callState,
  remoteStream,
  remoteScreenStream,
  localVideoStream,
  localScreenStream,
  onEndCall,
  onAnswer,
  toggleMute,
  toggleVideo,
  toggleScreenShare,
  toggleRemoteAudio,
  isMuted,
  isVideoEnabled,
  isScreenSharing,
  recipient,
  rtcStats,
  setInputGain,
  inputGain = 1.0,
  isMaximized,
  setIsMaximized
}) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null); // Remote Camera
  const remoteScreenRef = useRef<HTMLVideoElement>(null); // Remote Screen
  const localVideoRef = useRef<HTMLVideoElement>(null); // Local Camera
  const localScreenRef = useRef<HTMLVideoElement>(null); // Local Screen Preview
  
  const [duration, setDuration] = useState(0);
  const [autoplayBlocked, setAutoplayBlocked] = useState(false);
  const [showDebug, setShowDebug] = useState(false);
  
  // Output Audio Context Refs
  const outputCtxRef = useRef<AudioContext | null>(null);
  const outputGainRef = useRef<GainNode | null>(null);
  const [outputVolume, setOutputVolume] = useState(1.0);
  const [isDeafened, setIsDeafened] = useState(false);

  // Auto-maximize on video start
  const hasMaximizedForVideoRef = useRef(false);
  
  useEffect(() => {
      const hasAnyVideo = isVideoEnabled || isScreenSharing || 
                          (remoteStream && remoteStream.getVideoTracks().length > 0) || 
                          (remoteScreenStream && remoteScreenStream.getVideoTracks().length > 0);
      
      if (hasAnyVideo && !hasMaximizedForVideoRef.current) {
          setIsMaximized(true);
          hasMaximizedForVideoRef.current = true;
      } else if (!hasAnyVideo) {
          hasMaximizedForVideoRef.current = false;
      }
  }, [isVideoEnabled, isScreenSharing, remoteStream, remoteScreenStream, setIsMaximized]);

  // --- Attach Media Streams to Video Elements ---
  useEffect(() => {
      if (localVideoRef.current && localVideoStream) localVideoRef.current.srcObject = localVideoStream;
  }, [localVideoStream, isMaximized]);

  useEffect(() => {
      if (localScreenRef.current && localScreenStream) localScreenRef.current.srcObject = localScreenStream;
  }, [localScreenStream, isMaximized]);

  useEffect(() => {
      if (remoteVideoRef.current && remoteStream) remoteVideoRef.current.srcObject = remoteStream;
  }, [remoteStream, isMaximized]);

  useEffect(() => {
      if (remoteScreenRef.current && remoteScreenStream) remoteScreenRef.current.srcObject = remoteScreenStream;
  }, [remoteScreenStream, isMaximized]);

  // --- Audio Handling ---
  useEffect(() => {
    if (remoteStream && callState === CallState.CONNECTED) {
        if (audioRef.current) {
            audioRef.current.srcObject = remoteStream;
            audioRef.current.play().catch(e => { console.warn("Autoplay:", e); setAutoplayBlocked(true); });
        }
        try {
            if (!outputCtxRef.current) {
                const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
                const ctx = new AudioContext();
                const source = ctx.createMediaStreamSource(remoteStream);
                const gainNode = ctx.createGain();
                source.connect(gainNode);
                gainNode.connect(ctx.destination);
                outputCtxRef.current = ctx;
                outputGainRef.current = gainNode;
                gainNode.gain.value = outputVolume;
            }
        } catch (e) { if (audioRef.current) audioRef.current.volume = 1.0; }
    } else {
        if (outputCtxRef.current) { outputCtxRef.current.close(); outputCtxRef.current = null; outputGainRef.current = null; }
    }
  }, [remoteStream, callState]);

  useEffect(() => {
      if (outputGainRef.current) outputGainRef.current.gain.value = isDeafened ? 0 : outputVolume;
      else if (audioRef.current) audioRef.current.volume = isDeafened ? 0 : Math.min(outputVolume, 1);
  }, [outputVolume, isDeafened]);

  useEffect(() => {
    let interval: number;
    if (callState === CallState.CONNECTED || callState === CallState.RECONNECTING) {
      interval = window.setInterval(() => setDuration(prev => prev + 1), 1000);
    } else {
      setDuration(0); setIsMaximized(false); setShowDebug(false); setIsDeafened(false); hasMaximizedForVideoRef.current = false;
    }
    return () => clearInterval(interval);
  }, [callState, setIsMaximized]);

  const handleToggleDeafen = () => { setIsDeafened(prev => !prev); if (toggleRemoteAudio) toggleRemoteAudio(); };
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };
  const handleManualPlay = () => { audioRef.current?.play().then(() => setAutoplayBlocked(false)).catch(console.error); };

  const renderAvatar = (size: 'small' | 'large') => {
      const sizeClasses = size === 'large' ? 'w-32 h-32 md:w-40 md:h-40' : 'w-9 h-9';
      const iconSize = size === 'large' ? 'w-12 h-12 md:w-16 md:h-16' : 'w-4 h-4';
      if (recipient?.avatar_url) return <img src={recipient.avatar_url} className={`${sizeClasses} rounded-full object-cover shadow-lg border border-white/10`} />;
      return (
        <div className={`${sizeClasses} bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-lg border-2 border-white/10`}>
            {size === 'large' ? <svg className={iconSize} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg> : <svg className={iconSize} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>}
        </div>
      );
  };

  const hasRemoteVideo = remoteStream && remoteStream.getVideoTracks().length > 0;
  const hasRemoteScreen = remoteScreenStream && remoteScreenStream.getVideoTracks().length > 0;
  const hasLocalVideo = localVideoStream && localVideoStream.getVideoTracks().length > 0;
  const hasLocalScreen = localScreenStream && localScreenStream.getVideoTracks().length > 0;

  // Determine Main View (Priority: Remote Screen -> Remote Cam -> Avatar)
  const isPresenterMode = hasRemoteScreen || hasLocalScreen;

  if (callState === CallState.IDLE) return null;

  return (
    <>
        <audio ref={audioRef} autoPlay playsInline controls={false} style={{ display: 'none' }} />

        {/* --- CONNECTING/INCOMING SCREENS (Keep existing logic) --- */}
        {(callState === CallState.OFFERING || callState === CallState.RECEIVING || callState === CallState.CONNECTING) && (
            <div className="fixed inset-0 h-[100dvh] w-screen bg-black/90 flex flex-col items-center justify-center z-[9999] backdrop-blur-md animate-fade-in touch-action-none overflow-hidden">
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[150vw] h-[150vw] bg-indigo-600/20 rounded-full blur-[100px] animate-pulse"></div>
                </div>
                <div className="relative z-10 flex flex-col items-center justify-between h-full py-12 w-full max-w-sm mx-auto px-6">
                    <div className="flex flex-col items-center justify-center flex-1 w-full">
                        <div className="mb-8 relative">
                            <div className="absolute inset-0 rounded-full border-4 border-indigo-500 animate-ping opacity-30"></div>
                            {renderAvatar('large')}
                        </div>
                        <div className="text-center mb-8">
                            <h3 className="text-3xl font-bold text-white mb-2 tracking-tight">
                            {callState === CallState.OFFERING && 'Calling...'}
                            {callState === CallState.RECEIVING && 'Incoming Call'}
                            {callState === CallState.CONNECTING && 'Connecting...'}
                            </h3>
                            <p className="text-indigo-300 font-medium animate-pulse text-lg mb-2">{recipient ? recipient.email : 'Unknown User'}</p>
                        </div>
                    </div>
                    <div className="flex items-center justify-center gap-12 pb-8 w-full">
                        {callState === CallState.RECEIVING ? (
                            <>
                                <button onClick={onEndCall} className="w-16 h-16 bg-red-500/20 hover:bg-red-500 text-red-500 hover:text-white rounded-full flex items-center justify-center border-2 border-red-500/50 transition-all"><svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
                                <button onClick={onAnswer} className="w-16 h-16 bg-green-500 hover:bg-green-400 text-white rounded-full flex items-center justify-center shadow-lg shadow-green-500/40 animate-bounce transition-all"><svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg></button>
                            </>
                        ) : (
                            <button onClick={onEndCall} className="w-16 h-16 bg-red-500 text-white rounded-full flex items-center justify-center transition-all hover:scale-105"><svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
                        )}
                    </div>
                </div>
            </div>
        )}

        {/* --- ACTIVE CALL OVERLAY --- */}
        {(callState === CallState.CONNECTED || callState === CallState.RECONNECTING) && (
            isMaximized ? (
                <div className="fixed inset-0 h-[100dvh] w-screen bg-[#080808] flex flex-col z-[9999] animate-fade-in overflow-hidden relative">
                    
                    {/* --- MAIN VIDEO LAYER --- */}
                    <div className="absolute inset-0 z-0">
                        {hasRemoteScreen ? (
                            // Remote Screen Share is Main
                            <video ref={remoteScreenRef} autoPlay playsInline className="w-full h-full object-contain bg-black" />
                        ) : hasLocalScreen ? (
                            // You are sharing - Show Preview or Placeholder
                            <div className="w-full h-full flex flex-col items-center justify-center bg-[#111]">
                                <video ref={localScreenRef} autoPlay playsInline muted className="max-w-[60%] rounded-xl border border-white/10 shadow-2xl opacity-50" />
                                <p className="mt-4 text-indigo-400 font-bold animate-pulse">You are sharing your screen</p>
                            </div>
                        ) : hasRemoteVideo ? (
                            // Remote Camera is Main
                            <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-cover" />
                        ) : (
                            // Avatar Fallback
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="relative z-10 mb-8 flex flex-col items-center">
                                    {renderAvatar('large')}
                                    <h2 className="text-3xl font-bold text-white mt-6 mb-2">{recipient ? recipient.email.split('@')[0] : 'Unknown'}</h2>
                                    <p className={`text-xl font-mono ${callState === CallState.RECONNECTING ? 'text-amber-400 animate-pulse' : 'text-indigo-300'}`}>
                                        {callState === CallState.RECONNECTING ? 'Connection Lost' : formatTime(duration)}
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* --- PICTURE-IN-PICTURE (PIP) CONTAINER --- */}
                    <div className="absolute top-24 right-6 flex flex-col gap-4 z-20 items-end pointer-events-none">
                        
                        {/* Remote Camera PiP (Only if screen is shared) */}
                        {isPresenterMode && hasRemoteVideo && (
                            <div className="w-32 h-48 md:w-48 md:h-72 bg-black rounded-2xl overflow-hidden shadow-2xl border border-white/10 animate-scale-in pointer-events-auto">
                                <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-cover" />
                                <div className="absolute bottom-1 left-2 text-[10px] font-bold text-white bg-black/50 px-1 rounded">Remote</div>
                            </div>
                        )}

                        {/* Local Camera PiP */}
                        {hasLocalVideo && (
                            <div className="w-32 h-48 md:w-48 md:h-72 bg-black rounded-2xl overflow-hidden shadow-2xl border border-white/10 animate-scale-in pointer-events-auto">
                                <video ref={localVideoRef} autoPlay playsInline muted className="w-full h-full object-cover transform scale-x-[-1]" />
                                <div className="absolute bottom-1 left-2 text-[10px] font-bold text-white bg-black/50 px-1 rounded">You</div>
                            </div>
                        )}
                    </div>

                    {/* --- HEADER CONTROLS --- */}
                    <div className="w-full flex justify-between items-center p-6 pt-safe-top z-20 absolute top-0 bg-gradient-to-b from-black/60 to-transparent pointer-events-none">
                        <button onClick={() => setIsMaximized(false)} className="pointer-events-auto p-2 bg-white/10 rounded-full text-white hover:bg-white/20 transition backdrop-blur-md shadow-lg">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                        </button>
                        <div className="flex flex-col items-center pointer-events-auto">
                            <span className={`text-xs font-bold uppercase tracking-widest flex items-center gap-2 ${callState === CallState.RECONNECTING ? 'text-amber-400' : 'text-green-400'}`}>
                                 <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${callState === CallState.RECONNECTING ? 'bg-amber-500' : 'bg-green-500'}`}></div> 
                                 {callState === CallState.RECONNECTING ? 'Reconnecting...' : (isPresenterMode ? 'Live Presentation' : 'Encrypted P2P')}
                            </span>
                        </div>
                        <button onClick={() => setShowDebug(!showDebug)} className={`pointer-events-auto p-2 rounded-full transition backdrop-blur-md ${showDebug ? 'bg-indigo-500 text-white' : 'bg-white/10 text-gray-400'}`}>
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>
                        </button>
                    </div>

                    {/* Debug Panel */}
                    {showDebug && rtcStats && (
                        <div className="absolute top-24 left-6 bg-black/80 backdrop-blur-md border border-white/10 rounded-xl p-4 w-64 text-xs font-mono text-green-400 shadow-2xl animate-fade-in-up z-30">
                            <div className="flex justify-between mb-1"><span>RTT:</span> <span>{rtcStats.rtt} ms</span></div>
                            <div className="flex justify-between mb-1"><span>Loss:</span> <span>{rtcStats.packetsLost} pkts</span></div>
                            <div className="flex justify-between mb-1 text-indigo-300"><span>Res:</span> <span>{rtcStats.resolution}</span></div>
                            <div className="flex justify-between mb-1 text-fuchsia-300"><span>FPS:</span> <span>{rtcStats.fps}</span></div>
                        </div>
                    )}

                    {/* --- BOTTOM CONTROLS --- */}
                    <div className="absolute bottom-0 left-0 right-0 bg-[#111]/80 backdrop-blur-xl p-8 pb-safe-bottom rounded-t-[2.5rem] border-t border-white/5 shadow-[0_-10px_40px_rgba(0,0,0,0.5)] flex items-center justify-evenly z-30">
                        <button onClick={toggleMute} className={`flex flex-col items-center gap-2 p-4 rounded-2xl transition-all w-16 md:w-20 ${isMuted ? 'bg-white text-black' : 'bg-[#222] text-white hover:bg-[#333]'}`}>
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isMuted ? "M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" : "M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"} /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isMuted ? "M3 3l18 18" : ""} /></svg>
                            <span className="text-[10px] font-bold uppercase">{isMuted ? 'Unmute' : 'Mute'}</span>
                        </button>
                        <button onClick={handleToggleDeafen} className={`flex flex-col items-center gap-2 p-4 rounded-2xl transition-all w-16 md:w-20 ${isDeafened ? 'bg-red-500 text-white' : 'bg-[#222] text-white hover:bg-[#333]'}`}>
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isDeafened ? "M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" : "M15.536 8.464a5 5 0 010 7.072"} /></svg>
                            <span className="text-[10px] font-bold uppercase">{isDeafened ? 'Undeafen' : 'Deafen'}</span>
                        </button>
                        {toggleVideo && (
                            <button onClick={toggleVideo} className={`flex flex-col items-center gap-2 p-4 rounded-2xl transition-all w-16 md:w-20 ${isVideoEnabled ? 'bg-white text-black' : 'bg-[#222] text-white hover:bg-[#333]'}`}>
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isVideoEnabled ? "M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" : "M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" } /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={!isVideoEnabled ? "M3 3l18 18" : ""} /></svg>
                                <span className="text-[10px] font-bold uppercase">{isVideoEnabled ? 'Cam' : 'Off'}</span>
                            </button>
                        )}
                        {toggleScreenShare && (
                            <button onClick={toggleScreenShare} className={`flex flex-col items-center gap-2 p-4 rounded-2xl transition-all w-16 md:w-20 hidden md:flex ${isScreenSharing ? 'bg-indigo-500 text-white' : 'bg-[#222] text-white hover:bg-[#333]'}`}>
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                                <span className="text-[10px] font-bold uppercase">{isScreenSharing ? 'Sharing' : 'Share'}</span>
                            </button>
                        )}
                        <button onClick={onEndCall} className="p-6 bg-red-500 hover:bg-red-600 rounded-full text-white shadow-xl shadow-red-500/20 active:scale-95 transition-transform">
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                    </div>
                </div>
            ) : (
                // --- COMPACT OVERLAY ---
                <div className="fixed top-0 left-0 right-0 h-[100dvh] w-screen pointer-events-none z-[9999] flex flex-col items-center justify-start pt-safe-top">
                    <div className="mt-20 md:mt-6 w-[95%] max-w-md pointer-events-auto animate-slide-up space-y-2">
                        {autoplayBlocked && (
                            <button onClick={handleManualPlay} className="w-full bg-amber-500 text-black text-sm font-bold px-4 py-2 rounded-full shadow-lg flex items-center justify-center gap-2 animate-bounce">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /></svg>
                                Tap to Hear Audio
                            </button>
                        )}
                        <div onClick={() => setIsMaximized(true)} className="bg-gray-800/95 backdrop-blur-xl border border-gray-600 rounded-full shadow-2xl p-2 px-4 flex items-center justify-between cursor-pointer active:scale-[0.98] transition-transform overflow-hidden relative">
                            <div className="absolute inset-0 bg-green-500/10 animate-pulse pointer-events-none"></div>
                            <div className="flex items-center space-x-3 min-w-0 relative z-10">
                                <div className="relative shrink-0">
                                    <div className={`w-2.5 h-2.5 rounded-full animate-pulse absolute -top-0.5 -right-0.5 border-2 border-gray-800 z-10 ${callState === CallState.RECONNECTING ? 'bg-amber-500' : 'bg-green-500'}`}></div>
                                    {renderAvatar('small')}
                                </div>
                                <div className="flex flex-col min-w-0">
                                    <span className="text-white text-sm font-bold leading-none mb-0.5 truncate">{recipient ? recipient.email.split('@')[0] : 'Connected'}</span>
                                    <div className="flex items-center gap-1.5">
                                        <span className={`text-[10px] font-mono bg-opacity-10 px-1 rounded ${callState === CallState.RECONNECTING ? 'text-amber-400 bg-amber-500' : 'text-indigo-300 bg-indigo-500'}`}>
                                            {callState === CallState.RECONNECTING ? 'Reconnecting...' : formatTime(duration)}
                                        </span>
                                        {(isVideoEnabled || isScreenSharing) && <span className="text-[10px] text-gray-400 bg-white/10 px-1 rounded">Video On</span>}
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center space-x-2 shrink-0 relative z-10">
                                <button onClick={(e) => { e.stopPropagation(); toggleMute && toggleMute(); }} className={`p-2.5 rounded-full transition-all duration-200 ${isMuted ? 'bg-white text-black hover:bg-gray-200' : 'bg-gray-700/50 text-gray-300 hover:bg-gray-600 hover:text-white'}`}>
                                    {isMuted ? <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3l18 18" /></svg> : <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>}
                                </button>
                                <button onClick={(e) => { e.stopPropagation(); onEndCall(); }} className="p-2.5 bg-red-500 hover:bg-red-600 text-white rounded-full transition-all duration-200 shadow-lg shadow-red-500/20 active:scale-95"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
                            </div>
                        </div>
                    </div>
                </div>
            )
        )}
    </>
  );
};