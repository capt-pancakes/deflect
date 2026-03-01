// Type declarations for essentia.js (no @types package available)
declare module 'essentia.js' {
  export function EssentiaWASM(): Promise<unknown>;
  export class Essentia {
    constructor(wasmModule: unknown, isDebug?: boolean);
    arrayToVector(arr: Float32Array): EssentiaVector;
    RhythmExtractor2013(signal: EssentiaVector): {
      bpm: number;
      ticks: EssentiaVector;
      estimates: EssentiaVector;
      bpmIntervals: EssentiaVector;
    };
  }
  interface EssentiaVector {
    size(): number;
    get(index: number): number;
    delete(): void;
  }
}
