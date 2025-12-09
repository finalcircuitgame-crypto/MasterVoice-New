import React from 'react';
import { CallState } from '../types';

interface VoiceCallOverlayProps {
  callState: CallState;
  remoteStream: MediaStream | null;
  onEndCall: () => void;
  onAnswer?: () => void;
  toggleMute?: () => void;
  isMuted?: boolean;
}

export const VoiceCallOverlay: React.FC<VoiceCallOverlayProps> = ({
  callState,
  remoteStream,
  onEndCall,
  onAnswer,
  toggleMute,
  isMuted
}) => {
  const audioRef = React.useRef<HTMLAudioElement>(null);

  React.useEffect(() => {
    if (audioRef.current && remoteStream) {
      audioRef.current.srcObject = remoteStream;
      audioRef.current.play().catch(e => console.error("Auto-play failed", e));
    }
  }, [remoteStream]);

  if (callState === CallState.IDLE) return null;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 backdrop-blur-sm">
      <div className="bg-gray-800 p-8 rounded-3xl shadow-2xl flex flex-col items-center border border-gray-700 animate-fade-in w-full max-w-sm mx-4">
        
        {/* Avatar / Animation */}
        <div className="w-32 h-32 bg-gray-700 rounded-full flex items-center justify-center mb-8 relative">
             <div className={`absolute inset-0 rounded-full border-4 border-blue-500 ${callState === CallState.CONNECTED ? 'animate-ping opacity-20' : 'animate-pulse'}`}></div>
             <svg className="w-12 h-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
             </svg>
        </div>
        
        <h3 className="text-2xl font-bold text-white mb-2">
          {callState === CallState.OFFERING && 'Calling...'}
          {callState === CallState.RECEIVING && 'Incoming Call...'}
          {callState === CallState.CONNECTED && 'Connected'}
        </h3>
        
        <p className="text-gray-400 mb-10 text-sm">Secure WebRTC Voice Channel</p>

        <div className="flex items-center space-x-8">
            {/* INCOMING CALL ACTIONS */}
            {callState === CallState.RECEIVING && (
                <>
                    <button
                        onClick={onEndCall}
                        className="flex flex-col items-center gap-2 group"
                    >
                        <div className="bg-red-500 group-hover:bg-red-600 text-white rounded-full p-4 transition shadow-lg group-hover:scale-110">
                             <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </div>
                        <span className="text-xs text-gray-400">Decline</span>
                    </button>

                    <button
                        onClick={onAnswer}
                        className="flex flex-col items-center gap-2 group"
                    >
                         <div className="bg-green-500 group-hover:bg-green-600 text-white rounded-full p-4 transition shadow-lg group-hover:scale-110 animate-bounce">
                             <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                        </div>
                        <span className="text-xs text-gray-400">Accept</span>
                    </button>
                </>
            )}

            {/* ACTIVE CALL ACTIONS */}
            {callState === CallState.CONNECTED && (
                <>
                    <button
                        onClick={toggleMute}
                        className={`flex flex-col items-center gap-2 group`}
                    >
                         <div className={`rounded-full p-4 transition shadow-lg group-hover:scale-105 border ${isMuted ? 'bg-white text-black border-white' : 'bg-gray-700 text-white border-gray-600'}`}>
                             {isMuted ? (
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3l18 18" /></svg>
                             ) : (
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
                             )}
                        </div>
                        <span className="text-xs text-gray-400">{isMuted ? 'Unmute' : 'Mute'}</span>
                    </button>

                    <button
                        onClick={onEndCall}
                        className="flex flex-col items-center gap-2 group"
                    >
                         <div className="bg-red-500 group-hover:bg-red-600 text-white rounded-full p-4 transition shadow-lg group-hover:scale-105">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </div>
                        <span className="text-xs text-gray-400">End</span>
                    </button>
                </>
            )}

            {/* CALLING STATE ACTIONS */}
            {callState === CallState.OFFERING && (
                 <button
                    onClick={onEndCall}
                    className="flex flex-col items-center gap-2 group"
                >
                     <div className="bg-red-500 group-hover:bg-red-600 text-white rounded-full p-4 transition shadow-lg group-hover:scale-105">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </div>
                    <span className="text-xs text-gray-400">Cancel</span>
                </button>
            )}
        </div>
        
        {/* Hidden audio element for playback */}
        <audio ref={audioRef} autoPlay playsInline />
      </div>
    </div>
  );
};