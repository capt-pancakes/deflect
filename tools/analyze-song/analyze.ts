#!/usr/bin/env node
import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

async function main() {
  const args = process.argv.slice(2);
  if (args.length < 1) {
    console.error('Usage: npx tsx analyze.ts <input.mp3> [-o output.json]');
    process.exit(1);
  }

  const inputPath = resolve(args[0]);
  const outputFlag = args.indexOf('-o');
  const outputPath = outputFlag >= 0 && args[outputFlag + 1]
    ? resolve(args[outputFlag + 1])
    : inputPath.replace(/\.\w+$/, '.json');

  console.log(`Analyzing: ${inputPath}`);
  console.log(`Output:    ${outputPath}`);

  // Step 1: Decode MP3 to PCM
  // TODO: implement in Task 5

  // Step 2: Analyze with Essentia.js
  // TODO: implement in Task 5

  // Step 3: Write output
  // TODO: implement in Task 5

  console.log('Analysis complete.');
}

main().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});
