export interface MetricScore {
  current: number;
  projected: number;
  weight: number;
}

export interface Recommendation {
  rank: number;
  title: string;
  priority: string;
  effort: string;
  impact: string;
  weeks: number;
  cost: string;
  scoreGain: string;
  metrics: string[];
}

export interface Competitor {
  name: string;
  score: number;
  marketShare: string;
  pricePoint: string;
}

export interface AIResult {
  product: {
    name: string;
    category: string;
    url: string;
    overallScore: number;
    grade: string;
    riskLevel: string;
    oneLiner: string;
  };
  market: {
    tam: string;
    growthRate: string;
    currentShare: string;
    projectedShare: string;
    maturity: string;
    positioning: string;
    audience: string;
  };
  scores: Record<string, MetricScore>;
  competitors: Competitor[];
  recommendations: Recommendation[];
  strengths: string[];
  warnings: string[];
  verdict: string;
  summary: string;
  totalCost: string;
  totalWeeks: number;
  projectedROI: string;
}

export interface AnalysisDocument extends AIResult {
  userId: string;
  productName: string;
  category: string;
  deploymentUrl: string;
  createdAt: any;
}

export interface FormState {
  productName: string;
  category: string;
  deploymentUrl: string;
}

export interface AnalysisDocument extends AIResult {
  userId: string;
  productName: string;
  category: string;
  deploymentUrl: string;
  createdAt: any; // Timestamp
}
