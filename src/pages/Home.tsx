import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import regeneratedImage from '../assets/images/regenerated_image_1778422255929.png';
import { db } from '../firebase';
import { useAuth } from '../AuthContext';
import { handleFirestoreError, OperationType } from '../lib/firebase-utils';
import { AIResult, FormState } from '../types';
import { CircleGauge } from '../components/CircleGauge';
import { 
  ShieldCheck, 
  Brain, 
  Gauge, 
  ShieldAlert, 
  Quote, 
  CheckCircle2, 
  AtSign, 
  Network, 
  Radar,
  Loader2,
  AlertTriangle,
  CheckCircle,
  XCircle,
  ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleGenAI, Type } from "@google/genai";
import { Link } from 'react-router-dom';

let aiClient: GoogleGenAI | null = null;
function getAI() {
  if (!aiClient) {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY environment variable is required.");
    }
    aiClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
  return aiClient;
}

const Navbar = () => {
  const { user } = useAuth();
  return (
  <nav className="fixed top-0 w-full z-50 bg-slate-950/60 backdrop-blur-xl border-b border-white/10 shadow-[0_0_24px_rgba(124,58,237,0.1)]">
    <div className="flex justify-between items-center px-8 h-20 w-full mx-auto max-w-7xl">
      <div className="flex items-center gap-2">
        <ShieldCheck className="text-primary w-8 h-8 fill-primary/20" />
        <span className="text-2xl font-black tracking-tighter text-white uppercase">ValidCore</span>
      </div>
      <div className="hidden md:flex gap-8 items-center">
        <a className="font-inter tracking-tight font-bold uppercase text-[11px] text-white border-b border-violet-500 hover:text-white transition-all duration-300" href="#features">Features</a>
        <a className="font-inter tracking-tight font-bold uppercase text-[11px] text-slate-400 hover:text-white hover:scale-105 transition-all duration-300" href="#how-it-works">How it works</a>
        <a className="font-inter tracking-tight font-bold uppercase text-[11px] text-slate-400 hover:text-white hover:scale-105 transition-all duration-300" href="#pricing">Pricing</a>
      </div>
      <div className="flex items-center gap-4">
        {user ? (
          <>
            <Link to="/history" className="text-slate-400 hover:text-white font-bold uppercase text-[11px] tracking-widest transition-colors hidden sm:inline">History</Link>
            <Link to="/settings" className="w-8 h-8 rounded-full bg-surface-container-high border border-white/10 flex items-center justify-center hover:bg-white/5 transition-colors text-white font-bold text-xs uppercase">
              {user.email?.[0] || 'U'}
            </Link>
          </>
        ) : (
          <Link to="/login" className="bg-primary-container text-white px-6 py-3 font-bold uppercase text-[11px] tracking-widest rounded-none ease-out duration-300 hover:shadow-[0_0_20px_rgba(124,58,237,0.4)] transition-all hover:scale-105">
            Log In
          </Link>
        )}
      </div>
    </div>
  </nav>
  );
};

