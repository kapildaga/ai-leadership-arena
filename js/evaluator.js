/* AI Leadership Arena — built-in evaluator (works fully offline).
 * Scores structured choices exactly and written responses with a transparent rubric. */
window.Arena = window.Arena || {};

(function (A) {
  const DIMS = {
    outcome:        { name: "Outcome framing", tip: "Open with the business outcome or decision at stake (a KPI, cost, customer or risk result) before talking about solutions." },
    recommendation: { name: "Clear recommendation", tip: "State one clear recommendation (\"I recommend…\", \"We should…\") with something specific: a number, an owner or a date." },
    tradeoff:       { name: "Trade-offs & risk", tip: "Name what you are giving up or risking, and the condition that would make you change course." },
    stakeholder:    { name: "Stakeholder awareness", tip: "Acknowledge the other party's perspective or concern explicitly before or after your recommendation." },
    economy:        { name: "Executive economy", tip: "Aim for 4–6 crisp sentences (about 70–160 words) and drop hedges like \"I think maybe\", \"just\" or \"basically\"." }
  };

  const RX = {
    outcome: /\b(outcomes?|objectives?|goals?|business|customers?|decisions?|value|kpis?|results?|loss ratio|turnaround|cycle time|revenue|margins?|costs?|profit\w*|growth|retention|risk appetite|board|investors?|success|saving\w*|roi|impact|efficien\w*|productivity|inventory|stock-?outs?|service levels?|on-time|lead times?|cost to serve|throughput|downtime|conversion|churn|nps|csat|satisfaction|resolution|handl(e|ing) time|attrition|engagement|time to hire|working capital|market share|sales)\b/gi,
    recommendation: /\b(i recommend|i propose|i suggest|my recommendation|we should|we will|let'?s|i will|i'll|the decision|i'm asking|i am asking|we'll|my proposal|i commit|we commit|my answer|the answer is|that'?s the date|that is the date|go(es)? live|will (go|launch|start|ship|deliver)|here'?s what|i'?d propose|my ask|i'?d like to|i want to|i'?d rather)\b/gi,
    tradeoff: /\b(trade-?offs?|risk\w*|downsides?|cost of|at the expense|in exchange|however|but|constrain\w*|delay\w*|sacrific\w*|instead of|uncertain\w*|assum\w*|if not|otherwise|unless|condition\w*|threshold\w*|paus\w*|stop\w*|no-go|gates?|gated|confidence|not (yet )?prove[dn]?|caveat\w*|give up|giving up|if (testing|it|we|they|the|either|that|this)|provided|as long as)\b/gi,
    stakeholder: /\b(cfo|cto|ceo|coo|ciso|board|sponsor|team|teams|leaders?|stakeholders?|your|you|i understand|understand|acknowledge|appreciate|fair (point|challenge|question|concern)|concern|perspective|owner|customers?|regulators?|compliance|legal|employees?|agents?|managers?|planners?|recruiters?|candidates?|suppliers?|technicians?|staff|frontline|together|with you)\b/gi,
    specific: /(\d+(\.\d+)?\s?(%|percent|weeks?|days?|months?|quarters?|k|m|million|crore|fte)|\$\s?\d|£\s?\d|₹\s?\d|\bq[1-4]\b|\b(monday|tuesday|wednesday|thursday|friday)\b|\bby (end of|next)\b)/gi,
    hedge: /\b(i think maybe|maybe|perhaps|kind of|sort of|basically|just|hopefully|try to|i guess|possibly|might be able|a bit|somewhat|i feel like)\b/gi,
    jargon: /\b(synerg\w*|paradigm|boil the ocean|low[- ]hanging fruit|move the needle|circle back|best[- ]of[- ]breed|game[- ]changer|disrupt\w*|cutting[- ]edge|world[- ]class|leverage synergies)\b/gi
  };

  const count = (text, rx) => (text.match(rx) || []).length;
  const clamp = v => Math.max(0, Math.min(100, Math.round(v)));
  const sentences = t => t.split(/(?<=[.!?])\s+/).filter(s => s.trim().length > 3);

  const STOP = new Set(["let's", "lets", "that", "this", "with", "what", "would", "should", "rather", "than", "their", "them", "they", "your", "from", "have", "just", "only", "into", "make", "before", "need", "there", "which", "under"]);
  const norm = s => s.toLowerCase().replace(/[’‘]/g, "'").replace(/[^a-z0-9\s'-]/g, " ").replace(/\s+/g, " ").trim();
  /** Fuzzy match executive expressions: ≥70% of distinctive words present (min 3), or the exact phrase. */
  function expressionsUsed(text, trackId) {
    const lower = norm(text);
    const found = [];
    A.content.tracks.forEach(t => t.expressions.forEach((e, i) => {
      const phrase = norm(e[0]);
      const words = [...new Set(phrase.split(" ").filter(w => w.length >= 4 && !STOP.has(w)))];
      const hit = words.length >= 3 ? words.filter(w => new RegExp("\\b" + w.replace(/[-']/g, ".") + "\\b").test(lower)).length / words.length : 0;
      if (lower.includes(phrase) || hit >= 0.6) found.push({ track: t.id, idx: i, text: e[0], own: t.id === trackId });
    }));
    return found;
  }

  function evaluateText(text, scenario, opts) {
    opts = opts || {};
    const t = (text || "").trim();
    const words = t.split(/\s+/).filter(Boolean).length;
    const sents = sentences(t);
    const first2 = sents.slice(0, 2).join(" ");
    const kw = (scenario.keywords || []);
    const kwHits = kw.filter(k => t.toLowerCase().includes(k.toLowerCase())).length;
    const spec = count(t, RX.specific);
    const hedges = t.match(RX.hedge) || [];
    const jargon = t.match(RX.jargon) || [];
    const exprs = expressionsUsed(t, scenario.track);

    const outcomeHits = count(t, RX.outcome);
    const outcome = clamp((opts.curveball ? 30 : 15) + Math.min(outcomeHits, 4) * 12 + (count(first2, RX.outcome) ? 20 : 0) + Math.min(kwHits, 3) * 5);

    const recHits = count(t, RX.recommendation);
    const recommendation = clamp((recHits ? 40 : 5) + Math.min(recHits, 3) * 10 + Math.min(spec, 3) * 10 - Math.min(hedges.length, 4) * 6);

    const toHits = count(t, RX.tradeoff);
    const tradeoff = clamp((opts.curveball ? 25 : 10) + Math.min(toHits, 5) * 15 + (/\btrade-?off/i.test(t) ? 10 : 0));

    const stHits = count(t, RX.stakeholder);
    const ack = /\b(i understand|fair|appreciate|acknowledge|you'?re right|that concern|your concern|i hear|not at all|that'?s a reasonable|makes sense|understood|you saw|i know)\b/i.test(t);
    const stakeholder = clamp(10 + Math.min(stHits, 6) * 9 + (ack ? 25 : 0) + (opts.curveball ? 0 : 5));

    let economy = 90;
    const [minW, maxW] = opts.curveball ? [20, 110] : [40, 170];
    if (words < minW) economy -= (minW - words) * 1.5;
    if (words > maxW) economy -= (words - maxW) * 0.5;
    economy -= hedges.length * 8 + jargon.length * 10;
    const avgSentence = sents.length ? words / sents.length : words;
    if (avgSentence > 32) economy -= 12;
    economy = clamp(economy);

    const dims = { outcome, recommendation, tradeoff, stakeholder, economy };
    const weights = opts.curveball ? { outcome: 0.15, recommendation: 0.25, tradeoff: 0.15, stakeholder: 0.3, economy: 0.15 }
                                   : { outcome: 0.22, recommendation: 0.24, tradeoff: 0.2, stakeholder: 0.17, economy: 0.17 };
    let overall = Object.keys(dims).reduce((s, k) => s + dims[k] * weights[k], 0);
    const ownExprs = exprs.filter(e => e.own).length;
    overall += Math.min(ownExprs, 2) * 4 + Math.min(exprs.length - ownExprs, 1) * 2;
    if (words < 25) overall = Math.min(overall, 35);
    overall = clamp(overall);

    const ranked = Object.keys(dims).sort((a, b) => dims[b] - dims[a]);
    const strengths = ranked.slice(0, 2).filter(k => dims[k] >= 55).map(k => strengthText(k, { spec, exprs, ack, words }));
    if (!strengths.length) strengths.push("You engaged with the scenario. Now sharpen the structure using the fixes below.");
    const fixes = ranked.slice(-2).reverse().filter(k => dims[k] < 80).map(k => DIMS[k].tip);
    if (hedges.length) fixes.push(`Cut the hedging language (${[...new Set(hedges.map(h => h.toLowerCase()))].slice(0, 3).map(h => `"${h}"`).join(", ")}). It weakens executive presence.`);
    if (jargon.length) fixes.push(`Replace jargon (${[...new Set(jargon.map(j => j.toLowerCase()))].slice(0, 2).map(j => `"${j}"`).join(", ")}) with plain, specific language.`);
    if (!exprs.length && !opts.curveball) fixes.push("Weave in at least one expression from this track naturally. It signals executive framing.");

    return { overall, dims, strengths, fixes: fixes.slice(0, 3), expressions: exprs, words, source: "rubric" };
  }

  function strengthText(k, ctx) {
    switch (k) {
      case "outcome": return "You anchored the response in a business outcome rather than the technology.";
      case "recommendation": return ctx.spec ? "Your recommendation was decisive and specific (numbers, dates or owners)." : "You made a clear recommendation rather than listing options.";
      case "tradeoff": return "You made the trade-offs or risks visible, which builds credibility.";
      case "stakeholder": return ctx.ack ? "You acknowledged the other party's perspective before pushing your view." : "You kept stakeholders and owners in view.";
      case "economy": return `Crisp and economical (${ctx.words} words) without hedging.`;
    }
  }

  /* ---------- Structured formats ---------- */
  function scoreMcq(scenario, idx) {
    const o = scenario.options[idx];
    const best = scenario.options.reduce((b, x, i) => x.score > scenario.options[b].score ? i : b, 0);
    return { score: o.score, chosen: idx, best, feedback: o.feedback };
  }

  function scoreBestWorst(scenario, bestIdx, worstIdx) {
    const rank = i => scenario.options[i].rank;
    let score = 0;
    score += rank(bestIdx) === "best" ? 60 : rank(bestIdx) === "mid" ? 20 : 0;
    score += rank(worstIdx) === "worst" ? 40 : rank(worstIdx) === "mid" ? 10 : 0;
    return { score, bestIdx, worstIdx,
      trueBest: scenario.options.findIndex(o => o.rank === "best"), trueWorst: scenario.options.findIndex(o => o.rank === "worst") };
  }

  function scoreBranch(scenario, choices) {
    const q = choices.map((c, i) => scenario.steps[i].options[c].quality);
    const score = clamp(q.reduce((a, b) => a + b, 0) / q.length * 100);
    return { score, perfect: q.every(x => x === 1) };
  }

  function meters(scenario, choices) {
    const m = { trust: 50, value: 50, control: 50, momentum: 50 };
    choices.forEach((c, i) => { const fx = scenario.steps[i].options[c].fx; Object.keys(m).forEach(k => m[k] = Math.max(0, Math.min(100, m[k] + (fx[k] || 0)))); });
    return m;
  }

  A.evaluator = { DIMS, evaluateText, scoreMcq, scoreBestWorst, scoreBranch, meters, expressionsUsed };
})(window.Arena);
