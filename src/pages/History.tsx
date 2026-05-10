import React, { useEffect, useState } from 'react';
import { collection, query, where, getDocs, doc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { handleFirestoreError, OperationType } from '../lib/firebase-utils';
import { AnalysisDocument } from '../types';
import { useAuth } from '../AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { ShieldCheck, History as HistoryIcon, ArrowRight, Activity, CalendarDays, Trash2 } from 'lucide-react';

export default function History() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [history, setHistory] = useState<(AnalysisDocument & { id: string })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchHistory() {
      if (!user) return;
      try {
        const q = query(
          collection(db, 'results'),
          where('userId', '==', user.uid)
        );
        const snapshot = await getDocs(q);
        const docs = snapshot.docs.map(doc => ({
          ...doc.data(),
          id: doc.id
        })) as (AnalysisDocument & { id: string })[];
        
        docs.sort((a, b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0));
        setHistory(docs);
      } catch (err) {
        handleFirestoreError(err, OperationType.GET, 'results');
      } finally {
        setLoading(false);
      }
    }
    fetchHistory();
  }, [user]);

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await deleteDoc(doc(db, 'results', id));
      setHistory(prev => prev.filter(item => item.id !== id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `results/${id}`);
    }
  };

  const getGradeColor = (grade: string | undefined) => {
    if (!grade) return 'text-white bg-white/10';
    if (grade.startsWith('A')) return 'text-teal-400 bg-teal-400/10';
    if (grade.startsWith('B')) return 'text-blue-400 bg-blue-400/10';
    if (grade.startsWith('C')) return 'text-yellow-400 bg-yellow-400/10';
    return 'text-red-400 bg-red-400/10';
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
        <div className="max-w-4xl mx-auto px-8">
          <header className="mb-12 flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
              <HistoryIcon className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-white tracking-tight">Analysis Registry</h1>
              <p className="text-slate-500 font-mono text-sm tracking-widest uppercase mt-1">Historic Validation Runs</p>
            </div>
          </header>

          {loading ? (
             <div className="flex justify-center p-12">
               <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
             </div>
          ) : history.length === 0 ? (
            <div className="glass-panel p-12 text-center rounded-xl border-white/5">
              <Activity className="w-12 h-12 text-slate-600 mx-auto mb-4" />
              <h3 className="text-white font-bold text-lg mb-2">No data active</h3>
              <p className="text-slate-400 mb-6 font-inter">You have no recorded validation runs in the registry.</p>
              <Link to="/" className="bg-primary text-on-primary px-6 py-3 font-bold uppercase text-[11px] tracking-widest rounded-none inline-flex items-center gap-2 hover:scale-105 transition-transform">
                Initiate Scan <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {history.map(run => (
                <div key={run.id} onClick={() => navigate(`/results/${run.id}`)} className="block group cursor-pointer">
                  <div className="glass-panel p-6 rounded-xl border border-white/5 hover:border-primary/50 transition-all duration-300 flex flex-col md:flex-row md:items-center justify-between gap-6 group-hover:bg-surface-container-high/50">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className={`w-8 h-8 rounded shrink-0 flex items-center justify-center font-black ${getGradeColor(run.product?.grade)}`}>
                          {run.product?.grade || '?'}
                        </div>
                        <h3 className="text-xl font-black text-white group-hover:text-primary transition-colors">{run.productName}</h3>
                      </div>
                      <div className="text-sm font-mono text-slate-500 tracking-widest uppercase pl-11">{run.category}</div>
                    </div>
                    
                    <div className="flex items-center gap-8 md:gap-12 pl-11 md:pl-0 border-l-2 border-white/5 md:border-none">
                      <div>
                        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Overall</div>
                        <div className="text-2xl font-black text-white">{run.product?.overallScore || (run as any).overall || 'N/A'}</div>
                      </div>
                      <div>
                        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Date</div>
                        <div className="text-sm font-mono text-slate-300 flex items-center gap-2">
                           <CalendarDays className="w-4 h-4 text-slate-500" />
                           {run.createdAt?.toDate ? run.createdAt.toDate().toLocaleDateString() : 'Just now'}
                        </div>
                      </div>
                      <div className="flex gap-4 items-center">
                        <button 
                          onClick={(e) => handleDelete(e, run.id)}
                          className="text-slate-500 hover:text-red-500 transition-colors p-2"
                          aria-label="Delete result"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                        <div className="text-slate-600 group-hover:text-primary transition-colors transform group-hover:translate-x-2 duration-300 hidden sm:block">
                          <ArrowRight className="w-6 h-6" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </>
  );
}

