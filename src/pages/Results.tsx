import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { handleFirestoreError, OperationType } from '../lib/firebase-utils';
import { AnalysisDocument, Recommendation, Competitor } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Printer, ShieldCheck, CheckCircle, XCircle, ArrowUpRight, Copy, Loader2, Download
} from 'lucide-react';
import * as htmlToImage from 'html-to-image';
import { jsPDF } from 'jspdf';

// Color Mapping
const getColorForScore = (score: number) => {
  if (score >= 80) return 'text-green-500';
  if (score >= 60) return 'text-yellow-500';
  return 'text-red-500';
};
const getBgColorForScore = (score: number) => {
  if (score >= 80) return 'bg-green-500';
  if (score >= 60) return 'bg-yellow-500';
  return 'bg-red-500';
};
const getGradeColor = (grade: string | undefined) => {
  if (!grade) return 'text-white border-white/20';
  if (grade.startsWith('A')) return 'text-teal-400 border-teal-400/30 bg-teal-400/10';
  if (grade.startsWith('B')) return 'text-blue-400 border-blue-400/30 bg-blue-400/10';
  if (grade.startsWith('C')) return 'text-yellow-400 border-yellow-400/30 bg-yellow-400/10';
  return 'text-red-400 border-red-400/30 bg-red-400/10';
};

const getBadgeColor = (priority: string) => {
  const p = priority.toLowerCase();
  if (p === 'critical') return 'bg-red-500 text-white';
  if (p === 'high') return 'bg-amber-500 text-white';
  if (p === 'medium') return 'bg-blue-500 text-white';
  return 'bg-slate-500 text-white';
};

