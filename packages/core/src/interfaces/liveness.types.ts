export type LivenessAction = 'BLINK' | 'TURN_LEFT' | 'TURN_RIGHT' | 'SMILE' | 'NOD';

export interface LivenessChallenge {
  action: LivenessAction;
  instruction: string;
  durationMs: number;
}

export interface LivenessResult {
  success: boolean;
  score: number;       // Liveness score (0.0 to 1.0)
  isReal: boolean;     // Whether it's a real living entity
  message: string;
}

export interface LivenessDetectorConfig {
  ort: any;            // Initialized via Dependency Injection (ort-web or ort-node)
}
