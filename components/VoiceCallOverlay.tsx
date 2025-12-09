import React from 'react';
import { CallState } from '../types';

interface VoiceCallOverlayProps {
  callState: CallState;
  remoteStream: MediaStream | null;
  onEndCall: () => void;
  onAnswer?: () => void; // Automatically answered in our hook logic currently for simplicity, but could be manual
}

export const VoiceCallOverlay: React.FC<VoiceCallOverlayProps> = ({
  callState,
  remoteStream,
  onEndCall,
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
      <div className="bg-gray-800 p-8 rounded-2xl shadow-2xl flex flex-col items-center border border-gray-700 animate-fade-in">
        <div className="w-24 h-24 bg-gray-700 rounded-full flex items-center justify-center mb-6 relative">
             {/* Pulse animation */}
             <div className={`absolute inset-0 rounded-full border-4 border-blue-500 ${callState === CallState.CONNECTED ? 'animate-ping opacity-20' : ''}`}></div>
             <svg className="w-10 h-10 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
             </svg>
        </div>
        
        <h3 className="text-xl font-bold text-white mb-2">
          {callState === CallState.OFFERING && 'Calling...'}
          {callState === CallState.RECEIVING && 'Incoming Call...'}
          {callState === CallState.CONNECTED && 'Connected'}
        </h3>
        
        <p className="text-gray-400 mb-8 text-sm">WebRTC Voice Channel</p>

        <div className="flex space-x-4">
          <button
            onClick={onEndCall}
            className="bg-red-500 hover:bg-red-600 text-white rounded-full p-4 transition shadow-lg hover:scale-105"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        {/* Hidden audio element for playback */}
        <audio ref={audioRef} autoPlay playsInline />
      </div>
    </div>
  );
};