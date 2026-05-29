import { preprocessImage, cosineSimilarity } from '../utils/image-utils';
import { ImageInput } from '../interfaces/common.types';
import { FaceMatcherConfig, MatchResult } from '../interfaces/face.types';

export class FaceMatcher {
    private detectorSession: any = null;
    private recognizerSession: any = null;
    private config: FaceMatcherConfig;

    constructor(config: FaceMatcherConfig) {
        if (!config || !config.ort) {
            throw new Error("[NDieu-Face] Need to provide 'ort' (ONNX Runtime) object to initialize.");
        }
        this.config = {
            similarityThreshold: 0.75,
            ...config
        };
    }

    /**
     * Initialize FaceMatcher by loading Face Detection (BlazeFace) and Recognition (MobileFaceNet) models
     * @param detModel URL path or binary buffer (Uint8Array) of the BlazeFace model (.onnx)
     * @param recModel URL path or binary buffer (Uint8Array) of the MobileFaceNet model (.onnx)
     * @param options Session configuration options for ONNX Runtime (Default uses WASM)
     */
    async initialize(
        detModel: string | Uint8Array, 
        recModel: string | Uint8Array, 
        options: any = { executionProviders: ['wasm'] },
        onProgress?: (progress: number, modelName: string) => void
    ) {
        console.log("[NDieu-Face] Initializing edge face models...");
        try {
            const detOptions = { ...options, onProgress: onProgress ? (p: number) => onProgress(p, 'faceDetModel') : undefined };
            const recOptions = { ...options, onProgress: onProgress ? (p: number) => onProgress(p, 'faceRecModel') : undefined };

            const [detSession, recSession] = await Promise.all([
                this.config.ort.InferenceSession.create(detModel, detOptions),
                this.config.ort.InferenceSession.create(recModel, recOptions)
            ]);

            this.detectorSession = detSession;
            this.recognizerSession = recSession;
            console.log("[NDieu-Face] Successfully initialized face detection and extraction models!");
        } catch (error) {
            console.error("[NDieu-Face] Model initialization error:", error);
            throw new Error(`[NDieu] FaceMatcher initialization failed: ${error}`);
        }
    }

    /**
     * Extract Vector Embedding from an image containing a face
     * @param image Image containing the face to extract features from
     */
    async extractEmbedding(image: ImageInput): Promise<Float32Array> {
        if (!this.recognizerSession) {
            throw new Error("[NDieu-Face] Face recognition model is not ready.");
        }

        console.log("[NDieu-Face] Extracting face feature vector...");

        // 1. Image preprocessing: MobileFaceNet requires 112x112 pixel input size
        const targetW = 112;
        const targetH = 112;
        
        // MobileFaceNet expects image to be normalized for face models (subtract 127.5 then divide by 127.5)
        const floatBuffer = preprocessImage(image, targetW, targetH, {
            mean: [0.5, 0.5, 0.5], // pixel / 255.0 - 0.5 = (pixel - 127.5) / 255.0
            std: [0.5, 0.5, 0.5],  // / 0.5 => * 2.0 = (pixel - 127.5) / 127.5
            channelOrder: 'RGB'
        });

        // 2. Create input Tensor with shape [1, 3, 112, 112] using injected library
        const inputTensor = new this.config.ort.Tensor('float32', floatBuffer, [1, 3, targetH, targetW]);

        // 3. Execute inference
        const outputs = await this.recognizerSession.run({ 'input': inputTensor });
        
        // Extract output results
        const outputNames = Object.keys(outputs);
        const embeddingTensor = outputs[outputNames[0]];
        const embeddings = embeddingTensor.data as Float32Array;

        return embeddings;
    }

    /**
     * Compare document image with portrait image (Selfie)
     * @param documentImage Portrait image cropped from ID card
     * @param selfieImage Actual selfie image of the customer
     */
    async match(
        documentImage: ImageInput,
        selfieImage: ImageInput
    ): Promise<MatchResult> {
        try {
            console.log("[NDieu-Face] Starting offline face matching process...");

            // Step 1: Extract features of face 1 (Document)
            const embeddingDoc = await this.extractEmbedding(documentImage);

            // Step 2: Extract features of face 2 (Selfie)
            const embeddingSelfie = await this.extractEmbedding(selfieImage);

            // Step 3: Calculate Cosine distance between 2 vector embeddings
            const similarityScore = cosineSimilarity(embeddingDoc, embeddingSelfie);
            
            // Convert and normalize match confidence level
            const threshold = this.config.similarityThreshold || 0.75;
            const isMatch = similarityScore >= threshold;

            console.log(`[NDieu-Face] Match result - Similarity: ${similarityScore.toFixed(4)}, Threshold: ${threshold}`);

            return {
                success: true,
                similarity: similarityScore,
                isMatch: isMatch,
                message: isMatch 
                    ? "Face on document matches the user's selfie image." 
                    : "Face does not match. Please try again with better angle and lighting."
            };

        } catch (error) {
            console.error("[NDieu-Face] Error during matching process:", error);
            return {
                success: false,
                similarity: 0.0,
                isMatch: false,
                message: `Offline matching error: ${error}`
            };
        }
    }

    async release(): Promise<void> {
        if (this.detectorSession && typeof this.detectorSession.release === 'function') {
            await this.detectorSession.release();
        }
        if (this.recognizerSession && typeof this.recognizerSession.release === 'function') {
            await this.recognizerSession.release();
        }
    }
}
