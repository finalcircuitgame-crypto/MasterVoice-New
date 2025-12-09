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

  // --- CONNECTED STATE (Compact/Floating Mode) ---
  if (callState === CallState.CONNECTED) {
    return (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 animate-slide-up w-full max-w-md px-4 pointer-events-none">
            <div className="bg-gray-800/90 backdrop-blur-md border border-gray-600 rounded-full shadow-2xl p-2 px-4 flex items-center justify-between pointer-events-auto">
                <div className="flex items-center space-x-3">
                     <div className="relative">
                         <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse absolute top-0 right-0 border border-gray-800"></div>
                         <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                             V
                         </div>
                     </div>
                     <div className="flex flex-col">
                         <span className="text-white text-sm font-bold leading-none">Connected</span>
                         <span className="text-[10px] text-gray-400">HD Voice Active</span>
                     </div>
                </div>

                <div className="flex items-center space-x-2">
                    <button
                        onClick={toggleMute}
                        className={`p-2 rounded-full transition ${isMuted ? 'bg-white text-black hover:bg-gray-200' : 'bg-gray-700 text-gray-300 hover:bg-gray-600 hover:text-white'}`}
                        title={isMuted ? "Unmute" : "Mute"}
                    >
                         {isMuted ? (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3l18 18" /></svg>
                         ) : (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
                         )}
                    </button>

                    <button
                        onClick={onEndCall}
                        className="p-2 bg-red-500/90 hover:bg-red-600 text-white rounded-full transition shadow-lg shadow-red-500/20"
                        title="End Call"
                    >
                         <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>
                
                {/* Hidden Audio */}
                <audio ref={audioRef} autoPlay playsInline className="hidden" />
            </div>
        </div>
    );
  }

  // --- INCOMING / OFFERING STATE (Full Screen Overlay) ---
  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 backdrop-blur-md animate-fade-in">
      {/* Background Pulse Effect */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-600/20 rounded-full blur-[100px] animate-pulse"></div>
      </div>

      <div className="relative z-10 flex flex-col items-center max-w-sm w-full mx-4">
        
        {/* Large Avatar with Ring */}
        <div className="mb-8 relative">
             <div className="absolute inset-0 rounded-full border-4 border-indigo-500 animate-ping opacity-30"></div>
             <div className="absolute inset-0 rounded-full border-4 border-indigo-500 animate-pulse delay-75"></div>
             <div className="w-32 h-32 bg-gray-800 rounded-full flex items-center justify-center relative z-10 border-4 border-gray-700 shadow-2xl">
                 <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                 </svg>
             </div>
        </div>
        
        <h3 className="text-3xl font-bold text-white mb-2 text-center tracking-tight">
          {callState === CallState.OFFERING && 'Calling...'}
          {callState === CallState.RECEIVING && 'Incoming Call'}
        </h3>
        
        <p className="text-gray-400 mb-12 text-sm uppercase tracking-widest">Secure Audio Channel</p>

        <div className="flex items-center gap-10">
            {/* ACTIONS */}
            {callState === CallState.RECEIVING && (
                <>
                    <button
                        onClick={onEndCall}
                        className="group flex flex-col items-center gap-3"
                    >
                        <div className="w-16 h-16 bg-red-500/20 group-hover:bg-red-500 text-red-500 group-hover:text-white rounded-full flex items-center justify-center transition-all duration-300 border-2 border-red-500/50">
                             <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </div>
                        <span className="text-xs font-bold text-gray-500 group-hover:text-red-400 transition">DECLINE</span>
                    </button>

                    <button
                        onClick={onAnswer}
                        className="group flex flex-col items-center gap-3"
                    >
                         <div className="w-16 h-16 bg-green-500 group-hover:bg-green-400 text-white rounded-full flex items-center justify-center transition-all duration-300 shadow-lg shadow-green-500/30 animate-bounce">
                             <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                        </div>
                        <span className="text-xs font-bold text-gray-500 group-hover:text-green-400 transition">ACCEPT</span>
                    </button>
                </>
            )}

            {callState === CallState.OFFERING && (
                 <button
                    onClick={onEndCall}
                    className="group flex flex-col items-center gap-3"
                >
                     <div className="w-16 h-16 bg-red-500 text-white rounded-full flex items-center justify-center transition-all hover:scale-105 shadow-lg shadow-red-500/30">
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </div>
                    <span className="text-xs font-bold text-gray-500 group-hover:text-red-400 transition">CANCEL</span>
                </button>
            )}
        </div>
        
        {/* Hidden audio element for consistency in all states */}
        <audio ref={audioRef} autoPlay playsInline className="hidden" />
      </div>
    </div>
  );
};