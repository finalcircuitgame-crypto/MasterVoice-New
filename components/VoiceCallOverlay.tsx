import React, { useState, useEffect, useRef } from 'react';
import { CallState, UserProfile } from '../types';

interface VoiceCallOverlayProps {
  callState: CallState;
  remoteStream: MediaStream | null;
  onEndCall: () => void;
  onAnswer?: () => void;
  toggleMute?: () => void;
  isMuted?: boolean;
  recipient?: UserProfile;
  rtcStats?: any;
}

export const VoiceCallOverlay: React.FC<VoiceCallOverlayProps> = ({
  callState,
  remoteStream,
  onEndCall,
  onAnswer,
  toggleMute,
  isMuted,
  recipient,
  rtcStats
}) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [duration, setDuration] = useState(0);
  const [autoplayBlocked, setAutoplayBlocked] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [showDebug, setShowDebug] = useState(false);

  // --- AUDIO HANDLING ---
  // Ensure Audio Element always has the stream and plays
  useEffect(() => {
    if (audioRef.current && remoteStream) {
      console.log("[VoiceCallOverlay] Attaching remote stream to audio element", remoteStream.getTracks());
      
      // Explicitly set srcObject
      if (audioRef.current.srcObject !== remoteStream) {
        audioRef.current.srcObject = remoteStream;
      }
      
      const playAudio = async () => {
          try {
              await audioRef.current?.play();
              console.log("[VoiceCallOverlay] Audio playing successfully");
              setAutoplayBlocked(false);
          } catch (error) {
              console.warn("[VoiceCallOverlay] Autoplay blocked or failed:", error);
              setAutoplayBlocked(true);
          }
      };
      
      playAudio();
    }
  }, [remoteStream, callState]); // Re-check if callState changes (e.g. connected)

  // Timer Logic
  useEffect(() => {
    let interval: number;
    if (callState === CallState.CONNECTED || callState === CallState.RECONNECTING) {
      interval = window.setInterval(() => {
        setDuration(prev => prev + 1);
      }, 1000);
    } else {
      setDuration(0);
      setIsMaximized(false);
      setShowDebug(false);
    }
    return () => clearInterval(interval);
  }, [callState]);

  const handleManualPlay = () => {
      if (audioRef.current) {
          audioRef.current.play()
            .then(() => setAutoplayBlocked(false))
            .catch(e => console.error("Manual play failed", e));
      }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const renderAvatar = (size: 'small' | 'large') => {
      const sizeClasses = size === 'large' ? 'w-32 h-32 md:w-40 md:h-40' : 'w-9 h-9';
      const iconSize = size === 'large' ? 'w-12 h-12 md:w-16 md:h-16' : 'w-4 h-4';
      
      if (recipient?.avatar_url) {
          return <img src={recipient.avatar_url} className={`${sizeClasses} rounded-full object-cover shadow-lg border border-white/10`} />;
      }
      return (
        <div className={`${sizeClasses} bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-lg border-2 border-white/10`}>
            {size === 'large' ? (
                <svg className={iconSize} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
            ) : (
                <svg className={iconSize} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
            )}
        </div>
      );
  };

  if (callState === CallState.IDLE) return null;

  return (
    <>
        {/* Persistent Audio Element - outside conditional rendering to prevent unmounting */}
        <audio ref={audioRef} autoPlay playsInline controls={false} style={{ display: 'none' }} />

        {/* --- INCOMING / OFFERING STATE (Full Screen Overlay) --- */}
        {(callState === CallState.OFFERING || callState === CallState.RECEIVING) && (
            <div className="fixed inset-0 h-[100dvh] w-screen bg-black/90 flex flex-col items-center justify-center z-[9999] backdrop-blur-md animate-fade-in touch-action-none overflow-hidden">
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[150vw] h-[150vw] bg-indigo-600/20 rounded-full blur-[100px] animate-pulse"></div>
                </div>

                <div className="relative z-10 flex flex-col items-center justify-between h-full py-12 w-full max-w-sm mx-auto px-6">
                    <div className="flex flex-col items-center justify-center flex-1 w-full">
                        <div className="mb-8 relative">
                            <div className="absolute inset-0 rounded-full border-4 border-indigo-500 animate-ping opacity-30"></div>
                            <div className="absolute inset-0 rounded-full border-4 border-indigo-500 animate-pulse delay-75"></div>
                            {renderAvatar('large')}
                        </div>
                        
                        <div className="text-center mb-8">
                            <h3 className="text-3xl font-bold text-white mb-2 tracking-tight">
                            {callState === CallState.OFFERING && 'Calling...'}
                            {callState === CallState.RECEIVING && 'Incoming Call'}
                            </h3>
                            <p className="text-indigo-300 font-medium animate-pulse text-lg mb-2">
                                {recipient ? recipient.email : 'Unknown User'}
                            </p>
                            <p className="text-gray-500 font-mono text-xs">
                                {callState === CallState.OFFERING ? 'Establishing P2P Tunnel...' : 'Secure Audio Request'}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center justify-center gap-12 pb-8 w-full">
                        {callState === CallState.RECEIVING && (
                            <>
                                <button
                                    onClick={onEndCall}
                                    className="group flex flex-col items-center gap-3 active:scale-95 transition-transform"
                                >
                                    <div className="w-16 h-16 md:w-20 md:h-20 bg-red-500/20 group-hover:bg-red-500 text-red-500 group-hover:text-white rounded-full flex items-center justify-center transition-all duration-300 border-2 border-red-500/50 shadow-[0_0_20px_rgba(239,68,68,0.2)]">
                                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                    </div>
                                    <span className="text-xs font-bold text-gray-400 group-hover:text-red-400 transition tracking-wider">DECLINE</span>
                                </button>

                                <button
                                    onClick={onAnswer}
                                    className="group flex flex-col items-center gap-3 active:scale-95 transition-transform"
                                >
                                    <div className="w-16 h-16 md:w-20 md:h-20 bg-green-500 group-hover:bg-green-400 text-white rounded-full flex items-center justify-center transition-all duration-300 shadow-[0_0_30px_rgba(34,197,94,0.4)] animate-bounce">
                                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                                    </div>
                                    <span className="text-xs font-bold text-gray-400 group-hover:text-green-400 transition tracking-wider">ACCEPT</span>
                                </button>
                            </>
                        )}

                        {callState === CallState.OFFERING && (
                            <button
                                onClick={onEndCall}
                                className="group flex flex-col items-center gap-3 active:scale-95 transition-transform"
                            >
                                <div className="w-16 h-16 md:w-20 md:h-20 bg-red-500 text-white rounded-full flex items-center justify-center transition-all hover:scale-105 shadow-[0_0_30px_rgba(239,68,68,0.4)]">
                                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                </div>
                                <span className="text-xs font-bold text-gray-500 group-hover:text-red-400 transition tracking-wider">CANCEL</span>
                            </button>
                        )}
                    </div>
                </div>
            </div>
        )}

        {/* --- CONNECTED / RECONNECTING STATE --- */}
        {(callState === CallState.CONNECTED || callState === CallState.RECONNECTING) && (
            isMaximized ? (
                // FULLSCREEN CONNECTED VIEW
                <div className="fixed inset-0 h-[100dvh] w-screen bg-[#080808] flex flex-col items-center z-[9999] animate-fade-in overflow-hidden">
                    {/* Header */}
                    <div className="w-full flex justify-between items-center p-6 pt-safe-top z-20">
                        <button onClick={() => setIsMaximized(false)} className="p-2 bg-white/10 rounded-full text-white hover:bg-white/20 transition">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                        </button>
                        <div className="flex flex-col items-center">
                            <span className={`text-xs font-bold uppercase tracking-widest flex items-center gap-2 ${callState === CallState.RECONNECTING ? 'text-amber-400' : 'text-green-400'}`}>
                                 <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${callState === CallState.RECONNECTING ? 'bg-amber-500' : 'bg-green-500'}`}></div> 
                                 {callState === CallState.RECONNECTING ? 'Reconnecting...' : 'Encrypted P2P'}
                            </span>
                        </div>
                        <button onClick={() => setShowDebug(!showDebug)} className={`p-2 rounded-full transition ${showDebug ? 'bg-indigo-500 text-white' : 'bg-white/10 text-gray-400'}`}>
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>
                        </button>
                    </div>

                    {/* Main Content */}
                    <div className="flex-1 w-full flex flex-col items-center justify-center relative">
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-30">
                            <div className={`w-[300px] h-[300px] border rounded-full animate-ping ${callState === CallState.RECONNECTING ? 'border-amber-500/30' : 'border-indigo-500/30'}`} style={{ animationDuration: '3s' }}></div>
                            <div className={`absolute w-[400px] h-[400px] border rounded-full animate-ping ${callState === CallState.RECONNECTING ? 'border-amber-500/20' : 'border-indigo-500/20'}`} style={{ animationDuration: '3s', animationDelay: '1s' }}></div>
                        </div>

                        <div className="relative z-10 mb-8">
                            {renderAvatar('large')}
                        </div>
                        <h2 className="text-3xl font-bold text-white mb-2">{recipient ? recipient.email.split('@')[0] : 'Unknown'}</h2>
                        <p className={`text-xl font-mono ${callState === CallState.RECONNECTING ? 'text-amber-400 animate-pulse' : 'text-indigo-300'}`}>
                            {callState === CallState.RECONNECTING ? 'Connection Lost' : formatTime(duration)}
                        </p>
                        {callState === CallState.RECONNECTING && <p className="text-xs text-gray-500 mt-2">Waiting for peer...</p>}


                        {/* Debug Stats Overlay */}
                        {showDebug && rtcStats && (
                            <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-black/80 backdrop-blur-md border border-white/10 rounded-xl p-4 w-64 text-xs font-mono text-green-400 shadow-2xl animate-fade-in-up z-30">
                                <div className="flex justify-between mb-1"><span>RTT:</span> <span>{rtcStats.rtt} ms</span></div>
                                <div className="flex justify-between mb-1"><span>Jitter:</span> <span>{rtcStats.jitter} ms</span></div>
                                <div className="flex justify-between mb-1"><span>Loss:</span> <span>{rtcStats.packetsLost} pkts</span></div>
                                <div className="flex justify-between mb-1"><span>Sent:</span> <span>{(rtcStats.bytesSent / 1024).toFixed(0)} KB</span></div>
                                <div className="flex justify-between mb-1"><span>Recv:</span> <span>{(rtcStats.bytesReceived / 1024).toFixed(0)} KB</span></div>
                                <div className="flex justify-between border-t border-white/10 pt-1 mt-1 text-gray-400"><span>Codec:</span> <span className="uppercase">{rtcStats.codec}</span></div>
                            </div>
                        )}
                    </div>

                    {/* Bottom Controls */}
                    <div className="w-full bg-[#111] p-8 pb-safe-bottom rounded-t-[2.5rem] border-t border-white/5 shadow-[0_-10px_40px_rgba(0,0,0,0.5)] flex items-center justify-evenly">
                        <button 
                            onClick={toggleMute}
                            className={`flex flex-col items-center gap-2 p-4 rounded-2xl transition-all w-20 ${isMuted ? 'bg-white text-black' : 'bg-[#222] text-white hover:bg-[#333]'}`}
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isMuted ? "M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" : "M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"} /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isMuted ? "M3 3l18 18" : ""} /></svg>
                            <span className="text-[10px] font-bold uppercase">{isMuted ? 'Unmute' : 'Mute'}</span>
                        </button>

                        <button 
                            onClick={onEndCall}
                            className="p-6 bg-red-500 hover:bg-red-600 rounded-full text-white shadow-xl shadow-red-500/20 active:scale-95 transition-transform"
                        >
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>

                        <button 
                            onClick={() => setIsMaximized(false)}
                            className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-[#222] text-white hover:bg-[#333] transition-all w-20"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                            <span className="text-[10px] font-bold uppercase">Minimize</span>
                        </button>
                    </div>
                </div>
            ) : (
                // COMPACT / FLOATING MODE
                <div className="fixed top-0 left-0 right-0 h-[100dvh] w-screen pointer-events-none z-[9999] flex flex-col items-center justify-start pt-safe-top">
                    <div className="mt-20 md:mt-6 w-[95%] max-w-md pointer-events-auto animate-slide-up space-y-2">
                        {autoplayBlocked && (
                            <button 
                                onClick={handleManualPlay}
                                className="w-full bg-amber-500 text-black text-sm font-bold px-4 py-2 rounded-full shadow-lg flex items-center justify-center gap-2 animate-bounce"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /></svg>
                                Tap to Hear Audio
                            </button>
                        )}

                        <div 
                            onClick={() => setIsMaximized(true)}
                            className="bg-gray-800/95 backdrop-blur-xl border border-gray-600 rounded-full shadow-2xl p-2 px-4 flex items-center justify-between cursor-pointer active:scale-[0.98] transition-transform"
                        >
                            <div className="flex items-center space-x-3 min-w-0">
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
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center space-x-2 shrink-0">
                                <button
                                    onClick={(e) => { e.stopPropagation(); toggleMute && toggleMute(); }}
                                    className={`p-2.5 rounded-full transition-all duration-200 ${isMuted ? 'bg-white text-black hover:bg-gray-200' : 'bg-gray-700/50 text-gray-300 hover:bg-gray-600 hover:text-white'}`}
                                >
                                    {isMuted ? (
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3l18 18" /></svg>
                                    ) : (
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
                                    )}
                                </button>

                                <button
                                    onClick={(e) => { e.stopPropagation(); onEndCall(); }}
                                    className="p-2.5 bg-red-500 hover:bg-red-600 text-white rounded-full transition-all duration-200 shadow-lg shadow-red-500/20 active:scale-95"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )
        )}
    </>
  );
};