import React, { useState } from 'react';
import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '../firebase';
import { handleFirestoreError, OperationType } from '../lib/firebase-utils';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, ShieldAlert, Loader2 } from 'lucide-react';
import { useAuth } from '../AuthContext';

export default function Login() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { user } = useAuth();

  // Redirect if already logged in
  React.useEffect(() => {
    if (user) navigate('/');
  }, [user, navigate]);

  const handleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      await signInWithPopup(auth, googleProvider);
      navigate('/');
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center relative overflow-hidden px-4">
      <div className="grain-overlay opacity-30"></div>
      
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="relative z-10 glass-panel p-10 md:p-16 rounded-2xl w-full max-w-md flex flex-col items-center text-center">
        <ShieldCheck className="w-16 h-16 text-primary mb-8" />
        <h1 className="text-3xl font-black text-white uppercase tracking-tighter mb-2">ValidCore</h1>
        <p className="text-slate-400 text-sm font-mono tracking-widest mb-10">Access Restricted</p>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-lg flex items-center gap-3 mb-8 w-full text-left">
            <ShieldAlert className="w-5 h-5 flex-shrink-0" />
            <div className="text-xs font-bold leading-relaxed">{error}</div>
          </div>
        )}

        <button 
          onClick={handleLogin}
          disabled={loading}
          className="w-full bg-white text-slate-950 py-4 font-black uppercase tracking-widest text-[12px] hover:bg-slate-200 transition-colors flex items-center justify-center gap-3 relative disabled:opacity-50"
        >
          {loading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <>
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Authenticate with Google
            </>
          )}
        </button>
      </div>
    </div>
  );
}
