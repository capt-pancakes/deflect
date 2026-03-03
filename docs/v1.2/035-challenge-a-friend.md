# 035 — Challenge-a-Friend

**Priority:** T3 — Variety
**Refs:** feature-specs.md §7.3 (US-SOC-03), product-vision.md §Part 6

---

## Description

Allow players to generate a URL after any game that encodes the exact game seed and their score. When a friend opens the URL, they see the challenger's score and play the same seeded game. After finishing, a side-by-side comparison shows who won.

### URL Structure

- `https://[domain]/?c=[base64-encoded-params]`
- Params: `{seed, mode, challengerScore, challengerCombo, challengerAccuracy}`
- URL must be under 200 characters for easy sharing via text

### Challenge Screen (opening a challenge link)

- "CHALLENGE RECEIVED" header
- Challenger's score displayed prominently
- "CAN YOU BEAT IT?" call-to-action
- "PLAY" button starts the seeded game
- "SKIP" text link goes to normal main menu

### Results Comparison (game over after challenge)

- Side-by-side: "THEM" (left) vs "YOU" (right)
- Score, combo, accuracy for each
- Winner indicated with crown icon and "YOU WIN!" or "THEY WIN!"
- "REMATCH" button (new seed, your score as target)
- "SHARE RESULT" button (comparison card)

---

## Acceptance Criteria

- [ ] Challenge URL is under 200 characters
- [ ] Challenge parameters are base64 encoded, not plaintext
- [ ] Opening a challenge URL on the same device still works
- [ ] Challenge seed overrides the normal RNG
- [ ] If challenge URL is malformed, gracefully fall back to normal main menu
- [ ] Results comparison screen clearly shows who won
- [ ] "REMATCH" generates a new challenge URL with updated scores
- [ ] "SHARE RESULT" generates a comparison card
- [ ] Challenge button available on game over screen for all modes

---

## Dependencies

- 007 (Game Over Screen) — challenge button location
- 033 (Share System) — share card generation
