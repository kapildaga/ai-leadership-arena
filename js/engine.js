/* AI Leadership Arena — adaptive engine and gamification.
 * Mastery: Elo-style rating 0-100 per track, updated against tier difficulty.
 * Tier ladder: 2 consecutive strong results (>=70) unlock and move up a tier;
 * 2 consecutive weak results (<40) step down a tier and queue remediation.
 * Spaced repetition: weak items return after 2, 5 and 10 further attempts. */
window.Arena = window.Arena || {};

(function (A) {
  const TIER_DIFFICULTY = { 1: 25, 2: 45, 3: 65, 4: 82 };
  const TIER_XP = { 1: 10, 2: 20, 3: 35, 4: 60 };
  const K = 14;
  const PASS = 70, FAIL = 40;
  const REVIEW_GAPS = [2, 5, 10];

  const LEVELS = [
    { name: "AI Practitioner", xp: 0 },
    { name: "AI Lead", xp: 250 },
    { name: "AI Director", xp: 700 },
    { name: "VP, AI", xp: 1500 },
    { name: "Chief AI Officer", xp: 2800 }
  ];

  const BADGES = {
    first_steps:    { name: "First Move", icon: "🎯", desc: "Completed your first scenario" },
    calibrated:     { name: "Baseline Set", icon: "🧭", desc: "Completed the calibration assessment" },
    promoted:       { name: "Step Up", icon: "⬆️", desc: "Unlocked a new tier in any track" },
    boardroom:      { name: "Boardroom Ready", icon: "🏛️", desc: "Scored 80+ on a Boardroom challenge" },
    tradeoff:       { name: "Trade-off Visible", icon: "⚖️", desc: "Scored 80+ on trade-off clarity in a written response" },
    comeback:       { name: "Comeback", icon: "🔁", desc: "Promoted in a track after stepping down" },
    streak3:        { name: "Habit Forming", icon: "🔥", desc: "Practised 3 days in a row" },
    streak7:        { name: "Relentless", icon: "⚡", desc: "Practised 7 days in a row" },
    drill5:         { name: "Drill Sergeant", icon: "🥇", desc: "Completed 5 Daily Drills" },
    all_rounder:    { name: "All-Rounder", icon: "🌐", desc: "Mastery 50+ in every track" },
    scholar:        { name: "Lexicon", icon: "📚", desc: "Studied 20 executive expressions" },
    perfect_branch: { name: "Room Reader", icon: "🧠", desc: "Made the strongest choice at every step of a simulation" }
  };

  function levelFor(xp) {
    let idx = 0; LEVELS.forEach((l, i) => { if (xp >= l.xp) idx = i; });
    const next = LEVELS[idx + 1];
    return { idx, name: LEVELS[idx].name, xp, nextName: next ? next.name : null,
      progress: next ? (xp - LEVELS[idx].xp) / (next.xp - LEVELS[idx].xp) : 1, toNext: next ? next.xp - xp : 0 };
  }

  function expected(mastery, tier) { return 1 / (1 + Math.pow(10, (TIER_DIFFICULTY[tier] - mastery) / 28)); }

  /* ---------- Scenario selection ---------- */
  function dueReviews(d) { return d.reviewQueue.filter(r => r.dueAt <= d.attempts && A.content.byId[r.scenarioId]); }

  function pickScenario(d, trackId, tier) {
    const pool = A.content.scenariosFor(trackId, tier);
    const seen = d.tracks[trackId].seen;
    const unseen = pool.filter(s => !seen[s.id]);
    if (unseen.length) return unseen[0];
    // Least recently seen
    return pool.slice().sort((a, b) => (seen[a.id] || 0) - (seen[b.id] || 0))[0];
  }

  /** Next best practice for this user, with a human-readable reason. */
  function recommend(d) {
    const due = dueReviews(d);
    if (due.length) {
      const s = A.content.byId[due[0].scenarioId];
      return { scenario: s, reason: `Spaced review: you found "${s.title}" difficult earlier. Let's lock it in.`, kind: "review" };
    }
    const tracks = A.content.tracks.slice().sort((a, b) => d.mastery[a.id] - d.mastery[b.id]);
    const weakest = tracks[0];
    const t = d.tracks[weakest.id];
    const s = pickScenario(d, weakest.id, t.currentTier);
    const misses = d.history.filter(h => h.track === weakest.id && h.score < 60).length;
    const reason = `${weakest.short} is your lowest-mastery area (${Math.round(d.mastery[weakest.id])})` +
      (misses ? `, with ${misses} weaker result${misses > 1 ? "s" : ""} so far.` : ".") +
      ` This ${A.content.tierNames[s.tier]}-tier scenario is pitched at your current level.`;
    return { scenario: s, reason, kind: "weakest" };
  }

  /** Daily drill: 3 weakest tracks at current tier, 1 review (or random), 1 stretch item a tier up. */
  function buildDrill(d) {
    const items = [];
    const used = new Set();
    const add = (s, why) => { if (s && !used.has(s.id)) { used.add(s.id); items.push({ id: s.id, why }); } };
    const sorted = A.content.tracks.slice().sort((a, b) => d.mastery[a.id] - d.mastery[b.id]);
    sorted.slice(0, 3).forEach(t => add(pickScenario(d, t.id, d.tracks[t.id].currentTier), `Focus area: ${t.short}`));
    const due = dueReviews(d)[0];
    if (due) add(A.content.byId[due.scenarioId], "Spaced review");
    else { const t = sorted[3 + Math.floor(Math.random() * (sorted.length - 3))]; add(pickScenario(d, t.id, d.tracks[t.id].currentTier), `Maintain: ${t.short}`); }
    const strong = sorted[sorted.length - 1];
    const stretchTier = Math.min(4, d.tracks[strong.id].currentTier + 1);
    add(pickScenario(d, strong.id, stretchTier), `Stretch: ${strong.short} at ${A.content.tierNames[stretchTier]}`);
    // Top up if de-duplication removed something
    for (const t of sorted) { if (items.length >= 5) break; add(pickScenario(d, t.id, d.tracks[t.id].currentTier), `Practice: ${t.short}`); }
    return items.slice(0, 5);
  }

  /* ---------- Recording results ---------- */
  function updateStreak(d) {
    const today = A.store.today();
    if (d.streak.lastDay === today) return;
    const y = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    d.streak.count = d.streak.lastDay === y ? d.streak.count + 1 : 1;
    d.streak.lastDay = today;
    d.streak.best = Math.max(d.streak.best || 0, d.streak.count);
  }

  /**
   * Apply a scored attempt. Returns a summary of what changed for the feedback screen.
   * extra: { dims } for freetext, { perfect } for branch.
   */
  function record(d, scenario, score, extra) {
    extra = extra || {};
    const tr = d.tracks[scenario.track];
    const before = { mastery: d.mastery[scenario.track], tier: tr.currentTier, level: levelFor(d.xp).idx };
    const events = [];

    // Mastery (Elo-style)
    const exp = expected(d.mastery[scenario.track], scenario.tier);
    const delta = K * (score / 100 - exp);
    d.mastery[scenario.track] = Math.max(0, Math.min(100, d.mastery[scenario.track] + delta));

    // XP
    let xp = Math.round(TIER_XP[scenario.tier] * Math.max(0.2, score / 100));
    if (score >= 85) xp += 5;
    d.xp += xp;
    d.attempts += 1;
    tr.seen[scenario.id] = Date.now();
    updateStreak(d);

    // Tier ladder (only when playing at your current tier or above)
    if (scenario.tier >= tr.currentTier) {
      if (score >= PASS) { tr.wins += 1; tr.losses = 0; }
      else if (score < FAIL) { tr.losses += 1; tr.wins = 0; }
      else { tr.wins = 0; tr.losses = 0; }
      if (scenario.tier > tr.currentTier && score >= PASS) { tr.wins = 2; } // a strong stretch result counts double
      if (tr.wins >= 2 && tr.currentTier < 4) {
        tr.currentTier += 1; tr.maxTier = Math.max(tr.maxTier, tr.currentTier); tr.wins = 0;
        events.push({ kind: "promoted", text: `Promoted to ${A.content.tierNames[tr.currentTier]} in ${A.content.track(scenario.track).short}` });
        award(d, "promoted", events);
        if (tr.demoted) { award(d, "comeback", events); tr.demoted = false; }
      } else if (tr.losses >= 2 && tr.currentTier > 1) {
        tr.currentTier -= 1; tr.losses = 0; tr.demoted = true;
        events.push({ kind: "demoted", text: `Stepping back to ${A.content.tierNames[tr.currentTier]} in ${A.content.track(scenario.track).short} to rebuild the fundamentals. The higher tier stays unlocked.` });
      }
    }

    // Spaced repetition
    const existing = d.reviewQueue.find(r => r.scenarioId === scenario.id);
    if (score < 60) {
      if (existing) { existing.stage = 0; existing.dueAt = d.attempts + REVIEW_GAPS[0]; }
      else d.reviewQueue.push({ scenarioId: scenario.id, stage: 0, dueAt: d.attempts + REVIEW_GAPS[0] });
      if (score < FAIL) events.push({ kind: "review", text: "Added to your spaced-review queue. It will come back in a couple of rounds." });
    } else if (existing && existing.dueAt <= d.attempts) {
      existing.stage += 1;
      if (existing.stage >= REVIEW_GAPS.length) { d.reviewQueue = d.reviewQueue.filter(r => r !== existing); events.push({ kind: "mastered", text: "Review item mastered and removed from your queue." }); }
      else existing.dueAt = d.attempts + REVIEW_GAPS[existing.stage];
    }

    // Badges
    if (d.attempts === 1) award(d, "first_steps", events);
    if (scenario.tier === 4 && score >= 80) award(d, "boardroom", events);
    if (extra.dims && extra.dims.tradeoff >= 80) award(d, "tradeoff", events);
    if (extra.perfect) award(d, "perfect_branch", events);
    checkGlobalBadges(d, events);

    d.history.push({ ts: Date.now(), scenarioId: scenario.id, track: scenario.track, tier: scenario.tier, type: scenario.type, score: Math.round(score), xp });
    if (d.history.length > 500) d.history = d.history.slice(-500);
    d.events = (d.events || []).concat(events.filter(e => e.kind === "promoted" || e.kind === "demoted").map(e => Object.assign({ ts: Date.now() }, e))).slice(-100);

    const lv = levelFor(d.xp);
    if (lv.idx > before.level) events.unshift({ kind: "level", text: `New title unlocked: ${lv.name}` });

    return { xp, masteryBefore: before.mastery, masteryAfter: d.mastery[scenario.track], tierBefore: before.tier, tierAfter: tr.currentTier, events };
  }

  function award(d, id, events) {
    if (!d.badges.includes(id)) { d.badges.push(id); events && events.push({ kind: "badge", text: `Badge earned: ${BADGES[id].icon} ${BADGES[id].name}` }); }
  }
  function checkGlobalBadges(d, events) {
    if (d.streak.count >= 3) award(d, "streak3", events);
    if (d.streak.count >= 7) award(d, "streak7", events);
    if (d.drillsCompleted >= 5) award(d, "drill5", events);
    if (d.explored.length >= 20) award(d, "scholar", events);
    if (A.content.tracks.every(t => d.mastery[t.id] >= 50)) award(d, "all_rounder", events);
  }

  /** Calibration answers: {trackId: score}. Sets starting mastery and tier per track. */
  function applyCalibration(d, results) {
    Object.entries(results).forEach(([trackId, score]) => {
      const tr = d.tracks[trackId];
      if (score >= 100) { d.mastery[trackId] = 45; tr.currentTier = tr.maxTier = 2; }
      else if (score >= 40) { d.mastery[trackId] = 32; }
      else { d.mastery[trackId] = 20; }
      const s = A.content.calibration.find(c => c.track === trackId);
      if (s) tr.seen[s.id] = Date.now();
    });
    d.calibrated = true;
    d.xp += 40;
    award(d, "calibrated");
  }

  A.engine = { LEVELS, BADGES, TIER_XP, levelFor, recommend, buildDrill, pickScenario, record, award, checkGlobalBadges, applyCalibration, dueReviews };
})(window.Arena);
