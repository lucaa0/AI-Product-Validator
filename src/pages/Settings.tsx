import React from 'react';
import { useAuth } from '../AuthContext';
import { auth } from '../firebase';
import { Link, useNavigate } from 'react-router-dom';
import { ShieldCheck, LogOut, User, Settings as SettingsIcon } from 'lucide-react';

export default function Settings() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await auth.signOut();
    navigate('/');
  };

  return (
    <>
      <nav className="fixed top-0 w-full z-50 bg-slate-950/60 backdrop-blur-xl border-b border-white/10 shrink-0 p-4">
        <div className="flex justify-between items-center mx-auto max-w-7xl">
          <Link to="/" className="flex items-center gap-2">
            <ShieldCheck className="text-primary w-8 h-8 fill-primary/20" />
            <span className="text-2xl font-black tracking-tighter text-white uppercase">ValidCore</span>
          </Link>
          <Link to="/" className="flex items-center gap-2 text-slate-400 hover:text-white font-bold uppercase text-[11px] tracking-widest transition-colors">
            Return to Lab
          </Link>
        </div>
      </nav>

      <main className="flex-1 bg-surface-container-lowest min-h-screen pt-32 pb-32">
        <div className="max-w-2xl mx-auto px-8">
          <header className="mb-12 flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-surface-container-high border border-white/10 flex items-center justify-center">
              <SettingsIcon className="w-6 h-6 text-slate-400" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-white tracking-tight">System Configuration</h1>
              <p className="text-slate-500 font-mono text-sm tracking-widest uppercase mt-1">Operator Profile</p>
            </div>
          </header>

          <div className="glass-panel p-8 rounded-xl border border-white/5 space-y-8">
            <div>
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2 mb-4">
                <User className="w-4 h-4" /> Identity Protocol
              </h3>
              <div className="flex items-center gap-4 bg-surface-container-lowest p-4 rounded-lg border border-white/5">
                {user?.photoURL ? (
                  <img src={user.photoURL} alt="Avatar" className="w-12 h-12 rounded-full border-2 border-primary/20" />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-surface-container-high flex items-center justify-center text-white font-bold">
                    {user?.email?.[0].toUpperCase() || 'U'}
                  </div>
                )}
                <div>
                  <div className="text-white font-bold">{user?.displayName || 'Unknown Operator'}</div>
                  <div className="text-sm font-mono text-slate-400">{user?.email}</div>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-white/5">
               <button onClick={handleLogout} className="flex items-center gap-2 text-red-400 hover:text-red-300 transition-colors font-bold uppercase tracking-widest text-[11px] py-2">
                 <LogOut className="w-4 h-4" /> Terminate Session
               </button>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