export default function Results() {
  const { id } = useParams<{ id: string }>();
  const [result, setResult] = useState<AnalysisDocument | null>(null);
  const [loading, setLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function load() {
      if (!id) return;
      try {
        const docRef = doc(db, 'results', id);
        const snapshot = await getDoc(docRef);
        if (snapshot.exists()) {
          const data = snapshot.data() as AnalysisDocument;
          setResult(data);
        } else {
          setResult(null);
        }
      } catch (err) {
        handleFirestoreError(err, OperationType.GET, 'results');
      } finally {
         setLoading(false);
      }
    }
    load();
  }, [id]);

  const handleExportPDF = async () => {
    if (!reportRef.current || !result) return;
    setIsExporting(true);
    try {
      const dataUrl = await htmlToImage.toJpeg(reportRef.current, {
        backgroundColor: '#020617', // slate-950
        quality: 0.95,
        pixelRatio: 2,
        filter: (node: HTMLElement) => {
           if (node?.dataset?.html2canvasIgnore === 'true') {
              return false;
           }
           return true; // include others
        }
      });

      const img = new Image();
      img.src = dataUrl;
      await new Promise((resolve) => { img.onload = resolve; });
      
      const pdf = new jsPDF({
        orientation: 'p',
        unit: 'px',
        format: [img.width / 2, img.height / 2]
      });
      
      pdf.addImage(dataUrl, 'JPEG', 0, 0, img.width / 2, img.height / 2);
      pdf.save(`${result.product.name.replace(/\s+/g, '_')}_Validation.pdf`);
    } catch (error) {
      console.error('Failed to export PDF:', error);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center">
         <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
         <p className="font-mono text-primary text-sm tracking-widest uppercase">Loading Telemetry...</p>
      </div>
    );
  }

  if (!result || !result.product) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white">
        <h2 className="text-3xl font-black mb-4">Result Not Found</h2>
        <Link to="/" className="bg-white/10 px-6 py-3 font-bold uppercase text-[11px] tracking-widest">Return Home</Link>
      </div>
    );
  }

  const keys = Object.keys(result.scores || {});

  // Chart config
  const radarRadius = 150;
  const listCompetitors = [
    { name: result.product.name, score: result.product.overallScore, isMe: true },
    ...(result.competitors || []).map(c => ({ name: c.name, score: c.score, isMe: false }))
  ].sort((a, b) => b.score - a.score);

  return (
    <div ref={reportRef} className="min-h-screen bg-slate-950 text-white font-sans text-sm selection:bg-primary/30">
      
      {/* 1. HEADER */}
      <section className="w-full bg-slate-950 border-b border-white/10 p-8" data-html2canvas-ignore="false">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-start gap-8">
          <div className="flex gap-8 items-center">
            {/* Grade Circle */}
            <div className={`w-24 h-24 rounded-full border-2 flex flex-col items-center justify-center shrink-0 ${getGradeColor(result.product.grade)}`}>
               <span className="text-4xl font-black">{result.product.grade}</span>
            </div>
            <div>
               <h1 className="text-4xl font-black tracking-tight uppercase mb-1">{result.product.name}</h1>
               <div className="flex gap-3 text-sm text-slate-400 mb-3 font-mono">
                  <span>{result.product.category}</span>
                  <span>//</span>
                  <a href={result.product.url} className="hover:text-primary transition-colors">{result.product.url}</a>
               </div>
               <div className="flex items-center gap-3">
                  <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded bg-white/5 border border-white/10`}>
                    Risk: {result.product.riskLevel}
                  </span>
                  <span className="text-slate-300 italic text-sm">"{result.product.oneLiner}"</span>
               </div>
            </div>
          </div>

          <div className="flex flex-col gap-3 font-mono">
            <div className="text-right">
               <span className="text-slate-500 text-xs">Score</span>
               <div className="text-3xl font-black text-white">{result.product.overallScore}/100</div>
            </div>
            <div className="flex gap-2 self-end" data-html2canvas-ignore="true">
               <button 
                 onClick={handleExportPDF} 
                 disabled={isExporting}
                 className="px-3 py-1.5 border border-white/20 hover:bg-white/10 text-[10px] font-bold uppercase tracking-widest transition-colors flex items-center gap-1 disabled:opacity-50"
               >
                 {isExporting ? <><Loader2 className="w-3 h-3 animate-spin"/> Exporting...</> : <><Download className="w-3 h-3" /> Export PDF</>}
               </button>
               <button onClick={() => navigator.clipboard.writeText(window.location.href)} className="px-3 py-1.5 border border-white/20 hover:bg-white/10 text-[10px] font-bold uppercase tracking-widest transition-colors flex items-center gap-1"><Copy className="w-3 h-3" /> Copy Link</button>
               <Link to="/" className="px-3 py-1.5 bg-primary/20 text-primary border border-primary/30 hover:bg-primary/30 text-[10px] font-bold uppercase tracking-widest transition-colors flex items-center gap-1"><ArrowUpRight className="w-3 h-3"/> New Scan</Link>
            </div>
          </div>
        </div>
      </section>

      <main className="max-w-6xl mx-auto p-8 space-y-12 pb-32">
        
        {/* 2. KPI ROW */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
           {[['Market Size', result.market?.tam, 'Total TAM'], 
             ['Growth Rate', result.market?.growthRate, 'Segment'], 
             ['Market Share', result.market?.currentShare, 'Current'], 
             ['Projected ROI', result.projectedROI, 'Post-fix']
           ].map((kpi, i) => (
              <div key={i} className="border border-white/10 p-5 flex flex-col justify-between">
                 <div className="text-[10px] uppercase font-bold text-slate-500 tracking-widest mb-2">{kpi[0]}</div>
                 <div className="text-3xl font-black mb-1">{kpi[1] || 'N/A'}</div>
                 <div className="text-xs text-slate-500 font-mono">{kpi[2]}</div>
              </div>
           ))}
        </section>

        {/* 3. SCORES TABLE */}
        <section>
           <h2 className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-4">Diagnostic Telemetry</h2>
           <div className="border border-white/10">
              <table className="w-full text-left font-mono text-sm leading-relaxed">
                 <thead className="bg-white/5 border-b border-white/10 text-[10px] uppercase text-slate-400">
                    <tr>
                       <th className="p-3 font-normal">Metric</th>
                       <th className="p-3 font-normal">Current</th>
                       <th className="p-3 font-normal">Projected</th>
                       <th className="p-3 font-normal">Delta</th>
                       <th className="p-3 font-normal text-right">Weight</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-white/5">
                    {keys.map((k) => {
                       const v = result.scores[k];
                       const d = v.projected - v.current;
                       return (
                         <tr key={k} className="hover:bg-white/5">
                            <td className="p-3 font-sans font-medium text-white">{k}</td>
                            <td className="p-3 flex items-center gap-2">
                               <div className={`w-2 h-2 rounded-full ${getBgColorForScore(v.current)}`}></div>
                               {v.current}
                            </td>
                            <td className="p-3 text-slate-300">{v.projected}</td>
                            <td className="p-3 text-green-400 flex items-center gap-1 font-bold">
                               +{d} <ArrowUpRight className="w-3 h-3" />
                            </td>
                            <td className="p-3 text-slate-500 text-right">{Math.round(v.weight * 100)}%</td>
                         </tr>
                       )
                    })}
                    {/* Total Row */}
                    <tr className="bg-white/5 font-black uppercase tracking-widest text-xs">
                       <td className="p-3">Weighted Score</td>
                       <td className="p-3">
                          <div className="flex items-center gap-2">
                             <div className={`w-2 h-2 rounded-full ${getBgColorForScore(result.product.overallScore)}`}></div>
                             {result.product.overallScore}
                          </div>
                       </td>
                       <td className="p-3">
                          {Math.round(keys.reduce((acc, k) => acc + (result.scores[k].projected * result.scores[k].weight), 0))}
                       </td>
                       <td className="p-3 text-green-400 flex items-center gap-1">
                          +{Math.round(keys.reduce((acc, k) => acc + (result.scores[k].projected * result.scores[k].weight), 0)) - result.product.overallScore} <ArrowUpRight className="w-3 h-3" />
                       </td>
                       <td className="p-3 text-right text-slate-500">100%</td>
                    </tr>
                 </tbody>
              </table>
           </div>
        </section>

        {/* 4. TWO CHARTS SIDE BY SIDE */}
        <section className="grid lg:grid-cols-2 gap-8">
           {/* RADAR SVG */}
           <div className="border border-white/10 p-6 flex flex-col items-center relative">
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-6 absolute top-6 left-6">Score Distribution</h3>
              <div className="w-full max-w-[400px] mt-8">
                 <svg viewBox="0 0 400 400" width="100%" preserveAspectRatio="xMidYMid meet">
                    <g transform="translate(200, 200)">
                       {/* Grid */}
                       {[0.2, 0.4, 0.6, 0.8, 1].map(r => (
                          <polygon key={r} fill="none" stroke="rgba(255,255,255,0.05)" points={
                             keys.map((k, i) => {
                                const angle = (Math.PI * 2 * i) / keys.length - Math.PI / 2;
                                return `${Math.cos(angle) * radarRadius * r},${Math.sin(angle) * radarRadius * r}`;
                             }).join(' ')
                          } />
                       ))}
                       {/* Axes */}
                       {keys.map((k, i) => {
                          const angle = (Math.PI * 2 * i) / keys.length - Math.PI / 2;
                          // Extend axes slightly for labels
                          return (
                             <g key={k}>
                                <line x1="0" y1="0" x2={Math.cos(angle) * radarRadius} y2={Math.sin(angle) * radarRadius} stroke="rgba(255,255,255,0.1)" />
                                <text 
                                  x={Math.cos(angle) * (radarRadius + 20)} 
                                  y={Math.sin(angle) * (radarRadius + 20)}
                                  fill="#fff" fontSize="10" 
                                  textAnchor={Math.cos(angle) > 0.1 ? 'start' : Math.cos(angle) < -0.1 ? 'end' : 'middle'}
                                  dominantBaseline={Math.sin(angle) > 0.1 ? 'hanging' : Math.sin(angle) < -0.1 ? 'baseline' : 'middle'}
                                >
                                  {k}
                                </text>
                             </g>
                          )
                       })}
                       
                       {/* Projected Polygon */}
                       <polygon 
                         points={keys.map((k, i) => {
                            const v = result.scores[k].projected;
                            const a = (Math.PI * 2 * i) / keys.length - Math.PI / 2;
                            return `${Math.cos(a) * (v / 100 * radarRadius)},${Math.sin(a) * (v / 100 * radarRadius)}`;
                         }).join(' ')}
                         fill="rgba(45, 212, 191, 0.1)" stroke="#2dd4bf" strokeWidth="1" strokeDasharray="4 4"
                       />
                       
                       {/* Current Polygon */}
                       <polygon 
                         points={keys.map((k, i) => {
                            const v = result.scores[k].current;
                            const a = (Math.PI * 2 * i) / keys.length - Math.PI / 2;
                            return `${Math.cos(a) * (v / 100 * radarRadius)},${Math.sin(a) * (v / 100 * radarRadius)}`;
                         }).join(' ')}
                         fill="rgba(124, 58, 237, 0.4)" stroke="#7C3AED" strokeWidth="2"
                       />
                    </g>
                 </svg>
              </div>
              <div className="flex gap-4 mt-4 font-mono text-[9px] text-slate-400 capitalize">
                 <span className="flex items-center gap-2"><div className="w-2 h-2 bg-[#7C3AED]"></div> Current</span>
                 <span className="flex items-center gap-2"><div className="w-4 h-0.5 border-t border-dashed border-[#2dd4bf]"></div> Projected</span>
              </div>
           </div>

           {/* HORIZONTAL BARS */}
           <div className="border border-white/10 p-6 flex flex-col relative">
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-8">Competitor Benchmark</h3>
              <div className="w-full flex-1 flex flex-col justify-center">
                 <svg viewBox={`0 0 500 ${listCompetitors.length * 50 + 20}`} width="100%" preserveAspectRatio="xMidYMid meet">
                    {listCompetitors.map((c, i) => {
                       const y = i * 50 + 20;
                       return (
                         <g key={i}>
                            {/* Text left aligned */}
                            <text x="0" y={y + 12} fill={c.isMe ? "#fff" : "#94a3b8"} fontSize="12" fontWeight={c.isMe ? "bold" : "normal"}>
                               {c.name}
                            </text>
                            
                            {/* Empty background bar */}
                            <rect x="140" y={y} width="300" height="16" fill="rgba(255,255,255,0.05)" />
                            
                            {/* Filled bar */}
                            <motion.rect 
                               x="140" y={y} height="16" fill={c.isMe ? "#7C3AED" : "#334155"}
                               initial={{ width: 0 }}
                               animate={{ width: (c.score / 100) * 300 }}
                               transition={{ duration: 1, delay: i * 0.1 }}
                            />
                            
                            {/* Score Text right aligned */}
                            <text x="450" y={y + 12} fill={c.isMe ? "#7C3AED" : "#64748b"} fontSize="12" fontWeight="bold" fontFamily="monospace">
                               {c.score}
                            </text>
                         </g>
                       )
                    })}
                 </svg>
              </div>
           </div>
        </section>

        {/* 5. MARKET POSITIONING CSS GRID */}
        <section>
           <h2 className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-4">Market Positioning</h2>
           <div className="border border-white/10 aspect-video md:aspect-[3/1] relative bg-slate-900 overflow-hidden text-[10px] font-mono text-slate-600 uppercase tracking-widest">
               {/* 2x2 Grid Layout Lines */}
               <div className="absolute inset-0 flex"><div className="w-1/2 h-full border-r border-white/5"></div></div>
               <div className="absolute inset-0 flex flex-col"><div className="h-1/2 w-full border-b border-white/5"></div></div>
               
               {/* Quadrant Labels */}
               <div className="absolute top-4 left-4">Challengers</div>
               <div className="absolute top-4 right-4 text-right">Leaders</div>
               <div className="absolute bottom-4 left-4">Declining</div>
               <div className="absolute bottom-4 right-4 text-right">Struggling</div>

               {/* Map competitors and product to grid.
                   High Share (top), Low Share (bottom). High Score (right), Low Score (left).
                   Need to guess/approximate position based on numbers to percentage for this CSS approach. 
               */}
               {listCompetitors.map((c, i) => {
                  // VERY rough mapping to [0, 100] for position
                  // Score logic: 50 -> 0%, 100 -> 100%
                  const left = Math.max(0, Math.min(100, (c.score - 50) * 2));
                  // Share logic (fake mapping for illustration): Assume max share is ~40%.
                  // Note: `c.marketShare` might be a string in new schema or number. Parse it.
                  let shareNum = typeof c.marketShare === 'string' ? parseFloat(c.marketShare) : (c.marketShare as any || 0);
                  if (c.isMe && result.market) shareNum = parseFloat(result.market.currentShare);

                  const bottom = Math.max(0, Math.min(100, (shareNum / 40) * 100));

                  return (
                     <div key={i} className="absolute flex flex-col items-center" style={{ left: `${left}%`, bottom: `${bottom}%`, transform: 'translate(-50%, 50%)' }}>
                        <div className={`w-3 h-3 rounded-full ${c.isMe ? 'bg-primary' : 'bg-slate-600'}`}></div>
                        <div className={`mt-1 font-sans text-xs bg-black/50 px-1 rounded whitespace-nowrap ${c.isMe ? 'font-bold text-white' : 'text-slate-400'}`}>{c.name}</div>
                     </div>
                  )
               })}
           </div>
        </section>

        {/* 6. RECOMMENDATIONS TABLE */}
        <section>
           <h2 className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-4">Strategic Recommendations</h2>
           <div className="border border-white/10 overflow-x-auto">
              <table className="w-full text-left font-mono text-sm">
                 <thead className="bg-white/5 border-b border-white/10 text-[10px] uppercase text-slate-400">
                    <tr>
                       <th className="p-3 font-normal font-sans">#</th>
                       <th className="p-3 font-normal font-sans">Action</th>
                       <th className="p-3 font-normal">Priority</th>
                       <th className="p-3 font-normal">Effort</th>
                       <th className="p-3 font-normal">Impact</th>
                       <th className="p-3 font-normal">Weeks</th>
                       <th className="p-3 font-normal">Cost</th>
                       <th className="p-3 font-normal">Gain</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-white/5">
                    {result.recommendations?.map((r, i) => (
                       <tr key={i} className="hover:bg-white/5 text-slate-300">
                          <td className="p-3">{r.rank}</td>
                          <td className="p-3 font-sans font-bold text-white">{r.title}</td>
                          <td className="p-3">
                             <span className={`px-2 py-0.5 text-[10px] uppercase font-bold tracking-widest rounded-sm ${getBadgeColor(r.priority)}`}>{r.priority}</span>
                          </td>
                          <td className="p-3">{r.effort}</td>
                          <td className="p-3">{r.impact}</td>
                          <td className="p-3">{r.weeks}w</td>
                          <td className="p-3">{r.cost}</td>
                          <td className="p-3 text-green-400">{r.scoreGain}</td>
                       </tr>
                    ))}
                    <tr className="bg-white/5 font-black uppercase tracking-widest text-[10px] sm:text-xs text-white">
                       <td colSpan={5} className="p-3 text-right">Total Investment</td>
                       <td className="p-3 text-primary">{result.totalWeeks}w</td>
                       <td className="p-3 text-primary">{result.totalCost}</td>
                       <td className="p-3 text-primary">&mdash;</td>
                    </tr>
                 </tbody>
              </table>
           </div>
        </section>

        {/* 7. STRENGTHS / WARNINGS */}
        <section className="grid md:grid-cols-2 gap-0 border border-white/10 divide-y md:divide-y-0 md:divide-x divide-white/10">
           <div className="p-6">
               <h3 className="text-[10px] font-bold uppercase tracking-widest text-green-500 mb-6 flex items-center gap-2">
                 <CheckCircle className="w-4 h-4" /> Validated Strengths
               </h3>
               <ul className="space-y-4">
                 {result.strengths?.map((str, i) => (
                   <li key={i} className="text-sm text-slate-300 flex gap-4 items-start pb-4 border-b border-white/5 last:border-0 last:pb-0">
                      <CheckCircle className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                      <span className="leading-relaxed font-sans">{str}</span>
                   </li>
                 ))}
               </ul>
           </div>
           <div className="p-6">
               <h3 className="text-[10px] font-bold uppercase tracking-widest text-red-500 mb-6 flex items-center gap-2">
                 <XCircle className="w-4 h-4" /> Strategic Warnings
               </h3>
               <ul className="space-y-4">
                 {result.warnings?.map((warn, i) => (
                   <li key={i} className="text-sm text-slate-300 flex gap-4 items-start pb-4 border-b border-red-500/10 last:border-0 last:pb-0">
                      <XCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                      <span className="leading-relaxed font-sans">{warn}</span>
                   </li>
                 ))}
               </ul>
           </div>
        </section>

        {/* 8. FINAL VERDICT */}
        <section className="border border-white/10 p-8 md:p-12 relative overflow-hidden bg-slate-900">
           <div className="absolute top-0 left-0 w-1.5 h-full bg-primary shadow-[0_0_20px_rgba(124,58,237,0.5)]"></div>
           <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-6">Final Verdict</h3>
           <h2 className="text-2xl md:text-3xl font-serif italic text-white leading-relaxed mb-8">
             "{result.verdict}"
           </h2>
           
           <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">Summary Analysis</h4>
           <p className="text-slate-400 font-sans leading-loose text-sm max-w-4xl">
             {result.summary}
           </p>
        </section>
        
      </main>
    </div>
  );
}
