#!/usr/bin/env node
import { writeFile } from 'node:fs/promises';
import { resolve, basename } from 'node:path';
import { decodeMP3 } from './src/decode.js';
import { analyzeBeats } from './src/beats.js';
import { analyzeEnergy } from './src/energy.js';
import { detectEvents } from './src/events.js';
import { formatSongData } from './src/format.js';

async function main() {
  const args = process.argv.slice(2);
  if (args.length < 1) {
    console.error('Usage: npx tsx analyze.ts <input.mp3> [-o output.json]');
    process.exit(1);
  }

  const inputPath = resolve(args[0]);
  const outputFlag = args.indexOf('-o');
  const outputPath =
    outputFlag >= 0 && args[outputFlag + 1]
      ? resolve(args[outputFlag + 1])
      : inputPath.replace(/\.\w+$/, '.json');

  const title = basename(inputPath, '.mp3');

  console.log(`Analyzing: ${inputPath}`);

  console.log('  Decoding MP3...');
  const audio = await decodeMP3(inputPath);
  console.log(
    `  Sample rate: ${audio.sampleRate}, Duration: ${audio.duration.toFixed(1)}s`,
  );

  console.log('  Detecting beats...');
  const { bpm, beats } = await analyzeBeats(audio.channelData, audio.sampleRate);
  console.log(`  BPM: ${bpm}, Beats: ${beats.length}`);

  console.log('  Analyzing energy...');
  const energy = analyzeEnergy(audio.channelData, audio.sampleRate);
  console.log(`  Energy frames: ${energy.length}`);

  console.log('  Detecting events...');
  const events = detectEvents(energy, audio.duration);
  console.log(`  Events: ${events.length}`);

  const songData = formatSongData({
    title,
    artist: 'Unknown',
    duration: audio.duration,
    bpm,
    beats,
    energy,
    events,
  });

  await writeFile(outputPath, JSON.stringify(songData, null, 2));
  console.log(`Output: ${outputPath}`);
  console.log('Done.');
}

main().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});