const Hero = () => (
  <section className="max-w-7xl mx-auto px-8 grid md:grid-cols-2 gap-16 items-center min-h-[819px]">
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8 }}
      className="relative z-10"
    >
      <div className="inline-flex items-center gap-2 px-3 py-1 bg-surface-container-high ghost-border rounded-full mb-8">
        <span className="flex h-2 w-2 rounded-full bg-primary neon-glow"></span>
        <span className="font-inter tracking-tight font-bold uppercase text-[11px] text-on-surface-variant">Trusted by 12,000+ product teams</span>
      </div>
      <h1 className="text-6xl md:text-8xl font-black tracking-tighter leading-[0.9] text-white mb-8">
        Validate your product. <br/>
        <span className="gradient-text">Ship with confidence.</span>
      </h1>
      <p className="text-lg text-slate-400 max-w-xl mb-10 leading-relaxed">
        ValidCore is the authoritative, atmospheric environment for product validation. Deep space analytics combined with brutalist architectural precision.
      </p>
      <div className="flex flex-wrap gap-4">
        <a href="#interactive-lab" className="bg-primary-container inline-block text-white px-8 py-4 font-bold uppercase text-[11px] tracking-widest rounded-none neon-glow hover:neon-glow-strong transition-all duration-300">
          Upload product
        </a>
      </div>
    </motion.div>
    
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 1, delay: 0.2 }}
      className="relative"
    >
      <div className="absolute -top-24 -right-24 w-96 h-96 bg-primary/20 blur-[120px] rounded-full pointer-events-none"></div>
      <div className="glass-panel p-6 rounded-xl neon-glow border-white/10 relative z-10 transform md:rotate-3 hover:rotate-0 transition-transform duration-700">
        <div className="flex justify-between items-center mb-6">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500/50"></div>
            <div className="w-3 h-3 rounded-full bg-yellow-500/50"></div>
            <div className="w-3 h-3 rounded-full bg-green-500/50"></div>
          </div>
          <div className="text-[10px] text-slate-500 font-mono">VALIDATION_REPORT_v2.0</div>
        </div>
        <img 
          alt="Dashboard Mockup" 
          className="w-full h-auto rounded-lg" 
          src={regeneratedImage} 
        />
      </div>
    </motion.div>
  </section>
);

const CRITERIA_OPTIONS = [
  'Compliance', 'Safety', 'Performance', 'Security', 
  'Usability', 'Reliability', 'Scalability', 'Accessibility'
];

