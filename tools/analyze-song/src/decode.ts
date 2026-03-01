// tools/analyze-song/src/decode.ts
import { readFile } from 'node:fs/promises';

export interface DecodedAudio {
  sampleRate: number;
  channelData: Float32Array; // mono mixdown
  duration: number;
}

export async function decodeMP3(filePath: string): Promise<DecodedAudio> {
  const buffer = await readFile(filePath);
  // audio-decode returns an AudioBuffer-like object
  const { default: decode } = await import('audio-decode');
  const audioBuffer = await decode(buffer);

  // Mixdown to mono
  const numChannels = audioBuffer.numberOfChannels;
  const length = audioBuffer.length;
  const mono = new Float32Array(length);

  for (let ch = 0; ch < numChannels; ch++) {
    const channelData = audioBuffer.getChannelData(ch);
    for (let i = 0; i < length; i++) {
      mono[i] += channelData[i] / numChannels;
    }
  }

  return {
    sampleRate: audioBuffer.sampleRate,
    channelData: mono,
    duration: audioBuffer.duration,
  };
}
