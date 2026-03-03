import type { SignalColor } from './types';
import { SIGNAL_COLORS } from './types';

/** Generate a shareable score card with visual pattern */
export function generateScoreCard(stats: {
  score: number;
  survived: number;
  catches: number;
  misses: number;
  maxCombo: number;
  mode: string;
  colorMisses?: Partial<Record<SignalColor, number>>;
}): string {
  const accuracy =
    stats.catches + stats.misses > 0
      ? Math.round((stats.catches / (stats.catches + stats.misses)) * 100)
      : 0;

  const modeLabel = stats.mode === 'zen' ? 'ZEN' : stats.mode === 'daily' ? 'DAILY' : 'ARCADE';

  const dateStr = stats.mode === 'daily'
    ? ` ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
    : '';

  // Color performance blocks (shows which colors you handled well)
  const colorEmoji: Record<SignalColor, string> = {
    red: '\ud83d\udfe5',
    blue: '\ud83d\udfe6',
    green: '\ud83d\udfe9',
    yellow: '\ud83d\udfe8',
  };

  // Build a pattern row showing per-color performance
  const colorMisses = stats.colorMisses || {};
  const totalSignals = stats.catches + stats.misses;
  let pattern = '';
  if (totalSignals > 0) {
    for (const color of SIGNAL_COLORS) {
      const missed = colorMisses[color] || 0;
      if (missed === 0) {
        pattern += colorEmoji[color] || '\u2b1c'; // Full color = no misses
      } else if (missed <= 2) {
        pattern += '\ud83d\udfe7'; // Orange = some misses
      } else {
        pattern += '\u2b1b'; // Black = many misses
      }
    }
  }

  // Accuracy bar
  const barLen = 10;
  const filled = Math.round((accuracy / 100) * barLen);
  const bar = '\u2b1c'.repeat(filled) + '\u2b1b'.repeat(barLen - filled);

  // Combo indicator
  const comboIcon =
    stats.maxCombo >= 10
      ? '\ud83d\udd25\ud83d\udd25\ud83d\udd25'
      : stats.maxCombo >= 5
        ? '\ud83d\udd25\ud83d\udd25'
        : stats.maxCombo >= 3
          ? '\ud83d\udd25'
          : '';

  const lines = [
    `DEFLECT ${modeLabel}${dateStr} ${pattern}`,
    `${stats.score} pts | ${stats.survived < 1 ? '<1s' : `${Math.floor(stats.survived)}s`} | ${stats.maxCombo}x ${comboIcon}`,
    `${bar} ${accuracy}%`,
    '',
    typeof window !== 'undefined' ? window.location.href : '',
  ].filter(Boolean);

  return lines.join('\n');
}

export async function shareScore(text: string, imageCanvas?: HTMLCanvasElement): Promise<boolean> {
  // Try image sharing first if canvas provided
  if (imageCanvas && navigator.share) {
    try {
      const blob = await new Promise<Blob | null>((resolve) =>
        imageCanvas.toBlob(resolve, 'image/png'),
      );
      if (blob) {
        const file = new File([blob], 'deflect-score.png', { type: 'image/png' });
        const shareData = { text, files: [file] };
        if (navigator.canShare && navigator.canShare(shareData)) {
          await navigator.share(shareData);
          return true;
        }
      }
    } catch {
      // Fall through to text sharing
    }
  }

  // Text sharing fallback
  if (navigator.share) {
    try {
      await navigator.share({ text });
      return true;
    } catch {
      // User cancelled
    }
  }

  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}
