# 052 — Zen Mode Accuracy HUD

**Priority:** T2 — Depth
**Source:** Alex (PO) review — M13; product-vision.md Part 3

---

## Description

Add an accuracy percentage HUD and personal best accuracy display to Zen mode. Zen mode's identity is "no damage, pure flow" — accuracy is the meaningful metric. Showing a live accuracy percentage and a best-to-beat target gives Zen players a clear goal.

### HUD Elements (Zen-specific)

- **Live accuracy %** — large, centered below score position, updates on every catch/miss
- **Personal best accuracy** — smaller text: "BEST: 94.2%" displayed above the live accuracy
- **Color:** Green for accuracy >= personal best, white otherwise

---

## Acceptance Criteria

- [ ] Accuracy percentage displayed prominently in Zen mode HUD
- [ ] Accuracy updates in real-time on each catch or miss event
- [ ] Personal best accuracy for Zen mode stored in `deflect_stats`
- [ ] "BEST: XX.X%" shown above live accuracy as a target
- [ ] Accuracy text turns green when current accuracy >= personal best
- [ ] Accuracy formatted to 1 decimal place (e.g., "87.3%")
- [ ] Personal best updates at end of Zen session if current accuracy is higher (minimum 10 catches)
- [ ] Only visible in Zen mode (not Arcade, Daily, etc.)

---

## Dependencies

- 005 (Stats Screen) — Zen best accuracy display
- 045 (Persistence Layer) — best accuracy storage
