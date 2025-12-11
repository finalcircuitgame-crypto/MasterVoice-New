import React, { createContext, useContext, useState, useCallback, useRef } from 'react';

type ModalType = 'alert' | 'confirm' | 'prompt';

interface ModalState {
  isOpen: boolean;
  type: ModalType;
  title: string;
  message: string;
  placeholder?: string;
  confirmText?: string;
  cancelText?: string;
}

interface ModalContextType {
  showAlert: (title: string, message: string) => Promise<void>;
  showConfirm: (title: string, message: string, confirmText?: string, cancelText?: string) => Promise<boolean>;
  showPrompt: (title: string, message: string, placeholder?: string) => Promise<string | null>;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export const useModal = () => {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error('useModal must be used within a ModalProvider');
  }
  return context;
};

export const ModalProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<ModalState>({
    isOpen: false,
    type: 'alert',
    title: '',
    message: ''
  });
  
  const [inputValue, setInputValue] = useState('');
  const resolveRef = useRef<((value: any) => void) | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setState(prev => ({ ...prev, isOpen: false }));
    setInputValue('');
    resolveRef.current = null;
  };

  const showAlert = useCallback((title: string, message: string): Promise<void> => {
    return new Promise((resolve) => {
      setState({ isOpen: true, type: 'alert', title, message });
      resolveRef.current = () => {
        resolve();
        reset();
      };
    });
  }, []);

  const showConfirm = useCallback((title: string, message: string, confirmText = 'Confirm', cancelText = 'Cancel'): Promise<boolean> => {
    return new Promise((resolve) => {
      setState({ isOpen: true, type: 'confirm', title, message, confirmText, cancelText });
      resolveRef.current = (result: boolean) => {
        resolve(result);
        reset();
      };
    });
  }, []);

  const showPrompt = useCallback((title: string, message: string, placeholder = ''): Promise<string | null> => {
    return new Promise((resolve) => {
      setInputValue('');
      setState({ isOpen: true, type: 'prompt', title, message, placeholder });
      resolveRef.current = (result: string | null) => {
        resolve(result);
        reset();
      };
      // Focus input on next render
      setTimeout(() => inputRef.current?.focus(), 50);
    });
  }, []);

  const handleConfirm = () => {
    if (state.type === 'prompt') {
      resolveRef.current?.(inputValue);
    } else if (state.type === 'confirm') {
      resolveRef.current?.(true);
    } else {
      resolveRef.current?.(undefined);
    }
  };

  const handleCancel = () => {
    if (state.type === 'prompt') {
      resolveRef.current?.(null);
    } else {
      resolveRef.current?.(false);
    }
  };

  return (
    <ModalContext.Provider value={{ showAlert, showConfirm, showPrompt }}>
      {children}
      {state.isOpen && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#1a1a20] border border-white/10 rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden animate-scale-in flex flex-col">
            
            {/* Header */}
            <div className="p-6 pb-2">
                <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-4 border border-white/5 shadow-inner">
                    {state.type === 'alert' && <svg className="w-6 h-6 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                    {state.type === 'confirm' && <svg className="w-6 h-6 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                    {state.type === 'prompt' && <svg className="w-6 h-6 text-fuchsia-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>}
                </div>
                <h3 className="text-xl font-bold text-white mb-2">{state.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{state.message}</p>
            </div>

            {/* Input for Prompt */}
            {state.type === 'prompt' && (
                <div className="px-6 pb-2">
                    <input
                        ref={inputRef}
                        type="text"
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                        placeholder={state.placeholder}
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleConfirm()}
                    />
                </div>
            )}

            {/* Actions */}
            <div className="p-6 pt-4 flex gap-3">
                {state.type !== 'alert' && (
                    <button 
                        onClick={handleCancel}
                        className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-gray-300 font-semibold rounded-xl transition text-sm"
                    >
                        {state.cancelText || 'Cancel'}
                    </button>
                )}
                <button 
                    onClick={handleConfirm}
                    className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition shadow-lg shadow-indigo-600/20 text-sm"
                >
                    {state.confirmText || 'OK'}
                </button>
            </div>
          </div>
        </div>
      )}
    </ModalContext.Provider>
  );
};
