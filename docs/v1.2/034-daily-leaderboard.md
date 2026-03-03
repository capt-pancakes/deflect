# 034 — Daily Leaderboard

**Priority:** T3 — Variety (promoted from T4 per PO review — social comparison drives retention; the local fallback version can ship at T2)
**Refs:** feature-specs.md §7.2 (US-SOC-02), product-vision.md §Part 6

---

## Description

Add an anonymous daily leaderboard for the daily challenge mode. Players submit scores after completing the daily challenge and can see their rank, the top 10, and a score distribution histogram. No personal data is collected; entries are ephemeral (deleted after 48 hours).

**Note:** This feature requires a backend service. If shipping without a backend, replace with a local "personal daily history" comparison (compare today's score to last 7 daily scores).

### Implementation Approach (No Accounts)

- Player submits: score, accuracy, max combo, survival time + hash of daily seed (integrity check)
- Player receives: their rank, top 10 scores, score distribution histogram
- Anonymous entries with no PII
- Entries deleted after 48 hours

### Leaderboard UI (on Daily Challenge Hub)

- "TODAY'S LEADERBOARD" section below challenge card
- Top 10 list: Rank | Score | Combo | Accuracy
- Player's own rank highlighted if they've played today
- Score distribution bar chart showing player's percentile

---

## Acceptance Criteria

- [ ] Leaderboard data fetched asynchronously; UI shows "Loading..." spinner
- [ ] If API is unreachable, leaderboard section shows "Offline" and is skippable
- [ ] Submissions include a simple integrity hash (deters casual cheating)
- [ ] Leaderboard refreshes when the Daily Hub screen is opened
- [ ] No PII is transmitted or stored
- [ ] Top 10 list displays rank, score, combo, and accuracy
- [ ] Player's own rank is highlighted
- [ ] Score distribution histogram shows player's percentile position
- [ ] **Fallback (no backend):** show personal daily history comparison instead

---

## Dependencies

- 006 (Daily Challenge Hub) — display location
- Backend service (external dependency)
