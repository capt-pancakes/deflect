// Re-export SongData types. These match the game's src/song-data.ts exactly.
// If the import path doesn't resolve cleanly, copy the interfaces instead.
// The contract is the JSON schema, not the TypeScript import.
export type { SongData, Beat, BPMSection, EnergyFrame, SongEvent } from '../../../src/song-data.js';
