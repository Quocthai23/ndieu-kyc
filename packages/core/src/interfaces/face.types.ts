export interface FaceMatcherConfig {
  ort: any;                    // Initialized via Dependency Injection (ort-web or ort-node)
  similarityThreshold?: number; // Threshold for face matching (default: 0.75 - Cosine Similarity)
}

export interface MatchResult {
  success: boolean;
  similarity: number;   // Similarity score from 0.0 to 1.0
  isMatch: boolean;     // Whether the face matches
  message: string;
}
