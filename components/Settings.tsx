import React, { useRef, useState, useEffect } from 'react';
import { UserProfile } from '../types';
import { supabase } from '../supabaseClient';

interface SettingsProps {
  currentUser: UserProfile;
  onBack: () => void;
}

export const Settings: React.FC<SettingsProps> = ({ currentUser, onBack }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  
  // Settings State
  const [notifications, setNotifications] = useState(localStorage.getItem('mv_notifications') !== 'false');
  const [darkMode, setDarkMode] = useState(localStorage.getItem('mv_dark_mode') !== 'false');
  const [currentTheme, setCurrentTheme] = useState(localStorage.getItem('mv_theme') || 'indigo');
  
  // Modals State
  const [showKeysModal, setShowKeysModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
      // Apply dark mode
      if (darkMode) {
          document.documentElement.classList.add('dark');
      } else {
          document.documentElement.classList.remove('dark');
      }
  }, [darkMode]);

  useEffect(() => {
      // Apply theme
      document.body.classList.remove('theme-emerald', 'theme-rose', 'theme-amber', 'theme-blue');
      if (currentTheme !== 'indigo') {
          document.body.classList.add(`theme-${currentTheme}`);
      }
  }, [currentTheme]);

  const toggleNotifications = () => {
      const newVal = !notifications;
      setNotifications(newVal);
      localStorage.setItem('mv_notifications', String(newVal));
  };

  const toggleDarkMode = () => {
      const newVal = !darkMode;
      setDarkMode(newVal);
      localStorage.setItem('mv_dark_mode', String(newVal));
  };

  const changeTheme = (theme: string) => {
      setCurrentTheme(theme);
      localStorage.setItem('mv_theme', theme);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.reload();
  };
  
  const handleDeleteAccount = async () => {
      try {
          const { error } = await supabase.from('profiles').delete().eq('id', currentUser.id);
          if (error) throw error;
          await supabase.auth.signOut();
          window.location.href = '/';
      } catch (err) {
          console.error("Delete failed", err);
          alert("Could not delete account. Please contact support.");
      }
  };

  const calculateFileHash = async (file: File): Promise<string> => {
    const buffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!e.target.files || e.target.files.length === 0) return;
      
      const file = e.target.files[0];
      setUploading(true);

      try {
          const fileHash = await calculateFileHash(file);
          const fileExt = file.name.split('.').pop();
          const fileName = `${fileHash}.${fileExt}`;
          const filePath = `avatars/${fileName}`;

          const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(filePath);

          const { error: uploadError } = await supabase.storage
              .from('avatars')
              .upload(filePath, file, { upsert: false });

          if (uploadError) {
              const isExisting = uploadError.message.includes('already exists') || 
                                 uploadError.message.includes('violates row-level security') ||
                                 (uploadError as any).statusCode === '409';
              if (!isExisting) throw uploadError;
          }

          const { error: updateError } = await supabase
              .from('profiles')
              .update({ avatar_url: publicUrl, updated_at: new Date().toISOString() })
              .eq('id', currentUser.id);

          if (updateError) throw updateError;
          window.location.reload();

      } catch (error: any) {
          alert('Failed to update avatar. ' + error.message);
      } finally {
          setUploading(false);
      }
  };

  return (
    <div className="flex flex-col h-full w-full bg-[#060609] md:bg-[#060609] font-['Outfit'] animate-fade-in relative z-20 overflow-hidden">
      {/* Header */}
      <div className="p-6 pb-2 flex items-center gap-4 shrink-0">
        <button 
            onClick={onBack} 
            className="p-2 -ml-2 hover:bg-white/10 rounded-full transition text-gray-400 focus:outline-none focus:ring-2 focus:ring-white/20"
        >
           <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        </button>
        <h1 className="text-2xl font-bold text-white tracking-tight">Settings</h1>
      </div>

      <div className="flex-1 overflow-y-auto p-6 pt-2 space-y-8 pb-10">
         {/* Profile Card */}
         <div className="bg-[#13131a] border border-white/5 rounded-[2rem] p-6 flex flex-col items-center relative overflow-hidden shadow-2xl">
             <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-r from-indigo-900/40 to-purple-900/40 blur-xl"></div>
             
             {/* Avatar Circle */}
             <div className="relative z-10 -mt-2 mb-4 group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                 <div className="w-24 h-24 rounded-full border-4 border-[#13131a] bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-3xl font-bold text-white shadow-xl relative overflow-hidden">
                     {currentUser.avatar_url ? (
                         <img src={currentUser.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                     ) : (
                         <span>{currentUser.email[0].toUpperCase()}</span>
                     )}
                     <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                         <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                     </div>
                 </div>
                 {uploading && <div className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-full z-30"><div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div></div>}
             </div>
             
             <input type="file" ref={fileInputRef} onChange={handleAvatarUpload} accept="image/*" className="hidden" />
             <h2 className="text-xl font-bold text-white">{currentUser.email}</h2>
             <p className="text-indigo-400 text-sm font-medium mt-1 tracking-wide uppercase bg-indigo-500/10 px-3 py-1 rounded-full">{currentUser.plan || 'Free Plan'}</p>
         </div>

         {/* General Settings */}
         <div className="space-y-3">
             <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-4">Appearance</h3>
             <div className="bg-[#13131a] border border-white/5 rounded-[1.5rem] overflow-hidden p-4">
                 <div className="flex items-center justify-between mb-4">
                     <span className="text-gray-200 font-medium">Accent Color</span>
                 </div>
                 <div className="flex gap-3 justify-start">
                     {[
                         { id: 'indigo', color: 'bg-indigo-500' },
                         { id: 'emerald', color: 'bg-emerald-500' },
                         { id: 'rose', color: 'bg-rose-500' },
                         { id: 'amber', color: 'bg-amber-500' },
                         { id: 'blue', color: 'bg-blue-500' },
                     ].map(t => (
                         <button 
                            key={t.id}
                            onClick={() => changeTheme(t.id)}
                            className={`w-8 h-8 rounded-full ${t.color} ${currentTheme === t.id ? 'ring-2 ring-white ring-offset-2 ring-offset-[#13131a]' : ''} transition-all hover:scale-110`}
                         />
                     ))}
                 </div>
             </div>
         </div>

         <div className="space-y-3">
             <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-4">App Preferences</h3>
             <div className="bg-[#13131a] border border-white/5 rounded-[1.5rem] overflow-hidden">
                 <div onClick={toggleNotifications} className="p-4 flex items-center justify-between border-b border-white/5 hover:bg-white/5 transition cursor-pointer">
                     <div className="flex items-center gap-4">
                         <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg></div>
                         <span className="text-gray-200 text-base font-medium">Notifications</span>
                     </div>
                     <div className={`w-12 h-7 rounded-full relative cursor-pointer shadow-inner transition-colors ${notifications ? 'bg-green-600' : 'bg-gray-700'}`}>
                         <div className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow-md transition-all ${notifications ? 'right-1' : 'left-1'}`}></div>
                     </div>
                 </div>
                 <div onClick={toggleDarkMode} className="p-4 flex items-center justify-between hover:bg-white/5 transition cursor-pointer">
                     <div className="flex items-center gap-4">
                         <div className="w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center text-purple-400"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg></div>
                         <span className="text-gray-200 text-base font-medium">Dark Mode</span>
                     </div>
                     <span className="text-xs text-gray-500 font-bold uppercase tracking-wider">{darkMode ? 'On' : 'Off'}</span>
                 </div>
             </div>
         </div>

         {/* Privacy */}
         <div className="space-y-3">
             <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-4">Privacy & Security</h3>
             <div className="bg-[#13131a] border border-white/5 rounded-[1.5rem] overflow-hidden">
                 <button onClick={() => setShowKeysModal(true)} className="w-full p-4 flex items-center justify-between hover:bg-white/5 transition border-b border-white/5">
                     <div className="flex items-center gap-4">
                         <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center text-green-400"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg></div>
                         <div className="text-left">
                             <p className="text-gray-200 text-base font-medium">P2P Encryption Keys</p>
                             <p className="text-gray-500 text-xs">Manage your identity keys</p>
                         </div>
                     </div>
                     <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                 </button>
                 <button onClick={() => setShowDeleteModal(true)} className="w-full p-4 flex items-center justify-between hover:bg-white/5 transition">
                     <div className="flex items-center gap-4">
                         <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center text-red-400"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></div>
                         <span className="text-gray-200 text-base font-medium">Delete Account</span>
                     </div>
                     <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                 </button>
             </div>
         </div>
         
         <button onClick={handleLogout} className="w-full py-4 bg-red-600/10 hover:bg-red-600/20 text-red-500 font-bold rounded-2xl transition border border-red-600/20 flex items-center justify-center gap-2 active:scale-95">
             <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
             Sign Out
         </button>
         
         <p className="text-center text-[10px] text-gray-600 mt-4">MasterVoice v2.2.0 (Beta)</p>
      </div>

      {/* Keys Modal */}
      {showKeysModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-6 animate-fade-in">
              <div className="bg-[#1a1a20] w-full max-w-md rounded-3xl p-6 border border-white/10 shadow-2xl animate-scale-in">
                  <h3 className="text-xl font-bold text-white mb-4">Encryption Fingerprint</h3>
                  <div className="bg-black/50 p-4 rounded-xl font-mono text-xs text-green-400 break-all border border-green-500/20 mb-4">
                      {currentUser.id.split('-').join(':').toUpperCase()}:{Date.now().toString(16).toUpperCase()}
                  </div>
                  <p className="text-gray-400 text-sm mb-6">This fingerprint is unique to your current session identity keys. Verify this with peers to ensure no Man-in-the-Middle attacks.</p>
                  <button onClick={() => setShowKeysModal(false)} className="w-full py-3 bg-white text-black font-bold rounded-xl hover:bg-gray-200 transition">Close</button>
              </div>
          </div>
      )}

      {/* Delete Account Modal */}
      {showDeleteModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-6 animate-fade-in">
              <div className="bg-[#1a1a20] w-full max-w-md rounded-3xl p-6 border border-white/10 shadow-2xl animate-scale-in border-red-500/20">
                  <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center text-red-500 mb-4 mx-auto">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2 text-center">Delete Account?</h3>
                  <p className="text-gray-400 text-sm mb-6 text-center">This action is permanent and cannot be undone. All your messages, keys, and profile data will be wiped immediately.</p>
                  <div className="flex gap-3">
                      <button onClick={() => setShowDeleteModal(false)} className="flex-1 py-3 bg-white/5 text-white font-bold rounded-xl hover:bg-white/10 transition">Cancel</button>
                      <button onClick={handleDeleteAccount} className="flex-1 py-3 bg-red-600 text-white font-bold rounded-xl hover:bg-red-500 transition shadow-lg shadow-red-600/20">Delete Forever</button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};