export interface AviatorRound {
  id: string;
  roundNumber: number;
  multiplier: number;
  peakMultiplier: number;
  status: 'climbing' | 'crashed' | 'waiting';
  timestamp: string;
}

export interface BetState {
  amount: number;
  autoCashout: number;
  isAuto: boolean;
  isActive: boolean;
  hasCashedOut: boolean;
  cashoutMultiplier: number;
  profit: number;
}

export interface PredictionMetrics {
  predictedRangeMin: number;
  predictedRangeMax: number;
  likelihoodOver1_5: number;
  likelihoodOver2_0: number;
  likelihoodOver5_0: number;
  riskRating: 'Low' | 'Medium' | 'High' | 'Extreme';
  confidenceScore: number; // 0 to 100
  trendRecommendation: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: string;
}
