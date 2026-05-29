export interface BBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ImageInput {
  data: Uint8Array | Uint8ClampedArray; // Flat RGBA pixel array [R,G,B,A, R,G,B,A, ...]
  width: number;                        // Image width
  height: number;                       // Image height
}

export interface NormalizeConfig {
  mean: [number, number, number];
  std: [number, number, number];
  channelOrder: 'RGB' | 'BGR';
}