const InteractiveLab = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<FormState>({ productName: '', category: 'FinTech', deploymentUrl: '' });
  const [selectedCriteria, setSelectedCriteria] = useState<string[]>(['Compliance', 'Safety', 'Performance']);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AIResult | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (selectedCriteria.length === 0) {
      setError("Please select at least one tracking criteria.");
      return;
    }
    setStep(3);
    setIsAnalyzing(true);
    setError(null);
    setResult(null);
    setShowToast(false);
    
    try {
      const prompt = `Analyze this product:
Name: ${formData.productName || 'Unknown Product'}
Category: ${formData.category}
Deployment URL: ${formData.deploymentUrl || 'N/A'}

The user selected these criteria: ${selectedCriteria.join(', ')}.

Generate a comprehensive validation dashboard JSON. Follow this JSON format precisely:

{
  "product": {
    "name": "${formData.productName || 'Product Name'}",
    "category": "${formData.category}",
    "url": "${formData.deploymentUrl || 'https://...'}",
    "overallScore": 80,
    "grade": "B+",
    "riskLevel": "Medium",
    "oneLiner": "Strong infrastructure, weak user experience"
  },
  "market": {
    "tam": "$4.2T",
    "growthRate": "14.7% YoY",
    "currentShare": "8.3%",
    "projectedShare": "11.2% (post-fix)",
    "maturity": "Growth",
    "positioning": "Budget",
    "audience": "Price-sensitive shoppers"
  },
  "scores": {
    // for each selected criteria
    "[Criteria Base Name]": { "current": 75, "projected": 88, "weight": 0.15 }
  },
  "competitors": [
    { "name": "Amazon", "score": 88, "marketShare": "37.8%", "pricePoint": "Mid-Premium" }
  ],
  "recommendations": [
    {
      "rank": 1,
      "title": "Redesign Navigation UX",
      "priority": "Critical",
      "effort": "High",
      "impact": "High",
      "weeks": 8,
      "cost": "$180K",
      "scoreGain": "+12 pts overall",
      "metrics": ["Usability", "Accessibility"]
    }
  ],
  "strengths": ["Exceptional scalability", "..."],
  "warnings": ["Third-party compliance risk", "..."],
  "verdict": "Solid technical foundation undermined by UX debt... highest ROI.",
  "summary": "One clear paragraph. Real insight. No fluff.",
  "totalCost": "$2.4M",
  "totalWeeks": 24,
  "projectedROI": "340%"
}
`;

      const scoresProperties: Record<string, any> = {};
      selectedCriteria.forEach(c => {
         scoresProperties[c] = {
           type: Type.OBJECT,
           properties: {
             current: { type: Type.INTEGER },
             projected: { type: Type.INTEGER },
             weight: { type: Type.NUMBER }
           }
         };
      });
      
      const responseSchema = {
          type: Type.OBJECT,
          properties: {
              product: {
                type: Type.OBJECT,
                properties: {
                  name: {type: Type.STRING},
                  category: {type: Type.STRING},
                  url: {type: Type.STRING},
                  overallScore: {type: Type.INTEGER},
                  grade: {type: Type.STRING},
                  riskLevel: {type: Type.STRING},
                  oneLiner: {type: Type.STRING}
                }
              },
              market: {
                 type: Type.OBJECT,
                 properties: {
                   tam: {type: Type.STRING},
                   growthRate: {type: Type.STRING},
                   currentShare: {type: Type.STRING},
                   projectedShare: {type: Type.STRING},
                   maturity: {type: Type.STRING},
                   positioning: {type: Type.STRING},
                   audience: {type: Type.STRING}
                 }
              },
              scores: {
                  type: Type.OBJECT,
                  properties: scoresProperties,
                  required: selectedCriteria
              },
              competitors: {
                 type: Type.ARRAY,
                 items: {
                    type: Type.OBJECT,
                    properties: {
                      name: {type: Type.STRING},
                      score: {type: Type.INTEGER},
                      marketShare: {type: Type.STRING},
                      pricePoint: {type: Type.STRING}
                    }
                 }
              },
              recommendations: {
                  type: Type.ARRAY,
                  items: {
                      type: Type.OBJECT,
                      properties: {
                          rank: {type: Type.INTEGER},
                          title: {type: Type.STRING},
                          priority: {type: Type.STRING},
                          effort: {type: Type.STRING},
                          impact: {type: Type.STRING},
                          weeks: {type: Type.INTEGER},
                          cost: {type: Type.STRING},
                          scoreGain: {type: Type.STRING},
                          metrics: {type: Type.ARRAY, items: {type: Type.STRING}}
                      }
                  }
              },
              strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
              warnings: { type: Type.ARRAY, items: { type: Type.STRING } },
              verdict: { type: Type.STRING },
              summary: { type: Type.STRING },
              totalCost: { type: Type.STRING },
              totalWeeks: { type: Type.INTEGER },
              projectedROI: { type: Type.STRING }
          },
          required: ["product", "market", "scores", "competitors", "recommendations", "strengths", "warnings", "verdict", "summary", "totalCost", "totalWeeks", "projectedROI"]
      };

      const ai = getAI();
      const response = await ai.models.generateContent({
          model: "gemini-3.1-pro-preview",
          contents: prompt,
          config: {
              responseMimeType: "application/json",
              responseSchema
          }
      });

      const data = JSON.parse(response.text || "{}");
      
      const docRef = await addDoc(collection(db, 'results'), {
        userId: user.uid,
        productName: formData.productName || 'Unknown Product',
        category: formData.category,
        deploymentUrl: formData.deploymentUrl || '',
        ...data,
        createdAt: serverTimestamp()
      }).catch(err => {
         handleFirestoreError(err, OperationType.CREATE, 'results');
      });

      if (docRef) {
         navigate(`/results/${docRef.id}`);
      }
    } catch (err: any) {
      console.error(err);
      let errMsg = "An error occurred during analysis.";
      
      if (err.message) {
        try {
          const parsed = JSON.parse(err.message);
          // Handle standard Google API error format
          if (parsed.error && typeof parsed.error === 'object') {
            errMsg = parsed.error.message || JSON.stringify(parsed.error);
          } else if (parsed.error) {
            errMsg = parsed.error;
          } else {
            errMsg = err.message;
          }
        } catch {
          errMsg = err.message;
        }
      } else if (typeof err === 'string') {
        errMsg = err;
      }
      
      setError(errMsg);
      setStep(2);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const toggleCriteria = (c: string) => {
    setSelectedCriteria(prev => 
      prev.includes(c) ? prev.filter(item => item !== c) : [...prev, c]
    );
  };

  return (
    <section id="interactive-lab" className="py-32 bg-surface-container-lowest">
      <AnimatePresence>
        {result && !isAnalyzing && showToast && (
          <motion.div 
            initial={{ opacity: 0, y: 50, x: '-50%' }} 
            animate={{ opacity: 1, y: 0, x: '-50%' }} 
            exit={{ opacity: 0, y: 50, x: '-50%' }}
            className="fixed bottom-8 left-1/2 z-50 max-w-md w-full bg-slate-900 border border-primary/30 p-6 rounded-xl shadow-[0_0_40px_rgba(124,58,237,0.2)]"
          >
            <div className="flex gap-4">
              <Brain className="text-primary w-8 h-8 flex-shrink-0" />
              <div>
                <h4 className="text-white font-bold mb-2 uppercase text-xs tracking-widest text-primary">AI Summary</h4>
                <p className="text-slate-300 text-sm leading-relaxed">{result.summary}</p>
                <button onClick={() => setShowToast(false)} className="mt-4 text-xs font-bold uppercase tracking-widest text-slate-500 hover:text-white transition-colors">Dismiss</button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-4xl mx-auto px-8">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-black tracking-tight text-white mb-4">Interactive Lab</h2>
          <p className="text-slate-400 font-inter tracking-tight font-bold uppercase text-[11px]">3-Step Verification Protocol</p>
        </motion.div>
        
        <div className="mb-12 flex justify-between items-center relative">
          <div className="absolute top-1/2 left-0 w-full h-0.5 bg-white/5 -z-10"></div>
          {[1, 2, 3].map(num => (
            <div key={num} className={`w-10 h-10 rounded-full flex items-center justify-center font-bold border-4 border-background transition-colors duration-500 ${step >= num ? 'bg-primary-container text-white' : 'bg-surface-container-high text-slate-500'}`}>
              {num}
            </div>
          ))}
        </div>
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="glass-panel p-10 rounded-xl relative overflow-hidden min-h-[400px]"
        >
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div key="step1" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-8">
                <div>
                  <label className="block font-inter tracking-widest font-bold uppercase text-[11px] text-slate-500 mb-2">Product Name</label>
                  <input value={formData.productName} onChange={e => setFormData({...formData, productName: e.target.value})} className="w-full bg-surface-container-lowest border-b border-white/10 focus:border-primary px-4 py-4 text-white outline-none transition-all placeholder:text-slate-700" placeholder="e.g. ValidCore Nexus" type="text" />
                </div>
                <div className="grid md:grid-cols-2 gap-8">
                  <div>
                    <label className="block font-inter tracking-widest font-bold uppercase text-[11px] text-slate-500 mb-2">Category</label>
                    <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full bg-surface-container-lowest border-b border-white/10 focus:border-primary px-4 py-4 text-white outline-none">
                      <option>FinTech</option>
                      <option>HealthTech</option>
                      <option>SaaS Infrastructure</option>
                      <option>E-commerce</option>
                      <option>EdTech</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-inter tracking-widest font-bold uppercase text-[11px] text-slate-500 mb-2">Deployment URL</label>
                    <input value={formData.deploymentUrl} onChange={e => setFormData({...formData, deploymentUrl: e.target.value})} className="w-full bg-surface-container-lowest border-b border-white/10 focus:border-primary px-4 py-4 text-white outline-none transition-all placeholder:text-slate-700" placeholder="https://..." type="url" />
                  </div>
                </div>
                <div className="pt-6">
                  <button onClick={() => setStep(2)} className="w-full bg-primary text-on-primary py-4 font-black uppercase tracking-widest text-[12px] hover:scale-[1.01] transition-transform">
                    Continue to Configuration
                  </button>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div key="step2" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-8 flex flex-col h-full justify-between">
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <label className="block font-inter tracking-widest font-bold uppercase text-[11px] text-slate-500">Validation Modules</label>
                    <span className="text-[10px] uppercase font-bold text-slate-600">{selectedCriteria.length} selected</span>
                  </div>
                  
                  {error && (
                    <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-lg flex items-start gap-3 mb-6 relative">
                       <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                       <div className="text-sm font-medium">{error}</div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {CRITERIA_OPTIONS.map(c => {
                      const selected = selectedCriteria.includes(c);
                      return (
                        <button 
                          key={c}
                          onClick={() => toggleCriteria(c)}
                          className={`p-4 border text-left transition-all flex flex-col gap-3 rounded-lg ${selected ? 'bg-primary/10 border-primary text-white neon-glow' : 'bg-surface-container-low border-white/5 text-slate-400 hover:border-white/20 hover:text-white'}`}
                        >
                          <div className={`w-4 h-4 rounded-sm border flex items-center justify-center flex-shrink-0 ${selected ? 'bg-primary border-primary' : 'border-slate-600'}`}>
                            {selected && <CheckCircle2 className="w-3 h-3 text-on-primary bg-primary rounded-sm" />}
                          </div>
                          <span className="font-bold text-xs uppercase tracking-wider">{c}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
                
                <div className="pt-6 mt-auto flex gap-4">
                  <button onClick={() => setStep(1)} className="px-8 ghost-border text-white py-4 font-black uppercase tracking-widest text-[12px] hover:bg-white/5 transition-all">
                    Back
                  </button>
                  <button onClick={handleAnalyze} className="flex-1 bg-primary text-on-primary py-4 font-black uppercase tracking-widest text-[12px] hover:scale-[1.01] transition-transform flex items-center justify-center gap-2">
                    Initialize Analysis <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div key="step3" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center w-full min-h-[400px]">
                {isAnalyzing ? (
                  <div className="flex flex-col items-center space-y-6">
                    <div className="relative">
                      <div className="w-24 h-24 rounded-full border-4 border-white/5"></div>
                      <div className="w-24 h-24 rounded-full border-4 border-primary border-t-transparent animate-spin absolute top-0 left-0"></div>
                      <Radar className="w-8 h-8 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
                    </div>
                    <div className="text-center">
                      <h3 className="text-xl font-bold text-white mb-2 uppercase tracking-widest">Neural Scan Active</h3>
                      <p className="text-slate-400 text-sm font-mono tracking-tighter">Calculating deeply nested performance vectors...</p>
                    </div>
                  </div>
                ) : null}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </section>
  );
};

const Features = () => (
  <section id="features" className="py-32 px-8 max-w-7xl mx-auto">
    <div className="flex flex-col md:flex-row justify-between items-end gap-8 mb-20">
      <motion.div initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="max-w-2xl">
        <label className="font-inter tracking-widest font-bold uppercase text-[11px] text-primary mb-4 block">Platform Core</label>
        <h2 className="text-5xl md:text-7xl font-black tracking-tighter text-white">Precision Instrumentation.</h2>
      </motion.div>
    </div>
    
    <div className="grid md:grid-cols-3 gap-8">
      {[
        { icon: Brain, title: "AI-powered Insights", desc: "Autonomous neural networks analyzing your product architecture for potential failure points before they occur." },
        { icon: Gauge, title: "Real-time Scoring", desc: "Live streaming metrics calculating your compliance and performance scores with millisecond latency." },
        { icon: ShieldAlert, title: "Hardened Security", desc: "Military-grade encryption and automated penetration testing integrated directly into your validation cycle." },
      ].map((feature, i) => (
        <motion.div 
          key={i}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: i * 0.1 }}
          className="group p-8 bg-surface border border-white/5 hover:border-primary/50 transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_0_30px_rgba(124,58,237,0.1)]"
        >
          <feature.icon className="w-10 h-10 text-primary mb-6 block" />
          <h3 className="text-xl font-bold text-white mb-4">{feature.title}</h3>
          <p className="text-slate-500 text-sm leading-relaxed mb-6">{feature.desc}</p>
          <div className="h-1 w-0 bg-primary group-hover:w-full transition-all duration-500"></div>
        </motion.div>
      ))}
    </div>
  </section>
);

const ValidationFlow = () => (
  <section id="how-it-works" className="py-32 bg-surface-container-low">
    <div className="max-w-7xl mx-auto px-8">
      <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-24">
        <h2 className="text-5xl font-black tracking-tighter text-white mb-4 uppercase">The Validation Flow</h2>
        <div className="h-1 w-24 bg-primary mx-auto"></div>
      </motion.div>
      
      <div className="relative grid md:grid-cols-4 gap-8">
        {[
          { num: "01", title: "Integration", desc: "Connect your repo or upload builds." },
          { num: "02", title: "Analysis", desc: "Deep neural scan across 12 metrics." },
          { num: "03", title: "Scoring", desc: "Automated scoring & benchmarking." },
          { num: "04", title: "Certification", desc: "Official seal of validation issued." }
        ].map((step, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
            className="relative z-10"
          >
            <div className="w-16 h-16 rounded-full bg-background border-2 border-primary flex items-center justify-center mb-8 mx-auto shadow-[0_0_15px_rgba(124,58,237,0.2)]">
              <span className="text-xl font-black text-primary">{step.num}</span>
            </div>
            <h4 className="text-center font-bold text-white mb-2 uppercase tracking-widest text-[13px]">{step.title}</h4>
            <p className="text-center text-slate-500 text-sm">{step.desc}</p>
          </motion.div>
        ))}
        <div className="hidden md:block absolute top-8 left-16 right-16 h-[2px] bg-gradient-to-r from-transparent via-primary/30 to-transparent -z-0"></div>
      </div>
    </div>
  </section>
);

const SocialProof = () => (
  <section className="py-32 px-8 max-w-7xl mx-auto">
    <motion.div 
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      className="flex justify-between items-center opacity-40 grayscale mb-24 gap-8 flex-wrap"
    >
      <div className="text-2xl font-black text-white uppercase tracking-tighter">VOLT.AI</div>
      <div className="text-2xl font-black text-white uppercase tracking-tighter">NEONPATH</div>
      <div className="text-2xl font-black text-white uppercase tracking-tighter">SYNTH_SYS</div>
      <div className="text-2xl font-black text-white uppercase tracking-tighter">QUANTUM_ARC</div>
    </motion.div>
    
    <div className="grid md:grid-cols-3 gap-12">
      {[
        { 
          quote: "ValidCore transformed our deployment cycle. We went from 'hope it works' to 'validated it works' in seconds.",
          name: "Marcus Thorne", role: "CTO, VOLT.AI", mt: "mt-0",
          img: "https://lh3.googleusercontent.com/aida-public/AB6AXuCWZ5IyaXCJRJSUJo323x_f5Eo-7IybngEJBWPqpI-ONFR5b9h-KJbpOHJGw6yVGoOOvcn8EFdN74lEjc6wEGhr130zWcaoXZiwD_gNvP6iHJqz5vY_EGh1kXHfTlZmcBhY_kgfBBEY5QXAlHduykkClvHgPqGgcCqFHugz9XUkyNIbPh95aen4qGdbmzoMlh37FFCHyCahBPG_mNBIfEfW50RuT120qfDBXRE_kLC9ICiOQcWHby0TmV6fxSqh8XfWc7Ih3dY3dw"
        },
        { 
          quote: "The precision instrumentation is unmatched. It feels like flying a high-performance aircraft through code.",
          name: "Elena Rossi", role: "Head of Product, NEONPATH", mt: "mt-8 md:mt-12",
          img: "https://lh3.googleusercontent.com/aida-public/AB6AXuA9b-FUMt1-SRtdO9cjjd99JAbj76aNxLno4IukHwlrcFv2ZPBqogyPdW-cIjBf9z_C76SXdviloPH2kNdpVkCy4nK0KQLSBWb_Kn4JzfJ6sS4bn0cbPBKUap0YwDZvMMZD6xDi_gFOngfdEVLt4bwxjOX5j4V-pfbX3b2qRCWCfI8tNquzr35tjGz82kH8QuuA8vY12ErQv7RYrlJuF-dSqTlVnuWezMJCcopp9eVFvojVI-AEVmt0l1p4qLW6YZBs2CqotT4GCw"
        },
        { 
          quote: "The UI itself is a statement of intent. It's built for those who take validation seriously.",
          name: "Jaxen Storm", role: "Lead Engineer, SYNTH_SYS", mt: "mt-0",
          img: "https://lh3.googleusercontent.com/aida-public/AB6AXuBgAPiYd8fiZXLJ3yce2ROfWrBF-Qk1TdxSHMounOtwKqCc6LzCGP9UnVcfv0fiB1v3LKqaGKtFdCWgpUkEuf_Io21lVksy3Ixbi0g3WV4ZFzIrSUj8XZQcfju1Xf_JMoQC7E8ugH5IOZb90wKcLipLEEIz7l5W-V-UMihszfR5hBr_Vo8PLgoDUYbgqK5wtEhJZq9rjvWWbYH0rQsSs6b_4WcQ-E8BmC3djDcooNtrXTlV0QfoqOQoHTNwgIvdAStB44TMJlwKhQ"
        }
      ].map((testimonial, i) => (
        <motion.div 
          key={i}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: i * 0.1 }}
          className={`p-8 bg-surface-container rounded-none ghost-border relative ${testimonial.mt}`}
        >
          <Quote className="text-primary/30 absolute top-4 right-4 w-10 h-10" fill="currentColor" />
          <p className="text-slate-300 italic mb-8">"{testimonial.quote}"</p>
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-primary-container/20 overflow-hidden">
              <img alt="Avatar" src={testimonial.img} className="w-full h-full object-cover" />
            </div>
            <div>
              <div className="text-white font-bold text-sm uppercase tracking-wider">{testimonial.name}</div>
              <div className="text-slate-500 text-[10px] uppercase font-bold">{testimonial.role}</div>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  </section>
);

const Pricing = () => (
  <section id="pricing" className="py-32 px-8 max-w-7xl mx-auto">
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="text-center mb-20"
    >
      <label className="font-inter tracking-widest font-bold uppercase text-[11px] text-primary mb-4 block">Scalable Tiers</label>
      <h2 className="text-6xl font-black tracking-tighter text-white">Investment Plans</h2>
    </motion.div>
    
    <div className="grid md:grid-cols-3 gap-8">
      {/* Plan 1 */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="bg-surface-container-low p-10 border border-white/5 flex flex-col"
      >
        <div className="mb-12">
          <h4 className="text-slate-400 font-bold uppercase tracking-[0.2em] text-[10px] mb-4">Starter</h4>
          <div className="flex items-baseline gap-2">
            <span className="text-5xl font-black text-white">$49</span>
            <span className="text-slate-500 text-sm uppercase">/mo</span>
          </div>
        </div>
        <ul className="space-y-4 mb-12 flex-grow">
          {['5 Monthly Validations', 'Core Security Scan', 'Email Support'].map((feature, i) => (
            <li key={i} className="flex items-center gap-3 text-sm text-slate-300">
              <CheckCircle2 className="text-primary w-5 h-5" /> {feature}
            </li>
          ))}
        </ul>
        <button className="ghost-border text-white w-full py-4 font-bold uppercase text-[11px] tracking-widest hover:bg-white/5 transition-all">Select Starter</button>
      </motion.div>

      {/* Plan 2 */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        className="bg-surface p-10 border-2 border-primary-container flex flex-col relative md:scale-105 neon-glow z-10"
      >
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary-container text-white px-4 py-1 text-[10px] font-black uppercase tracking-widest whitespace-nowrap">Most popular</div>
        <div className="mb-12">
          <h4 className="text-primary font-bold uppercase tracking-[0.2em] text-[10px] mb-4">Pro Plan</h4>
          <div className="flex items-baseline gap-2">
            <span className="text-5xl font-black text-white">$299</span>
            <span className="text-slate-500 text-sm uppercase">/mo</span>
          </div>
        </div>
        <ul className="space-y-4 mb-12 flex-grow">
          {['Unlimited Validations', 'AI-Powered Insights', '24/7 Priority Concierge', 'Custom PDF Reports'].map((feature, i) => (
            <li key={i} className="flex items-center gap-3 text-sm text-slate-300">
              <CheckCircle2 className="text-primary w-5 h-5" fill="currentColor" /> {feature}
            </li>
          ))}
        </ul>
        <button className="bg-primary-container text-white w-full py-4 font-bold uppercase text-[11px] tracking-widest hover:shadow-[0_0_20px_rgba(124,58,237,0.4)] transition-all">Launch Pro</button>
      </motion.div>

      {/* Plan 3 */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: 0.1 }}
        className="bg-surface-container-low p-10 border border-white/5 flex flex-col"
      >
        <div className="mb-12">
          <h4 className="text-slate-400 font-bold uppercase tracking-[0.2em] text-[10px] mb-4">Enterprise</h4>
          <div className="flex items-baseline gap-2">
            <span className="text-5xl font-black text-white">Custom</span>
          </div>
        </div>
        <ul className="space-y-4 mb-12 flex-grow">
          {['On-Premise Deployment', 'Dedicated Security Team', 'API Direct Integration'].map((feature, i) => (
            <li key={i} className="flex items-center gap-3 text-sm text-slate-300">
              <CheckCircle2 className="text-primary w-5 h-5" /> {feature}
            </li>
          ))}
        </ul>
        <button className="ghost-border text-white w-full py-4 font-bold uppercase text-[11px] tracking-widest hover:bg-white/5 transition-all">Contact Sales</button>
      </motion.div>
    </div>
  </section>
);

const FinalCTA = () => (
  <section className="py-32 px-8">
    <div className="max-w-7xl mx-auto bg-slate-950 rounded-none overflow-hidden relative border border-white/5 p-16 md:p-24">
      <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, #7c3aed 1px, transparent 0)', backgroundSize: '32px 32px' }}></div>
      <div className="absolute -right-40 -bottom-40 w-[600px] h-[600px] bg-primary/10 blur-[150px] rounded-full"></div>
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="relative z-10 text-center max-w-3xl mx-auto"
      >
        <h2 className="text-5xl md:text-7xl font-black tracking-tighter text-white mb-8 leading-tight">Ready to certify your future?</h2>
        <p className="text-slate-400 text-lg mb-12">Join the world's most innovative teams and start your validation journey today.</p>
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <a href="#pricing" className="bg-primary inline-block text-center text-on-primary px-12 py-5 font-black uppercase text-[12px] tracking-[0.2em] hover:scale-105 transition-transform">Get Started Now</a>
        </div>
      </motion.div>
    </div>
  </section>
);

const Footer = () => (
  <footer className="bg-slate-950 border-t border-white/5 w-full py-20 px-8 relative z-10">
    <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-12 mb-20">
      <div className="col-span-1">
        <div className="flex items-center gap-2 mb-6">
          <ShieldCheck className="text-primary w-6 h-6 fill-primary/20" />
          <span className="text-lg font-bold text-white uppercase tracking-widest">ValidCore</span>
        </div>
        <p className="text-slate-500 font-inter text-sm leading-relaxed">Defining the standard of atmospheric product validation since 2024.</p>
      </div>
      <div>
        <h5 className="text-white font-bold uppercase text-[11px] tracking-widest mb-6">Quick Links</h5>
        <ul className="space-y-4">
          <li><a className="text-slate-500 hover:text-violet-300 transition-colors font-inter text-sm" href="#interactive-lab">Interactive Lab</a></li>
          <li><a className="text-slate-500 hover:text-violet-300 transition-colors font-inter text-sm" href="#features">Features</a></li>
          <li><a className="text-slate-500 hover:text-violet-300 transition-colors font-inter text-sm" href="#how-it-works">How it works</a></li>
          <li><a className="text-slate-500 hover:text-violet-300 transition-colors font-inter text-sm" href="#pricing">Pricing</a></li>
        </ul>
      </div>
    </div>
    <div className="max-w-7xl mx-auto pt-12 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6">
      <p className="font-inter text-sm text-slate-500">© 2024 ValidCore. The Neon Monolith.</p>
      <div className="flex gap-6">
      </div>
    </div>
  </footer>
);

export default function App() {
  return (
    <>
      <div className="grain-overlay"></div>
      <Navbar />
      <main className="relative pt-32 overflow-hidden">
        <Hero />
        <InteractiveLab />
        <Features />
        <ValidationFlow />
        <SocialProof />
        <Pricing />
        <FinalCTA />
      </main>
      <Footer />
    </>
  );
}
