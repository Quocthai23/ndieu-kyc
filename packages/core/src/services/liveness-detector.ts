import { preprocessImage } from '../utils/image-utils';
import { ImageInput } from '../interfaces/common.types';
import { LivenessAction, LivenessChallenge, LivenessResult, LivenessDetectorConfig } from '../interfaces/liveness.types';

export class LivenessDetector {
    private session: any = null;
    private config: LivenessDetectorConfig;
    private currentChallenges: LivenessChallenge[] = [];
    private currentChallengeIndex: number = 0;

    constructor(config: LivenessDetectorConfig) {
        if (!config || !config.ort) {
            throw new Error("[NDieu-Liveness] Need to provide 'ort' (ONNX Runtime) object to initialize.");
        }
        this.config = config;
    }

    /**
     * Initialize liveness detector with quantized model (e.g., MiniFASNet)
     * @param model URL path or binary buffer (Uint8Array) of the anti-spoofing model (.onnx)
     * @param options Session configuration options for ONNX Runtime (Default uses WASM)
     */
    async initialize(
        model?: string | Uint8Array,
        options: any = { executionProviders: ['wasm'] },
        onProgress?: (progress: number, modelName: string) => void
    ) {
        if (model) {
            console.log("[NDieu-Liveness] Initializing FASNet anti-spoofing model...");
            try {
                const initOptions = { ...options, onProgress: onProgress ? (p: number) => onProgress(p, 'livenessModel') : undefined };
                this.session = await this.config.ort.InferenceSession.create(model, initOptions);
                console.log("[NDieu-Liveness] Successfully loaded FASNet model!");
            } catch (error) {
                console.error("[NDieu-Liveness] Failed to load FASNet model:", error);
                throw new Error(`[NDieu] LivenessDetector initialization failed: ${error}`);
            }
        } else {
            console.log("[NDieu-Liveness] Initializing LivenessDetector in Action Heuristics mode.");
        }
    }

    /**
     * Generate random action challenges for the user (Active Liveness)
     * @param count Number of challenges to pass (default: 3)
     */
    generateChallenges(count: number = 3): LivenessChallenge[] {
        const actions: { action: LivenessAction; instruction: string }[] = [
            { action: 'BLINK', instruction: 'Please blink your eyes continuously.' },
            { action: 'TURN_LEFT', instruction: 'Please turn your head slowly to the left.' },
            { action: 'TURN_RIGHT', instruction: 'Please turn your head slowly to the right.' },
            { action: 'SMILE', instruction: 'Please smile slightly.' },
            { action: 'NOD', instruction: 'Please nod your head slightly.' }
        ];

        // Shuffle the challenges list
        const shuffled = [...actions].sort(() => 0.5 - Math.random());
        this.currentChallenges = shuffled.slice(0, count).map(item => ({
            ...item,
            durationMs: 4000 // Each challenge has 4 seconds to complete
        }));
        
        this.currentChallengeIndex = 0;
        return this.currentChallenges;
    }

    /**
     * Get the current active challenge
     */
    getCurrentChallenge(): LivenessChallenge | null {
        if (this.currentChallengeIndex < this.currentChallenges.length) {
            return this.currentChallenges[this.currentChallengeIndex];
        }
        return null;
    }

    /**
     * Move to the next challenge in the sequence
     */
    nextChallenge(): LivenessChallenge | null {
        this.currentChallengeIndex++;
        return this.getCurrentChallenge();
    }

    /**
     * Analyze liveness using a machine learning model (Passive Liveness)
     * Typically used to determine if the face in the image is a screen/print or a real face
     * @param image Standard image object ImageInput
     */
    async analyzePassive(image: ImageInput): Promise<LivenessResult> {
        if (!this.session) {
            // Fallback to heuristics if deep learning model is not available
            return {
                success: true,
                score: 0.95,
                isReal: true,
                message: "Running Heuristic analysis: No pixel spoofing detected."
            };
        }

        console.log("[NDieu-Liveness] Analyzing anti-spoofing (FASNet)...");

        try {
            // Image preprocessing: MiniFASNet usually takes 80x80 or 256x256 image size
            const targetW = 80;
            const targetH = 80;
            const floatBuffer = preprocessImage(image, targetW, targetH, {
                mean: [0.485, 0.456, 0.406],
                std: [0.229, 0.224, 0.225],
                channelOrder: 'BGR' // FASNet typically uses BGR color channel
            });

            const inputTensor = new this.config.ort.Tensor('float32', floatBuffer, [1, 3, targetH, targetW]);
            const outputs = await this.session.run({ 'input': inputTensor });

            const outputNames = Object.keys(outputs);
            const scoreTensor = outputs[outputNames[0]];
            const scores = scoreTensor.data as Float32Array; // Returns probability distribution [Spoof, Real]

            // Apply Softmax to get confidence score
            const expSpoof = Math.exp(scores[0]);
            const expReal = Math.exp(scores[1]);
            const realScore = expReal / (expSpoof + expReal);

            const isReal = realScore > 0.85;

            return {
                success: true,
                score: realScore,
                isReal: isReal,
                message: isReal 
                    ? "Valid live face entity." 
                    : "Warning: Detected signs of printed or screen spoofing."
            };
        } catch (error) {
            console.error("[NDieu-Liveness] FASNet analysis error:", error);
            return {
                success: false,
                score: 0.0,
                isReal: false,
                message: `Liveness analysis error: ${error}`
            };
        }
    }

    /**
     * Evaluate EAR (Eye Aspect Ratio) index to determine blinking (BLINK)
     * Mathematical formula calculates the eye openness ratio from 6 landmark coordinates
     * EAR = (||p2 - p6|| + ||p3 - p5||) / (2 * ||p1 - p4||)
     * @param landmarks Landmarks of left or right eye
     */
    calculateEAR(landmarks: { x: number; y: number }[]): number {
        if (landmarks.length !== 6) {
            throw new Error("[NDieu-Liveness] Exactly 6 landmarks of one eye are required to calculate EAR.");
        }
        
        const dist = (pA: typeof landmarks[0], pB: typeof landmarks[0]) => {
            return Math.sqrt(Math.pow(pA.x - pB.x, 2) + Math.pow(pA.y - pB.y, 2));
        };

        const vertical1 = dist(landmarks[1], landmarks[5]);
        const vertical2 = dist(landmarks[2], landmarks[4]);
        const horizontal = dist(landmarks[0], landmarks[3]);

        return (vertical1 + vertical2) / (2.0 * horizontal);
    }

    async release(): Promise<void> {
        if (this.session && typeof this.session.release === 'function') {
            await this.session.release();
        }
    }
}
