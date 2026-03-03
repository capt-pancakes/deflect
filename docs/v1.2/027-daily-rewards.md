# 027 — Daily Rewards System

**Priority:** T2 — Depth (promoted from T4 per PO review — directly supports D7 retention)
**Refs:** feature-specs.md §5.5 (US-PROG-04)

---

## Description

Implement a daily reward system that incentivizes players to open the game and play at least one game every day. Rewards trigger on first game completion each calendar day (not on app open). The rewards cycle on a 7-day rotation with escalating value.

### 7-Day Reward Cycle

| Day | Reward |
|-----|--------|
| 1 | 25 bonus XP |
| 2 | 50 bonus XP |
| 3 | Random cosmetic hint ("You're close to unlocking Neon Green!") |
| 4 | 75 bonus XP |
| 5 | 100 bonus XP |
| 6 | Random cosmetic hint |
| 7 | 150 bonus XP + random unlockable if eligible |

---

## Acceptance Criteria

- [ ] Daily reward triggers once per calendar day (local timezone)
- [ ] Reward requires completing a game (not just opening the app)
- [ ] Reward popup appears on game over screen, after XP calculation
- [ ] 7-day cycle resets after day 7
- [ ] Missing a day resets the cycle to day 1
- [ ] "Random unlockable" on day 7 grants the next locked cosmetic in level order if the player has reached the required level; otherwise grants 200 XP
- [ ] "Cosmetic hint" days show the name and preview of the next cosmetic the player can unlock
- [ ] Reward state persisted in localStorage (`deflect_daily_reward: {day, lastClaimDate}`)

---

## Dependencies

- 023 (XP System) — XP bonus integration
- 026 (Cosmetics) — cosmetic unlock on day 7
- 007 (Game Over Screen) — reward popup display
